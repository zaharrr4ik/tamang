import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react';
import { FROG_DISPLAY_HEIGHT, FROG_DISPLAY_WIDTH, FROG_SHEETS } from './petSprites';
import type { FrogSpriteState } from './FrogSprite';

/** Ширина пиксельной тени под лапами, px (совпадает с шириной DOM-тени в PetStage). */
export const FROG_SHADOW_WIDTH = Math.round(FROG_DISPLAY_WIDTH * 0.6);

/** Частота idle-цикла: 4 кадра по 200 мс ≈ 5 fps. */
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

/** Насколько пиксельная тень ниже линии лап, px. */
const SHADOW_OFFSET = 10;

/**
 * Горизонтальная зона блуждания: центр питомца — 8–92% ширины сцены.
 * По краям центр дополнительно ограничен половиной ширины спрайта, иначе
 * лягушка обрезалась бы кромкой сцены (спрайт 112 px шире, чем 8% типичной
 * ширины экрана).
 */
const WALK_X_MIN_RATIO = 0.08;
const WALK_X_MAX_RATIO = 0.92;

/** Зазор от базовой линии до нижней кромки сцены: неигровая зона (бордюр пола). */
const BASELINE_BOTTOM_MARGIN = 6;

/** Скорость блуждания, px/с: медленная, чтобы питомец «жил», а не носился. */
const WALK_SPEED_X_MIN = 10;
const WALK_SPEED_X_MAX = 16;
const WALK_SPEED_Y_MIN = 7;
const WALK_SPEED_Y_MAX = 12;

/** Пауза после прихода к цели, мс: 1500–6500, в основном 2–4 с. */
const IDLE_PAUSE_MIN = 1500;
const IDLE_PAUSE_MAX = 6500;
const IDLE_PAUSE_COMMON_MIN = 2000;
const IDLE_PAUSE_COMMON_MAX = 4000;
const IDLE_PAUSE_COMMON_CHANCE = 0.7;

/** Доля целей в средней трети области: питомец тяготеет к центру. */
const GOAL_CENTER_BIAS = 0.7;

/** Минимальная дистанция новой цели, px: по X или по Y (чтобы не дёргался). */
const GOAL_MIN_DX = 40;
const GOAL_MIN_DY = 16;

/** Сколько раз пробуем подобрать цель, прежде чем взять самую дальнюю из попыток. */
const GOAL_PICK_ATTEMPTS = 12;

/** Порог «цель достигнута», px. */
const ARRIVE_EPSILON = 1.5;

/** Минимальное |dx|, при котором питомец разворачивается (а не идёт боком). */
const TURN_BEHIND_MIN_DX = 8;

/** Амплитуда и длина «шага» при ходьбе, px: лёгкое покачивание корпуса. */
const WALK_BOB_PX = 2;
const WALK_BOB_PERIOD_PX = 16;

/** Состояние слоя анимации. */
type FrogMode = 'walk' | 'held' | 'lifted' | 'hop' | 'falling' | 'landing';

/** Фаза блуждания внутри режима walk. */
type WalkPhase = 'idle' | 'turning' | 'moving';

/** Данные активного указателя на питомце. */
interface PressState {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  /** Смещение указателя от центра питомца на момент захвата. */
  grabOffsetX: number;
  /** Высота, с которой начался перенос (обычно 0). */
  startLift: number;
  /** Базовая линия (положение лап) на момент захвата. */
  startBaseline: number;
  /** Превышен ли порог DRAG_THRESHOLD. */
  lifted: boolean;
}

/** Геометрия сцены, нужная rAF-циклу без ре-рендеров. */
interface SceneSize {
  width: number;
  height: number;
  floorHeight: number;
}

/** Границы блуждания в координатах сцены. */
interface WalkBounds {
  minX: number;
  maxX: number;
  /** Верхняя граница базовой линии — линия горизонта пола. */
  horizonY: number;
  /** Нижняя граница базовой линии — неигровая зона снизу. */
  maxY: number;
}

/** Цель блуждания: куда идёт питомец. */
interface WalkGoal {
  x: number;
  baselineY: number;
}

