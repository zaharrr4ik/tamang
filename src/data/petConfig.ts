import type { PetExpression, PetStats } from '@/types';

/**
 * Конфигурация питомца.
 * Единственное место, где хранятся дефолтные значения, лимиты и экономика взаимодействия.
 * UI и сторы читают числа отсюда, а не хардкодят их у себя.
 */
export interface PetConfig {
  /** Имя питомца по умолчанию. */
  defaultName: string;
  /** Стартовые статы (0..100). */
  defaultStats: PetStats;
  /** Эмодзи для каждого выражения питомца. */
  expressions: Record<PetExpression, string>;
  /** Верхняя граница статов. */
  maxStat: number;
  /** Нижняя граница статов. */
  minStat: number;
  /** Прибавка настроения за клик по питомцу. */
  clickMoodGain: number;
  /** Прибавка здоровья за клик по питомцу. */
  clickHealthGain: number;
  /** Задержка возврата выражения в 'idle' после клика, мс. */
  reactionTimeoutMs: number;
  /** Пороги опыта по уровням: элемент с индексом i — минимальный XP для уровня i + 1. */
  levelThresholds: readonly number[];
  /** Стартовый запас монет. */
  defaultCoins: number;
  /** Стартовый запас еды (клубника). */
  defaultFood: number;
}

export const PET_CONFIG: PetConfig = {
  defaultName: 'Таманг',
  defaultStats: { health: 100, mood: 100, satiety: 60 },
  expressions: {
    idle: '🐥',
    happy: '🥰',
    sad: '😢',
    sleeping: '😴',
  },
  maxStat: 100,
  minStat: 0,
  clickMoodGain: 4,
  clickHealthGain: 1,
  reactionTimeoutMs: 1200,
  levelThresholds: [0, 50, 120, 220, 350, 520, 750, 1050],
  defaultCoins: 120,
  defaultFood: 2,
};

/**
 * Уровень питомца по накопленному опыту (нумерация с 1).
 * Например: totalXp = 0 -> 1, 50 -> 2, 120 -> 3.
 */
export function getPetLevel(totalXp: number): number {
  if (!Number.isFinite(totalXp) || totalXp <= 0) {
    return 1;
  }
  let level = 1;
  for (let index = 0; index < PET_CONFIG.levelThresholds.length; index += 1) {
    if (totalXp >= PET_CONFIG.levelThresholds[index]) {
      level = index + 1;
    }
  }
  return level;
}

/** Прогресс внутри текущего уровня — для плашки уровня в HUD. */
export interface LevelProgress {
  /** Текущий уровень (с 1). */
  level: number;
  /** Опыт, накопленный внутри текущего уровня. */
  xpInLevel: number;
  /** Сколько опыта нужно до следующего уровня, `null` на максимальном уровне. */
  xpForNextLevel: number | null;
  /** Заполнение шкалы уровня, 0..100. */
  percent: number;
}

/**
 * Считает прогресс до следующего уровня.
 * На максимальном уровне шкала всегда заполнена, `xpForNextLevel = null`.
 */
export function getLevelProgress(totalXp: number): LevelProgress {
  const safeXp = Number.isFinite(totalXp) && totalXp > 0 ? totalXp : 0;
  const level = getPetLevel(safeXp);
  const levelStartXp = PET_CONFIG.levelThresholds[level - 1] ?? 0;
  const nextLevelXp = PET_CONFIG.levelThresholds[level] ?? null;

  if (nextLevelXp === null) {
    return {
      level,
      xpInLevel: Math.max(0, safeXp - levelStartXp),
      xpForNextLevel: null,
      percent: 100,
    };
  }

  const span = Math.max(1, nextLevelXp - levelStartXp);
  const xpInLevel = Math.max(0, safeXp - levelStartXp);
  return {
    level,
    xpInLevel,
    xpForNextLevel: nextLevelXp - safeXp,
    percent: Math.min(100, Math.max(0, Math.round((xpInLevel / span) * 100))),
  };
}
