import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PetExpression, PetState, PetStats } from '@/types';
import { PET_CONFIG } from '@/data/petConfig';

/** Ключ persist-хранилища питомца. */
export const PET_STORE_KEY = 'tamang.pet';

/**
 * Публичное состояние питомца + действия.
 * Компоненты читают только через селекторы: `usePetStore((s) => s.stats)`.
 */
export interface PetStoreState extends PetState {
  /** Добавляет опыт (только положительное конечное число). */
  addXp(amount: number): void;
  /** Клик по питомцу: mood +4, health +1 (clamp 0..100), expression='happy', lastInteractionAt=now. */
  petClick(): void;
  /** Изменяет статы на указанные дельты с ограничением в [minStat, maxStat]. */
  applyStatDelta(delta: Partial<PetStats>): void;
  /** Принудительно задаёт выражение (сбрасывает таймер возврата в idle). */
  setExpression(expression: PetExpression): void;
  /** Надеть предмет (id не дублируются). */
  equipItem(itemId: string): void;
  /** Снять предмет. */
  unequipItem(itemId: string): void;
  /** Переименовать питомца (пустое имя игнорируется, длина ограничена). */
  renamePet(name: string): void;
  /** Сброс питомца к дефолтам из PET_CONFIG. */
  resetPet(): void;
}

/** Что именно сохраняется в localStorage (expression не персистится). */
type PetPersistedState = Pick<
  PetState,
  'name' | 'stats' | 'equippedItemIds' | 'totalXp' | 'lastInteractionAt'
>;

/** Максимальная длина имени питомца. */
const MAX_NAME_LENGTH = 24;

/** Ограничивает стат диапазоном и защищает от NaN/Infinity. */
function clampStat(value: number): number {
  if (!Number.isFinite(value)) {
    return PET_CONFIG.minStat;
  }
  return Math.min(PET_CONFIG.maxStat, Math.max(PET_CONFIG.minStat, Math.round(value)));
}

/** Изменяет стат на дельту, не выходя за границы. */
function applyDelta(current: number, delta: number | undefined): number {
  if (delta === undefined || !Number.isFinite(delta)) {
    return current;
  }
  return clampStat(current + delta);
}

/**
 * Таймер возврата выражения в 'idle' после клика.
 * Хранится на уровне модуля: переживает ререндеры и сбрасывается при повторном клике.
 */
let reactionTimer: ReturnType<typeof setTimeout> | null = null;

/** Останавливает запланированный возврат выражения в 'idle'. */
function clearReactionTimer(): void {
  if (reactionTimer !== null) {
    clearTimeout(reactionTimer);
    reactionTimer = null;
  }
}

/** Планирует возврат выражения в 'idle' через reactionTimeoutMs. */
function scheduleIdleReset(set: (partial: Partial<PetStoreState>) => void): void {
  clearReactionTimer();
  reactionTimer = setTimeout(() => {
    reactionTimer = null;
    set({ expression: 'idle' });
  }, PET_CONFIG.reactionTimeoutMs);
}

export const usePetStore = create<PetStoreState>()(
  persist(
    (set) => ({
      name: PET_CONFIG.defaultName,
      stats: { ...PET_CONFIG.defaultStats },
      expression: 'idle',
      equippedItemIds: [],
      totalXp: 0,
      lastInteractionAt: null,

      addXp: (amount) => {
        if (!Number.isFinite(amount) || amount <= 0) {
          return;
        }
        set((state) => ({ totalXp: state.totalXp + Math.round(amount) }));
      },

      petClick: () => {
        set((state) => ({
          stats: {
            health: applyDelta(state.stats.health, PET_CONFIG.clickHealthGain),
            mood: applyDelta(state.stats.mood, PET_CONFIG.clickMoodGain),
          },
          expression: 'happy',
          lastInteractionAt: Date.now(),
        }));
        // Повторный клик продлевает реакцию: старый таймер сбрасывается.
        scheduleIdleReset(set);
      },

      applyStatDelta: (delta) => {
        set((state) => ({
          stats: {
            health: applyDelta(state.stats.health, delta.health),
            mood: applyDelta(state.stats.mood, delta.mood),
          },
        }));
      },

      setExpression: (expression) => {
        clearReactionTimer();
        set({ expression });
      },

      equipItem: (itemId) => {
        if (!itemId) {
          return;
        }
        set((state) =>
          state.equippedItemIds.includes(itemId)
            ? state
            : { equippedItemIds: [...state.equippedItemIds, itemId] },
        );
      },

      unequipItem: (itemId) => {
        set((state) => ({
          equippedItemIds: state.equippedItemIds.filter((id) => id !== itemId),
        }));
      },

      renamePet: (name) => {
        const nextName = name.trim().slice(0, MAX_NAME_LENGTH);
        if (!nextName) {
          return;
        }
        set({ name: nextName });
      },

      resetPet: () => {
        clearReactionTimer();
        set({
          name: PET_CONFIG.defaultName,
          stats: { ...PET_CONFIG.defaultStats },
          expression: 'idle',
          equippedItemIds: [],
          totalXp: 0,
          lastInteractionAt: null,
        });
      },
    }),
    {
      name: PET_STORE_KEY,
      version: 1,
      partialize: (state): PetPersistedState => ({
        name: state.name,
        stats: state.stats,
        equippedItemIds: state.equippedItemIds,
        totalXp: state.totalXp,
        lastInteractionAt: state.lastInteractionAt,
      }),
    },
  ),
);
