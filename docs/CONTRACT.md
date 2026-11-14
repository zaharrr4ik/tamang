# КОНТРАКТ КАРКАСА (заморожен Lead-ом)

> Этот документ — единственный источник истины по интерфейсам между модулями.
> Любой агент может читать его, менять — только Lead.
> Изменение публичного API (имена файлов/экспортов/сигнатур) без согласования с Lead запрещено.

## 0. Среда выполнения

- Проект: `C:\Users\kotaz\Downloads\tamang\tamang-app` (далее — `PROJECT`).
- Node/pnpm не в PATH. Используй .cmd-обёртку (работает из любого shell, обходит ExecutionPolicy):
  ```bat
  C:\Users\kotaz\Downloads\tamang\run-pnpm.cmd install
  C:\Users\kotaz\Downloads\tamang\run-pnpm.cmd typecheck
  C:\Users\kotaz\Downloads\tamang\run-pnpm.cmd build
  ```
  (обёртка делает `cd PROJECT` и вызывает bundled node + pnpm).
- Зависимости уже установлены (`node_modules`). Новые npm-пакеты добавлять ЗАПРЕЩЕНО без явного разрешения Lead.
- Код, комментарии и тексты интерфейса — на русском языке.
- TypeScript strict включён (`noUnusedLocals`, `noUnusedParameters`), сборка падает на любых ошибках типов.

## 1. Владение файлами (write scopes)

| Роль | Пишет |
|---|---|
| Lead | `package.json`, `vite.config.ts`, `tsconfig.json`, `postcss.config.js`, `index.html`, `src/main.tsx`, `src/vite-env.d.ts`, `src/types/index.ts`, `src/index.css` (слой токенов) |
| Architect | `README.md`, `docs/ARCHITECTURE.md` |
| State | `src/store/**`, `src/lib/**`, `src/data/**` |
| UI | `src/components/**`, `src/modules/**`, `src/features/**`, `src/App.tsx`, `src/index.css` (может дополнять токены, но не удалять), `tailwind.config.js` (может расширять) |
| QA | `docs/QA-REPORT.md` (только отчёт) |

`src/types/index.ts` не редактируется без Lead. Статы питомца, уроки, товары и пр. — только через экспорты, описанные ниже.

## 2. Доменные типы

Все типы — в `src/types/index.ts`, импорт `import type { ... } from '@/types'`. Ниже — актуальный срез (полный список в файле):
`AppScreen`, `BottomTabId`, `LessonStatus`, `LessonMode`, `PetExpression`, `PetStats`, `PetState`, `WordToken`, `Lesson`, `LessonSession`, `ShopItem`, `TelegramUser`, `SoundId`, `AudioService`, `VoiceInputService`, `BottomTabModule`.

Актуальные формы (14.11.2026):

```ts
type BottomTabId = 'menu' | 'lesson' | 'shop' | 'wardrobe' | 'settings';
interface PetStats { health: number; mood: number; satiety: number; }
interface PetState {
  name: string;
  stats: PetStats;
  expression: PetExpression;
  equippedItemIds: string[];
  totalXp: number;
  lastInteractionAt: number | null;
  coins: number;
  food: number;
  streak: number;              // серия ежедневных заходов
  lastVisitDate: string | null; // 'YYYY-MM-DD' по локальной дате
}
interface BottomTabModule {
  id: BottomTabId; title: string; emoji: string; order: number;
  /** false — вкладка открывается программно и не показывается в нижней навигации. */
  inNav?: boolean;
}
```


## 3. Zustand-сторы

`create` + `persist` из `zustand`/`zustand/middleware` (версия 4.5.5). Селекторы обязательны: `usePetStore((s) => s.stats)`.

### 3.1 `src/store/petStore.ts`

```ts
export const PET_STORE_KEY = 'tamang.pet';

interface PetStoreState extends PetState {
  addXp(amount: number): void;
  /** Клик по питомцу: mood +4, health +1 (clamp 0..100), expression='happy', lastInteractionAt=now. */
  petClick(): void;
  /** Возврат выражения в 'idle' через ~1200мс после petClick. */
  applyStatDelta(delta: Partial<PetStats>): void;
  setExpression(expression: PetExpression): void;
  equipItem(itemId: string): void;
  unequipItem(itemId: string): void;
  renamePet(name: string): void;
  /** Ежедневный заход: идемпотентен в рамках одного дня; вчера+сегодня → streak+1, иначе 1. Вызывается из RootScreen. */
  registerVisit(): void;
  resetPet(): void;
}

export const usePetStore = create<PetStoreState>()(...);
```

