import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type PixelButtonTone = 'green' | 'blue' | 'cream' | 'yellow';
export type PixelButtonSize = 'md' | 'sm';

const TONE_CLASS: Record<PixelButtonTone, string> = {
  green: 'bg-app-accent text-app-accent-contrast',
  blue: 'bg-app-blue text-app-blue-contrast',
  cream: 'bg-app-card text-app-text',
  yellow: 'bg-app-yellow text-app-ink',
};

const SIZE_CLASS: Record<PixelButtonSize, string> = {
  md: 'min-h-[52px] px-5 py-3 text-lg font-semibold',
  sm: 'min-h-[40px] px-3 py-2 text-sm font-semibold',
};

export interface PixelButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: PixelButtonTone;
  size?: PixelButtonSize;
  children: ReactNode;
}

/**
 * Duolingo-style chunky button with a hard 4px pixel shadow that visually
 * "presses" down on tap. Colors come strictly from --app-* design tokens.
 */
export function PixelButton({
  tone = 'green',
  size = 'md',
  className = '',
  children,
  type = 'button',
  ...rest
}: PixelButtonProps) {
  const base = size === 'sm' ? 'pixel-btn-sm' : 'pixel-btn';
  return (
    <button
      type={type}
      className={[
        base,
        'flex select-none items-center justify-center gap-2 leading-none',
        TONE_CLASS[tone],
        SIZE_CLASS[size],
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
}