/** Скорости текущего перехода к цели, px/с. */
interface WalkMotion {
  speedX: number;
  speedY: number;
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

/** Случайное число в диапазоне [min, max). */
function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** Пауза стоя после прихода к цели: в основном 2–4 с, иногда короче или дольше. */
function getIdlePauseMs(): number {
  if (Math.random() < IDLE_PAUSE_COMMON_CHANCE) {
    return randomBetween(IDLE_PAUSE_COMMON_MIN, IDLE_PAUSE_COMMON_MAX);
  }
  return randomBetween(IDLE_PAUSE_MIN, IDLE_PAUSE_MAX);
}

/**
 * Куда класть цель внутри отрезка: с вероятностью GOAL_CENTER_BIAS — в среднюю
 * треть, иначе — куда угодно. Так питомец чаще тусуется в центре области.
 */
function pickCenterBiased(min: number, max: number): number {
  const span = max - min;
  if (span <= 0) {
    return min;
  }
  if (Math.random() < GOAL_CENTER_BIAS) {
    return min + span / 3 + Math.random() * (span / 3);
  }
  return min + Math.random() * span;
}

/**
 * Блуждание питомца по земле: медленная ходьба к случайной цели со смещением
 * к центру области, остановки на idle-кадрах, перенос указателем, падение и
 * приземление. Позиция задаётся базовой линией (низ спрайта — лапки) и пишется
 * напрямую в DOM (transform/opacity), чтобы rAF-цикл не вызывал ре-рендеров
 * React; кадр спрайта обновляется стейтом только при реальной смене кадра.
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
  const baselineYRef = useRef(0);
  const liftRef = useRef(0);
  const directionRef = useRef<FrogDirection>(1);
  const facingRef = useRef<FrogFacing>({ value: 'right' });
  const modeRef = useRef<FrogMode>('walk');
  const walkPhaseRef = useRef<WalkPhase>('idle');
  const goalRef = useRef<WalkGoal>({ x: 0, baselineY: 0 });
  const motionRef = useRef<WalkMotion>({
    speedX: WALK_SPEED_X_MIN,
    speedY: WALK_SPEED_Y_MIN,
  });
  const idleUntilRef = useRef(0);
  const frameIndexRef = useRef(0);
  const frameAccumulatorRef = useRef(0);
  const bobPhaseRef = useRef(0);
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

  /**
   * Пишет позицию питомца и тень напрямую в DOM (только transform/opacity).
   * Питомец позиционируется по базовой линии: низ спрайта = baselineY, поэтому
   * сдвиг по Y — `baselineY - stageHeight`; тень лежит чуть ниже лап.
   */
  const writeVisual = useCallback((): void => {
    const { height } = sizeRef.current;
    const x = xRef.current;
    const baselineY = baselineYRef.current;
    const lift = liftRef.current;
    const frog = frogRef.current;
    if (frog !== null) {
      frog.style.transform = `translate3d(${x - FROG_DISPLAY_WIDTH / 2}px, ${
        baselineY - height - lift
      }px, 0)`;
    }
    const shadow = shadowRef.current;
    if (shadow !== null) {
      const squish = clamp(1 - lift / 260, 0.55, 1);
      shadow.style.transform = `translate3d(${x - FROG_SHADOW_WIDTH / 2}px, ${
        baselineY + SHADOW_OFFSET - height
      }px, 0) scale(${squish}, 1)`;
      shadow.style.opacity = String(clamp(0.26 - lift / 300, 0.06, 0.26));
    }
  }, [frogRef, shadowRef]);

  /** Границы блуждания: X — 8–92% ширины (с поправкой на ширину спрайта), Y — от горизонта до низа. */
  const getWalkBounds = useCallback((): WalkBounds => {
    const { width, height, floorHeight: floor } = sizeRef.current;
    const half = FROG_DISPLAY_WIDTH / 2;
    const minX = Math.max(width * WALK_X_MIN_RATIO, half + 2);
    const maxX = Math.min(width * WALK_X_MAX_RATIO, width - half - 2);
    const horizonY = clamp(height - floor, 0, height);
    const maxY = Math.max(horizonY, height - BASELINE_BOTTOM_MARGIN);
    if (maxX <= minX) {
      // Совсем узкая сцена: ходить некуда — стоим по центру.
      const centerX = width / 2;
      return { minX: centerX, maxX: centerX, horizonY, maxY };
    }
    return { minX, maxX, horizonY, maxY };
  }, []);

  const clampX = useCallback(
    (value: number): number => {
      const { minX, maxX } = getWalkBounds();
      return clamp(value, minX, maxX);
    },
    [getWalkBounds],
  );

  const clampBaseline = useCallback(
    (value: number): number => {
      const { horizonY, maxY } = getWalkBounds();
      return clamp(value, horizonY, maxY);
    },
    [getWalkBounds],
  );

  /** Сколько места есть над полом для подъёма питомца. */
  const getMaxLift = useCallback((): number => {
    const { height, floorHeight: floor } = sizeRef.current;
    return Math.max(0, height - floor - FROG_DISPLAY_HEIGHT - 4);
  }, []);

