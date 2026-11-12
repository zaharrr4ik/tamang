# Tamang — Telegram Mini App «Тамагочи для изучения языков»

> **Этот файл — AI Context Protocol.** После сброса сессии достаточно передать ИИ-ассистенту
> `README.md` (и `docs/CONTRACT.md`), чтобы он мог безопасно менять или добавлять изолированные
> модули, не ломая остальные. Если ты ИИ-ассистент — сначала прочитай раздел
> [13. Инструкция для ИИ-ассистента](#13-инструкция-для-ии-ассистента-главный-раздел), затем
> остальное по порядку.

Статус: **каркас-фундамент (v0.1.0)**. Все зоны работают на мок-данных и готовы к запуску;
бэкенда нет, это осознанно. Домен и сценарии зафиксированы, детали реализации модулей — расширяемы.

---

## 1. Что это и цель проекта

`tamang-app` — Telegram Mini App на React: тамагочи, который помогает учить иностранные слова.
Живой питомец «живёт» в верхней половине экрана, а нижняя половина — сменяемая рабочая зона
(меню, урок, магазин, настройки). Прогресс и статы сохраняются в `localStorage` через Zustand
`persist`, поэтому перезапуск Mini App не сбрасывает игру.

**Цель этого репозитория — фундамент, а не финальная игра.** Требования к каркасу:

- каждый модуль изолирован: фичи не импортируют друг друга, общение — только через стор и типы;
- новая вкладка/урок/звук/стата добавляются по рецепту из раздела 13 без правок соседних модулей;
- приложение полностью работает и вне Telegram (fallback-тема, no-op haptics);
- код собирается без ошибок: TypeScript strict + `vite build` с кодом 0.

Что уже реализовано в каркасе:

| Зона | Что есть |
|---|---|
| Старт | Экран с яйцом по центру и кнопкой «Play!» → переход на главный экран |
| Верх главного экрана | Питомец-эмодзи, клик по нему, статы Health/Mood, слот надетых предметов, пустой контейнер под анимации |
| Низ главного экрана | Динамическая зона с реестром вкладок: Меню, Урок, Магазин, Настройки; кнопка «Назад» |
| Урок | Duolingo-стиль: реплика питомца, сборка ответа из слов, проверка, XP и mood за первое прохождение урока, прогресс уроков |
| Магазин | Сетка товаров: надеть/снять для полученных, «скоро» и цена для остальных |
| Настройки | Звук/вибрация/анимации, сброс питомца и прогресса, блок «О приложении» |
| Telegram | `TelegramProvider`, тема из `--tg-theme-*`, haptic, safe-area, fallback вне Telegram |
| Заделы | `AudioService` (TTS/звуки) и `VoiceInputService` (STT) — интерфейсы есть, реализации no-op |

Границы каркаса (важно понимать до изменений): нет сервера и авторизации, магазин не списывает
валюту (нет валюты), переодевание — эмодзи-слой над питомцем, анимации минимальные, звука и
голоса физически нет. Всё это — точки расширения, см. раздел 14.

---

## 2. Быстрый старт

### 2.1. Окружение

Node.js и pnpm **не в PATH**. Используется фиксированная `.cmd`-обёртка с bundled Node и pnpm
(обходит ExecutionPolicy, сама делает `cd` в папку проекта):

```bat
C:\Users\kotaz\Downloads\tamang\run-pnpm.cmd install
C:\Users\kotaz\Downloads\tamang\run-pnpm.cmd typecheck
C:\Users\kotaz\Downloads\tamang\run-pnpm.cmd dev
C:\Users\kotaz\Downloads\tamang\run-pnpm.cmd build
C:\Users\kotaz\Downloads\tamang\run-pnpm.cmd preview
```

Из PowerShell обёртка вызывается так: `& 'C:\Users\kotaz\Downloads\tamang\run-pnpm.cmd' build`.
Зависимости уже установлены в `node_modules`; `install` нужен только после изменения `package.json`
(а добавлять пакеты без согласования с Lead запрещено, см. раздел 13).

### 2.2. Скрипты npm

| Скрипт | Что делает |
|---|---|
| `dev` | `vite --host` — dev-сервер, по умолчанию `http://localhost:5173` (доступен и по LAN) |
| `typecheck` | `tsc --noEmit` — только проверка типов |
| `build` | `tsc --noEmit && vite build` — типы + production-сборка в `dist/` |
| `preview` | `vite preview --host` — локальная раздача `dist/` (по умолчанию порт 4173) |

### 2.3. Запуск в Telegram

1. Собери проект: `run-pnpm.cmd build` → появится `tamang-app\dist`.
2. Выложи содержимое `dist/` на любой **HTTPS**-хостинг (Vercel, Netlify, GitHub Pages, свой
   сервер). HTTPS обязателен: Telegram не открывает `http://`.
   В `vite.config.ts` уже стоит `base: './'`, поэтому сборка работает и из подкаталога
   (например, `username.github.io/repo/`), и с корня домена.
3. В Telegram открой `@BotFather`:
   - `/newbot` — если бота ещё нет;
   - `/newapp` — выбрать бота, задать название, описание, иконку и **URL** Mini App (адрес с шага 2);
   - открыть Mini App через кнопку меню бота или ссылку `t.me/<bot>/<app>`.
4. Для отладки в Telegram удобно пробрасывать dev-сервер через HTTPS-туннель (`ngrok`,
   `cloudflared` и т.п.) и указывать временный URL в BotFather. Это внешняя инфраструктура,
   в зависимостях проекта её нет.

### 2.4. Поведение вне Telegram

Приложение полностью работоспособно в обычном браузере (`run-pnpm.cmd dev`):

- официальный SDK `telegram-web-app.js` подключён в `index.html`, но вне Telegram ничего не делает;
- `isTelegram === false`, `webApp === null`, `user === null`;
- тема берётся из `matchMedia('(prefers-color-scheme: dark)')` и живёт по системной теме;
- `haptic()` — no-op, звук — no-op;
- CSS-переменные `--tg-theme-*` не определены, поэтому работают фолбэки `--app-*` из `src/index.css`.

Никакой ветки «только для Telegram» в UI нет: один и тот же код работает в обоих окружениях.

---

## 3. Стек и версии

| Слой | Технология | Версия | Зачем |
|---|---|---|---|
| UI | React + React DOM | 18.3.1 | функциональные компоненты и хуки |
| Язык | TypeScript | 5.6.3, `strict`, `noUnusedLocals`, `noUnusedParameters` | типобезопасность, сборка падает на любых ошибках |
| Сборка | Vite | 5.4.11 + `@vitejs/plugin-react` 4.3.3 | dev-сервер, HMR, production-сборка |
| Состояние | Zustand | 4.5.5 (+ `persist` из `zustand/middleware`) | 4 стора, селекторы, localStorage |
| Стили | Tailwind CSS | 3.4.15 + PostCSS 8.4.49 + Autoprefixer 10.4.20 | utility-классы на семантических токенах |
| Тема | CSS-переменные Telegram (`--tg-theme-*`) | — | нативный вид внутри Telegram |
| Telegram | официальный SDK `telegram-web-app.js` | — | ready/expand/theme/haptic |

Сознательные ограничения каркаса: **нет** UI-библиотек, иконочных пакетов, роутера, react-query,
i18n-библиотек и тестового раннера. Всё это можно добавить только с согласования Lead (раздел 13).

Псевдоним путей: `@/` → `src/` (настроен и в `vite.config.ts`, и в `tsconfig.json`).
Импортировать принято так: `import { usePetStore } from '@/store';`, типы — `import type { Lesson } from '@/types';`.

---

## 4. Структура проекта

```text
tamang-app/
├── index.html                  # корневой HTML: viewport-fit=cover, theme-color, подключение Telegram SDK, #root
├── package.json                # скрипты dev/build/typecheck/preview, фиксированные версии зависимостей
├── pnpm-lock.yaml              # lock-файл (менять только через pnpm, не руками)
├── pnpm-workspace.yaml         # pnpm 11: allowBuilds (esbuild), nodeLinker: hoisted, verifyDepsBeforeRun: false
├── postcss.config.js           # postcss + tailwind + autoprefixer
├── tailwind.config.js          # darkMode: 'class'; маппинг токенов --app-* в классы bg-app-*, text-app-* и т.д.
├── tsconfig.json               # strict, noUnusedLocals/Parameters, alias @/* → src/*
├── vite.config.ts              # base: './', alias @, dev-сервер host:true, outDir: dist
├── .gitignore                  # node_modules, dist и прочее
├── README.md                   # ЭТОТ файл — AI Context Protocol
├── docs/
│   ├── CONTRACT.md             # ЗАМОРОЖЕННЫЙ контракт интерфейсов — истина по API (меняет только Lead)
│   └── ARCHITECTURE.md         # краткая схема слоёв, data-flow, точки расширения
└── src/
    ├── main.tsx                # bootstrap: ReactDOM.createRoot + StrictMode, импорт index.css
    ├── App.tsx                 # корень: TelegramProvider → RootScreen (только сборка приложения)
    ├── vite-env.d.ts           # ссылочные типы Vite
    ├── index.css               # @tailwind + токены --app-*, CSS-яйцо, анимации, утилиты UI-слоя
    ├── types/
    │   └── index.ts            # ВСЕ доменные типы и интерфейсы (без реализации). Меняет только Lead.
    ├── store/
    │   ├── index.ts            # реэкспорт всех сторов и ключей persist; UI импортирует только отсюда
    │   ├── petStore.ts         # питомец + PET_STORE_KEY='tamang.pet'; level считается из totalXp
    │   ├── uiStore.ts          # экран и активная вкладка; без persist
    │   ├── lessonStore.ts      # сессия урока + completedLessonIds; persist 'tamang.lesson-progress'
    │   └── settingsStore.ts    # soundEnabled/hapticsEnabled/animationsEnabled; persist 'tamang.settings'
    ├── lib/
    │   ├── audio.ts            # audioService: AudioService, no-op; isSupported=false, setEnabled запоминает флаг
    │   ├── voice.ts            # voiceInputService: VoiceInputService, no-op; isSupported=false
    │   └── telegram/
    │       ├── types.ts        # минимальная типизация window.Telegram.WebApp (без any)
    │       ├── useTelegram.ts  # useTelegram(): TelegramContextValue (isTelegram, webApp, colorScheme, user, haptic)
    │       ├── TelegramProvider.tsx # ready/expand/themeChanged/fallback-тема, class="dark", data-theme
    │       └── index.ts        # реэкспорт useTelegram/TelegramProvider/типов для '@/lib/telegram'
    ├── data/
    │   ├── lessons.ts          # 4 мок-урока Lesson[], LESSON_CORRECT_MOOD_GAIN=4, правила данных
    │   ├── shopItems.ts        # 7 мок-товаров ShopItem[], часть ownedByDefault: true
    │   └── petConfig.ts        # PET_CONFIG + getPetLevel(totalXp): дефолты, эмодзи, clamp, гейны, пороги уровней
    ├── modules/
    │   ├── registry.tsx        # реестр вкладок: bottomTabRegistry + getBottomTab(id), сортировка по order
    │   └── index.ts            # реэкспорт registry для '@/modules'
    ├── features/
    │   ├── menu/MenuView.tsx       # меню нижней зоны: MENU_ACTIONS (Урок / Магазин / Настройки)
    │   ├── lesson/LessonView.tsx   # урок Duolingo-стиля; «прослушать» и «голосом» — disabled «скоро»
    │   ├── shop/ShopView.tsx       # сетка товаров, надеть/снять, «скоро» для недоступных
    │   └── settings/SettingsView.tsx # переключатели, сбросы (через локальный UI-стейт), «О приложении»
    └── components/
        ├── RootScreen.tsx      # читает uiStore.screen → StartScreen | MainScreen; синхронизирует audioService
        ├── StartScreen.tsx     # яйцо по центру + кнопка «Play!» → uiStore.start()
        ├── MainScreen.tsx      # каркас главного экрана: PetHalf + BottomHalf
        ├── BackButton.tsx      # «Назад» при bottomTab !== 'menu' → uiStore.backToMenu()
        ├── BottomHalf.tsx      # динамическая зона: BackButton + компонент из реестра по bottomTab
        ├── hooks/
        │   └── useUiFeedback.ts # playSound(SoundId) / vibrate(type) с учётом settingsStore; единая точка отклика
        └── pet/
            ├── PetHalf.tsx         # постоянная верхняя половина: имя, уровень+XP, сцена, статы
            ├── PetStage.tsx        # питомец-эмодзи; клик → petStore.petClick() (+ звук/haptic)
            ├── PetStats.tsx        # Health / Mood: полоски и числа (0..maxStat)
            └── PetOutfitSlot.tsx   # слой надетых предметов + пустой контейнер под будущие анимации
```

Композиция UI: `App` → `TelegramProvider` → `RootScreen` → (`StartScreen` | `MainScreen`).
`MainScreen` = `PetHalf` (постоянный верх) + `BottomHalf` (низ по `uiStore.bottomTab`).
`PetHalf` = имя/уровень + `PetStage` + `PetOutfitSlot` + `PetStats`.

Папки `node_modules/` и `dist/` в дереве не перечислены: это артефакты установки и сборки.
Если файл из дерева отсутствует на диске — это расхождение; проверяй `glob`/`read`, а не доверяй
памяти (см. раздел 13).

---

## 5. Модель экранов и поток данных

### 5.1. Экраны

Экран один-единственный по смыслу — это два состояния `uiStore.screen`:

```text
start (StartScreen: яйцо + «Play!»)
   │  uiStore.start()
   ▼
main (MainScreen)
   ├── верхняя половина (PetHalf) — постоянная
   └── нижняя половина (BottomHalf) — динамическая по uiStore.bottomTab
```

```tsx
// src/App.tsx (схема)
<TelegramProvider>
  <RootScreen />
</TelegramProvider>

// src/components/RootScreen.tsx (схема)
const screen = useUiStore((s) => s.screen);
return screen === 'start' ? <StartScreen /> : <MainScreen />;
```

Роутера нет: URL не меняется, экран и вкладка живут в `uiStore`. Навигация «назад» в нижней зоне —
это `uiStore.backToMenu()`, а не история браузера.

### 5.2. Верх и низ главного экрана

`MainScreen` — вертикальный flex на всю высоту:

- **верх (`PetHalf`)** — постоянная зона: питомец, статы, слот одежды, контейнер под анимации.
  Она не читает `uiStore.bottomTab` и не перемонтируется при смене вкладки — состояние питомца
  (и его локальные CSS-анимации) не теряется;
- **низ (`BottomHalf`)** — `flex-1 min-h-0`: занимает остаток высоты, внутренний скролл
  `overflow-y-auto`, снизу учтён safe-area. Внутри — `BackButton` (если вкладка не `menu`) и
  компонент, выбранный из реестра по `bottomTab`.

```text
MainScreen
├── PetHalf                       ← не меняется при смене вкладки
│   ├── PetStage (питомец, клик)
│   ├── PetStats (Health/Mood)
│   └── PetOutfitSlot (одежда + слот анимаций)
└── BottomHalf                    ← меняется при смене вкладки
    ├── BackButton (если bottomTab !== 'menu')
    └── <Component из bottomTabRegistry по uiStore.bottomTab>
        ├── MenuView → openTab('lesson' | 'shop' | 'settings')
        ├── LessonView
        ├── ShopView
        └── SettingsView
```

Внутри `LessonView` три состояния (это один и тот же компонент, а не отдельные экраны):
список уроков с прогрессом (сессия не активна, `currentLessonId === null`), активный урок
(`status` — `assembling`/`correct`/`wrong`) и экран «Все уроки пройдены!» (`status === 'completed'`).
Выбор урока в списке вызывает `startLesson(lessonId)`; выход из активного урока — `exitLesson()`
и возврат к списку.

Ключевой инвариант: **смена вкладки влияет только на нижнюю половину.** Если изменение
затрагивает верх — это ошибка архитектуры, а не фича (исключение: явное изменение данных
питомца в сторе — одежда, статы, имя).

### 5.3. Где живёт состояние

| Что | Где | Переживает перезапуск |
|---|---|---|
| Текущий экран, активная вкладка | `uiStore` | нет |
| Имя, статы, выражение, одежда, XP питомца | `petStore` | да (кроме `expression`) |
| Сессия урока (текущий урок, выбранные слова, статус, попытки) | `lessonStore` | нет |
| Пройденные уроки | `lessonStore.completedLessonIds` | да |
| Настройки (звук/вибрация/анимации) | `settingsStore` | да |
| Пользователь Telegram, тема | `TelegramProvider` / `useTelegram` | нет (перечитывается при старте) |

Локальные UI-состояния (открытая модалка, черновик имени, подтверждение сброса, видимость
подсказки) — это `useState` внутри компонента; в глобальные сторы их класть не нужно.

---

## 6. Состояние: 4 стора

Все сторы — Zustand 4: `create(...)` + `persist(...)` там, где нужно сохранение. Публичный импорт
всегда через баррель: `import { usePetStore, useUiStore, useLessonStore, useSettingsStore } from '@/store';`
Ключи persist — строковые константы, реэкспортируемые из `@/store` (например, `PET_STORE_KEY`).

### 6.1. `petStore` — питомец

```ts
export const PET_STORE_KEY = 'tamang.pet';

interface PetStoreState extends PetState {
  addXp(amount: number): void;
  petClick(): void;
  applyStatDelta(delta: Partial<PetStats>): void;
  setExpression(expression: PetExpression): void;
  equipItem(itemId: string): void;
  unequipItem(itemId: string): void;
  renamePet(name: string): void;
  resetPet(): void;
}
```

- Начальные значения — из `PET_CONFIG` (`src/data/petConfig.ts`): имя `«Таманг»`, статы `100/100`.
- `persist` хранит: `name`, `stats`, `equippedItemIds`, `totalXp`, `lastInteractionAt`.
  `expression` **не** персистится (при загрузке — `'idle'`).
- `petClick()`: `mood +4`, `health +1` с ограничением `0..100`, `expression = 'happy'`,
  `lastInteractionAt = Date.now()`, через `~1200 мс` (значение в `PET_CONFIG.reactionTimeoutMs`)
  выражение возвращается в `'idle'`.
- `addXp(amount)` увеличивает `totalXp` (принимает только положительное конечное число);
  `applyStatDelta` меняет статы с clamp; `equipItem`/`unequipItem` — массив `equippedItemIds`
  (без дублей); `renamePet` обрезает пробелы, ограничивает имя 24 символами и игнорирует пустое;
  `resetPet` — к дефолтам из `PET_CONFIG`.
- Уровень питомца не хранится в сторе: он вычисляется из `totalXp` функцией
  `getPetLevel(totalXp)` (`src/data/petConfig.ts`) по порогам `PET_CONFIG.levelThresholds`
  (уровень 1 при 0 XP, 2 при 50 XP, 3 при 120 XP и т.д.).
- Стор **сам не вызывает `audioService`**: звук — ответственность UI (клик, награда и т.п.).

### 6.2. `uiStore` — навигация

```ts
interface UiStoreState {
  screen: AppScreen;      // 'start' | 'main', старт: 'start'
  bottomTab: BottomTabId; // 'menu' | 'lesson' | 'shop' | 'settings', старт: 'menu'
  setScreen(screen: AppScreen): void;
  start(): void;          // screen → 'main', bottomTab → 'menu'
  openTab(tab: BottomTabId): void;
  backToMenu(): void;     // bottomTab → 'menu'
}
```

Persist **не нужен**: после перезапуска Mini App пользователь снова видит стартовый экран.

### 6.3. `lessonStore` — урок и прогресс

```ts
interface LessonStoreState {
  lessons: Lesson[];                 // статический импорт из src/data/lessons.ts
  currentLessonId: string | null;
  selectedWordIds: string[];
  status: LessonStatus;              // 'idle' | 'assembling' | 'correct' | 'wrong' | 'completed'
  attempts: number;
  completedLessonIds: string[];
  startLesson(lessonId?: string): void;
  selectWord(wordId: string): void;
  removeWordAt(index: number): void;
  clearAnswer(): void;
  checkAnswer(): boolean;
  nextLesson(): void;
  exitLesson(): void;
  resetProgress(): void;
}
```

- `persist` хранит **только** `completedLessonIds` (ключ `'tamang.lesson-progress'`).
  Текущая сессия (`currentLessonId`, `selectedWordIds`, `status`, `attempts`) не персистится.
- `startLesson(lessonId?)`: с id — начинает указанный урок; без id — первый незавершённый,
  если все пройдены — первый урок массива. Всегда: `status = 'assembling'`, `attempts = 0`,
  выбранные слова очищены.
- `selectWord(wordId)` игнорируется, если нет активного урока, статус `'correct'/'wrong'/'completed'`,
  слова нет в банке текущего урока или оно уже выбрано (id слов уникальны); иначе добавляет слово
  в конец ответа и ставит `status = 'assembling'`.
- `removeWordAt(index)` удаляет слово из ответа только в статусе `'assembling'`; `clearAnswer()`
  очищает ответ и возвращает `'correct'/'wrong'` в `'assembling'`.
- `checkAnswer()` сравнивает длину и порядок `selectedWordIds` с `correctWordIds` урока и
  инкрементит `attempts`:
  - если ответ уже верен (`status === 'correct'`) → возвращает `true` **без повторной награды**;
  - если урок завершён (`status === 'completed'`) → возвращает `false`;
  - верно → `status = 'correct'`, `completedLessonIds += lessonId` (без дублей).
    Награда начисляется **только при первом завершении этого урока**:
    XP — `usePetStore.getState().addXp(lesson.xpReward)`, настроение —
    `applyStatDelta({ mood: LESSON_CORRECT_MOOD_GAIN })` (`LESSON_CORRECT_MOOD_GAIN = 4`
    из `src/data/lessons.ts`), возвращает `true`. Повторное прохождение уже пройденного
    урока даёт `status = 'correct'` и обратную связь «Верно!», но **без награды** —
    защита от фарма XP;
  - неверно → `status = 'wrong'`, возвращает `false`.
- `nextLesson()` ищет следующий незавершённый урок после текущего, затем по кругу с начала
  массива; если незавершённых нет — `status = 'completed'`.
- `exitLesson()` завершает сессию, не теряя `completedLessonIds`; `resetProgress()` очищает
  `completedLessonIds` и сессию (персист обновляется).
- Уроки не копируются в стор: `lessons` — статический массив из `src/data/lessons.ts`.

### 6.4. `settingsStore` — настройки

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
```

Persist-ключ `'tamang.settings'`. Настройки читаются точечными селекторами там, где влияют:
звук — при вызовах `audioService`, вибрация — перед `haptic`, анимации — при выборе CSS-классов.

### 6.5. Правила работы со стором (обязательны)

1. **Только селекторы.** Правильно:
   `const mood = usePetStore((s) => s.stats.mood);` — неправильно: `const store = usePetStore();`
   (подписка на весь стор и лишние ререндеры).
2. **Состояние меняют только экшены стора.** Никакой мутации объектов снаружи, никаких
   `usePetStore.setState(...)` из компонентов. Нужен новый сценарий — добавь экшен в стор.
3. **Сторы не импортируют UI и не рисуют.** Доменная логика — в сторе, звук/haptic/анимации — в UI.
4. **Persist-ключи и имена персистируемых полей не менять** без миграции: иначе у пользователей
   пропадёт прогресс (`localStorage` хранит данные по этим ключам).
5. **Сбросы** — только через публичные `resetPet()`, `resetProgress()`, `resetSettings()`.
6. **Ключи `localStorage`:** `tamang.pet`, `tamang.lesson-progress`, `tamang.settings`.
   В коде это `PET_STORE_KEY`, `LESSON_STORE_KEY`, `SETTINGS_STORE_KEY` из `@/store`.
   Очистить прогресс вручную: DevTools → Application → Local Storage.

---

## 7. Рецепт: добавить новую вкладку/модуль

Задача: добавить в нижнюю динамическую зону новую вкладку, например «Сад» (`garden`).
**Верхняя половина и питомец не затрагиваются вообще.** Вкладка добавляется тремя-четырьмя
точечными правками.

### Шаг 1. Расширить union `BottomTabId` (согласовать с Lead!)

`src/types/index.ts` — замороженный файл, правит только Lead. Изменение:

```ts
// было
export type BottomTabId = 'menu' | 'lesson' | 'shop' | 'settings';
// станет
export type BottomTabId = 'menu' | 'lesson' | 'shop' | 'settings' | 'garden';
```

Без этого шага TypeScript не даст создать запись в реестре и открыть вкладку.

### Шаг 2. Создать компонент модуля

Файл `src/features/garden/GardenView.tsx`. Компонент — обычный, без пропсов: он читает стор
самостоятельно и не знает о других фичах. Экспорт **именованный** (`export function`), так же
устроены все существующие вкладки и импорты в реестре.

```tsx
// src/features/garden/GardenView.tsx
import { useUiFeedback } from '@/components/hooks/useUiFeedback';
import { usePetStore } from '@/store';

/** Новая вкладка нижней зоны. Верхняя половина (питомец) не затрагивается. */
export function GardenView() {
  const totalXp = usePetStore((state) => state.totalXp);
  const { playSound, vibrate } = useUiFeedback();

  const handlePlant = (): void => {
    playSound('tap');
    vibrate('light');
  };

  return (
    <div className="space-y-3">
      <header className="space-y-1">
        <h2 className="text-lg font-bold text-app-text">Сад</h2>
        <p className="text-sm text-app-hint">Опыт питомца: {totalXp}</p>
      </header>
      <button
        type="button"
        onClick={handlePlant}
        className="w-full rounded-app border border-app-border bg-app-bg px-4 py-3 text-left text-app-text shadow-app active:scale-[0.99]"
      >
        🌱 Посадить росток
      </button>
    </div>
  );
}
```

Правила: только токены (`text-app-text`, `bg-app-card`, ...), никаких `alert/confirm`, никаких
импортов из других `src/features/*`. Данные — через `@/store` и `@/data`; отклик (звук/вибрация) —
через `@/components/hooks/useUiFeedback`; haptic-подробности — через `@/lib/telegram`.

### Шаг 3. Добавить запись в реестр

`src/modules/registry.tsx` (импорты — именованные, как у существующих вкладок):

```tsx
import { GardenView } from '@/features/garden/GardenView';

// ... внутри массива bottomTabRegistry, рядом с menu/lesson/shop/settings:
{
  id: 'garden',
  title: 'Сад',
  emoji: '🌱',
  order: 4, // больше, чем у существующих вкладок; реестр сортирует по order
  Component: GardenView,
},
```

Контракт реестра (`src/modules/registry.tsx`):

```tsx
export interface BottomTabEntry extends BottomTabModule {
  Component: React.ComponentType;
}
export const bottomTabRegistry: BottomTabEntry[]; // отсортирован по order
export function getBottomTab(id: BottomTabId): BottomTabEntry;
```

### Шаг 4. Добавить пункт в меню

`MenuView` (`src/features/menu/MenuView.tsx`) рендерит список `MENU_ACTIONS` и уже содержит
обработчик `openTab` со звуком/вибрацией. Добавь в массив `MENU_ACTIONS` ещё один объект — и всё:

```tsx
// src/features/menu/MenuView.tsx, в массив MENU_ACTIONS
{
  tab: 'garden',
  title: 'Сад',
  emoji: '🌱',
  description: 'Выращивай растения вместе с питомцем',
  accentClass: 'bg-app-accent-soft',
},
```

`BottomHalf` сам отрисует `GardenView` по `uiStore.bottomTab` и покажет кнопку «Назад»
(она появляется для любой вкладки, кроме `menu`). Никаких правок в `MainScreen`, `PetHalf`,
`BottomHalf` и `App.tsx` не требуется.

### Чек-лист после добавления

- `run-pnpm.cmd typecheck` → 0 ошибок;
- `run-pnpm.cmd build` → успех;
- вкладка открывается из меню, «Назад» работает, верхняя половина не мигает и не сбрасывается;
- в README обновлено дерево (`src/features/garden/GardenView.tsx`).

---

## 8. Рецепт: добавить новый урок

Уроки — это данные, а не код UI: `src/data/lessons.ts` экспортирует `lessons: Lesson[]`.
**`lessonStore` менять не нужно** — он берёт уроки из массива; порядок уроков = порядок в массиве.

Структура `Lesson` (`src/types/index.ts`):

```ts
interface Lesson {
  id: string;                  // уникальный id урока
  title: string;               // заголовок, например «Приветствие»
  petPhrase: string;           // фраза, которую «говорит» питомец
  instruction: string;         // инструкция к заданию
  translation: string;         // правильный перевод (показывается после проверки)
  words: WordToken[];          // банк слов: правильные + дистракторы
  correctWordIds: string[];    // правильный порядок id слов
  xpReward: number;            // награда XP за верный ответ
  mode?: LessonMode;           // 'choice' (по умолчанию) | 'voice' (зарезервировано)
}

interface WordToken {
  id: string;   // уникален в пределах урока
  text: string; // то, что видит игрок
}
```

Готовый пример для вставки в конец массива (`lessons` — реальный массив, не выдуманный API):

```ts
// src/data/lessons.ts
{
  id: 'lesson-weather',
  title: 'Погода',
  petPhrase: 'It is sunny today.',
  instruction: 'Собери перевод фразы питомца на русский язык.',
  translation: 'Сегодня солнечно',
  words: [
    { id: 'weather-1', text: 'Сегодня' },
    { id: 'weather-2', text: 'солнечно' },
    // дистракторы — не входят в correctWordIds:
    { id: 'weather-3', text: 'дождь' },
    { id: 'weather-4', text: 'холодно' },
    { id: 'weather-5', text: 'завтра' },
    { id: 'weather-6', text: 'но' },
  ],
  correctWordIds: ['weather-1', 'weather-2'],
  xpReward: 15,
  mode: 'choice',
},
```

Правила данных:

- `id` урока уникален среди всех уроков; `id` слов уникальны **внутри урока** (на них завязаны
  выбор/удаление);
- `correctWordIds` — подмножество `words.map(w => w.id)` в правильном порядке; опечатка в id =
  урок невозможно пройти;
- `translation` должен совпадать с фразой, собранной из правильных слов в правильном порядке
  (это то, что показывается после проверки);
- в `words` обязательно есть дистракторы, иначе задание тривиально;
- `words` лучше перемешать на этапе данных: UI показывает банк как есть;
- `xpReward` — положительное число; начисление XP и `mood + LESSON_CORRECT_MOOD_GAIN`
  делает `checkAnswer()`, причём **только при первом завершении** урока;
- `mode` не указывай или ставь `'choice'`; `'voice'` — задел, без реализации.

Как это работает с прогрессом:

- добавленный урок автоматически появляется в списке `LessonView` (номер = позиция в массиве,
  метка «Пройден» — если `id` есть в `completedLessonIds`); менять `LessonView` не нужно;
- первое прохождение урока начисляет XP и `mood + LESSON_CORRECT_MOOD_GAIN`; повторное
  прохождение уже пройденного урока даёт обратную связь «Верно!», но **без награды**
  (защита от фарма XP);
- `startLesson()` без id → первый урок, которого нет в `completedLessonIds`; верный ответ
  добавляет `lessonId` в `completedLessonIds` (persist `'tamang.lesson-progress'`);
- `nextLesson()` → следующий незавершённый (по кругу), если все пройдены — `status = 'completed'`
  и показывается экран «Все уроки пройдены!»;
- сбросить прогресс: `useLessonStore.getState().resetProgress()` (кнопка в `SettingsView`).

Ничего в `lessonStore`, `LessonView` или `registry` при добавлении урока не меняется. Если
добавляешь **новый режим** урока (`LessonMode`) — это изменение контракта: только через Lead.

---

## 9. Рецепт: изменить питомца, статы и внешний вид

### 9.1. Конфигурация питомца

Все дефолты — в `src/data/petConfig.ts`, экспорт `PET_CONFIG`:

```ts
export interface PetConfig {
  defaultName: string;          // 'Таманг'
  defaultStats: PetStats;       // { health: 100, mood: 100 }
  expressions: Record<PetExpression, string>; // эмодзи: idle/happy/sad/sleeping
  maxStat: number;              // 100
  minStat: number;              // 0
  clickMoodGain: number;        // 4
  clickHealthGain: number;      // 1
  reactionTimeoutMs: number;    // 1200
  levelThresholds: readonly number[]; // [0, 50, 120, 220, 350, 520, 750, 1050]
}

export const PET_CONFIG: PetConfig;
export function getPetLevel(totalXp: number): number; // 1 при 0 XP, 2 при 50 XP, ...
```

Здесь меняются: имя по умолчанию, стартовые статы, эмодзи выражений, границы шкал (clamp),
бонусы за клик, задержка возврата выражения в `idle` и пороги уровней. Пороги уровней —
только данные: `getPetLevel` читает `PET_CONFIG.levelThresholds`, поэтому новый уровень
добавляется одним числом. Менять `PET_CONFIG` безопасно: стор читает его при инициализации
и в `resetPet()`, а UI — при отрисовке.

### 9.2. Публичное API `petStore`

| Экшен | Что делает |
|---|---|
| `petClick()` | `mood + clickMoodGain`, `health + clickHealthGain` (clamp), `expression='happy'`, `lastInteractionAt=now`, возврат в `'idle'` через `reactionTimeoutMs` |
| `addXp(amount)` | увеличить `totalXp` |
| `applyStatDelta(delta: Partial<PetStats>)` | изменить статы на дельту с ограничением `minStat..maxStat` |
| `setExpression(expression)` | принудительно задать выражение (например, `'sad'` на ошибке) |
| `equipItem(itemId)` / `unequipItem(itemId)` | надеть/снять предмет (id из `shopItems`) |
| `renamePet(name)` | переименовать питомца |
| `resetPet()` | сброс к `PET_CONFIG` |

Все экшены доступны и как `usePetStore.getState().action(...)` вне React (например, из
`lessonStore`). Из компонентов — только через селекторы.

### 9.3. Переодевание и слот под анимации

- `PetOutfitSlot` (`src/components/pet/PetOutfitSlot.tsx`) — слой поверх сцены питомца: рисует
  эмодзи надетых предметов из `usePetStore((s) => s.equippedItemIds)` (сопоставление id →
  `shopItems`) и содержит **пустой контейнер под будущие сложные анимации** —
  `data-slot="pet-animation-layer"` (не интерактивен, не влияет на клик и статы).
- Надеть/снять можно только то, что есть у игрока: в магазине предметы с `ownedByDefault: true`
  доступны сразу, остальные показывают «скоро». Покупка не реализована (нет валюты).
- Чтобы добавить предмет: добавь запись в `shopItems` (`ShopItem`: `id`, `title`, `description`,
  `emoji`, `price`, `category`, `ownedByDefault?`) и, если нужен внешний вид, отрисовку в
  `PetOutfitSlot` по `id`. Стор менять не нужно — он хранит только `equippedItemIds`.
- Чтобы добавить скин/анимацию питомца: меняй `PetStage` (`src/components/pet/PetStage.tsx`:
  эмодзи из `PET_CONFIG.expressions` или будущее изображение) и контейнер анимаций в
  `PetOutfitSlot`; учитывай `settingsStore.animationsEnabled`, CSS-классы `animate-float` /
  `animate-pop` из `tailwind.config.js` и `pet-emoji-shadow` из `src/index.css`.

### 9.4. Новая стата питомца

Это **изменение контракта**: `PetStats` живёт в `src/types/index.ts` (правит Lead), плюс нужна
новая дельта в `PET_CONFIG.defaultStats` и обработка в `petStore`/UI. Порядок:

1. согласовать с Lead поле (например, `satiety: number`), Lead правит `PetStats`;
2. `PET_CONFIG.defaultStats` — стартовое значение; `applyStatDelta` уже работает с
   `Partial<PetStats>`, clamp берётся из `PET_CONFIG`;
3. `PetStats`-компонент — новая полоска/число;
4. учесть старые сохранения: у пользователей в `localStorage` нет нового поля — стор/компонент
   должны переживать `undefined` (например, `satiety ?? PET_CONFIG.defaultStats.satiety`).
   Если нужна полноценная миграция — согласуй с Lead и используй `persist`-опции `version`/`migrate`.

Не добавляй новые статы «локально в компоненте»: они должны жить в `petStore`, иначе не
сохранятся и не будут доступны другим модулям.

---

## 10. Стилизация: токены вместо цветов

Слои стилей строго такие:

```text
CSS-переменные Telegram (--tg-theme-*)
        ↓ используются как значения по умолчанию
семантические токены --app-* в src/index.css (:root и html.dark)
        ↓ замаплены в tailwind.config.js
Tailwind-классы в компонентах: bg-app-bg, text-app-text, bg-app-card, ...
```

### 10.1. Переменные в `src/index.css`

| Токен | Назначение | Light (fallback вне Telegram) | Dark |
|---|---|---|---|
| `--app-bg` | фон приложения | `var(--tg-theme-bg-color, #f7f3e8)` | `#17212b` |
| `--app-card` | карточки/панели | `var(--tg-theme-secondary-bg-color, #ffffff)` | `#232e3c` |
| `--app-text` | основной текст | `var(--tg-theme-text-color, #1f2328)` | `#f5f5f5` |
| `--app-hint` | вторичный текст | `var(--tg-theme-hint-color, #8b8f94)` | `#8d99a6` |
| `--app-border` | границы | `rgba(31,35,40,0.12)` | `rgba(245,245,245,0.14)` |
| `--app-shadow` | тень карточек | `0 12px 32px rgba(...)` | усиленная тень |
| `--app-accent` | акцент/CTA | `#f0a020` | `#ffb648` |
| `--app-accent-soft` | мягкая подложка акцента | `#fdf0d5` | `#3a2c14` |
| `--app-accent-contrast` | текст/иконки на акцентном фоне | `#241a08` | `#1e1505` |
| `--app-success` | успех | `#2fbf71` | `#4ade80` |
| `--app-danger` | ошибка | `#e5484d` | `#f87171` |
| `--app-egg-shell` / `--app-egg-shade` / `--app-egg-rim` / `--app-egg-spot` | палитра CSS-яйца на старте | светлая скорлупа | тёмная скорлупа |
| `--app-soft-shadow-color` | цвет мягкой тени под эмодзи-питомцем | `rgba(31,35,40,0.22)` | `rgba(0,0,0,0.5)` |
| `--app-radius` | основной радиус | `20px` | — |
| `--app-radius-sm` | малый радиус | `12px` | — |
| `--app-safe-top` / `--app-safe-bottom` | safe-area | `env(safe-area-inset-*)` | — |

### 10.2. Маппинг в `tailwind.config.js`

Доступные классы (только они, других «цветных» классов нет):

| Токен → Tailwind | Пример использования |
|---|---|
| `app.bg` | `bg-app-bg` |
| `app.card` | `bg-app-card` |
| `app.text` | `text-app-text` |
| `app.hint` | `text-app-hint` |
| `app.border` | `border-app-border` |
| `app.accent` | `text-app-accent`, `bg-app-accent` |
| `app.accent-soft` | `bg-app-accent-soft` (подложки иконок/чипов) |
| `app.accent-contrast` | `text-app-accent-contrast` (текст на акцентной кнопке) |
| `app.success` | `text-app-success`, `border-app-success` |
| `app.danger` | `text-app-danger`, `border-app-danger` |
| `borderRadius.app` | `rounded-app` (`var(--app-radius)`) |
| `borderRadius.app-sm` | `rounded-app-sm` (`var(--app-radius-sm)`) |
| `boxShadow.app` | `shadow-app` |
| `fontFamily.app` | `font-app` |

Все перечисленные токены уже замаплены — отдельные классы в компонентах не нужны.

Тёмная тема: `darkMode: 'class'` в Tailwind; класс `dark` на `<html>` выставляет
`TelegramProvider` (в Telegram — по `colorScheme`, вне Telegram — по `prefers-color-scheme`).
Компоненты **не** проверяют тему вручную и не используют `dark:`-варианты для цветов, если это
уже покрыто токенами: переменные `--app-*` сами меняются в `html.dark`.

Кроме Tailwind-токенов в `src/index.css` есть CSS-утилиты UI-слоя: `start-gradient` (фон старта),
`egg-body` / `egg-spot` / `egg-shine` (CSS-яйцо без бинарных ассетов), `egg-bob` (покачивание),
`pet-emoji-shadow` (мягкая тень питомца). Они используют только переменные `--app-*`; анимации
отключаются при `prefers-reduced-motion: reduce` и настройкой `settingsStore.animationsEnabled`.

### 10.3. Правила

1. **Не хардкодить цвета/радиусы/тени** в `tsx`: только токены (`bg-app-bg`, `text-app-text`,
   `border-app-border`, `shadow-app`, `rounded-app`, ...). Хардкод допустим только внутри
   `src/index.css`, где объявлены сами токены.
2. Нужен новый цвет — добавь переменную в `:root` **и** `html.dark`, замапь в
   `tailwind.config.js`, опиши в README.
3. Safe-area: используй `var(--app-safe-top)` / `var(--app-safe-bottom)` (например,
   `pb-[calc(16px+var(--app-safe-bottom))]`), не зашивай отступы под конкретный телефон.
4. Проверяй обе темы и ширину 320–390px: интерфейс должен не ломаться и не давать горизонтальный скролл.

---

## 11. Telegram-слой

### 11.1. Как устроен

- `index.html` подключает официальный `https://telegram.org/js/telegram-web-app.js` — он
  определяет `window.Telegram.WebApp`. Вне Telegram скрипт ничего не делает.
- `src/lib/telegram/types.ts` — минимальная типизация SDK (без `any`): `themeParams`,
  `colorScheme`, `initDataUnsafe.user`, методы `ready/expand/disableVerticalSwipes/
  setHeaderColor/setBackgroundColor/onEvent/offEvent` и т.д.
- `TelegramProvider` монтируется в `App.tsx` и:
  - при наличии `window.Telegram.WebApp`: вызывает `ready()`, `expand()`,
    `disableVerticalSwipes?.()` (если метод есть), ставит цвет шапки/фона из `themeParams`
    (в `try/catch` — часть методов может быть недоступна в старых клиентах);
  - синхронизирует тему: `document.documentElement.classList.toggle('dark', scheme === 'dark')`
    и атрибут `data-theme`; подписывается на `themeChanged` и снимает подписку через `offEvent`
    при размонтировании;
  - вне Telegram берёт тему из `matchMedia('(prefers-color-scheme: dark)')` и слушает её изменения.
- `useTelegram()` возвращает контекст:

```ts
interface TelegramContextValue {
  isTelegram: boolean;
  webApp: TelegramWebApp | null;
  colorScheme: 'light' | 'dark';
  user: TelegramUser | null;
  haptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning'): void;
}
```

`haptic()` безопасен вне Telegram (no-op). В компонентах для звука и вибрации используй общий
хук `useUiFeedback()` (`@/components/hooks/useUiFeedback`) — он учитывает
`settingsStore.hapticsEnabled` и `soundEnabled`, поэтому отключённые настройки реально работают:

```tsx
const { playSound, vibrate } = useUiFeedback();
const petClick = usePetStore((s) => s.petClick);

<button onClick={() => { petClick(); vibrate('light'); playSound('tap'); }}>...</button>
```

Прямой `useTelegram().haptic(...)` — только для особых случаев, когда настройка вибрации
сознательно не применяется; по умолчанию весь UI-отклик идёт через `useUiFeedback()`
(так сделано в существующих фичах, включая `SettingsView`).

### 11.2. CSS-переменные и safe-area

Внутри Telegram переменные `--tg-theme-bg-color`, `--tg-theme-secondary-bg-color`,
`--tg-theme-text-color`, `--tg-theme-hint-color`, `--tg-theme-button-color` и др. доступны на
`:root`. Приложение читает их только через `--app-*` (см. раздел 10) — это делает его
совместимым и с Telegram, и с браузером. Safe-area учтена токенами `--app-safe-top/bottom`
(`viewport-fit=cover` уже в `index.html`).

### 11.3. Как добавить новый нативный API Telegram

1. Расширь типизацию в `src/lib/telegram/types.ts` (аккуратно, без `any`).
2. Если API нужно всем — добавь обёртку в `TelegramProvider`/`useTelegram` (состояние/функция
   в `TelegramContextValue`), с безопасным no-op поведением вне Telegram и в старых клиентах
   (`try/catch` или опциональный вызов `?.`).
3. Если API нужен одному месту — вызывай через `useTelegram().webApp`, но проверяй на `null`.
4. Не добавляй прямые обращения к `window.Telegram` в фичах — только через `@/lib/telegram`.
5. После изменения публичного API контекста — обнови этот README и `docs/CONTRACT.md` (через Lead).

---

## 12. Аудио и голос (заделы)

### 12.1. `src/lib/audio.ts`

```ts
export const audioService: AudioService;

interface AudioService {
  isSupported: boolean;                       // в каркасе false
  setEnabled(enabled: boolean): void;         // запоминает флаг
  play(sound: SoundId): void;                 // no-op в каркасе
  playPhrase(text: string, lang?: string): Promise<boolean>; // задел под TTS/аудио
  stopAll(): void;
}

type SoundId = 'tap' | 'correct' | 'wrong' | 'level-up' | 'purchase';
```

В каркасе звука нет: `play`/`playPhrase`/`stopAll` — осознанные no-op. UI не вызывает сервис
напрямую, а использует `useUiFeedback().playSound(sound)`, который проверяет
`settingsStore.soundEnabled` и только затем дергает `audioService.play(...)`. Включение/выключение
звука синхронизирует `RootScreen` через `audioService.setEnabled(...)`, чтобы будущая реализация
сразу уважала настройку.

### 12.2. `src/lib/voice.ts`

```ts
export const voiceInputService: VoiceInputService;

interface VoiceInputService {
  isSupported: boolean;                    // в каркасе false
  isListening: boolean;
  start(): Promise<boolean>;               // no-op: Promise.resolve(false)
  stop(): void;
  onResult(callback: (text: string) => void): Unsubscribe; // no-op: возвращает функцию отписки
}
```

### 12.3. Точки расширения в UI

В активном уроке `LessonView` есть две кнопки — «Прослушать» (фраза питомца) и «Голосом»
(ответ). Обе сейчас `disabled`, с бейджем «скоро» и `title`-подсказкой («Озвучка появится
в следующих версиях» / «Голосовой ввод появится в следующих версиях»). Это не мёртвый код,
а точки расширения.

Звуковые эффекты интерфейса уже идут через `audioService`: `useUiFeedback().playSound(...)`
вызывает его для `tap/correct/wrong` и уважает `settingsStore.soundEnabled`. Кнопки озвучки
фразы и голосового ввода — отдельный, ещё не подключённый сценарий.

Как заменить no-op на реальную реализацию:

1. **Аудио:** реализуй `AudioService` в `src/lib/audio.ts` (например, `Audio` + файлы или TTS),
   выставь `isSupported = true`, реализуй `play`/`playPhrase`/`stopAll` — сигнатуры не меняй.
   Затем в `LessonView` у кнопки «Прослушать» убери `disabled`/«скоро» и добавь
   `onClick={() => void audioService.playPhrase(lesson.petPhrase)}`.
2. **Голос:** реализуй `VoiceInputService` в `src/lib/voice.ts` (Web Speech API или нативный мост),
   выставь `isSupported = true`. В `LessonView` вызови `voiceInputService.start()`, подпишись
   через `onResult` и сохрани функцию отписки для очистки при размонтировании; полученный текст
   сравни с `lesson.translation` (или передай в `lessonStore` — но новый экшен/режим ответа это
   изменение контракта, согласуй с Lead).
3. Если меняется публичный интерфейс сервиса — это контракт: согласование с Lead, правка
   `src/types/index.ts`, README и `docs/CONTRACT.md`.
4. Проверь оба окружения: Telegram (WebView) ограничивает автозапуск аудио — первый звук должен
   быть следствием явного действия пользователя.

---

## 13. Инструкция для ИИ-ассистента (главный раздел)

Ты — ИИ-ассистент, которому передали этот репозиторий после сброса сессии. Твоя задача — менять
или добавлять изолированные модули, не ломая остальные. Ниже — обязательный протокол.

### 13.1. Порядок чтения (не пропускай)

1. `docs/CONTRACT.md` — замороженный контракт: типы, API сторов, Telegram-слой, дерево компонентов.
   Это истина в последней инстанции. Менять его может только Lead.
2. `README.md` (этот файл) — как всё устроено и как расширять.
3. `src/types/index.ts` — доменные типы (единственный источник).
4. `src/store/*.ts` — реальные экшены и persist.
5. Дальше по задаче: `src/modules/registry.tsx`, нужная `src/features/*`, `src/lib/*`.
6. Перед правкой — прочитай **фактические** файлы, которые собираешься менять: не полагайся на
   память и на этот README там, где речь о точных сигнатурах.

### 13.2. Карта зависимостей

```text
types (src/types)                       ← не импортирует ничего
  ↑
lib (src/lib) / data (src/data)         ← только types
  ↑
store (src/store)                       ← types + data
  ↑
components/hooks (useUiFeedback)        ← store + lib/telegram + lib/audio
  ↑
features (src/features)                 ← types + store + data + lib + components/hooks
  ↑
modules/registry                        ← features + types
  ↑
components (src/components)             ← types + store + lib + modules + hooks
  ↑
App.tsx                                 ← components + lib/telegram; только собирает
```

Фактические исключения, которые считаются нормой: фичи импортируют общий хук
`@/components/hooks/useUiFeedback` (звук/вибрация с учётом настроек) и мок-данные `@/data/*`;
`BottomHalf` импортирует реестр. Разрешённые направления — снизу вверх (стрелка «используется»).
Запрещено:

- `src/features/a` импортирует `src/features/b` — фичи изолированы; общение через стор/типы;
- фича импортирует компоненты `src/components/*` (кроме общего `components/hooks/useUiFeedback`);
- `store` импортирует UI/компоненты или вызывает `audioService`/`haptic` (звук и вибрация — в UI);
- `types` импортирует что-либо с рантаймом;
- `components` знают о внутренностях фич (кроме реестра и публичных компонентов модулей).

### 13.3. Чек-лист перед любым изменением

1. Прочитал `docs/CONTRACT.md` и этот раздел.
2. Понял, какие файлы моя зона записи; **не редактирую чужие файлы и не «улучшаю» соседние модули**.
3. Публичные экспорты, которые я затрагиваю, не переименованы и не удалены (или это согласовано
   с Lead и обновлено в CONTRACT.md).
4. `src/types/index.ts` не правлю без Lead.
5. Не добавляю npm-зависимостей, не меняю `package.json`/конфиги без согласования.
6. Использую селекторы стора, экшены для изменений, токены для стилей, `@/` для импортов.
7. После изменений: `run-pnpm.cmd typecheck` → 0, `run-pnpm.cmd build` → успех.
8. Если добавлен новый файл/API/токен/вкладка — обновил этот README (дерево, API, рецепты).

### 13.4. Рецепты типовых задач

- **Новая вкладка** — раздел 7 (4 шага: union → `src/features/<name>/<Name>View.tsx`
  с именованным экспортом → запись в `bottomTabRegistry` → объект в `MENU_ACTIONS`).
  Верхняя половина не меняется.
- **Новый урок** — раздел 8 (объект `Lesson` в `src/data/lessons.ts`, `correctWordIds` —
  подмножество `words`). Стор и `LessonView` не меняются; урок сам появится в списке.
- **Новый экран/модалка** — новый самостоятельный экран: значение `AppScreen` (типы, только
  с Lead) + ветка в `RootScreen`; подсостояние внутри вкладки (как список/активный урок/финиш в
  `LessonView`): отдельный компонент + локальный `useState`, без правки `uiStore`. Модалка —
  разметка поверх контента на локальном `useState` (как подтверждение сброса в `SettingsView`),
  без `alert/confirm` и без портала.
- **Новая стата питомца** — раздел 9.4 (Lead правит `PetStats`, затем `PET_CONFIG`, `petStore`,
  UI; учесть старые сохранения).
- **Новая звуковая реплика** — добавь значение в `SoundId` (`src/types`, с Lead) и вызывай
  `playSound('<id>')` / `audioService.play('<id>')` в UI; в каркасе это no-op. Не добавляй звук в стор.
- **Смена темы/цвета** — правь токены в `src/index.css` (`:root` и `html.dark`) и маппинг в
  `tailwind.config.js`; компоненты не трогай, если они используют токены.
- **Новый предмет магазина** — запись в `src/data/shopItems.ts`; чтобы он был доступен сразу,
  поставь `ownedByDefault: true` (иначе кнопка «скоро»); отрисовка на питомце — `PetOutfitSlot`.

### 13.5. Жёсткие запреты

| Запрещено | Почему |
|---|---|
| Новые npm-пакеты без согласования Lead | каркас зафиксирован, лишние зависимости ломают сборку/вес |
| `alert()` / `confirm()` / `prompt()` | в Telegram они заблокированы; только UI-состояния |
| Правка `src/types/index.ts` без Lead | это замороженный контракт |
| Хардкод цветов/радиусов/теней в `tsx` | ломает тему Telegram и dark mode; только `--app-*`/Tailwind-токены |
| Импорт одной фичи в другую | нарушает изоляцию модулей |
| `any`, `@ts-ignore`, `@ts-expect-error` без обоснования | TypeScript strict — часть контракта |
| Мёртвый код, `console.log` в проде, закомментированные блоки | QA-ревью не пропустит |
| Смена persist-ключей/имён полей без миграции | потеря прогресса и статов у пользователей |
| Мутация состояния вне экшенов (`setState` из компонента) | непредсказуемые обновления |
| Прямой `window.Telegram` в фичах вместо `@/lib/telegram` | ломает fallback вне Telegram |

### 13.6. Определение готовности (Definition of Done)

Команды обязаны завершиться с кодом 0:

```bat
C:\Users\kotaz\Downloads\tamang\run-pnpm.cmd typecheck
C:\Users\kotaz\Downloads\tamang\run-pnpm.cmd build
```

Плюс ручной чек-лист по экранам:

- [ ] старт: яйцо по центру, кнопка «Play!» → главный экран;
- [ ] верх: питомец виден, клик по нему меняет mood/health/эмодзи; полоски Health/Mood корректны;
      в шапке показаны имя, уровень (`getPetLevel`) и XP;
- [ ] смена вкладок меняет только низ; питомец и статы не сбрасываются;
- [ ] урок: вкладка открывается списком уроков (сессия не активна); выбор урока; сборка ответа,
      «Проверить», верный/неверный путь, «Дальше», повторный клик по слову игнорируется, пустой
      ответ не проверяется; после последнего урока — экран «Все уроки пройдены!»; кнопки
      «Прослушать»/«Голосом» — `disabled` с бейджем «скоро»;
- [ ] магазин: надеть/снять обновляет питомца; недоступные товары — «скоро»;
- [ ] настройки: переключатели влияют на поведение, сбросы работают (подтверждение — UI);
- [ ] прогресс уроков и статы переживают перезагрузку страницы (localStorage-ключи из раздела 6);
- [ ] вне Telegram (обычный браузер): работает, тема светлая/тёмная по системе, ошибок в консоли нет;
- [ ] ширина 320–390px и высокий экран: нет горизонтального скролла, низ скроллится, safe-area учтён.

### 13.7. Что делать при конфликте требований

Если задача требует изменить контракт (публичный API, типы, persist-ключи, структуру реестра) —
остановись, опиши проблему и согласуй с Lead. Изменение контракта без согласования — блокер
приёмки, даже если код собирается.

---

## 14. Известные ограничения каркаса и план развития

### Ограничения (осознанные)

- **Нет бэкенда и авторизации.** Все данные — мок (`src/data/*`), прогресс — `localStorage`
  на устройстве. Данные Telegram-пользователя доступны через `useTelegram()`, но не используются
  для сохранения на сервере.
- **Магазин без экономики.** Нет валюты, покупок и списаний: товары либо `ownedByDefault`, либо
  «скоро». `ShopItem.price` — только витрина.
- **Переодевание — эмодзи-слой.** Нет спрайтов/скелетной анимации; `PetOutfitSlot` держит слой
  предметов и пустой контейнер под будущие анимации.
- **Анимации минимальные** (CSS `float`/`pop`); нет сложной реактивной анимации питомца.
- **Аудио и голос — no-op** (`audioService.isSupported = false`, `voiceInputService.isSupported = false`).
- **Нет i18n**: интерфейс и комментарии на русском, уроки — английский как демо-язык.
- **Нет тестов и роутинга**: навигация — `uiStore`, URL не меняется, тестового раннера нет.

### Ближайшие шаги развития

1. **Бэкенд + Telegram-авторизация**: проверка `initData` на сервере, синхронизация статов и
   прогресса между устройствами (сторы остаются прежними, меняется слой persist/адаптер).
2. **Экономика магазина**: валюта (`coins`/`gems` в `petStore` или отдельном сторе), покупка
   предметов, снятие/надевание как вложение; UI уже готов к `owned`.
3. **Реальные переодевание и анимации**: спрайты/скелеты, скины, реакции на настроение и ошибки.
4. **TTS/STT**: реализация `AudioService`/`VoiceInputService` по зафиксированным интерфейсам,
   включение кнопок «прослушать»/«голосом» и режима `LessonMode = 'voice'`.
5. **Контент уроков**: больше уроков и языковых пар, прогресс по уровням/повторениям (SRS).
6. **i18n** интерфейса (ru/en) и тестирование (unit для сторов, e2e для базовых сценариев).

---

## Журнал QA

Приёмочные проверки каркаса (типы, сборка, требования ТЗ, качество, соответствие README)
ведутся в отдельном отчёте: [`docs/QA-REPORT.md`](docs/QA-REPORT.md).

- Отчёт создан **12.11.2026**. Итоговый вердикт — **PASS**: 0 блокеров, 0 major,
  6 minor и 6 nit (таблица замечаний — в §4 отчёта).
- minor-замечания из §4 исправлены в коде: `theme-color` для тёмной темы в `index.html`,
  переполнение старт-экрана (`StartScreen`), кнопка «Дальше» после ошибки в `LessonView`,
  XP и mood только за первое прохождение урока, синхронизация `docs/CONTRACT.md`
  (`levelThresholds`/`getPetLevel`), `dvh`-высота в `src/index.css`.
- Итоговая повторная проверка после исправлений — в конце `docs/QA-REPORT.md`.

В этот README результаты QA не дублируются — актуальный статус и найденные дефекты смотри
в отчёте. Не считай каркас проверенным только по этому README.

---

## Быстрая шпаргалка

```text
Запуск:    C:\Users\kotaz\Downloads\tamang\run-pnpm.cmd dev
Проверка:  C:\Users\kotaz\Downloads\tamang\run-pnpm.cmd typecheck
Сборка:    C:\Users\kotaz\Downloads\tamang\run-pnpm.cmd build   → dist/
Сторы:     petStore 'tamang.pet' | uiStore (без persist) |
           lessonStore 'tamang.lesson-progress' | settingsStore 'tamang.settings'
Верх/низ:  PetHalf (постоянно) + BottomHalf (реестр вкладок по uiStore.bottomTab)
Новый модуль: types (union, Lead) → src/features/<name>/<Name>View.tsx →
           src/modules/registry.tsx → кнопка в MenuView
Нельзя:    новые пакеты, alert/confirm, правка types без Lead, хардкод цветов,
           импорт фич друг в друга, any
Готово:    typecheck=0, build=0, ручной чек-лист раздела 13.6
```
