import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react';
import { FROG_DISPLAY_HEIGHT, FROG_DISPLAY_WIDTH, FROG_SHEETS } from './petSprites';
import type { FrogSpriteState } from './FrogSprite';

/** Ширина пиксельной тени под лапами, px (совпадает с шириной DOM-тени в PetStage). */
export const FROG_SHADOW_WIDTH = Math.round(FROG_DISPLAY_WIDTH * 0.6);

/** Частота idle-цикла во время ходьбы: 4 кадра по 200 мс ≈ 5 fps. */
const IDLE_FRAME_MS = 200;

/** Минимальное смещение указателя (px), после которого начинается перенос. */
export const DRAG_THRESHOLD = 6;

/** Пауза между ховер-реакциями, мс. */
const HOVER_REACTION_COOLDOWN_MS = 2200;

/** Длительность ховер-подскока, мс. */
const HOP_DURATION_MS = 340;

/** Высота ховер-подскока, px (уменьшается, если над полом мало места). */
const HOP_PEAK = 16;

/** Пауза с кадром разворота при смене направления, мс. */
const TURN_PAUSE_MS = 170;

/** Когда сменить кадр приземления, мс. */
const LAND_FRAME_SWITCH_MS = 120;

/** Сколько длится приземление до возврата к ходьбе, мс. */
const LAND_DURATION_MS = 300;

/** Диапазон скорости ходьбы, px/с (медленно ползёт по полу). */
const WALK_SPEED_MIN = 22;
const WALK_SPEED_MAX = 34;
/** Доля ширины сцены в скорости: на широком экране ползёт быстрее. */
const WALK_SPEED_RATIO = 0.085;

/** Амплитуда и длина «шага» при ходьбе, px: лёгкое покачивание корпуса. */
const WALK_BOB_PX = 2;
const WALK_BOB_PERIOD_PX = 16;

/** Состояние слоя анимации. */
type FrogMode = 'walk' | 'held' | 'lifted' | 'hop' | 'falling' | 'landing';

/** Данные активного указателя на питомце. */
interface PressState {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  /** Смещение указателя от центра питомца на момент захвата. */
  grabOffsetX: number;
  /** Высота, с которой начался перенос (обычно 0). */
  startLift: number;
  /** Превышен ли порог DRAG_THRESHOLD. */
  lifted: boolean;
}

/** Геометрия сцены, нужная rAF-циклу без ре-рендеров. */
interface SceneSize {
  width: number;
  height: number;
  floorHeight: number;
}

type FrogDirection = 1 | -1;

interface FrogFacing {
  value: 'left' | 'right';
}

export interface UseFrogWalkParams {
  /** Сцена: нужна для границ и для пересчёта координат указателя. */
  stageRef: RefObject<HTMLDivElement>;
  /** DOM-элемент питомца, которому пишется transform. */
  frogRef: RefObject<HTMLDivElement>;
  /** DOM-элемент тени под лапами. */
  shadowRef: RefObject<HTMLDivElement>;
  stageWidth: number;
  stageHeight: number;
  floorHeight: number;
  animationsEnabled: boolean;
  /** Короткий тап без переноса. */
  onTap: () => void;
  /** Питомец коснулся пола после падения. */
  onLand: () => void;
}

export interface UseFrogWalkResult {
  /** Текущий кадр для FrogSprite. */
  sprite: FrogSpriteState;
  handlePointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  handlePointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  handlePointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void;
  handlePointerCancel: (event: ReactPointerEvent<HTMLDivElement>) => void;
  handleLostPointerCapture: (event: ReactPointerEvent<HTMLDivElement>) => void;
  /** Реакция на движение указателя над сценой (в clientX). */
  reactToPointer: (clientX: number) => void;
}

/** Ограничивает значение отрезком [min, max]. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Движение питомца по полу: медленная ходьба с idle-циклом, перенос указателем,
 * падение и приземление. Позиция пишется напрямую в DOM (transform/opacity),
 * чтобы rAF-цикл не вызывал ре-рендеров React; кадр спрайта обновляется стейтом
 * только при реальной смене кадра (≈5 fps).
 */
