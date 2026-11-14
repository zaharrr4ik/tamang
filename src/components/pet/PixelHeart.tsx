/** Тон пиксельного сердца: берётся из токенов палитры, без хардкода цветов. */
export type HeartTone = 'danger' | 'accent' | 'yellow';

const HEART_TONE_CLASS: Record<HeartTone, string> = {
  danger: 'bg-app-danger',
  accent: 'bg-app-accent',
  yellow: 'bg-app-yellow',
};

/**
 * Маска сердца 5×5: 1 — закрашенный пиксель, 0 — прозрачный.
 * Получается жёсткое пиксельное сердце без сглаживания и теней.
 */
const PIXEL_HEART_MASK = [
  0, 1, 0, 1, 0,
  1, 1, 1, 1, 1,
  1, 1, 1, 1, 1,
  0, 1, 1, 1, 0,
  0, 0, 1, 0, 0,
] as const;

/** Размер одного пикселя сердца, px: 5 ячеек × 6 px = 30×30 px. */
const HEART_CELL_PX = 6;

/** Пиксельное сердце (30×30 px) из цветов палитры. */
export function PixelHeart({ tone }: { tone: HeartTone }) {
  return (
    <span
      aria-hidden="true"
      className="grid"
      style={{
        gridTemplateColumns: `repeat(5, ${HEART_CELL_PX}px)`,
        gridTemplateRows: `repeat(5, ${HEART_CELL_PX}px)`,
      }}
    >
      {PIXEL_HEART_MASK.map((cell, index) => (
        <span key={index} className={cell === 1 ? HEART_TONE_CLASS[tone] : undefined} />
      ))}
    </span>
  );
}
