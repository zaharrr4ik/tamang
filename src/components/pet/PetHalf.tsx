import { getPetLevel } from '@/data/petConfig';
import { usePetStore } from '@/store';
import { PetStage } from './PetStage';

/**
 * Верхняя половина главного экрана — «тамагочи-экран» с LCD-рамкой.
 * Живёт вне динамической зоны: при смене вкладок не размонтируется,
 * поэтому питомец и его состояние сохраняются.
 *
 * Контракт со сценой: .pixel-screen — это позиционированный контейнер
 * фиксированной (flex-1) высоты без внутренних отступов. PetStage заполняет
 * его целиком через absolute inset-0 (пол при этом рисуется внутри PetStage
 * и совпадает с нижней кромкой экрана). Обёртка absolute inset-0 гарантирует
 * сцене полноразмерный positioned-родитель.
 */
export function PetHalf() {
  const totalXp = usePetStore((state) => state.totalXp);
  const level = getPetLevel(totalXp);

  return (
    <section
      aria-label="Питомец"
      className="relative flex h-[50%] min-h-[240px] shrink-0 flex-col px-3 pb-2 pt-[calc(var(--app-safe-top)+0.75rem)]"
    >
      <div className="pixel-screen relative min-h-0 flex-1 overflow-hidden rounded-none">
        {/* Сцена: PetStage сам рисует пол и лягушку и заполняет этот контейнер. */}
        <div className="absolute inset-0">
          <PetStage />
        </div>

        {/* Слой эмодзи-нарядов (PetOutfitSlot) временно скрыт: старые
            смайлики-заглушки убраны, пока питомец — пиксельный спрайт.
            Вернём после того, как появятся пиксельные наряды. */}

        {/* Сканлайны LCD поверх сцены: только вид, тапы не перехватывают. */}
        <div
          aria-hidden="true"
          className="lcd-scanlines pointer-events-none absolute inset-0 z-10"
        />

        {/* Компактный HUD уровня в левом верхнем углу экрана, без эмодзи. */}
        <div className="absolute left-2 top-2 z-20 flex items-center gap-1.5">
          <span className="pixel-chip bg-app-card px-1.5 py-1 font-display text-[8px] leading-none text-app-text">
            УР.{level}
          </span>
          <span className="pixel-chip bg-app-card px-1.5 py-1 font-display text-[8px] leading-none text-app-hint">
            {totalXp} XP
          </span>
        </div>
      </div>
    </section>
  );
}
