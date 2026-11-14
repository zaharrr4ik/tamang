# Архитектура tamang-app

Краткая схема слоёв, потоков данных и точек расширения. Правила и рецепты изменения —
в [`README.md`](../README.md); контракт интерфейсов — в [`CONTRACT.md`](CONTRACT.md).
Файл описывает **принципы**, а не перечень файлов.

## 1. Слои и направление зависимостей

```text
┌─────────────────────────────────────────────────────────────┐
│ App.tsx  — только сборка: TelegramProvider → RootScreen      │
├─────────────────────────────────────────────────────────────┤
│ components/  RootScreen, StartScreen, MainScreen, BackButton,│
│              BottomHalf, BottomNav, pet/{PetHalf, PetHud,    │
│              PetStage, PetStats, PetOutfitSlot}, hooks/…     │
│              ui/{PixelButton, PixelPanel, PixelIcon}         │
├─────────────────────────────────────────────────────────────┤
│ modules/registry.tsx  — реестр вкладок: id → component       │
├─────────────────────────────────────────────────────────────┤
│ features/  menu/MenuView, lesson/LessonView,                 │
│            shop/ShopView, wardrobe/WardrobeView,             │
│            settings/SettingsView                             │
├─────────────────────────────────────────────────────────────┤
│ store/  petStore, uiStore, lessonStore, settingsStore        │
│ lib/    audio.ts, voice.ts, telegram/*                       │
│ data/   lessons.ts, shopItems.ts, petConfig.ts               │
│ assets/ fonts/mediocre-cartoon.ttf, icons/*.png, pet/*.png   │
├─────────────────────────────────────────────────────────────┤
│ types/index.ts — доменные типы и интерфейсы, без реализации  │
└─────────────────────────────────────────────────────────────┘
```

Зависимости направлены **вверх по схеме** (нижний слой не знает о верхнем):

- `types` не импортирует ничего с рантаймом;
- `lib` и `data` зависят только от `types`;
- `store` зависит от `types` и `data`; **не** импортирует UI, не проигрывает звук и вибрацию;
- `components/hooks/useUiFeedback` — общий UI-хук отклика: зависит от `store`, `lib/telegram`,
  `lib/audio` и применяет настройки (`soundEnabled`, `hapticsEnabled`);
- `features` зависят от `types`, `store`, `data`, `lib` и общего хука `components/hooks/useUiFeedback`;
  **не** импортируют друг друга и не тянут прочие `components/*`;
- `registry` зависит от `features` и `types`;
- `components` зависят от `types`, `store`, `lib`, `registry`, `hooks`;
- `App` собирает провайдер и экраны.

Следствие: модуль можно заменить/удалить, не трогая остальные, если сохранены его публичные
экспорты и persist-ключи.

## 2. Модель экранов

```text
uiStore.screen
├── 'start' → StartScreen (пиксельная лягушка-«устройство», без текста) — uiStore.start()
└── 'main'  → MainScreen
             ├── PetHalf      — постоянная зона (не зависит от bottomTab)
             │                  (PetHud + LCD-сцена PetStage)
             └── BottomHalf   — динамическая зона
                 ├── контент вкладки (menu — тёмная панель, остальные — BackButton + скролл)
                 └── BottomNav — постоянная нижняя полоса (реестр, inNav !== false)
```

Навигация хранится в `uiStore` (`screen`, `bottomTab`), роутера и URL-маршрутов нет. Смена
вкладки меняет только `BottomHalf`; `PetHalf` не перемонтируется, поэтому состояние и анимации
питомца сохраняются.

**Геометрия сцены питомца.** Кадр спрайт-листа 64×64, рабочая обрезка `FROG_CROP` — 28×16
(x=18, y=24; нижняя граница — лапы), масштаб `FROG_SCALE = 6` ⇒ отрисовка 168×96 px
(`FROG_DISPLAY_WIDTH`/`FROG_DISPLAY_HEIGHT`), тень `FROG_SHADOW_WIDTH = 101` px (60% ширины
спрайта). Пол `.pixel-floor` — `max(48, 22% высоты сцены)` (`MIN_FLOOR_HEIGHT = 48`,
`FLOOR_HEIGHT_RATIO = 0.22`); базовая линия блуждания — от горизонта пола до `height − 6`.
Потолок подъёма при переносе — `getMaxLift() = min(height − FROG_DISPLAY_HEIGHT − 8,
baselineY − FROG_DISPLAY_HEIGHT − 8)`: питомца можно утащить на всю высоту LCD, верх спрайта не
заходит выше 8 px от кромки (раньше потолок считался от линии горизонта пола, и выше неё поднять
было нельзя). Ховер-подскок ограничен тем же `min(HOP_PEAK, getMaxLift())`.

**Анимация.** Покадровая — только у посадки: `land` 2 кадра, смена через 120 мс, `landing`
300 мс. Idle-цикл удалён: в листе `idle` 4 кадра, но 1/2/3 попиксельно идентичны (надутый
живот), 0 — сдутый; переключение читалось как мерцание «дыхания» (~5 fps). Во всех состояниях
(`idle`/`walk`/`turn`/`held`) рендерится один кадр `FROG_IDLE_FRAME = 1`; блуждание (X 6–10,
Y 4–7 px/s), разворот и подскок — через CSS-трансформации, rAF пишет `transform` в DOM без
ре-рендеров React.

