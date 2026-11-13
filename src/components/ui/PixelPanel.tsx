import type { ReactNode } from 'react';

export type PixelPanelTone = 'card' | 'screen' | 'cream';

const TONE_CLASS: Record<PixelPanelTone, string> = {
  card: 'bg-app-card',
  screen: 'bg-app-screen',
  cream: 'bg-app-accent-soft',
};

export interface PixelPanelProps {
  children: ReactNode;
  className?: string;
  tone?: PixelPanelTone;
}

/**
 * Hard-edged retro panel: 3px ink border + 4px offset pixel shadow, no blur.
 */
export function PixelPanel({ children, className = '', tone = 'card' }: PixelPanelProps) {
  return (
    <div className={['pixel-frame', TONE_CLASS[tone], className].join(' ')}>{children}</div>
  );
}
