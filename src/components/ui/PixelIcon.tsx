import type { CSSProperties } from 'react';
import bookUrl from '@/assets/icons/book.png';
import chestUrl from '@/assets/icons/chest.png';
import coinUrl from '@/assets/icons/coin.png';
import compassUrl from '@/assets/icons/compass.png';
import crownUrl from '@/assets/icons/crown.png';
import fireUrl from '@/assets/icons/fire.png';
import heartUrl from '@/assets/icons/heart.png';
import lilyUrl from '@/assets/icons/lily.png';
import strawberryUrl from '@/assets/icons/strawberry.png';

/** Доступные пиксельные иконки (прозрачные PNG 64×64 в src/assets/icons). */
export type PixelIconName =
  | 'lily'
  | 'chest'
  | 'crown'
  | 'compass'
  | 'heart'
  | 'coin'
  | 'fire'
  | 'strawberry'
  | 'book';

const ICON_SOURCES: Record<PixelIconName, string> = {
  lily: lilyUrl,
  chest: chestUrl,
  crown: crownUrl,
  compass: compassUrl,
  heart: heartUrl,
  coin: coinUrl,
  fire: fireUrl,
  strawberry: strawberryUrl,
  book: bookUrl,
};

interface PixelIconProps {
  name: PixelIconName;
  /** Размер и отступы задаются классами: `h-6 w-6`, `mt-0.5` и т.п. */
  className?: string;
  style?: CSSProperties;
}

/**
 * Одна пиксельная иконка из набора игры.
 * Декоративная: скрыта от скринридеров, смысл должен быть в тексте рядом.
 */
export function PixelIcon({ name, className, style }: PixelIconProps) {
  return (
    <img
      src={ICON_SOURCES[name]}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={`pixelated shrink-0 select-none ${className ?? ''}`}
      style={style}
    />
  );
}