- Начальные значения берутся из `src/data/petConfig.ts`.
- `persist` (версия 2) хранит: `name`, `stats`, `equippedItemIds`, `totalXp`, `lastInteractionAt`, `coins`, `food`, `streak`, `lastVisitDate`. `expression` не персистится (при загрузке `'idle'`).
- Миграция со старых сохранений — `migrate: (persisted) => migratePersistedState(persisted)`; недостающие поля (в т.ч. `stats.satiety`) добираются из `PET_CONFIG` / `DEFAULT_PERSISTED_STATE`, счётчики нормализуются `normalizeCount`.
- `resetPet()` — сброс к дефолтам (включая `coins`/`food`/`streak`/`lastVisitDate`).
- Самостоятельно вызывает `audioService` НЕ должен (звук — на стороне UI).

### 3.2 `src/store/uiStore.ts`

```ts
interface UiStoreState {
  screen: AppScreen;        // старт: 'start'
  bottomTab: BottomTabId;   // старт: 'menu'
  setScreen(screen: AppScreen): void;
  start(): void;            // экран -> 'main', вкладка -> 'menu'
  openTab(tab: BottomTabId): void;
  backToMenu(): void;
}
export const useUiStore = create<UiStoreState>()(...); // без persist
```

### 3.3 `src/store/lessonStore.ts`

```ts
interface LessonStoreState {
  lessons: Lesson[];                 // из src/data/lessons.ts
  currentLessonId: string | null;
  selectedWordIds: string[];
  status: LessonStatus;              // 'idle' | 'assembling' | 'correct' | 'wrong' | 'completed'
  attempts: number;
  completedLessonIds: string[];      // персистится
  startLesson(lessonId?: string): void; // без id — первый незавершённый, иначе первый
  selectWord(wordId: string): void;     // игнор при 'correct'/'wrong'/'completed'; повторный клик по уже выбранному слову игнорируется (id уникальны)
  removeWordAt(index: number): void;    // удалить слово из ответа по позиции
  clearAnswer(): void;
  checkAnswer(): boolean;               // сравнить selectedWordIds с correctWordIds; инкремент attempts;
                                        // при верно: status='correct', completedLessonIds += lessonId; награда
                                        // (addXp(xpReward) + applyStatDelta({mood: +4})) — ТОЛЬКО при первом
                                        // завершении урока; повторное прохождение даёт обратную связь без награды.
                                        // при неверно: status='wrong'. Вернуть результат.
  nextLesson(): void;                   // следующий незавершённый, иначе status='completed'
  exitLesson(): void;                   // currentLessonId=null, selected=[], status='idle'
  resetProgress(): void;                // очистить completedLessonIds и сессию
}
export const useLessonStore = create<LessonStoreState>()(...);
```

- `persist` хранит только `completedLessonIds` (ключ `tamang.lesson-progress`).
- Уроки не дублируются: `lessons` — статический импорт из `src/data/lessons.ts`.

### 3.4 `src/store/settingsStore.ts`

```ts
interface SettingsStoreState {
  soundEnabled: boolean;      // true
  hapticsEnabled: boolean;    // true
  animationsEnabled: boolean; // true
  toggleSound(): void;
  toggleHaptics(): void;
  toggleAnimations(): void;
  resetSettings(): void;
}
export const useSettingsStore = create<SettingsStoreState>()(...); // ключ 'tamang.settings'
```

### 3.5 `src/store/index.ts`

Реэкспорт: `export * from './petStore'` и т.д. (включая ключи). UI импортирует только отсюда:
`import { usePetStore, useUiStore, useLessonStore, useSettingsStore } from '@/store';`

## 4. Telegram-слой (`src/lib/telegram/`)

```ts
// types.ts — минимальная типизация официального SDK (window.Telegram.WebApp)
// useTelegram.ts
export interface TelegramContextValue {
  isTelegram: boolean;
  webApp: TelegramWebApp | null;
  colorScheme: 'light' | 'dark';
  user: TelegramUser | null;
  /** Тактильный отклик; безопасен вне Telegram. */
  haptic: (type: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning') => void;
}
export function useTelegram(): TelegramContextValue; // внутри <TelegramProvider>
// TelegramProvider.tsx
export function TelegramProvider(props: { children: ReactNode }): JSX.Element;
```