export function useFrogWalk({
  stageRef,
  frogRef,
  shadowRef,
  stageWidth,
  stageHeight,
  floorHeight,
  animationsEnabled,
  onTap,
  onLand,
}: UseFrogWalkParams): UseFrogWalkResult {
  const xRef = useRef(0);
  const liftRef = useRef(0);
  const directionRef = useRef<FrogDirection>(1);
  const facingRef = useRef<FrogFacing>({ value: 'right' });
  const modeRef = useRef<FrogMode>('walk');
  const frameIndexRef = useRef(0);
  const frameAccumulatorRef = useRef(0);
  const walkPhaseRef = useRef(0);
  const turnUntilRef = useRef(0);
  const hopRef = useRef({ startTime: 0, peak: 0 });
  const fallRef = useRef({ startTime: 0, fromLift: 0, duration: 0 });
  const landingStartRef = useRef(0);
  const lastHoverAtRef = useRef(0);
  const pressRef = useRef<PressState | null>(null);
  const initializedRef = useRef(false);
  const sizeRef = useRef<SceneSize>({ width: 0, height: 0, floorHeight });
  const animationsEnabledRef = useRef(animationsEnabled);
  const onTapRef = useRef(onTap);
  const onLandRef = useRef(onLand);
  const spriteStateRef = useRef<FrogSpriteState>({
    sheet: 'idle',
    frame: 0,
    facing: 'right',
  });
  const [sprite, setSprite] = useState<FrogSpriteState>(spriteStateRef.current);

  useEffect(() => {
    animationsEnabledRef.current = animationsEnabled;
  }, [animationsEnabled]);

  useEffect(() => {
    onTapRef.current = onTap;
    onLandRef.current = onLand;
  }, [onTap, onLand]);

  /** Меняет кадр только когда он действительно изменился. */
  const applySprite = useCallback((next: FrogSpriteState): void => {
    const current = spriteStateRef.current;
    if (
      current.sheet === next.sheet &&
      current.frame === next.frame &&
      current.facing === next.facing
    ) {
      return;
    }
    spriteStateRef.current = next;
    setSprite(next);
  }, []);

  /** Пишет позицию питомца и тень напрямую в DOM (только transform/opacity). */
  const writeVisual = useCallback((): void => {
    const frog = frogRef.current;
    if (frog !== null) {
      frog.style.transform = `translate3d(${xRef.current - FROG_DISPLAY_WIDTH / 2}px, ${
        -liftRef.current
      }px, 0)`;
    }
    const shadow = shadowRef.current;
    if (shadow !== null) {
      const lift = liftRef.current;
      const squish = clamp(1 - lift / 260, 0.55, 1);
      shadow.style.transform = `translate3d(${xRef.current - FROG_SHADOW_WIDTH / 2}px, 0, 0) scale(${squish}, 1)`;
      shadow.style.opacity = String(clamp(0.26 - lift / 300, 0.06, 0.26));
    }
  }, [frogRef, shadowRef]);

  /** Минимальный и максимальный x центра питомца внутри сцены. */
  const getWalkBounds = useCallback((): { minX: number; maxX: number } => {
    const half = FROG_DISPLAY_WIDTH / 2;
    const { width } = sizeRef.current;
    const minX = half + 2;
    return { minX, maxX: Math.max(minX, width - half - 2) };
  }, []);

  const clampX = useCallback(
    (value: number): number => {
      const { minX, maxX } = getWalkBounds();
      return clamp(value, minX, maxX);
    },
    [getWalkBounds],
  );

  /** Сколько места есть над полом для подъёма питомца. */
  const getMaxLift = useCallback((): number => {
    const { height, floorHeight: floor } = sizeRef.current;
    return Math.max(0, height - floor - FROG_DISPLAY_HEIGHT - 4);
  }, []);

  /** Скорость ходьбы, px/с. */
  const getWalkSpeed = useCallback((): number => {
    return clamp(sizeRef.current.width * WALK_SPEED_RATIO, WALK_SPEED_MIN, WALK_SPEED_MAX);
  }, []);

  /** Смена направления: запоминаем взгляд и ставим паузу с кадром разворота. */
  const turnAround = useCallback((now: number): void => {
    directionRef.current = directionRef.current === 1 ? -1 : 1;
    facingRef.current = { value: directionRef.current === 1 ? 'right' : 'left' };
    turnUntilRef.current = now + TURN_PAUSE_MS;
    applySprite({ sheet: 'turn', frame: 0, facing: facingRef.current.value });
  }, [applySprite]);

  /** Один шаг анимации; dt в секундах. */
  const step = useCallback(
    (now: number, dt: number): void => {
      if (sizeRef.current.width <= 0) {
        return;
      }
      switch (modeRef.current) {
        case 'walk': {
          if (now < turnUntilRef.current) {
            applySprite({ sheet: 'turn', frame: 0, facing: facingRef.current.value });
            liftRef.current = 0;
            writeVisual();
            break;
          }
          if (turnUntilRef.current > 0) {
            turnUntilRef.current = 0;
            frameAccumulatorRef.current = 0;
            applySprite({
              sheet: 'idle',
              frame: frameIndexRef.current,
              facing: facingRef.current.value,
            });
          }
          frameAccumulatorRef.current += dt * 1000;
          if (frameAccumulatorRef.current >= IDLE_FRAME_MS) {
            frameAccumulatorRef.current %= IDLE_FRAME_MS;
            frameIndexRef.current = (frameIndexRef.current + 1) % FROG_SHEETS.idle.frameCount;
            applySprite({
              sheet: 'idle',
              frame: frameIndexRef.current,
              facing: facingRef.current.value,
            });
          }
          const { minX, maxX } = getWalkBounds();
          if (maxX - minX < 2) {
            // Совсем узкая сцена: ходить некуда — стоим по центру без разворотов.
            xRef.current = minX;
            liftRef.current = 0;
            writeVisual();
            break;
          }
          const speed = getWalkSpeed();
          const stepDistance = speed * dt;
          let nextX = xRef.current + directionRef.current * stepDistance;
          if (nextX <= minX || nextX >= maxX) {
            nextX = clamp(nextX, minX, maxX);
            turnAround(now);
          }
          xRef.current = nextX;
          // Лёгкое покачивание корпуса в такт шагам: без него ходьба читается
          // как скольжение (idle-кадры почти одинаковые).
          walkPhaseRef.current += stepDistance;
          liftRef.current =
            Math.abs(Math.sin((walkPhaseRef.current / WALK_BOB_PERIOD_PX) * Math.PI)) * WALK_BOB_PX;
          writeVisual();
          break;
        }
        case 'hop': {
          const progress = clamp((now - hopRef.current.startTime) / HOP_DURATION_MS, 0, 1);
          liftRef.current = 4 * hopRef.current.peak * progress * (1 - progress);
          if (progress >= 1) {
            modeRef.current = 'walk';
            liftRef.current = 0;
            facingRef.current = { value: directionRef.current === 1 ? 'right' : 'left' };
            frameAccumulatorRef.current = 0;
            applySprite({
              sheet: 'idle',
              frame: frameIndexRef.current,
              facing: facingRef.current.value,
            });
          }
          writeVisual();
          break;
        }
        case 'falling': {
          const { startTime, fromLift, duration } = fallRef.current;
          const progress = clamp((now - startTime) / Math.max(1, duration), 0, 1);
          liftRef.current = fromLift * (1 - progress);
          if (progress >= 1) {
            liftRef.current = 0;
            modeRef.current = 'landing';
            landingStartRef.current = now;
            applySprite({ sheet: 'land', frame: 0, facing: facingRef.current.value });
            onLandRef.current();
          }
          writeVisual();
          break;
        }
        case 'landing': {
          const elapsed = now - landingStartRef.current;
          applySprite({
            sheet: 'land',
            frame: elapsed >= LAND_FRAME_SWITCH_MS ? 1 : 0,
            facing: facingRef.current.value,
          });
          if (elapsed >= LAND_DURATION_MS) {
            modeRef.current = 'walk';
            frameAccumulatorRef.current = 0;
            applySprite({
              sheet: 'idle',
              frame: frameIndexRef.current,
              facing: facingRef.current.value,
            });
          }
          break;
        }
        case 'held':
        case 'lifted':
        default:
          break;
      }
    },
    [applySprite, getWalkBounds, getWalkSpeed, turnAround, writeVisual],
  );

  // rAF-цикл живёт только пока анимации включены.
  useEffect(() => {
    if (!animationsEnabled) {
      return undefined;
    }
    let frameId = 0;
    let previous = 0;
    const tick = (now: number): void => {
      if (previous === 0) {
        previous = now;
      }
      const dt = clamp((now - previous) / 1000, 0, 0.05);
      previous = now;
      step(now, dt);
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [animationsEnabled, step]);

  // Анимации выключены: питомец стоит на месте (ходьба/частицы полностью стоят),
  // но клик и перенос продолжают работать.
  useEffect(() => {
    if (animationsEnabled) {
      return;
    }
    modeRef.current = 'walk';
    liftRef.current = 0;
    turnUntilRef.current = 0;
    frameAccumulatorRef.current = 0;
    applySprite({ sheet: 'idle', frame: 0, facing: facingRef.current.value });
    writeVisual();
  }, [animationsEnabled, applySprite, writeVisual]);

  // Геометрия сцены: первый кадр ставим по центру, далее держим в границах.
  useLayoutEffect(() => {
    sizeRef.current = { width: stageWidth, height: stageHeight, floorHeight };
    if (stageWidth <= 0) {
      return;
    }
    if (!initializedRef.current) {
      initializedRef.current = true;
      xRef.current = clampX(stageWidth / 2);
    } else {
      xRef.current = clampX(xRef.current);
    }
    liftRef.current = clamp(liftRef.current, 0, getMaxLift());
    writeVisual();
  }, [stageWidth, stageHeight, floorHeight, clampX, getMaxLift, writeVisual]);

  /** Подхват питомца: начинается перенос без телепорта (сохраняем точку захвата). */
  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>): void => {
    if (pressRef.current !== null) {
      return;
    }
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }
    pressRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      grabOffsetX: event.clientX - xRef.current,
      startLift: liftRef.current,
      lifted: false,
    };
    // Палец/мышь коснулись лягушки — она останавливается и ждёт: тап или перенос.
    // Из ховер-подскока тоже опускаемся на пол, чтобы клик во время реакции
    // не превращался в «падение» вместо тапа.
    if (modeRef.current === 'walk' || modeRef.current === 'hop') {
      modeRef.current = 'held';
      turnUntilRef.current = 0;
      frameAccumulatorRef.current = 0;
      liftRef.current = 0;
      writeVisual();
      applySprite({
        sheet: 'idle',
        frame: frameIndexRef.current,
        facing: facingRef.current.value,
      });
    }
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // В части WebView захват указателя недоступен — перенос отработает
      // пока указатель остаётся над питомцем.
    }
  }, [applySprite, writeVisual]);

  /** Перенос: после порога 6 px питомец «отрывается» от пола и следует за пальцем. */
  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>): void => {
      const press = pressRef.current;
      if (press === null || press.pointerId !== event.pointerId) {
        return;
      }
      if (!press.lifted) {
        const deltaX = event.clientX - press.startClientX;
        const deltaY = event.clientY - press.startClientY;
        if (Math.hypot(deltaX, deltaY) <= DRAG_THRESHOLD) {
          return;
        }
        press.lifted = true;
        modeRef.current = 'lifted';
        liftRef.current = press.startLift;
        if (animationsEnabledRef.current) {
          applySprite({ sheet: 'jump', frame: 0, facing: facingRef.current.value });
        }
        event.preventDefault();
      }
      const maxLift = getMaxLift();
      liftRef.current = clamp(press.startLift + (press.startClientY - event.clientY), 0, maxLift);
      xRef.current = clampX(event.clientX - press.grabOffsetX);
      writeVisual();
    },
    [applySprite, clampX, getMaxLift, writeVisual],
  );

  /** Завершение переноса: падение и приземление, либо одиночный тап. */
  const finishPress = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>, cancelled: boolean): void => {
      const press = pressRef.current;
      if (press === null || press.pointerId !== event.pointerId) {
        return;
      }
      pressRef.current = null;
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // Захват мог не установиться — освобождать нечего.
      }
      if (press.lifted) {
        const fromLift = liftRef.current;
        if (!animationsEnabledRef.current || fromLift < 6) {
          // Анимации выключены или питомца тащили по полу без отрыва:
          // без кадров падения просто возвращаемся к ходьбе.
          modeRef.current = 'walk';
          liftRef.current = 0;
          frameAccumulatorRef.current = 0;
          writeVisual();
          applySprite({
            sheet: 'idle',
            frame: frameIndexRef.current,
            facing: facingRef.current.value,
          });
          return;
        }
        modeRef.current = 'falling';
        fallRef.current = {
          startTime: performance.now(),
          fromLift,
          duration: clamp(200 + fromLift * 1.6, 240, 640),
        };
        applySprite({ sheet: 'fall', frame: 0, facing: facingRef.current.value });
        return;
      }
      // Отпускание без переноса — это всегда тап (ласка и снова идём по полу).
      // Высота подъёма здесь не важна: если пользователь не тащил питомца,
      // значит он его погладил, а ховер-подскок не должен съедать тап.
      modeRef.current = 'walk';
      frameAccumulatorRef.current = 0;
      if (liftRef.current > 0) {
        liftRef.current = 0;
      }
      writeVisual();
      applySprite({
        sheet: 'idle',
        frame: frameIndexRef.current,
        facing: facingRef.current.value,
      });
      if (!cancelled) {
        onTapRef.current();
      }
    },
    [applySprite, writeVisual],
  );

  const handlePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>): void => {
      finishPress(event, false);
    },
    [finishPress],
  );

  const handlePointerCancel = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>): void => {
      finishPress(event, true);
    },
    [finishPress],
  );

  const handleLostPointerCapture = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>): void => {
      finishPress(event, true);
    },
    [finishPress],
  );

  /**
   * Ховер-реакция: питомец поворачивается мордой к указателю и делает
   * короткий подскок (кадр jump). Не чаще одного раза в 2,2 с.
   */
  const reactToPointer = useCallback(
    (clientX: number): void => {
      if (!animationsEnabledRef.current) {
        return;
      }
      if (pressRef.current !== null || modeRef.current !== 'walk') {
        return;
      }
      const stage = stageRef.current;
      if (stage === null || sizeRef.current.width <= 0) {
        return;
      }
      const now = performance.now();
      if (now - lastHoverAtRef.current < HOVER_REACTION_COOLDOWN_MS) {
        return;
      }
      lastHoverAtRef.current = now;
      const stageRect = stage.getBoundingClientRect();
      const pointerX = clientX - stageRect.left;
      facingRef.current = { value: pointerX >= xRef.current ? 'right' : 'left' };
      modeRef.current = 'hop';
      hopRef.current = { startTime: now, peak: Math.min(HOP_PEAK, getMaxLift()) };
      applySprite({ sheet: 'jump', frame: 0, facing: facingRef.current.value });
    },
    [applySprite, getMaxLift, stageRef],
  );

  return {
    sprite,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handleLostPointerCapture,
    reactToPointer,
  };
}
