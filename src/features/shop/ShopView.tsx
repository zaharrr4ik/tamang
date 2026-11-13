import { useUiFeedback } from '@/components/hooks/useUiFeedback';
import { shopItems } from '@/data/shopItems';
import { usePetStore } from '@/store';
import type { ShopItem } from '@/types';

/** Русские подписи категорий товаров. */
const CATEGORY_LABELS: Record<ShopItem['category'], string> = {
  outfit: 'Наряд',
  food: 'Еда',
  accessory: 'Аксессуар',
};

/**
 * Магазин: сетка мок-товаров в пиксельных карточках.
 * Предметы, выданные изначально (ownedByDefault), можно надеть или снять —
 * они сразу видны в слое питомца (PetOutfitSlot). Покупки в каркасе не реализованы,
 * поэтому остальные товары показывают цену и неактивную кнопку «Скоро».
 */
export function ShopView() {
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
        <h2 className="font-display text-xs leading-relaxed text-app-text">Магазин</h2>
        <p className="font-app text-[11px] leading-snug text-app-hint">
          Покупки появятся в следующих версиях. Пока доступны предметы, выданные на старте:
          надень их — и они появятся рядом с питомцем.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        {shopItems.map((item) => {
          const isOwned = item.ownedByDefault === true;
          const isEquipped = equippedItemIds.includes(item.id);

          return (
            <article
              key={item.id}
              className="pixel-frame flex flex-col bg-app-card p-2.5"
            >
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
                <button
                  type="button"
                  onClick={() => handleToggleEquip(item)}
                  className={[
                    'pixel-btn-sm flex min-h-[44px] w-full select-none items-center justify-center px-2',
                    'font-display text-[9px] uppercase leading-none',
                    isEquipped
                      ? 'bg-app-card text-app-text'
                      : 'bg-app-accent text-app-accent-contrast',
                  ].join(' ')}
                >
                  {isEquipped ? 'Снять' : 'Надеть'}
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  title="Покупки появятся в следующих версиях"
                  className="pixel-frame-sm flex min-h-[44px] w-full cursor-not-allowed select-none items-center justify-center bg-app-card px-2 font-app text-[10px] font-semibold text-app-hint opacity-70"
                >
                  {item.price} 🪙 · Скоро
                </button>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