Требования к провайдеру:
- при наличии `window.Telegram.WebApp`: `ready()`, `expand()`, `disableVerticalSwipes?.()` (если метод есть), установка цвета шапки/фона из themeParams с try/catch;
- тема: `document.documentElement.classList.toggle('dark', scheme === 'dark')` + `data-theme` атрибут; подписка на `themeChanged` с корректным `offEvent` при размонтировании;
- вне Telegram: тема по `matchMedia('(prefers-color-scheme: dark)')` + слушатель изменения;
- `haptic` — no-op вне Telegram.

## 5. Аудио и голос (задел, `src/lib/`)

```ts
// src/lib/audio.ts
export const audioService: AudioService; // no-op реализация, isSupported=false, setEnabled запоминает флаг
// src/lib/voice.ts
export const voiceInputService: VoiceInputService; // isSupported=false, start() -> Promise.resolve(false)
```

UI может вызывать `audioService.play('tap')` свободно; в каркасе звука нет (это осознанный no-op).
Кнопки «прослушать» / «голосом» рендерятся, но `disabled` с подсказкой «скоро» — точки расширения.

## 6. Данные (`src/data/`)

```ts
// lessons.ts
export const lessons: Lesson[]; // >= 3 урока, корректные correctWordIds, банк слов с дистракторами
// shopItems.ts
export const shopItems: ShopItem[]; // >= 5 товаров; 2-3 с ownedByDefault: true
// petConfig.ts
export const PET_CONFIG: {
  defaultName: string;         // 'Таманг'
  defaultStats: PetStats;      // { health: 100, mood: 100, satiety: 60 }
  defaultCoins: number;        // 120
  defaultFood: number;         // 2
  expressions: Record<PetExpression, string>; // эмодзи по выражению
  maxStat: number;             // 100
  minStat: number;             // 0
  clickMoodGain: number;       // 4
  clickHealthGain: number;     // 1
  reactionTimeoutMs: number;   // 1200
  levelThresholds: readonly number[]; // пороги уровней по totalXp: [0, 50, 120, 220, 350, 520, 750, 1050]
};
/** Уровень питомца по totalXp (1..8); аддитивное расширение, согласовано Lead. */
export function getPetLevel(totalXp: number): number;

export interface LevelProgress {
  level: number;
  xpInLevel: number;
  xpForNextLevel: number | null; // null на максимальном уровне
  percent: number;               // 0..100, заполнение плашки уровня
}
/** Прогресс внутри текущего уровня для HUD. */
export function getLevelProgress(totalXp: number): LevelProgress;
```

`levelThresholds`/`getPetLevel` изначально не были описаны в контракте и появились в State-слое как расширение; на ревью узаконены Lead (см. §9).

## 7. UI-слой

### 7.1 Реестр вкладок — `src/modules/registry.tsx`

```tsx
export interface BottomTabEntry extends BottomTabModule {
  Component: React.ComponentType;
}
/** Отсортирован по order; включает menu, lesson, shop, wardrobe, settings. */
export const bottomTabRegistry: BottomTabEntry[];
export function getBottomTab(id: BottomTabId): BottomTabEntry;
```

Нижняя навигация (`src/components/BottomNav.tsx`) рендерит `bottomTabRegistry.filter((tab) => tab.inNav !== false)`:
Главная (`menu`), Магазин (`shop`), Гардероб (`wardrobe`), Настройки (`settings`).
Урок (`lesson`) — `inNav: false`: открывается только кнопкой «На болото» в `MenuView`.
Иконки навигации — `PixelIcon` (`lily`/`chest`/`crown`/`compass`), активная вкладка подсвечена `bg-app-nav-active`.

### 7.2 Дерево компонентов (свобода внутри, но публичные компоненты и поток обязательны)