`LessonView` — пример модуля с внутренними состояниями (они локальны и не попадают в `uiStore`):
пока сессия не активна (`currentLessonId === null`), показывается список уроков с прогрессом;
после `startLesson()` — экран активного урока; при `status === 'completed'` — финальный экран
«Все уроки пройдены!». Переходы между этими состояниями задаёт `lessonStore`, а не `uiStore`.

## 3. Слои состояния

| Стор | Ключ persist | Хранит | Не хранит |
|---|---|---|---|
| `petStore` | `tamang.pet` (v2) | `name`, `stats` (health/mood/satiety), `equippedItemIds`, `totalXp`, `lastInteractionAt`, `coins`, `food`, `streak`, `lastVisitDate` | `expression` (всегда стартует с `'idle'`) |
| `uiStore` | — | `screen`, `bottomTab` | — |
| `lessonStore` | `tamang.lesson-progress` | `completedLessonIds` | текущую сессию (`currentLessonId`, `selectedWordIds`, `status`, `attempts`) |
| `settingsStore` | `tamang.settings` | `soundEnabled`, `hapticsEnabled`, `animationsEnabled` | — |

Компоненты читают состояние **точечными селекторами** и меняют его **только через экшены**
сторов. Прямой `setState` из компонентов и мутация объектов запрещены. Локальные UI-состояния
(модалки, черновики, подтверждения) живут в `useState` компонента и не попадают в глобальные сторы.

## 4. Data-flow: клик по питомцу

```text
Пользователь тапает по питомцу (PetStage)
  │
  ├─ petStore.petClick()
  │     ├─ stats.mood  += PET_CONFIG.clickMoodGain   (clamp minStat..maxStat)
  │     ├─ stats.health += PET_CONFIG.clickHealthGain (clamp)
  │     ├─ expression = 'happy'
  │     ├─ lastInteractionAt = Date.now()
  │     └─ таймер reactionTimeoutMs (≈1200 мс) → expression = 'idle'
  ├─ useUiFeedback().vibrate('light')   (haptic; вне Telegram — no-op)
  ├─ useUiFeedback().playSound('tap')   (audioService; в каркасе — no-op)
  └─ локальный hitCount += 1 → повторный CSS-анимацией animate-pop
  │
  ├─ PetStage перерисовывается по селекторам (expression/stats)
  └─ PetHud/PetHalf перерисовываются по totalXp (уровень), streak и coins
```

Звук и вибрацию издаёт UI-слой, а не стор: `useUiFeedback` применяет `settingsStore`
(`soundEnabled`, `hapticsEnabled`). `PetOutfitSlot` перерисовывается по `equippedItemIds`;
пустой контейнер анимаций — отдельный визуальный слой, на данные не влияет.
`RootScreen` при старте вызывает `petStore.registerVisit()`, который обновляет `streak`
(не чаще раза в день) и `lastVisitDate`.

## 5. Data-flow: прохождение урока

```text
uiStore.openTab('lesson')
  └─ BottomHalf рендерит LessonView из реестра
       ├─ сессия не активна → список уроков (прогресс из completedLessonIds)
       └─ startLesson(lessonId?)  → status='assembling', attempts=0, selectedWordIds=[]
            (без id — первый незавершённый, иначе lessons[0])

Пользователь собирает ответ:
  selectWord(wordId)   → selectedWordIds += wordId  (игнор повторов; не при correct/wrong/completed)
  removeWordAt(index)  → удаление слова по позиции   (только при status='assembling')
  clearAnswer()        → ответ очищен, status → 'assembling'

checkAnswer()
  ├─ status уже 'correct' → true без повторной награды
  ├─ status 'completed'   → false
  ├─ сравнение selectedWordIds с lesson.correctWordIds; attempts += 1
  ├─ верно:   status='correct'; completedLessonIds += lessonId (без дублей);
  │           награда — ТОЛЬКО при первом завершении урока:
  │           usePetStore.getState().addXp(lesson.xpReward);
  │           usePetStore.getState().applyStatDelta({ mood: LESSON_CORRECT_MOOD_GAIN });
  │           повторное прохождение пройденного урока → «Верно!» без награды
  └─ неверно: status='wrong'
  │
  └─ UI-реакция в LessonView: playSound('correct'|'wrong'), vibrate('success'|'error');
     подписка компонентов: LessonView (статус/попытки), PetHalf (XP и настроение меняются сразу)

nextLesson()  → следующий незавершённый по кругу; если все пройдены → status='completed'
exitLesson()  → currentLessonId=null, selectedWordIds=[], status='idle'
resetProgress() → completedLessonIds=[], сессия сброшена
```

`lessonStore` — единственное место, где правило «верный ответ» объединяет уроки и питомца:
награда (только при первом завершении урока) начисляется через `usePetStore.getState()`,
поэтому UI не дублирует бизнес-логику и `PetHalf` обновляется автоматически.

