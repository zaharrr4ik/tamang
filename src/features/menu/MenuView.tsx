import { useUiFeedback } from '@/components/hooks/useUiFeedback';
import { PixelButton } from '@/components/ui/PixelButton';
import { PixelIcon } from '@/components/ui/PixelIcon';
import { usePetStore, useUiStore } from '@/store';

/**
 * Главное меню нижней зоны: тёмная игровая панель по макету primer.png.
 * Сверху — строка «Сытость» (иконка сердца, шкала и плашка еды),
 * снизу — большая CTA «На болото», открывающая урок.
 * Панель занимает всю зону и не скроллится.
 */
export function MenuView() {
  const satiety = usePetStore((state) => state.stats.satiety);
  const food = usePetStore((state) => state.food);
  const openTab = useUiStore((state) => state.openTab);
  const { playSound, vibrate } = useUiFeedback();

  const satietyPercent = Math.min(100, Math.max(0, Math.round(satiety)));

  const handleLesson = (): void => {
    playSound('tap');
    vibrate('light');
    openTab('lesson');
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col justify-between gap-2 bg-app-panel p-3">
      <div className="flex items-center gap-2">
        <PixelIcon name="heart" className="h-6 w-6 shrink-0" />

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="font-display text-[11px] uppercase leading-none text-app-panel-text">
            Сытость
          </span>
          <div
            role="progressbar"
            aria-label="Сытость"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={satietyPercent}
            className="h-[14px] w-full overflow-hidden border-2 border-app-panel-deep bg-app-satiety-track"
          >
            <div
              className="h-full bg-app-satiety-fill"
              style={{ width: `${satietyPercent}%` }}
            />
          </div>
        </div>

        <div className="pixel-plate flex h-[56px] w-[56px] shrink-0 flex-col justify-between bg-app-food-plate p-1">
          <PixelIcon name="strawberry" className="h-8 w-8 self-center" />
          <span className="self-end font-display text-[11px] leading-none text-app-panel-text">
            x{food}
          </span>
        </div>
      </div>

      <PixelButton
        tone="green"
        onClick={handleLesson}
        className="max-h-[132px] min-h-[64px] w-full flex-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-app-panel-text"
      >
        <PixelIcon name="book" className="h-8 w-8" />
        <span className="font-display text-[20px] uppercase tracking-wide">На болото</span>
      </PixelButton>
    </div>
  );
}
