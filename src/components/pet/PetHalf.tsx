import { PetHud } from './PetHud';
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
  return (
    <section
      aria-label="Питомец"
      className="relative flex h-[58%] min-h-[240px] shrink-0 flex-col gap-1.5 pt-[calc(var(--app-safe-top)+0.5rem)]"
    >
      {/* Тёмная полоса устройства с HUD уровня, серии заходов и монет. */}
      <div className="shrink-0 bg-app-panel px-2 py-1.5">
        <PetHud />
      </div>

      <div className="pixel-screen relative mx-3 mb-2 min-h-0 flex-1 overflow-hidden rounded-none">
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
      </div>
    </section>
  );
}