## 6. Принцип реестра вкладок

Нижняя зона не знает о конкретных модулях: `BottomHalf` берёт запись из `bottomTabRegistry`
по `uiStore.bottomTab` и рендерит её `Component`.

```tsx
export interface BottomTabEntry extends BottomTabModule {
  Component: React.ComponentType;
}
export const bottomTabRegistry: BottomTabEntry[]; // сортировка по order
export function getBottomTab(id: BottomTabId): BottomTabEntry;
```

- вкладка = запись `{ id, title, emoji, order, inNav?, Component }`;
- `BottomTabId` — union в `src/types` (изменение только через Lead);
- `BottomNav` рисует все вкладки, кроме помеченных `inNav: false` (например, `lesson`):
  она открывается кнопкой «На болото» в `MenuView` через `uiStore.openTab('lesson')`;
- `BottomHalf` сам рисует шапку с `BackButton` для всех вкладок, кроме `menu`.

Добавление вкладки — 4 правки (тип → компонент фичи → запись в реестр → иконка в `BottomNav`,
если вкладка должна быть в навигации), без изменений `App`, `MainScreen`, `PetHalf` и других
фич. Полный рецепт — README, раздел 7.

## 7. Внешние слои

- **Telegram.** `TelegramProvider` — единственная точка работы с `window.Telegram.WebApp`:
  `ready/expand`, тема (`--tg-theme-*` → class `dark` на `<html>`), подписка `themeChanged` и
  отписка при размонтировании, haptic. Вне Telegram — fallback по `prefers-color-scheme`,
  `haptic` — no-op. UI-код обращается к Telegram через `useTelegram()` (из `@/lib/telegram`)
  или общий `useUiFeedback()`; прямые `window.Telegram` в компонентах и фичах запрещены.
- **Стили.** Telegram-переменные → семантические токены `--app-*` в `src/index.css` → классы
  Tailwind (`bg-app-bg`, `text-app-text`, `bg-app-panel`, ...). Компоненты не хардкодят цвета
  и не проверяют тему вручную: `--app-*` меняются вместе с `html.dark`. Иконки — только
  `PixelIcon` (растровые PNG из `src/assets/icons`); шрифты — self-hosted `Mediocre Cartoon`
  (TTF, один вес 400) на весь интерфейс, `Pixelify Sans` в стеке — только фолбэк для
  отсутствующих глифов (`« » … №`), без CDN. Размеры текста — по шкале Tailwind `text-xs`…
  `text-2xl` (15/20 … 28/32 px) для смыслового текста; микро-подписи (бейджи, категории,
  навигация) — 12–14 px, жёсткий минимум 12 px.
- **Сервисы.** `audioService` (`isSupported = false`) и `voiceInputService` (`isSupported = false`)
  — интерфейсы с no-op реализациями в `src/lib`. Звуковые эффекты UI уже идут через
  `useUiFeedback().playSound(...)`; кнопки урока «Прослушать» и «Голосом» — `disabled` с бейджем
  «скоро» и являются точками подключения. Замена реализации не требует правок вызывающего кода,
  если сохранены сигнатуры `AudioService`/`VoiceInputService`.

## 8. Точки расширения

| Что расширяем | Куда добавлять | Что не трогаем |
|---|---|---|
| Новая вкладка | `src/types` (union, Lead) → `src/features/<name>/<Name>View.tsx` → `src/modules/registry.tsx` → иконка в `BottomNav` (если нужна в навигации) | `App`, `MainScreen`, `PetHalf`, другие фичи |
| Новый урок | объект `Lesson` в `src/data/lessons.ts` | `lessonStore`, `LessonView`, реестр |
| Новая стата | `src/types` (Lead) → `PET_CONFIG` → `petStore` → UI (HUD/панель) | остальные фичи |
| Новая иконка | PNG 64×64 в `src/assets/icons/` → `PixelIconName` в `PixelIcon.tsx` | вёрстка экранов |
| Новая настройка | `settingsStore` + `SettingsView` + UI-потребитель | другие модули |
| Новый звук/голос | реализация `AudioService`/`VoiceInputService` в `src/lib` | вызовы в UI |
| Новый нативный API Telegram | `src/lib/telegram/types.ts` + `TelegramProvider`/`useTelegram` | прямые `window.Telegram` в фичах |
| Цвет/тема | `src/index.css` (`:root` и `html.dark`) + `tailwind.config.js` | компоненты, если используют токены |
| Новый экран за пределами start/main | `AppScreen` (Lead) + ветка в `RootScreen` | `MainScreen` и фичи |

## 9. Анти-паттерны (архитектурные)

- импорт `features/a` → `features/b` (ломает изоляцию; данные — через стор);
- бизнес-логика в компонентах (награды, clamp, проверка ответа) вместо экшенов стора;
- звук/вибрация в сторах вместо UI;
- прямые `window.Telegram` в фичах, обходящие `@/lib/telegram`;
- хардкод цветов вместо `--app-*`;
- `setState` из компонентов и мутация объектов состояния;
- смена persist-ключей/полей без миграции (потеря прогресса пользователей).
