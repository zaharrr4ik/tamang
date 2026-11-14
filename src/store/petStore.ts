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
  /**
   * Отметить заход игрока: раз в календарный день обновляет серию (streak).
   * Идемпотентен: повторный вызов в тот же день ничего не меняет.
   */
  registerVisit(): void;
  /** Сброс питомца к дефолтам из PET_CONFIG. */
  resetPet(): void;
}

/** Что именно сохраняется в localStorage (expression не персистится). */
type PetPersistedState = Pick<
  PetState,
  | 'name'
  | 'stats'
  | 'equippedItemIds'
  | 'totalXp'
  | 'lastInteractionAt'
  | 'coins'
  | 'food'
  | 'streak'
  | 'lastVisitDate'
>;

/** Максимальная длина имени питомца. */
const MAX_NAME_LENGTH = 24;

/** Ключ локальной даты YYYY-MM-DD (серия считается по местному времени). */
function getLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Ограничивает стат диапазоном и защищает от NaN/Infinity. */
function clampStat(value: number): number {
  if (!Number.isFinite(value)) {
    return PET_CONFIG.minStat;
  }
  return Math.min(PET_CONFIG.maxStat, Math.max(PET_CONFIG.minStat, Math.round(value)));
}

/** Значение по умолчанию для нового сохранения. */
const DEFAULT_PERSISTED_STATE: PetPersistedState = {
  name: PET_CONFIG.defaultName,
  stats: { ...PET_CONFIG.defaultStats },
  equippedItemIds: [],
  totalXp: 0,
  lastInteractionAt: null,
  coins: PET_CONFIG.defaultCoins,
  food: PET_CONFIG.defaultFood,
  streak: 1,
  lastVisitDate: null,
};

/** Безопасно читает стат из старого сохранения (может не содержать satiety). */
function normalizeStat(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? clampStat(value) : clampStat(fallback);
}

/** Безопасно читает неотрицательное целое из старого сохранения. */
function normalizeCount(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(0, Math.round(value));
}

/**
 * Миграция сохранений до версии 2: в старых сейвах нет satiety, монет, еды и серии.
 * Намеренно терпима к отсутствующим/битым полям — данные игрока не должны теряться.
 */
function migratePersistedState(persisted: unknown): PetPersistedState {
  if (!persisted || typeof persisted !== 'object') {
    return { ...DEFAULT_PERSISTED_STATE, stats: { ...DEFAULT_PERSISTED_STATE.stats } };
  }
  const raw = persisted as Partial<PetPersistedState> & { stats?: Partial<PetStats> };
  const savedName = typeof raw.name === 'string' ? raw.name.trim().slice(0, MAX_NAME_LENGTH) : '';
  const savedEquipped = Array.isArray(raw.equippedItemIds)
    ? raw.equippedItemIds.filter((id): id is string => typeof id === 'string')
    : [];

  return {
    name: savedName || DEFAULT_PERSISTED_STATE.name,
    stats: {
      health: normalizeStat(raw.stats?.health, PET_CONFIG.defaultStats.health),
      mood: normalizeStat(raw.stats?.mood, PET_CONFIG.defaultStats.mood),
      satiety: normalizeStat(raw.stats?.satiety, PET_CONFIG.defaultStats.satiety),
    },
    equippedItemIds: savedEquipped,
    totalXp: normalizeCount(raw.totalXp, DEFAULT_PERSISTED_STATE.totalXp),
    lastInteractionAt:
      typeof raw.lastInteractionAt === 'number' && Number.isFinite(raw.lastInteractionAt)
        ? raw.lastInteractionAt
        : null,
    coins: normalizeCount(raw.coins, PET_CONFIG.defaultCoins),
    food: normalizeCount(raw.food, PET_CONFIG.defaultFood),
    streak: Math.max(1, normalizeCount(raw.streak, DEFAULT_PERSISTED_STATE.streak)),
    lastVisitDate: typeof raw.lastVisitDate === 'string' ? raw.lastVisitDate : null,
  };
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
      coins: PET_CONFIG.defaultCoins,
      food: PET_CONFIG.defaultFood,
      streak: 1,
      lastVisitDate: null,

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
            satiety: state.stats.satiety,
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
            satiety: applyDelta(state.stats.satiety, delta.satiety),
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

      registerVisit: () => {
        set((state) => {
          const today = getLocalDateKey(new Date());
          if (state.lastVisitDate === today) {
            return state;
          }
          const now = new Date();
          const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
          const isConsecutive = state.lastVisitDate === getLocalDateKey(yesterday);
          return {
            streak: isConsecutive ? Math.max(1, state.streak) + 1 : 1,
            lastVisitDate: today,
          };
        });
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
          coins: PET_CONFIG.defaultCoins,
          food: PET_CONFIG.defaultFood,
          streak: 1,
          lastVisitDate: null,
        });
      },
    }),
    {
      name: PET_STORE_KEY,
      version: 2,
      migrate: (persisted) => migratePersistedState(persisted),
      partialize: (state): PetPersistedState => ({
        name: state.name,
        stats: state.stats,
        equippedItemIds: state.equippedItemIds,
        totalXp: state.totalXp,
        lastInteractionAt: state.lastInteractionAt,
        coins: state.coins,
        food: state.food,
        streak: state.streak,
        lastVisitDate: state.lastVisitDate,
      }),
    },
  ),
);
