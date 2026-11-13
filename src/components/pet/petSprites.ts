import type { CSSProperties } from 'react';
import idleSheetUrl from '@/assets/pet/idle.png';
import jumpSheetUrl from '@/assets/pet/jump.png';
import fallSheetUrl from '@/assets/pet/fall.png';
import landSheetUrl from '@/assets/pet/land.png';
import turnSheetUrl from '@/assets/pet/turn.png';

/** Единый размер кадра во всех спрайт-листах питомца, исходных пикселей. */
export const SPRITE_FRAME_SIZE = 64;

/** Имена спрайт-листов питомца. */
export type FrogSheetName = 'idle' | 'jump' | 'fall' | 'land' | 'turn';

interface FrogSheet {
  /** URL спрайт-листа (импорт Vite). */
  url: string;
  /** Ширина одного кадра, исходных пикселей. */
  frameWidth: number;
  /** Высота одного кадра, исходных пикселей. */
  frameHeight: number;
  /** Кадров в строке. */
  columns: number;
  /** Строк в листе. */
  rows: number;
  /** Всего кадров (кадры идут row-major). */
  frameCount: number;
}

/**
 * Спрайт-листы из src/assets/pet (все кадры 64×64):
 *  - idle 128×128: 2×2, 4 кадра;
 *  - land 128×64: 2×1, 2 кадра;
 *  - jump / fall / turn 64×64: по 1 кадру.
 */
export const FROG_SHEETS: Record<FrogSheetName, FrogSheet> = {
  idle: {
    url: idleSheetUrl,
    frameWidth: SPRITE_FRAME_SIZE,
    frameHeight: SPRITE_FRAME_SIZE,
    columns: 2,
    rows: 2,
    frameCount: 4,
  },
  jump: {
    url: jumpSheetUrl,
    frameWidth: SPRITE_FRAME_SIZE,
    frameHeight: SPRITE_FRAME_SIZE,
    columns: 1,
    rows: 1,
    frameCount: 1,
  },
  fall: {
    url: fallSheetUrl,
    frameWidth: SPRITE_FRAME_SIZE,
    frameHeight: SPRITE_FRAME_SIZE,
    columns: 1,
    rows: 1,
    frameCount: 1,
  },
  land: {
    url: landSheetUrl,
    frameWidth: SPRITE_FRAME_SIZE,
    frameHeight: SPRITE_FRAME_SIZE,
    columns: 2,
    rows: 1,
    frameCount: 2,
  },
  turn: {
    url: turnSheetUrl,
    frameWidth: SPRITE_FRAME_SIZE,
    frameHeight: SPRITE_FRAME_SIZE,
    columns: 1,
    rows: 1,
    frameCount: 1,
  },
};

/**
 * Обрезка прозрачных полей кадра.
 *
 * Все кадры лягушки укладываются в область x=18..46, y=24..40 исходного кадра
 * (idle/jump/fall/turn/land). Нижняя граница обрезки (y=40) — линия лап, поэтому
 * низ DOM-элемента спрайта всегда совпадает с верхней кромкой пола.
 */
export const FROG_CROP = {
  x: 18,
  y: 24,
  width: 28,
  height: 16,
} as const;

/** Масштаб спрайта: целое число, чтобы пиксели остались жёсткими. */
export const FROG_SCALE = 4;

/** Размер DOM-элемента спрайта на экране (112×64 при масштабе 4). */
export const FROG_DISPLAY_WIDTH = FROG_CROP.width * FROG_SCALE;
export const FROG_DISPLAY_HEIGHT = FROG_CROP.height * FROG_SCALE;

/**
 * CSS одного кадра: лист масштабируется целиком через background-size,
 * а background-position сдвигает его так, чтобы в элементе оказалась
 * обрезка нужного кадра (лист 64×64, кадр 64×64).
 */
export function getFrogFrameStyle(
  sheetName: FrogSheetName,
  frame: number,
  scale: number = FROG_SCALE,
): CSSProperties {
  const sheet = FROG_SHEETS[sheetName];
  const lastFrame = sheet.frameCount - 1;
  const safeFrame = Number.isFinite(frame)
    ? Math.min(lastFrame, Math.max(0, Math.round(frame)))
    : 0;
  const column = safeFrame % sheet.columns;
  const row = Math.floor(safeFrame / sheet.columns);
  const offsetX = (column * sheet.frameWidth + FROG_CROP.x) * scale;
  const offsetY = (row * sheet.frameHeight + FROG_CROP.y) * scale;

  return {
    width: `${FROG_CROP.width * scale}px`,
    height: `${FROG_CROP.height * scale}px`,
    backgroundImage: `url("${sheet.url}")`,
    backgroundSize: `${sheet.frameWidth * sheet.columns * scale}px ${
      sheet.frameHeight * sheet.rows * scale
    }px`,
    backgroundPosition: `-${offsetX}px -${offsetY}px`,
  };
}
