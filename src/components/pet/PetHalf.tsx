import { getPetLevel } from '@/data/petConfig';
import { usePetStore } from '@/store';
import { PetOutfitSlot } from './PetOutfitSlot';
import { PetStage } from './PetStage';
import { PetStats } from './PetStats';

/**
 * Верхняя половина главного экрана.
 * Живёт вне динамической зоны: при смене вкладок не размонтируется,
 * поэтому питомец и его статы сохраняют состояние.
 */
export function PetHalf() {
  const name = usePetStore((state) => state.name);
  const totalXp = usePetStore((state) => state.totalXp);
  const level = getPetLevel(totalXp);

  return (
    <section
      aria-label="Питомец"
      className="relative flex h-[48%] min-h-[232px] shrink-0 flex-col overflow-hidden px-4 pb-3 pt-[calc(var(--app-safe-top)+0.75rem)]"
    >
      <header className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold leading-tight text-app-text">{name}</h2>
          <p className="text-[11px] text-app-hint">Твой питомец-полиглот</p>
        </div>
        <span className="shrink-0 rounded-full border border-app-border bg-app-card px-3 py-1 text-[11px] font-semibold text-app-accent shadow-app">
          ⭐ Ур. {level} · {totalXp} XP
        </span>
      </header>

      {/* Сцена питомца: сам питомец, слой надетых предметов и задел под анимации. */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center">
        <PetStage />
        <PetOutfitSlot />
      </div>

      <PetStats />
    </section>
  );
}
