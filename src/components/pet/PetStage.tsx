import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from 'react';
import { usePetStore, useSettingsStore } from '@/store';
import { useUiFeedback } from '@/components/hooks/useUiFeedback';
import { FrogSprite } from './FrogSprite';
import { PixelHeart } from './PixelHeart';
import type { HeartTone } from './PixelHeart';
import { FROG_DISPLAY_HEIGHT, FROG_DISPLAY_WIDTH } from './petSprites';
import { FROG_SHADOW_WIDTH, useFrogWalk } from './useFrogWalk';

/** Минимальная высота пола, px. */
const MIN_FLOOR_HEIGHT = 64;
/** Доля высоты сцены, которую занимает пол (остальное — «воздух» LCD-экрана). */
const FLOOR_HEIGHT_RATIO = 0.34;
/** Жизнь одного всплеска сердец, мс (чуть дольше 900 мс анимации). */
const HEART_LIFETIME_MS = 1000;
/** Задержка между сердцами одного всплеска, мс. */
const HEART_STAGGER_MS = 70;
/** Сколько сердец появляется при поглаживании: от 2 до 4. */
const HEART_MIN_COUNT = 2;
const HEART_MAX_COUNT = 4;
const HEART_TONES: readonly HeartTone[] = ['danger', 'accent', 'yellow'];

/** Одно пиксельное сердце во всплеске. */
interface HeartSpec {
  id: number;
  tone: HeartTone;
  /** Позиция по горизонтали в процентах ширины сцены. */
  leftPct: number;
  /** Позиция по вертикали в px от нижней кромки сцены. */
  bottomPx: number;
  delayMs: number;
}

/** Анимация-отклик корпуса лягушки. */
interface TapFx {
  id: number;
  kind: 'none' | 'tap' | 'land';
}

/** Ограничивает значение отрезком [min, max]. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Сцена питомца: пиксельная лягушка живёт на mint-LCD-полу.
 *
 * Наполнение: пол, жёсткая пиксельная тень, спрайт-лягушка (медленное блуждание
 * по полу вглубь сцены, взгляд на указатель, клик, drag-and-drop) и пиксельные
 * сердца при поглаживании.
 * Позиция питомца пишется напрямую в DOM из rAF-цикла, поэтому анимация не
 * вызывает ре-рендеров React. Сцена заполняет positioned-родителя (absolute
 * inset-0 внутри .pixel-screen), пол прижат к нижней кромке экрана.
 */
