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
}

export const PET_CONFIG: PetConfig = {
  defaultName: 'Таманг',
  defaultStats: { health: 100, mood: 100 },
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
