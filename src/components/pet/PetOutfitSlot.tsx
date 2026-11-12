import { shopItems } from '@/data/shopItems';
import { usePetStore, useSettingsStore } from '@/store';
import type { ShopItem } from '@/types';

/** Позиции бейджей надетых предметов вокруг питомца (по кругу). */
const SLOT_POSITIONS = [
  'left-[4%] top-[14%]',
  'right-[5%] top-[10%]',
  'left-[1%] bottom-[24%]',
  'right-[2%] bottom-[20%]',
  'left-[44%] top-[1%]',
] as const;

/**
 * Слой надетых предметов из магазина (equippedItemIds -> shopItems).
 * Сейчас это эмодзи-бейджи вокруг питомца; сюда же добавлен пустой контейнер
 * под будущую систему сложного переодевания и анимаций питомца.
 */
export function PetOutfitSlot() {
  const equippedItemIds = usePetStore((state) => state.equippedItemIds);
  const animationsEnabled = useSettingsStore((state) => state.animationsEnabled);

  const equippedItems: ShopItem[] = equippedItemIds
    .map((itemId) => shopItems.find((item) => item.id === itemId))
    .filter((item): item is ShopItem => item !== undefined);

  return (
    <div
      className="pointer-events-none absolute inset-0"
      aria-hidden={equippedItems.length === 0}
      aria-label="Надетые предметы"
    >
      {/* Надетые предметы: показываем эмодзи-бейджи рядом с питомцем. */}
      {equippedItems.map((item, index) => (
        <span
          key={item.id}
          role="img"
          aria-label={item.title}
          title={item.title}
          className={`absolute flex h-9 w-9 items-center justify-center rounded-full border border-app-border bg-app-card text-lg shadow-app ${
            SLOT_POSITIONS[index % SLOT_POSITIONS.length]
          } ${animationsEnabled ? 'animate-pop' : ''}`}
        >
          {item.emoji}
        </span>
      ))}

      {/*
        ПУСТОЙ КОНТЕЙНЕР ПОД БУДУЩИЕ АНИМАЦИИ.
        Задел: сюда будут монтироваться сложные анимации (частицы, эффекты)
        и полноценное переодевание питомца. Слой не интерактивен и не влияет на вёрстку.
        data-атрибуты — точки интеграции для будущих модулей анимаций.
      */}
      <div
        data-slot="pet-animation-layer"
        data-future="animations-outfit"
        className="absolute inset-0"
      />
    </div>
  );
}
