/**
 * Контракт типов приложения (заморожен Lead-ом).
 *
 * Правила:
 *  - Этот файл — единый источник доменных типов. Изменения только через Lead.
 *  - Здесь НЕТ реализации: только типы и константы.
 *  - Импорт из любого места: `import type { Lesson } from '@/types'`.
 */

/** Экран приложения: запуск (яйцо) и главный. */
export type AppScreen = 'start' | 'main';

/**
 * Идентификаторы вкладок динамической нижней зоны.
 * Чтобы добавить новую вкладку: расширь этот union, добавь модуль и запись в реестр вкладок.
 */
export type BottomTabId = 'menu' | 'lesson' | 'shop' | 'settings';

/** Состояние сессии урока. */
export type LessonStatus = 'idle' | 'assembling' | 'correct' | 'wrong' | 'completed';

/**
 * Режим урока. `choice` — текущий режим (кнопки-слова).
 * `voice` — зарезервировано под будущий голосовой ввод (фундамент уже заложен).
 */
export type LessonMode = 'choice' | 'voice';

/** Выражение питомца для отрисовки эмоции. */
export type PetExpression = 'idle' | 'happy' | 'sad' | 'sleeping';

/** Базовые статы питомца, шкала 0..100. */
export interface PetStats {
  health: number;
  mood: number;
}

/** Публичное состояние питомца (то, что хранится и персистится). */
export interface PetState {
  /** Имя питомца, задаётся пользователем (по умолчанию «Таманг»). */
  name: string;
  stats: PetStats;
  expression: PetExpression;
  /** Надетые предметы (задел под переодевание). */
  equippedItemIds: string[];
  /** Накопленный опыт. */
  totalXp: number;
  /** Timestamp последнего взаимодействия (мс). */
  lastInteractionAt: number | null;
}

/** Слово-токен в банке слов урока. */
export interface WordToken {
  id: string;
  text: string;
}

/** Мок-урок: реплика питомца и задание собрать ответ из слов. */
export interface Lesson {
  id: string;
  title: string;
  /** Фраза, которую «говорит» питомец. */
  petPhrase: string;
  /** Инструкция к заданию. */
  instruction: string;
  /** Правильный перевод (показывается после верной/неверной сборки). */
  translation: string;
  /** Перемешанный банк слов. */
  words: WordToken[];
  /** Правильный порядок id слов. */
  correctWordIds: string[];
  xpReward: number;
  mode?: LessonMode;
}

/** Текущая сессия урока. */
export interface LessonSession {
  lessonId: string;
  selectedWordIds: string[];
  status: LessonStatus;
  attempts: number;
}

/** Товар магазина (мок). */
export interface ShopItem {
  id: string;
  title: string;
  description: string;
  emoji: string;
  price: number;
  category: 'outfit' | 'food' | 'accessory';
  /** Выдан игроку изначально. */
  ownedByDefault?: boolean;
}

/** Пользователь Telegram (минимальный срез нужных полей). */
export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

/** Результат подписки/отписки от событий сервиса. */
export type Unsubscribe = () => void;

/** Звуковые события приложения. */
export type SoundId = 'tap' | 'correct' | 'wrong' | 'level-up' | 'purchase';

/**
 * Сервис аудио. Сейчас — no-op заглушка; интерфейс зафиксирован,
 * чтобы позже заменить реализацию без правок вызывающего кода.
 */
export interface AudioService {
  isSupported: boolean;
  setEnabled(enabled: boolean): void;
  play(sound: SoundId): void;
  /** Озвучивание фразы (TTS/аудиофайл) — задел на будущее. */
  playPhrase(text: string, lang?: string): Promise<boolean>;
  stopAll(): void;
}

/**
 * Сервис голосового ввода. Сейчас — заглушка, которая сообщает `isSupported = false`;
 * интерфейс зафиксирован под будущую реализацию (Web Speech API / нативный мост).
 */
export interface VoiceInputService {
  isSupported: boolean;
  isListening: boolean;
  start(): Promise<boolean>;
  stop(): void;
  onResult(callback: (text: string) => void): Unsubscribe;
}

/** Модуль нижней панели: метаданные вкладки + компонент контента. */
export interface BottomTabModule {
  id: BottomTabId;
  title: string;
  /** Эмодзи-иконка (пока без сторонних иконочных библиотек). */
  emoji: string;
  order: number;
}