```
App
└── TelegramProvider
    └── RootScreen (читает uiStore.screen; registerVisit() и audioService.setEnabled)
        ├── StartScreen          // яйцо по центру + кнопка «Play!» -> uiStore.start()
        └── MainScreen
            ├── PetHalf          // верхняя половина, НЕ меняется при смене вкладки
            │   ├── PetHud       // тёмная полоса: уровень (getLevelProgress), огонёк (streak), монеты (coins)
            │   ├── PetStage     // сцена LCD: пиксельный питомец, пол, тап -> petStore.petClick()
            │   └── (PetStats / PetOutfitSlot временно не рендерятся)
            └── BottomHalf       // нижняя половина, динамическая
                ├── (контент вкладки)   // menu — тёмная панель без скролла, остальные — шапка BackButton + скролл
                └── BottomNav           // постоянная нижняя полоса навигации
                        MenuView        // «Сытость» + еда + CTA «На болото»
                        LessonView      // Duolingo-стиль: фраза питомца, банк слов, сборка ответа
                        ShopView        // сетка товаров
                        WardrobeView    // надеть/снять предметы гардероба
                        SettingsView    // переключатели + сбросы
```

Требования к UI:
- Верхняя половина сохраняет состояние (питомец, статы) при переключении вкладок — она вне динамической зоны.
- Нижняя половина занимает остаток высоты, внутренний скролл `overflow-y-auto`, safe-area снизу.
- Все цвета/радиусы/тени — через токены (`bg-app-bg`, `text-app-text`, `bg-app-card`, `border-app-border`, `text-app-accent`, `shadow-app`, `rounded-app`).
- Никаких `alert()`, `confirm()` (в Telegram они запрещены) — только UI-состояния.
- Модули не импортируют друг друга; общение только через сторы/типы.
- Кнопки уроков/магазина/настроек должны реально работать на мок-данных, без заглушек-заглушек, кроме явно помеченных «скоро».

## 8. Проверки, которые обязаны проходить

```bat
C:\Users\kotaz\Downloads\tamang\run-pnpm.cmd typecheck
C:\Users\kotaz\Downloads\tamang\run-pnpm.cmd build
```

Обе команды — с кодом 0. `build` создаёт `PROJECT/dist`. Плюс QA проверяет: нет битых импортов, нет `any` без необходимости, нет мёртвого кода, README соответствует реальному дереву файлов.

## 9. Журнал изменений контракта

Правит только Lead; записи — по итогам ревью/QA.

| Дата | Изменение | Причина |
|---|---|---|
| 12.11.2026 | В §6 узаконены `PET_CONFIG.levelThresholds: readonly number[]` ([0, 50, 120, 220, 350, 520, 750, 1050]) и `getPetLevel(totalXp): number`. | State-слой добавил их как расширение; README §9.1 уже описывал, QA отметил расхождение контракта и кода. |
| 12.11.2026 | В §3.3 уточнено: награда в `checkAnswer` (`addXp` + `mood +4`) начисляется только при первом завершении урока; повторное прохождение пройденного урока даёт обратную связь без награды. | QA minor #4: повторные прохождения фармили XP. |
| 12.11.2026 | В §3.3 зафиксировано, что `clearAnswer` из `wrong` возвращает `status='assembling'` (фактическое поведение State-слоя). | Сверка кода и контракта на ревью. |
| 14.11.2026 | §2: `BottomTabId += 'wardrobe'`; `PetStats += satiety`; `PetState += coins/food/streak/lastVisitDate`; `BottomTabModule += inNav?`. §3.1: `registerVisit()`, persist v2 + `migrate`, 9 персистируемых полей. §6: `defaultStats.satiety=60`, `defaultCoins=120`, `defaultFood=2`, `LevelProgress`/`getLevelProgress`. §7: `PetHud`, `BottomNav`, `WardrobeView`; `lesson` — `inNav: false`, навигация через `BottomNav` + CTA «На болото» (MENU_ACTIONS удалён). | Редизайн под макет `primer.png`: тёмный HUD (уровень/огонёк/монеты), нижняя панель с сытостью и едой, вкладка «Гардероб», шрифт Jambilee. |
| 14.11.2026 | `useFrogWalk` сохраняет публичный API, но меняет поведение: блуждание по целям (X 8–92%, Y от горизонта до низа сцены), скорости 10–16 / 7–12 px/s, паузы 1.5–6.5 с, 70% целей в средней трети. | Запрос пользователя: питомец должен двигаться медленно, с паузами и хаотично-целесообразно, а не пинг-понгом у краёв. |