export function PetStage() {
  const petClick = usePetStore((state) => state.petClick);
  const animationsEnabled = useSettingsStore((state) => state.animationsEnabled);
  const { playSound, vibrate } = useUiFeedback();

  const stageRef = useRef<HTMLDivElement>(null);
  const frogRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);

  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [hitCount, setHitCount] = useState(0);
  const [hearts, setHearts] = useState<ReadonlyArray<HeartSpec>>([]);
  const [fx, setFx] = useState<TapFx>({ id: 0, kind: 'none' });
  const heartIdRef = useRef(0);
  const heartTimersRef = useRef<number[]>([]);
  const fxIdRef = useRef(0);

  // Геометрия сцены: замеряем до первой отрисовки, чтобы лягушка сразу встала
  // в центр рабочей области пола, и пересчитываем при ресайзе / повороте экрана.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (stage === null) {
      return undefined;
    }
    const update = (): void => {
      const width = stage.clientWidth;
      const height = stage.clientHeight;
      setStageSize((previous) =>
        previous.width === width && previous.height === height ? previous : { width, height },
      );
    };
    update();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update);
      return () => {
        window.removeEventListener('resize', update);
      };
    }
    const observer = new ResizeObserver(update);
    observer.observe(stage);
    return () => {
      observer.disconnect();
    };
  }, []);

  const floorHeight = useMemo(
    () => Math.max(MIN_FLOOR_HEIGHT, Math.round(stageSize.height * FLOOR_HEIGHT_RATIO)),
    [stageSize.height],
  );

  /** Убирает отложенные таймеры сердец (при выключении анимаций и размонтировании). */
  const clearHeartTimers = useCallback((): void => {
    for (const timerId of heartTimersRef.current) {
      window.clearTimeout(timerId);
    }
    heartTimersRef.current = [];
  }, []);

  // Анимации выключены — настроение и здоровье всё равно растут по клику,
  // но частиц на экране нет (и старые всплески сразу убираются).
  useEffect(() => {
    if (!animationsEnabled) {
      clearHeartTimers();
      setHearts([]);
    }
  }, [animationsEnabled, clearHeartTimers]);

  useEffect(() => {
    return () => {
      clearHeartTimers();
    };
  }, [clearHeartTimers]);

  /** Всплеск из 2–4 сердец над головой лягушки (только при включённых анимациях). */
  const spawnHearts = useCallback((): void => {
    const stage = stageRef.current;
    const frog = frogRef.current;
    if (stage === null || frog === null) {
      return;
    }
    const stageRect = stage.getBoundingClientRect();
    const frogRect = frog.getBoundingClientRect();
    if (stageRect.width <= 0) {
      return;
    }
    const frogCenterPct =
      ((frogRect.left + frogRect.width / 2 - stageRect.left) / stageRect.width) * 100;
    const count = HEART_MIN_COUNT + Math.floor(Math.random() * (HEART_MAX_COUNT - HEART_MIN_COUNT + 1));
    const additions: HeartSpec[] = [];
    for (let index = 0; index < count; index += 1) {
      heartIdRef.current += 1;
      additions.push({
        id: heartIdRef.current,
        tone: HEART_TONES[index % HEART_TONES.length],
        leftPct: clamp(frogCenterPct + (Math.random() * 2 - 1) * 9, 8, 92),
        // Сердца всплывают над головой: считаем верх спрайта по его реальному
        // прямоугольнику (базовая линия плавает по глубине, floorHeight мало).
        bottomPx: clamp(
          stageRect.bottom - frogRect.top - 14 + Math.random() * 8,
          8,
          Math.max(8, stageRect.height - 8),
        ),
        delayMs: index * HEART_STAGGER_MS,
      });
    }
    setHearts((previous) => [...previous, ...additions]);
    for (const heart of additions) {
      const timerId = window.setTimeout(() => {
        setHearts((previous) => previous.filter((item) => item.id !== heart.id));
      }, HEART_LIFETIME_MS);
      heartTimersRef.current.push(timerId);
    }
  }, []);

  /** Короткий тап по лягушке: ласка, счётчик, звук, вибрация и сердца. */
  const handleTap = useCallback((): void => {
    setHitCount((count) => count + 1);
    petClick();
    vibrate('light');
    playSound('tap');
    if (!animationsEnabled) {
      return;
    }
    spawnHearts();
    fxIdRef.current += 1;
    setFx({ id: fxIdRef.current, kind: 'tap' });
  }, [animationsEnabled, petClick, playSound, spawnHearts, vibrate]);

  /** Приземление после падения: короткое «сплющивание» корпуса. */
  const handleLand = useCallback((): void => {
    fxIdRef.current += 1;
    setFx({ id: fxIdRef.current, kind: 'land' });
  }, []);

  const {
    sprite,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handleLostPointerCapture,
    reactToPointer,
  } = useFrogWalk({
    stageRef,
    frogRef,
    shadowRef,
    stageWidth: stageSize.width,
    stageHeight: stageSize.height,
    floorHeight,
    animationsEnabled,
    onTap: handleTap,
    onLand: handleLand,
  });

  // Реакция на мышь/перо: лягушка поворачивается к указателю и подпрыгивает.
  const handleStagePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>): void => {
      if (event.pointerType === 'mouse' || event.pointerType === 'pen') {
        reactToPointer(event.clientX);
      }
    },
    [reactToPointer],
  );

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>): void => {
      if (event.key !== 'Enter' && event.key !== ' ') {
        return;
      }
      event.preventDefault();
      handleTap();
    },
    [handleTap],
  );

  const handleContextMenu = useCallback((event: ReactMouseEvent<HTMLDivElement>): void => {
    event.preventDefault();
  }, []);

  const fxClass =
    fx.kind === 'tap'
      ? 'animate-pixel-pop'
      : fx.kind === 'land'
        ? 'animate-hop-squash'
        : '';

  return (
    <div
      ref={stageRef}
      data-pet-stage="true"
      className="absolute inset-0 overflow-hidden"
      onPointerMove={handleStagePointerMove}
    >
      {/* Пол: mint-LCD-плитка с жёсткой пиксельной сеткой, прижат к низу экрана. */}
      <div
        aria-hidden="true"
        className="pixel-floor pointer-events-none absolute inset-x-0 bottom-0"
        style={{ height: floorHeight }}
      />

      {/* Пиксельная тень-полоска под лапами, без blur и скруглений.
          Позицию по X и базовой линии пишет rAF через transform. */}
      <div
        ref={shadowRef}
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 h-2 bg-app-ink opacity-25"
        style={{ width: FROG_SHADOW_WIDTH }}
      />

      {/* Питомец: absolute-элемент 112×64 px, позицию пишет rAF через transform.
          Низ элемента (лапки) совпадает с базовой линией baselineY. */}
      <div
        ref={frogRef}
        role="button"
        tabIndex={0}
        aria-label="Питомец"
        data-hit-count={hitCount}
        className="absolute bottom-0 left-0 z-10 flex cursor-grab touch-none select-none items-end justify-center active:cursor-grabbing focus-visible:outline focus-visible:outline-2 focus-visible:outline-dashed focus-visible:outline-app-ink"
        style={{
          width: FROG_DISPLAY_WIDTH,
          height: FROG_DISPLAY_HEIGHT,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onLostPointerCapture={handleLostPointerCapture}
        onKeyDown={handleKeyDown}
        onContextMenu={handleContextMenu}
      >
        <div key={fx.id} className={`h-full w-full origin-bottom ${fxClass}`}>
          <FrogSprite sprite={sprite} />
        </div>
      </div>

      {/* Пиксельные сердца при поглаживании: поднимаются и растворяются. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
        {hearts.map((heart) => (
          <span
            key={heart.id}
            className="animate-pet-rise absolute block"
            style={{
              left: `${heart.leftPct}%`,
              bottom: heart.bottomPx,
              opacity: 0,
              animationDelay: `${heart.delayMs}ms`,
            }}
          >
            <PixelHeart tone={heart.tone} />
          </span>
        ))}
      </div>
    </div>
  );
}