  /**
   * Выбор новой цели: точка в рабочей области со смещением к центру и не ближе
   * GOAL_MIN_DX/GOAL_MIN_DY к текущему положению. Если цель сзади — сначала
   * разворот на месте с паузой TURN_PAUSE_MS.
   */
  const chooseGoal = useCallback(
    (now: number): void => {
      const { minX, maxX, horizonY, maxY } = getWalkBounds();
      const currentX = xRef.current;
      const currentBaseline = baselineYRef.current;
      let bestX = currentX;
      let bestBaseline = currentBaseline;
      let bestScore = -1;
      for (let attempt = 0; attempt < GOAL_PICK_ATTEMPTS; attempt += 1) {
        const candidateX = pickCenterBiased(minX, maxX);
        const candidateBaseline = pickCenterBiased(horizonY, maxY);
        const score = Math.max(
          Math.abs(candidateX - currentX) / GOAL_MIN_DX,
          Math.abs(candidateBaseline - currentBaseline) / GOAL_MIN_DY,
        );
        if (score > bestScore) {
          bestScore = score;
          bestX = candidateX;
          bestBaseline = candidateBaseline;
        }
        if (score >= 1) {
          break;
        }
      }
      goalRef.current = { x: bestX, baselineY: bestBaseline };
      motionRef.current = {
        speedX: randomBetween(WALK_SPEED_X_MIN, WALK_SPEED_X_MAX),
        speedY: randomBetween(WALK_SPEED_Y_MIN, WALK_SPEED_Y_MAX),
      };
      const dx = bestX - currentX;
      if (Math.abs(dx) >= TURN_BEHIND_MIN_DX) {
        const desired: FrogDirection = dx > 0 ? 1 : -1;
        if (desired !== directionRef.current) {
          // Цель сзади: разворот на месте, и только потом ходьба.
          directionRef.current = desired;
          facingRef.current = { value: desired === 1 ? 'right' : 'left' };
          walkPhaseRef.current = 'turning';
          turnUntilRef.current = now + TURN_PAUSE_MS;
          applySprite({ sheet: 'turn', frame: 0, facing: facingRef.current.value });
          return;
        }
      }
      walkPhaseRef.current = 'moving';
      frameAccumulatorRef.current = 0;
      bobPhaseRef.current = 0;
      applySprite({ sheet: 'idle', frame: frameIndexRef.current, facing: facingRef.current.value });
    },
    [applySprite, getWalkBounds],
  );

  /** Приход к цели: встаём на idle-кадры и ждём 1500–6500 мс до новой цели. */
  const arriveAtGoal = useCallback(
    (now: number): void => {
      xRef.current = clampX(goalRef.current.x);
      baselineYRef.current = clampBaseline(goalRef.current.baselineY);
      liftRef.current = 0;
      walkPhaseRef.current = 'idle';
      idleUntilRef.current = now + getIdlePauseMs();
      frameAccumulatorRef.current = 0;
      applySprite({ sheet: 'idle', frame: frameIndexRef.current, facing: facingRef.current.value });
      writeVisual();
    },
    [applySprite, clampBaseline, clampX, writeVisual],
  );

