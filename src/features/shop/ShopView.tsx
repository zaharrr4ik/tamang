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
 * Магазин: сетка мок-товаров.
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
    <div className="space-y-4">
      <header className="space-y-1">
        <h2 className="text-lg font-bold text-app-text">Магазин</h2>
        <p className="text-sm text-app-hint">
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
              className="flex flex-col rounded-app border border-app-border bg-app-bg p-3 shadow-app"
            >
              <div className="flex items-start justify-between gap-1">
                <span className="text-3xl" role="img" aria-label={item.title}>
                  {item.emoji}
                </span>
                {isEquipped && (
                  <span className="shrink-0 rounded-full border border-app-success px-2 py-0.5 text-[10px] font-semibold text-app-success">
                    Надето
                  </span>
                )}
              </div>

              <h3 className="mt-2 text-sm font-bold leading-tight text-app-text">{item.title}</h3>
              <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-app-hint">
                {item.description}
              </p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-app-hint">
                {CATEGORY_LABELS[item.category]}
              </p>

              <div className="mt-2 flex-1" />

              {isOwned ? (
                <button
                  type="button"
                  onClick={() => handleToggleEquip(item)}
                  className={`mt-1 w-full rounded-app-sm px-3 py-2 text-xs font-bold transition-transform active:scale-95 ${
                    isEquipped
                      ? 'border border-app-border bg-app-card text-app-text'
                      : 'bg-app-accent text-app-accent-contrast'
                  }`}
                >
                  {isEquipped ? 'Снять' : 'Надеть'}
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  title="Покупки появятся в следующих версиях"
                  className="mt-1 w-full cursor-not-allowed rounded-app-sm border border-app-border bg-app-card px-3 py-2 text-xs font-semibold text-app-hint opacity-70"
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
