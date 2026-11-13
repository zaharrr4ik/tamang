import { getFrogFrameStyle } from './petSprites';
import type { FrogSheetName } from './petSprites';

/** Какое состояние кадра показывать и куда смотрит питомец. */
export interface FrogSpriteState {
  /** Спрайт-лист, из которого берётся кадр. */
  sheet: FrogSheetName;
  /** Индекс кадра в листе (row-major). */
  frame: number;
  /**
   * Взгляд питомца. Базовый арт нарисован мордой влево, поэтому
   * для взгляда вправо спрайт зеркалится через scaleX(-1).
   */
  facing: 'left' | 'right';
}

interface FrogSpriteProps {
  sprite: FrogSpriteState;
}

/** Один кадр пиксельной лягушки: жёсткие пиксели, без сглаживания и теней. */
export function FrogSprite({ sprite }: FrogSpriteProps) {
  return (
    <div
      aria-hidden="true"
      className="h-full w-full"
      style={{ transform: sprite.facing === 'right' ? 'scaleX(-1)' : undefined }}
    >
      <div
        className="sprite-frame pixelated"
        style={getFrogFrameStyle(sprite.sheet, sprite.frame)}
      />
    </div>
  );
}