  /** Один шаг анимации; dt в секундах. */
  const step = useCallback(
    (now: number, dt: number): void => {
      if (sizeRef.current.width <= 0) {
        return;
      }
      switch (modeRef.current) {
        case 'walk': {
          // Пауза на разворот: питомец стоит кадром «turn» и только потом идёт.
          if (walkPhaseRef.current === 'turning') {
            liftRef.current = 0;
            applySprite({ sheet: 'turn', frame: 0, facing: facingRef.current.value });
            if (now < turnUntilRef.current) {
              writeVisual();
              break;
            }
            walkPhaseRef.current = 'moving';
            turnUntilRef.current = 0;
            frameAccumulatorRef.current = 0;
            bobPhaseRef.current = 0;
            applySprite({
              sheet: 'idle',
              frame: frameIndexRef.current,
              facing: facingRef.current.value,
            });
          }
          // idle-кадры идут всегда: и в движении, и на остановке питомец «дышит».
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
          if (walkPhaseRef.current === 'idle') {
            // Стоим на месте до конца паузы, затем выбираем новую цель.
            liftRef.current = 0;
            if (now >= idleUntilRef.current) {
              chooseGoal(now);
            }
            writeVisual();
            break;
          }
          const goal = goalRef.current;
          const motion = motionRef.current;
          const dx = goal.x - xRef.current;
          const dy = goal.baselineY - baselineYRef.current;
          const needsX = Math.abs(dx) > ARRIVE_EPSILON;
          const needsY = Math.abs(dy) > ARRIVE_EPSILON;
          if (!needsX && !needsY) {
            arriveAtGoal(now);
            break;
          }
          // Идём к цели по осям со своими скоростями: X 10–16, Y 7–12 px/с.
          const stepX = needsX ? Math.sign(dx) * Math.min(Math.abs(dx), motion.speedX * dt) : 0;
          const stepY = needsY ? Math.sign(dy) * Math.min(Math.abs(dy), motion.speedY * dt) : 0;
          xRef.current += stepX;
          baselineYRef.current += stepY;
          // Лёгкое покачивание корпуса в такт шагам: без него ходьба читается
          // как скольжение (idle-кадры почти одинаковые).
          bobPhaseRef.current += Math.hypot(stepX, stepY);
          liftRef.current =
            Math.abs(Math.sin((bobPhaseRef.current / WALK_BOB_PERIOD_PX) * Math.PI)) * WALK_BOB_PX;
          if (
            Math.abs(goal.x - xRef.current) <= ARRIVE_EPSILON &&
            Math.abs(goal.baselineY - baselineYRef.current) <= ARRIVE_EPSILON
          ) {
            arriveAtGoal(now);
            break;
          }
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
            walkPhaseRef.current = 'idle';
            idleUntilRef.current = now + getIdlePauseMs();
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
    [applySprite, arriveAtGoal, chooseGoal, writeVisual],
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
    walkPhaseRef.current = 'idle';
    liftRef.current = 0;
    turnUntilRef.current = 0;
    frameAccumulatorRef.current = 0;
    idleUntilRef.current = performance.now() + getIdlePauseMs();
    applySprite({ sheet: 'idle', frame: 0, facing: facingRef.current.value });
    writeVisual();
  }, [animationsEnabled, applySprite, writeVisual]);

  // Геометрия сцены: на первом кадре ставим питомца в центр рабочей области,
  // дальше держим X и базовую линию в новых границах (ресайз/поворот экрана).
  useLayoutEffect(() => {
    sizeRef.current = { width: stageWidth, height: stageHeight, floorHeight };
    if (stageWidth <= 0) {
      return;
    }
    const bounds = getWalkBounds();
    if (!initializedRef.current) {
      initializedRef.current = true;
      xRef.current = (bounds.minX + bounds.maxX) / 2;
      baselineYRef.current = (bounds.horizonY + bounds.maxY) / 2;
      walkPhaseRef.current = 'idle';
      idleUntilRef.current = 0;
    } else {
      xRef.current = clamp(xRef.current, bounds.minX, bounds.maxX);
      baselineYRef.current = clampBaseline(baselineYRef.current);
      goalRef.current = {
        x: clampX(goalRef.current.x),
        baselineY: clampBaseline(goalRef.current.baselineY),
      };
    }
    liftRef.current = clamp(liftRef.current, 0, getMaxLift());
    writeVisual();
  }, [stageWidth, stageHeight, floorHeight, clampBaseline, clampX, getMaxLift, getWalkBounds, writeVisual]);

  /** Подхват питомца: начинается перенос без телепорта (сохраняем точку захвата). */
  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>): void => {
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
        startBaseline: baselineYRef.current,
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
    },
    [applySprite, writeVisual],
  );

  /**
   * Перенос: после порога 6 px питомец «отрывается» от пола и следует за пальцем.
   * Вверх — подъём над землёй, вниз — сначала опускание, затем уход вглубь сцены
   * (базовая линия сдвигается, но остаётся в границах рабочей области).
   */
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
        baselineYRef.current = press.startBaseline;
        if (animationsEnabledRef.current) {
          applySprite({ sheet: 'jump', frame: 0, facing: facingRef.current.value });
        }
        event.preventDefault();
      }
      const deltaY = event.clientY - press.startClientY;
      xRef.current = clampX(event.clientX - press.grabOffsetX);
      if (deltaY <= 0) {
        // Вверх: питомец отрывается от земли.
        liftRef.current = clamp(press.startLift - deltaY, 0, getMaxLift());
      } else {
        // Вниз: сначала гасим подъём, затем уводим базовую линию вглубь.
        const groundShift = Math.max(0, deltaY - press.startLift);
        liftRef.current = Math.max(0, press.startLift - deltaY);
        baselineYRef.current = clampBaseline(press.startBaseline + groundShift);
      }
      writeVisual();
    },
    [applySprite, clampBaseline, clampX, getMaxLift, writeVisual],
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
          // Анимации выключены или питомца тащили по земле без отрыва:
          // без кадров падения просто возвращаемся к блужданию.
          modeRef.current = 'walk';
          walkPhaseRef.current = 'idle';
          idleUntilRef.current = performance.now() + getIdlePauseMs();
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
      // Отпускание без переноса — это всегда тап: питомец переживает ласку,
      // встаёт на idle-кадры и чуть позже выбирает новую цель.
      modeRef.current = 'walk';
      walkPhaseRef.current = 'idle';
      idleUntilRef.current = performance.now() + getIdlePauseMs();
      liftRef.current = 0;
      frameAccumulatorRef.current = 0;
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
