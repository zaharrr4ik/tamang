import { useUiFeedback } from '@/components/hooks/useUiFeedback';
import { PixelButton } from '@/components/ui/PixelButton';
import { shopItems } from '@/data/shopItems';
import { usePetStore } from '@/store';
import type { ShopItem } from '@/types';

/** Русские подписи категорий гардероба. */
const CATEGORY_LABELS: Record<ShopItem['category'], string> = {
  outfit: 'Наряд',
  accessory: 'Аксессуар',
  food: 'Еда',
};

/** В гардеробе только наряды и аксессуары: еда — не одежда. */
const wardrobeItems = shopItems.filter((item) => item.category !== 'food');

/**
 * Гардероб: список нарядов и аксессуаров из магазина.
 * Доступные предметы (выданные изначально или уже надетые) можно надеть/снять —
 * это обновляет `equippedItemIds` в petStore. Остальные помечены «Скоро»:
 * покупки в каркасе не реализованы. Звук и вибрация — через общий хук отклика.
 */
export function WardrobeView() {
  const equippedItemIds = usePetStore((state) => state.equippedItemIds);
  const equipItem = usePetStore((state) => state.equipItem);
  const unequipItem = usePetStore((state) => state.unequipItem);
  const { playSound, vibrate } = useUiFeedback();

  const handleToggleEquip = (item: ShopItem): void => {
    if (equippedItemIds.includes(item.id)) {
      unequipItem(item.id);
    } else {
      equipItem(item.id);
    }
    playSound('tap');
    vibrate('light');
  };

  return (
    <div className="space-y-3">
      <header className="space-y-1">
        <h2 className="font-display text-xs leading-relaxed text-app-text">Гардероб</h2>
        <p className="font-app text-[11px] leading-snug text-app-hint">
          Надень или сними предметы, которые уже есть у питомца. Остальные появятся
          в следующих версиях.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        {wardrobeItems.map((item) => {
          const isEquipped = equippedItemIds.includes(item.id);
          const isOwned = item.ownedByDefault === true || isEquipped;

          return (
            <article key={item.id} className="pixel-frame-sm flex flex-col bg-app-card p-2.5">
              <div className="flex items-start justify-between gap-1">
                <span className="text-3xl leading-none" role="img" aria-label={item.title}>
                  {item.emoji}
                </span>
                {isEquipped && (
                  <span className="pixel-chip shrink-0 bg-app-accent-soft px-1.5 py-1 font-display text-[7px] leading-none text-app-text">
                    Надето
                  </span>
                )}
              </div>

              <h3 className="mt-2 font-display text-[9px] leading-relaxed text-app-text">
                {item.title}
              </h3>
              <p className="mt-1 line-clamp-2 font-app text-[11px] leading-snug text-app-hint">
                {item.description}
              </p>
              <p className="mt-1 font-display text-[7px] uppercase leading-relaxed text-app-hint">
                {CATEGORY_LABELS[item.category]}
              </p>

              <div className="mt-2 flex-1" />

              {isOwned ? (
                <PixelButton
                  size="sm"
                  tone={isEquipped ? 'cream' : 'green'}
                  onClick={() => handleToggleEquip(item)}
                  className="mt-2 min-h-[44px] w-full px-2"
                >
                  <span className="font-display text-[9px] uppercase leading-none">
                    {isEquipped ? 'Снять' : 'Надеть'}
                  </span>
                </PixelButton>
              ) : (
                <button
                  type="button"
                  disabled
                  title="Покупки появятся в следующих версиях"
                  className="pixel-frame-sm mt-2 flex min-h-[44px] w-full cursor-not-allowed select-none items-center justify-center bg-app-card px-2 font-app text-[10px] font-semibold text-app-hint opacity-70"
                >
                  Скоро
                </button>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
