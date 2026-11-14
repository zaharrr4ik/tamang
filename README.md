# Tamang — Telegram Mini App «Тамагочи для изучения языков»

> **Этот файл — AI Context Protocol.** После сброса сессии достаточно передать ИИ-ассистенту
> `README.md` (и `docs/CONTRACT.md`), чтобы он мог безопасно менять или добавлять изолированные
> модули, не ломая остальные. Если ты ИИ-ассистент — сначала прочитай раздел
> [13. Инструкция для ИИ-ассистента](#13-инструкция-для-ии-ассистента-главный-раздел), затем
> остальное по порядку.

Статус: **каркас-фундамент (v0.1.0) с пиксельным ретро-редизайном**. Все зоны работают на
мок-данных и готовы к запуску; бэкенда нет, это осознанно. Домен и сценарии зафиксированы,
детали реализации модулей — расширяемы.

---

## 1. Что это и цель проекта

`tamang-app` — Telegram Mini App на React: тамагочи, который помогает учить иностранные слова.
Живой питомец «живёт» в верхней половине экрана, а нижняя половина — сменяемая рабочая зона
(меню, урок, магазин, гардероб, настройки). Прогресс и статы сохраняются в `localStorage` через Zustand
`persist`, поэтому перезапуск Mini App не сбрасывает игру.

**Цель этого репозитория — фундамент, а не финальная игра.** Требования к каркасу:

- каждый модуль изолирован: фичи не импортируют друг друга, общение — только через стор и типы;
- новая вкладка/урок/звук/стата добавляются по рецепту из раздела 13 без правок соседних модулей;
- приложение полностью работает и вне Telegram (fallback-тема, no-op haptics);
- код собирается без ошибок: TypeScript strict + `vite build` с кодом 0.

Что уже реализовано в каркасе:

| Зона | Что есть |
|---|---|
| Старт | Пиксельная лягушка-«устройство» по центру; тап по ней (без единой надписи) → главный экран |
| Верх главного экрана | Тёмная полоса устройства с HUD `PetHud`: уровень с зелёной заливкой по `getLevelProgress`, огонёк `streak`, монеты `coins`; под ней LCD-экран с питомцем (`PetStage`) и сканлайнами, клик и перетаскивание питомца; слой надетых предметов (`PetOutfitSlot`) временно скрыт |
| Низ главного экрана | Тёмная панель меню (сытость, плашка еды, кнопка «На болото») и постоянная нижняя навигация `BottomNav`: Главная, Магазин, Гардероб, Настройки; вкладки берутся из `bottomTabRegistry`, «Урок» скрыт из навигации (`inNav: false`); кнопка «Назад» у внутренних вкладок |
| Урок | Duolingo-стиль: реплика питомца, сборка ответа из слов, проверка, XP и mood за первое прохождение урока, прогресс уроков; всё в пиксельной рамке |
| Магазин | Сетка товаров: надеть/снять для полученных, «скоро» и цена для остальных |
| Гардероб | Отдельная вкладка: наряды и аксессуары без еды; надетые — «Снять», полученные — «Надеть», остальные — «Скоро» |
| Настройки | Звук/вибрация/анимации (пиксельные переключатели), сбросы с inline-подтверждением, блок «О приложении» |
| Стиль | Единая пиксельная система: 3px ink-рамки, жёсткие тени без размытия, `Jambilee` для заголовков/чисел (только латиница), `Pixelify Sans` для кириллицы и текста, self-hosted шрифты и PNG-иконки через `PixelIcon` |
| Telegram | `TelegramProvider`, тема из `--tg-theme-*`, haptic, safe-area, fallback вне Telegram |
| Заделы | `AudioService` (TTS/звуки) и `VoiceInputService` (STT) — интерфейсы есть, реализации no-op |

Границы каркаса (важно понимать до изменений): нет сервера и авторизации, магазин не списывает
валюту — монеты `coins` и еда `food` пока только отображаются в HUD и на главном экране;
переодевание на питомце пока не отображается — слой нарядов `PetOutfitSlot` временно скрыт,
пиксельные наряды в следующей итерации; питомец анимирован пиксельными спрайтами (блуждание
по полу, реакция на указатель, перенос пальцем), но скелетных анимаций и «комнаты» уровня
полноценного тамагочи нет; полоски Health/Mood временно скрыты; звука и голоса физически нет.
Всё это — точки расширения, см. раздел 14.

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

В репозитории уже настроен автодеплой на GitHub Pages (см. 2.5), поэтому вручную собирать и
выкладывать не нужно: живой URL — <https://zaharrr4ik.github.io/tamang/>. Шаги ниже — для своего
хостинга или локальной проверки.

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

### 2.5. Инфраструктура и деплой

Публичный репозиторий — [github.com/zaharrr4ik/tamang](https://github.com/zaharrr4ik/tamang),
ветка `main`. Живое приложение: <https://zaharrr4ik.github.io/tamang/>.

| Что | Значение |
|---|---|
| Репозиторий | `github.com/zaharrr4ik/tamang` (public), ветка `main` |
| Хостинг | GitHub Pages, источник — **GitHub Actions** (Settings → Pages → Build and deployment → Source: GitHub Actions) |
| Workflow | `.github/workflows/deploy.yml` — «Deploy to GitHub Pages» |
| Триггер | `push` в `main` + ручной `workflow_dispatch` |
| Живой URL | <https://zaharrr4ik.github.io/tamang/> |
| Telegram | Mini App создан в `@BotFather` через `/newapp`; в поле **Web App URL** указан живой URL выше |

Что делает workflow на каждый push в `main`:

1. `actions/checkout@v4`;
2. `pnpm/action-setup@v4` — pnpm **11**;
3. `actions/setup-node@v4` — Node.js **22**, кэш pnpm;
4. `pnpm install --frozen-lockfile` → `pnpm build`;
5. `touch dist/.nojekyll` — отключает обработку Jekyll, чтобы Pages отдавал файлы как есть;
6. `actions/upload-pages-artifact@v3` (path `dist`) → `actions/deploy-pages@v4` с `environment: github-pages`.

Права workflow: `contents: read`, `pages: write`, `id-token: write`; `concurrency: pages` —
новый деплой отменяет предыдущий. Секреты не нужны: используется штатный `GITHUB_TOKEN`.

```text
git push origin main → GitHub Actions (build) → GitHub Pages → https://zaharrr4ik.github.io/tamang/
```

**Автодеплой.** Отдельного шага «выложить в Telegram» нет: любой push в `main` пересобирает
и перезаливает Pages. Чтобы Telegram-клиент увидел новую версию, достаточно обновить WebView
(потянуть вниз / закрыть и открыть Mini App): при перезапуске Telegram заново загружает
`index.html`, а хэшированные ассеты подтягиваются с Pages.

**Траблшутинг: первая сборка упала.** Первый запуск workflow завершился ошибкой на установке:
pnpm 11 требует Node.js 22, а в `deploy.yml` стоял `node-version: 20`. После замены на
`node-version: 22` сборка и деплой прошли. Если правишь workflow — держи Node 22+ для pnpm 11.

Локальная проверка production-сборки — `run-pnpm.cmd build` (та же команда, что в CI);
деплой с локальной машины не нужен.

---

## 3. Стек и версии

| Слой | Технология | Версия | Зачем |
|---|---|---|---|
| UI | React + React DOM | 18.3.1 | функциональные компоненты и хуки |
| Язык | TypeScript | 5.6.3, `strict`, `noUnusedLocals`, `noUnusedParameters` | типобезопасность, сборка падает на любых ошибках |
| Сборка | Vite | 5.4.11 + `@vitejs/plugin-react` 4.3.3 | dev-сервер, HMR, production-сборка |
| Состояние | Zustand | 4.5.5 (+ `persist` из `zustand/middleware`) | 4 стора, селекторы, localStorage |
| Стили | Tailwind CSS | 3.4.15 + PostCSS 8.4.49 + Autoprefixer 10.4.20 | utility-классы на семантических токенах |
| Шрифты | Self-hosted `.woff2` | `Jambilee` (латиница) + `Pixelify Sans` (кириллица + латиница) | пиксельная типографика без внешних CDN; `@font-face` в `src/index.css` |
| Иконки | Self-hosted PNG 64×64 + `PixelIcon` | `src/assets/icons/*.png` | пиксельные иконки без иконочных пакетов и эмодзи в UI |
| Тема | CSS-переменные Telegram (`--tg-theme-*`) | — | нативный вид внутри Telegram |
| Telegram | официальный SDK `telegram-web-app.js` | — | ready/expand/theme/haptic |

Сознательные ограничения каркаса: **нет** UI-библиотек, иконочных пакетов, роутера, react-query,
i18n-библиотек и тестового раннера. Иконки — только собственные PNG через `PixelIcon`, эмодзи в UI
не используются. Всё это можно добавить только с согласования Lead (раздел 13).

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
├── .github/
│   └── workflows/deploy.yml    # CI/CD: push в main → pnpm build → GitHub Pages (см. 2.5)
├── docs/
│   ├── CONTRACT.md             # ЗАМОРОЖЕННЫЙ контракт интерфейсов — истина по API (меняет только Lead)
│   ├── ARCHITECTURE.md         # краткая схема слоёв, data-flow, точки расширения
│   └── QA-REPORT.md            # отчёт приёмочных проверок (актуальный вердикт — сверху)
└── src/
    ├── main.tsx                # bootstrap: ReactDOM.createRoot + StrictMode, импорт index.css
    ├── App.tsx                 # корень: TelegramProvider → RootScreen (только сборка приложения)
    ├── vite-env.d.ts           # ссылочные типы Vite
    ├── index.css               # @tailwind, @font-face (self-hosted), токены --app-*, пиксельные утилиты, анимации
    ├── assets/
    │   ├── fonts/              # .woff2: Jambilee (латиница/цифры) + Pixelify Sans (кириллица + латиница)
    │   ├── icons/              # PNG 64×64, прозрачный фон: lily, chest, crown, compass, heart, coin, fire, strawberry, book
    │   ├── pet/                # спрайт-листы: idle 128×128, land 128×64, jump/fall/turn 64×64 (death/hurt не подключены)
    │   └── start-frog.png      # пиксельная лягушка-«устройство» старт-экрана
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
    │   └── petConfig.ts        # PET_CONFIG (дефолты, satiety/coins/food, пороги) + getPetLevel() и getLevelProgress()
    ├── modules/
    │   ├── registry.tsx        # реестр вкладок: bottomTabRegistry + getBottomTab(id), сортировка по order, флаг inNav
    │   └── index.ts            # реэкспорт registry для '@/modules'
    ├── features/
    │   ├── menu/MenuView.tsx       # главная: сытость, плашка еды, CTA «На болото» → openTab('lesson'); тёмная панель
    │   ├── lesson/LessonView.tsx   # урок Duolingo-стиля; «прослушать» и «голосом» — disabled «скоро»
    │   ├── shop/ShopView.tsx       # сетка товаров, надеть/снять, «скоро» для недоступных
    │   ├── wardrobe/WardrobeView.tsx # гардероб: наряды и аксессуары, «Надеть»/«Снять»/«Скоро»
    │   └── settings/SettingsView.tsx # переключатели, сбросы (через локальный UI-стейт), «О приложении»
    └── components/
        ├── RootScreen.tsx      # читает uiStore.screen → StartScreen | MainScreen; registerVisit() один раз; синхронизирует audioService
        ├── StartScreen.tsx     # пиксельная лягушка-«устройство» по центру: тап (без текста) → uiStore.start()
        ├── MainScreen.tsx      # каркас главного экрана: PetHalf + BottomHalf
        ├── BackButton.tsx      # пиксельная кнопка «← Назад» при bottomTab !== 'menu' → uiStore.backToMenu()
        ├── BottomHalf.tsx      # низ: тёмная панель для menu без скролла; для остальных — шапка (BackButton + название) + скролл; BottomNav всегда
        ├── BottomNav.tsx       # постоянная тёмная навигация: вкладки из bottomTabRegistry с inNav !== false, PixelIcon, активная плашка
        ├── hooks/
        │   └── useUiFeedback.ts # playSound(SoundId) / vibrate(type) с учётом settingsStore; единая точка отклика
        ├── ui/
        │   ├── PixelButton.tsx  # единая пиксельная кнопка: tone green/blue/cream/yellow, size md/sm, min-h 52/40px
        │   ├── PixelPanel.tsx   # пиксельная панель: tone card/screen/cream → .pixel-frame + фон
        │   └── PixelIcon.tsx    # пиксельная PNG-иконка: name: PixelIconName, alt="" aria-hidden, image-rendering: pixelated
        └── pet/
            ├── PetHalf.tsx         # верхняя половина: тёмная полоса с PetHud + LCD (.pixel-screen) с PetStage и сканлайнами
            ├── PetHud.tsx          # HUD устройства: плашки уровня (заливка по getLevelProgress), streak и coins
            ├── PetStage.tsx        # сцена: пол, тень, лягушка (блуждание/клик/drag), пиксельные сердца; rAF без ре-рендеров
            ├── petSprites.ts       # метаданные спрайт-листов + getFrogFrameStyle(): кадр 64×64, обрезка и масштаб ×4
            ├── FrogSprite.tsx      # один кадр лягушки (.sprite-frame.pixelated, зеркалирование по facing)
            ├── useFrogWalk.ts      # хук движения: блуждание к цели, walk/held/lifted/hop/falling/landing, перенос указателем, тап
            ├── PixelHeart.tsx      # пиксельное сердце 20×20 из маски 5×5 (цвета из токенов)
            ├── PetStats.tsx        # Health / Mood: полоски и числа; временно не рендерится (скрыт в UI)
            └── PetOutfitSlot.tsx   # слой нарядов: сейчас не рендерится (эмодзи-заглушки убраны; файл под пиксельные наряды)
```

Композиция UI: `App` → `TelegramProvider` → `RootScreen` → (`StartScreen` | `MainScreen`).
`MainScreen` = `PetHalf` (постоянный верх) + `BottomHalf` (низ по `uiStore.bottomTab`).
`PetHalf` = тёмная полоса с `PetHud` + LCD-экран: `PetStage` + сканлайны
(`PetStats` и слой нарядов `PetOutfitSlot` временно не рендерятся). Все переиспользуемые кнопки/панели/иконки — из `src/components/ui/`.

Папки `node_modules/` и `dist/` в дереве не перечислены: это артефакты установки и сборки.
Если файл из дерева отсутствует на диске — это расхождение; проверяй `glob`/`read`, а не доверяй
памяти (см. раздел 13).

---

## 5. Модель экранов и поток данных

### 5.1. Экраны

Экран один-единственный по смыслу — это два состояния `uiStore.screen`:

```text
start (StartScreen: пиксельная лягушка-«устройство» `w-[min(86vw,380px)]`, тап → start())
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

`MainScreen` — вертикальный flex на всю высоту: пиксельный «корпус тамагочи» с LCD-экраном сверху
и панелью вкладок снизу.

- **верх (`PetHalf`)** — постоянная зона `h-[58%] min-h-[240px] shrink-0`: сверху тёмная полоса
  устройства `bg-app-panel` с `PetHud` (три плашки `.pixel-plate`: уровень с заливкой по
  `getLevelProgress`, огонёк `streak`, монеты `coins`), под ней мятный LCD-экран (`.pixel-screen`)
  со сценой питомца и сканлайнами (слой надетых предметов `PetOutfitSlot` временно скрыт). Она не
  читает `uiStore.bottomTab` и не перемонтируется при смене вкладки — состояние питомца (и его
  анимации) не теряется. Полоски Health/Mood временно **не рендерятся** (`PetStats` сохранён в
  коде для следующей итерации);
- **низ (`BottomHalf`)** — `flex-1 min-h-0` + жёсткая верхняя граница `border-t-3 border-app-ink`:
  занимает остаток высоты. Для меню (`bottomTab === 'menu'`) — тёмная панель `bg-app-panel`
  без скролла; для остальных вкладок — шапка (`BackButton` + название) и `overflow-y-auto`
  с учётом safe-area. Внизу **всегда** рендерится `BottomNav` (тёмная полоса `bg-app-nav`).

```text
MainScreen
├── PetHalf                       ← не меняется при смене вкладки
│   ├── PetHud (тёмная полоса: уровень + streak + coins)
│   ├── PetStage (спрайт-лягушка, тап/клик/перетаскивание)
│   ├── (PetOutfitSlot — скрыт до появления пиксельных нарядов)
│   ├── .lcd-scanlines (декор поверх сцены)
│   └── PetStats временно скрыт
└── BottomHalf                    ← меняется при смене вкладки
    ├── шапка: BackButton + название вкладки (если bottomTab !== 'menu')
    ├── <Component из bottomTabRegistry по uiStore.bottomTab>
    │   ├── MenuView → openTab('lesson')  (тёмная панель без скролла)
    │   ├── LessonView                                             (overflow-y-auto)
    │   ├── ShopView                                               (overflow-y-auto)
    │   ├── WardrobeView                                           (overflow-y-auto)
    │   └── SettingsView                                           (overflow-y-auto)
    └── BottomNav (постоянно; вкладки из bottomTabRegistry, inNav !== false)
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
| Имя, статы (health/mood/satiety), выражение, одежда, XP, coins, food, streak, lastVisitDate | `petStore` | да (кроме `expression`) |
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
  registerVisit(): void;
  applyStatDelta(delta: Partial<PetStats>): void;
  setExpression(expression: PetExpression): void;
  equipItem(itemId: string): void;
  unequipItem(itemId: string): void;
  renamePet(name: string): void;
  resetPet(): void;
}
```

- Начальные значения — из `PET_CONFIG` (`src/data/petConfig.ts`): имя `«Таманг»`,
  `stats = { health: 100, mood: 100, satiety: 60 }`, `coins = 120`, `food = 2`, `streak = 1`.
- `persist` (ключ `PET_STORE_KEY`, **version 2**) хранит: `name`, `stats`, `equippedItemIds`,
  `totalXp`, `lastInteractionAt`, `coins`, `food`, `streak`, `lastVisitDate`.
  `expression` **не** персистится (при загрузке — `'idle'`).
- Миграция: `migratePersistedState(persisted)` терпимо читает старый снапшот v1 (в нём нет
  `satiety`/`coins`/`food`/`streak`/`lastVisitDate`) и добивает поля дефолтами через
  `normalizeStat`/`normalizeCount`; `DEFAULT_PERSISTED_STATE` — база для этих дефолтов.
- `registerVisit()` вызывает `RootScreen` **один раз** при старте. Считает локальную дату
  (`getLocalDateKey`, формат `YYYY-MM-DD`): если `lastVisitDate` уже сегодня — ничего не меняется;
  если это вчера — `streak + 1`; иначе `streak = 1`. В тот же день повторный вызов идемпотентен.
- `petClick()`: `mood +4`, `health +1` с ограничением `0..100`, `satiety` не меняется,
  `expression = 'happy'`, `lastInteractionAt = Date.now()`, через `~1200 мс`
  (значение в `PET_CONFIG.reactionTimeoutMs`) выражение возвращается в `'idle'`.
- `addXp(amount)` увеличивает `totalXp` (принимает только положительное конечное число);
  `applyStatDelta` меняет статы с clamp; `equipItem`/`unequipItem` — массив `equippedItemIds`
  (без дублей); `renamePet` обрезает пробелы, ограничивает имя 24 символами и игнорирует пустое;
  `resetPet` — к дефолтам из `PET_CONFIG` (включая `coins`, `food`, `streak`, `lastVisitDate`).
- Уровень питомца не хранится в сторе: он вычисляется из `totalXp` функциями
  `getPetLevel(totalXp)` (номер уровня) и `getLevelProgress(totalXp)` (`src/data/petConfig.ts`) по
  порогам `PET_CONFIG.levelThresholds` (уровень 1 при 0 XP, 2 при 50 XP, 3 при 120 XP и т.д.).
  `LevelProgress = { level, xpInLevel, xpForNextLevel: number | null, percent }`; на максимальном
  уровне `percent === 100`, а `xpForNextLevel === null` — именно `percent` рисует заливку в `PetHud`.
- Стор **сам не вызывает `audioService`**: звук — ответственность UI (клик, награда и т.п.).

### 6.2. `uiStore` — навигация

```ts
interface UiStoreState {
  screen: AppScreen;      // 'start' | 'main', старт: 'start'
  bottomTab: BottomTabId; // 'menu' | 'lesson' | 'shop' | 'wardrobe' | 'settings', старт: 'menu'
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
   пропадёт прогресс (`localStorage` хранит данные по этим ключам). Меняешь форму снапшота —
   поднимай `version` в `persist(...)` и добавляй `migrate` (образец — `petStore`, version 2).
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
export type BottomTabId = 'menu' | 'lesson' | 'shop' | 'wardrobe' | 'settings';
// станет
export type BottomTabId = 'menu' | 'lesson' | 'shop' | 'wardrobe' | 'settings' | 'garden';
```

Без этого шага TypeScript не даст создать запись в реестре и открыть вкладку.

### Шаг 2. Создать компонент модуля

Файл `src/features/garden/GardenView.tsx`. Компонент — обычный, без пропсов: он читает стор
самостоятельно и не знает о других фичах. Экспорт **именованный** (`export function`), так же
устроены все существующие вкладки и импорты в реестре.

```tsx
// src/features/garden/GardenView.tsx
import { PixelButton } from '@/components/ui/PixelButton';
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
        <h2 className="font-display text-xs uppercase tracking-wide text-app-text">Сад</h2>
        <p className="font-app text-[11px] text-app-hint">Опыт питомца: {totalXp}</p>
      </header>
      <PixelButton tone="green" className="w-full" onClick={handlePlant}>
        Посадить росток
      </PixelButton>
    </div>
  );
}
```

Правила: только токены (`text-app-text`, `bg-app-card`, ...), кнопки/панели — из
`@/components/ui` (`PixelButton`/`PixelPanel`/`PixelIcon`) или классы `.pixel-btn`/`.pixel-frame`, никаких
`alert/confirm`, никаких импортов из других `src/features/*`. Данные — через `@/store` и `@/data`;
отклик (звук/вибрация) — через `@/components/hooks/useUiFeedback`; haptic-подробности — через
`@/lib/telegram`.

### Шаг 3. Добавить запись в реестр

`src/modules/registry.tsx` (импорты — именованные, как у существующих вкладок):

```tsx
import { GardenView } from '@/features/garden/GardenView';

// ... внутри массива tabEntries, рядом с menu/shop/wardrobe/settings/lesson:
{
  id: 'garden',
  title: 'Сад',
  emoji: '🌱',
  order: 5, // больше, чем у существующих вкладок; реестр сортирует по order
  Component: GardenView,
  // inNav: false, // необязательно: скрыть вкладку из BottomNav (как у lesson)
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

### Шаг 4. Иконка в нижней навигации (только для вкладок в `BottomNav`)

Если вкладка должна быть видна в нижней полосе, добавь её иконку в `NAV_ICONS`
(`src/components/BottomNav.tsx`):

```tsx
const NAV_ICONS: Record<BottomTabId, PixelIconName> = {
  menu: 'lily',
  lesson: 'book',
  shop: 'chest',
  wardrobe: 'crown',
  settings: 'compass',
  garden: 'strawberry', // новая иконка из src/assets/icons/
};
```

`BottomNav` рендерит только вкладки с `tab.inNav !== false` и берёт подпись из `title` записи
реестра. Хочешь вкладку без кнопки в навигации (как «Урок») — поставь `inNav: false` в записи
реестра и пропусти этот шаг; на экран тогда попадают только через `uiStore.openTab('garden')`
(например, из `MenuView`). Список допустимых имён — `PixelIconName` в
`src/components/ui/PixelIcon.tsx`; новые иконки кладутся в `src/assets/icons/` (PNG 64×64,
прозрачный фон, `image-rendering: pixelated`).

Никаких правок в `MainScreen`, `PetHalf`, `BottomHalf` и `App.tsx` не требуется: `BottomHalf`
сам отрисует `GardenView` по `uiStore.bottomTab` и покажет кнопку «Назад» (она появляется для
любой вкладки, кроме `menu`).

### Чек-лист после добавления

- `run-pnpm.cmd typecheck` → 0 ошибок;
- `run-pnpm.cmd build` → успех;
- вкладка открывается, «Назад» работает, верхняя половина не мигает и не сбрасывается;
- вкладка есть в `BottomNav` (если нужна) и корректно подсвечивается как активная;
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
  defaultStats: PetStats;       // { health: 100, mood: 100, satiety: 60 }
  defaultCoins: number;         // 120
  defaultFood: number;          // 2
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

export interface LevelProgress {
  level: number;
  xpInLevel: number;
  xpForNextLevel: number | null; // null на максимальном уровне
  percent: number;               // 0..100 — заливка плашки уровня в PetHud
}
export function getLevelProgress(totalXp: number): LevelProgress;
```

Здесь меняются: имя по умолчанию, стартовые статы (включая `satiety`), стартовые `coins`/`food`,
эмодзи выражений, границы шкал (clamp), бонусы за клик, задержка возврата выражения в `idle`
и пороги уровней. Пороги уровней — только данные: `getPetLevel` и `getLevelProgress` читают
`PET_CONFIG.levelThresholds`, поэтому новый уровень добавляется одним числом. Менять `PET_CONFIG`
безопасно: стор читает его при инициализации и в `resetPet()`, а UI — при отрисовке.

### 9.2. Публичное API `petStore`

| Экшен | Что делает |
|---|---|
| `petClick()` | `mood + clickMoodGain`, `health + clickHealthGain` (clamp), `expression='happy'`, `lastInteractionAt=now`, возврат в `'idle'` через `reactionTimeoutMs` |
| `addXp(amount)` | увеличить `totalXp` |
| `applyStatDelta(delta: Partial<PetStats>)` | изменить статы на дельту с ограничением `minStat..maxStat` |
| `registerVisit()` | визит дня: `lastVisitDate` + `streak` (та же дата — без изменений, вчера — `+1`, иначе `1`); вызывается один раз из `RootScreen` |
| `setExpression(expression)` | принудительно задать выражение (например, `'sad'` на ошибке) |
| `equipItem(itemId)` / `unequipItem(itemId)` | надеть/снять предмет (id из `shopItems`) |
| `renamePet(name)` | переименовать питомца |
| `resetPet()` | сброс к `PET_CONFIG` |

Все экшены доступны и как `usePetStore.getState().action(...)` вне React (например, из
`lessonStore`). Из компонентов — только через селекторы.

### 9.3. Переодевание, спрайты и анимация питомца

- `PetOutfitSlot` (`src/components/pet/PetOutfitSlot.tsx`) — **временно скрыт из UI**: `PetHalf`
  его больше не импортирует и не рендерит, эмодзи-заглушки убраны (пиксельные наряды — следующая
  итерация). Файл сохранён как задел: слой поверх сцены (`pointer-events-none absolute inset-0`),
  эмодзи-бейджи надетых предметов из `usePetStore((s) => s.equippedItemIds)` (id → `shopItems`)
  в пяти фиксированных позициях, внутри — **пустой контейнер под будущие сложные анимации**
  (`data-slot="pet-animation-layer"` / `data-future="animations-outfit"`). Клики не перехватывает,
  на статы не влияет. Вернуть — после появления спрайтов одежды.
- Питомец — пиксельные спрайты из `src/assets/pet` (все кадры 64×64):
  - `petSprites.ts` — метаданные `FROG_SHEETS` (`idle` 2×2 = 4 кадра, `land` 2×1 = 2 кадра,
    `jump`/`fall`/`turn` по 1 кадру), `FROG_CROP` (x=18, y=24, 28×16; нижняя граница — лапы),
    `FROG_SCALE = 4` → элемент 112×64 px, `getFrogFrameStyle(sheet, frame, scale = FROG_SCALE)`
    режет кадр через `background-position`;
  - `FrogSprite` — один кадр (`.sprite-frame.pixelated`), зеркалится через `scaleX(-1)` по `facing`;
  - `useFrogWalk` — **блуждание к случайной цели**, а не пинг-понг по чек-линии: X цели — 8–92%
    ширины сцены (с поправкой на половину спрайта), базовая линия плавает от горизонта
    (`stageHeight - floorHeight`) до `stageHeight - 6`; скорости X 10–16 px/s, Y 7–12 px/s;
    пауза после прихода 1500–6500 мс (в 70% случаев 2–4 с); 70% целей — в средней трети области;
    новая цель не ближе 40 px по X и 16 px по Y (до 12 попыток); если цель сзади (`|dx| ≥ 8`) —
    разворот на месте с паузой `turn` 170 мс; покачивание корпуса ±2 px на каждые 16 px пути.
    hover-подскок (`jump`, не чаще 2.2 с). `pointerdown` из `walk` **или `hop`** → `held`
    (клик во время ховер-подскока не проглатывается как «падение»), отпускание без переноса —
    **всегда тап** (`onTap`, высота подъёма не важна). Режим `falling` → `landing` (300 мс)
    включается только после реального переноса с отрывом ≥6 px при включённых анимациях.
    rAF пишет `transform` напрямую в DOM — анимация не вызывает ре-рендеров React.
    При `animationsEnabled = false` лягушка стоит на idle-кадре, движение и частицы отключены,
    но тап и перенос работают;
  - `PetStage` — сцена: `.pixel-floor` высотой `max(64, 34% высоты сцены)` (`MIN_FLOOR_HEIGHT = 64`,
    `FLOOR_HEIGHT_RATIO = 0.34`), пиксельная тень-полоска, лягушка с `role="button"`
    (Enter/Space) и позиционированием по `baselineY` (низ элемента = линия лап), 2–4 пиксельных
    сердца на тап (`animate-pet-rise`, 1000 мс, задержка 70 мс), `animate-pixel-pop` на тап и
    `animate-hop-squash` на приземление. `death.png`/`hurt.png` лежат в assets, но пока не подключены.
- HUD питомца — `PetHud` (`src/components/pet/PetHud.tsx`): тёмная полоса `bg-app-panel` с тремя
  плашками `.pixel-plate`. Уровень (`getLevelProgress(totalXp).percent` → заливка
  `bg-app-level-fill` по треку `bg-app-level-track`, подпись `Ур. N`), огонёк `streak`
  (`PixelIcon name="fire"`) и монеты `coins` (`PixelIcon name="coin"`). HUD не читает `bottomTab`
  и не перемонтируется при смене вкладки.
- Надеть/снять можно только то, что есть у игрока: в магазине предметы с `ownedByDefault: true`
  доступны сразу, остальные показывают «скоро». Покупка не реализована: `coins` и `food` пока
  только отображаются в HUD и на главном экране.
- Чтобы добавить предмет: добавь запись в `shopItems` (`ShopItem`: `id`, `title`, `description`,
  `emoji`, `price`, `category`, `ownedByDefault?`) и, если нужен внешний вид, отрисовку по `id`
  в `PetOutfitSlot`, когда слой вернут в `PetHalf` (сейчас скрыт, см. §14). Стор менять не нужно —
  он хранит только `equippedItemIds`.
- Чтобы добавить новый спрайт-лист/состояние: положи PNG с кадрами 64×64 в `src/assets/pet`,
  добавь импорт и запись в `FROG_SHEETS` (`frameWidth`, `frameHeight`, `columns`, `rows`,
  `frameCount`), при необходимости поправь `FROG_CROP`; новое состояние подключай через
  `useFrogWalk`/`FrogSprite`. Учитывай `settingsStore.animationsEnabled`. Новые файлы в
  `src/assets/**` и правки `src/index.css` — зона Lead, согласуй.

### 9.4. Новая стата питомца

Это **изменение контракта**: `PetStats` живёт в `src/types/index.ts` (правит Lead), плюс нужна
новая дельта в `PET_CONFIG.defaultStats` и обработка в `petStore`/UI. Образец уже сделанного —
`satiety` (шкала «Сытость» на главном экране). Порядок:

1. согласовать с Lead поле (например, `energy: number`), Lead правит `PetStats`;
2. `PET_CONFIG.defaultStats` — стартовое значение; `applyStatDelta` уже работает с
   `Partial<PetStats>`, clamp берётся из `PET_CONFIG`;
3. `PetStats`-компонент — новая полоска/число;
4. старые сохранения: подними `version` в `persist(...)` `petStore` и дополни
   `migratePersistedState` нормализацией нового поля (`normalizeStat`), как это сделано для
   `satiety`/`coins`/`food` при переходе на version 2. Пользователь не должен увидеть `undefined`.
   Дефолты для таких полей держи в `DEFAULT_PERSISTED_STATE`, а не в компонентах.

Не добавляй новые статы «локально в компоненте»: они должны жить в `petStore`, иначе не
сохранятся и не будут доступны другим модулям.

---

## 10. Стилизация: пиксельная ретро-система

Цепочка слоёв прежняя, но к ней добавился визуальный канон:

```text
CSS-переменные Telegram (--tg-theme-*)
        ↓ значения по умолчанию
семантические токены --app-* в src/index.css (:root и html.dark)
        ↓ замаплены в tailwind.config.js
Tailwind-классы: bg-app-card, text-app-ink, font-display, shadow-pixel, ...
        ↓ плюс CSS-утилиты из @layer utilities
pixel-frame, pixel-screen, pixel-btn, pixel-chip, lcd-scanlines, retro-room-bg, ...
```

Визуальный канон — **Duolingo-«чанки» × тамагочи-пиксель**:

- жёсткие контуры `3px solid var(--app-ink)` (2px у компактных элементов), радиусы только
  `--app-radius` (10px) / `--app-radius-sm` (6px);
- тени только жёсткие, без размытия: `4px 4px 0 ink` (крупные) / `2px 2px 0 ink` (компактные);
  у кнопок — «подъём» `0 4px 0`, при нажатии кнопка физически вдавливается (`translateY(4px)`,
  тень исчезает);
- никаких градиентов на кнопках, размытых теней (`blur-*`, `shadow-md/lg`), скруглений 20px+,
  glassmorphism и «мягких» карточек;
- шрифты: `font-display` (Jambilee, **только латиница**) — короткие заголовки, числа, лейблы, XP;
  `font-app` (Pixelify Sans) — тело текста, кириллица и длинные кнопки;
- иконки — только PNG через `PixelIcon` (`src/assets/icons/`), эмодзи и иконочные пакеты в UI
  не используются;
- весь интерфейсный текст — по-русски (английский остаётся только в демо-словах уроков).

### 10.1. Шрифты (self-hosted)

`@font-face` объявлены в `src/index.css`, файлы — в `src/assets/fonts/*.woff2` (Vite кладёт их
в сборку с хэшем):

| Семейство | Tailwind-класс | Где использовать | Файлы |
|---|---|---|---|
| `Jambilee` | `font-display` | короткие заголовки, лейблы, числа, «Ур. N», счётчики — только латиница, цифры и базовая пунктуация | `jambilee.woff2` |
| `Pixelify Sans` | `font-app` (и `body`) | тело, описания, длинные кнопки, подписи, **вся кириллица** | `pixelify-sans-{cyrillic,latin}.woff2` |

Стеки в `tailwind.config.js`: `font-display = 'Jambilee', 'Pixelify Sans'`, `font-app` (и
`font-family` у `body`) = `'Pixelify Sans', 'Jambilee'`.

Правила типографики:

- **никаких внешних шрифтовых CDN** (Google Fonts и т.п.) — только локальные `.woff2`; иначе
  Telegram WebView без сети останется без пиксельного шрифта, а сборка получит лишнюю зависимость;
- **в Jambilee нет кириллицы** — русский текст в `font-display` автоматически падает на
  `Pixelify Sans` из стека. Поэтому не полагайся на Jambilee для русских заголовков: ширина и
  рисунок букв будут другими. Русские заголовки либо набирай `font-app`, либо сознательно
  оставляй фолбэк;
- Jambilee рассчитан на короткие строки: подписи и лейблы 9–11px (`text-[10px]`, `font-display`),
  числа HUD 12–13px, крупный CTA — до 20px. Для многострочного текста — `leading-relaxed`,
  длинные русские фразы в `font-display` не набирай;
- `font-display` не применяй к абзацам — только к коротким акцентам и числам.

### 10.2. Токены `--app-*` (`:root` / `html.dark`)

| Токен | Назначение | Light | Dark |
|---|---|---|---|
| `--app-bg` | фон приложения | `#fff8e7` | `#171b21` |
| `--app-card` | карточки/панели | `#ffffff` | `#212830` |
| `--app-text` | основной текст | `#18181b` | `#f4f4f5` |
| `--app-hint` | вторичный текст | `#6f6a5c` | `#9aa3ad` |
| `--app-border` | обычные границы | `#18181b` | `#4a5563` |
| `--app-ink` | «чернила»: жёсткие рамки, тени, текст на LCD | `#18181b` | `#0b0e12` |
| `--app-ink-soft` | смягчённый ink | `#3f3f46` | `#a8b3bf` |
| `--app-accent` | зелёный CTA (Duolingo) | `#58cc02` | `#58cc02` |
| `--app-accent-soft` | подложка под акцент | `#e7f8d4` | `#14300a` |
| `--app-accent-contrast` | текст на зелёном | `#0c2a00` | `#efffdf` |
| `--app-blue` | синий CTA | `#1cb0f6` | `#1cb0f6` |
| `--app-blue-soft` | подложка под синий | `#d7f0fe` | `#0d2b3c` |
| `--app-blue-contrast` | текст на синем | `#04283b` | `#e6f7ff` |
| `--app-yellow` | жёлтый CTA/XP | `#ffc800` | `#ffc800` |
| `--app-purple` / `--app-orange` | акценты (магазин/бейджи) | `#ce82ff` / `#ff9600` | те же |
| `--app-success` / `--app-danger` | успех / ошибка | `#58cc02` / `#ff4b4b` | те же |
| `--app-panel` | тёмная панель «устройства» (HUD, меню) | `#1d4241` | тот же |
| `--app-panel-deep` | глубина и рамка плашек на панели | `#12312c` | тот же |
| `--app-panel-text` | основной текст на тёмной панели | `#e9f6e3` | тот же |
| `--app-panel-muted` | вторичный текст на панели | `#b9d6c4` | тот же |
| `--app-nav` | фон нижней навигации `BottomNav` | `#27421d` | тот же |
| `--app-nav-active` | заливка активной вкладки | `#a8e06f` | тот же |
| `--app-nav-active-text` | текст/иконка активной вкладки | `#16340f` | тот же |
| `--app-nav-text` | текст неактивных вкладок | `#cfdcc4` | тот же |
| `--app-level-track` / `--app-level-fill` | трек и заливка уровня в `PetHud` | `#1f3f40` / `#82e973` | те же |
| `--app-food-plate` | плашка еды на главном экране | `#182827` | тот же |
| `--app-satiety-track` / `--app-satiety-fill` | шкала «Сытость» на главном | `#ccebd7` / `#6f9677` | те же |
| `--app-screen` | мятный LCD-экран | `#e8f5e9` | `#e8f5e9` |
| `--app-screen-deep` | глубина LCD (inset) | `#cfe9d3` | `#cfe9d3` |
| `--app-floor` / `--app-floor-line` | пол сцены и линии решётки | `#bfe0c4` / `#8ecb9a` | те же |
| `--app-room-glow` | свечение «комнаты» старт-экрана | `#e8f5e9` | `#22392b` |
| `--app-grid-line` | линии сетки комнаты/фоновых секций | `rgba(24, 24, 27, 0.045)` | `rgba(244, 244, 245, 0.06)` |
| `--app-shadow` | алиас жёсткой тени | `4px 4px 0 0 var(--app-ink)` | тот же |
| `--app-pixel-shadow` / `-sm` / `-lg` | жёсткие тени 4px / 2px / 6px | `0 0 blur`, только смещение | те же |
| `--app-radius` / `--app-radius-sm` | радиусы кнопок/чипов | `10px` / `6px` | те же |
| `--app-safe-top` / `--app-safe-bottom` | safe-area (через `env()`) | — | — |

**Важно про тёмную тему.** LCD-экран остаётся мятным и светлым в обеих темах, а `--app-ink` в
тёмной теме — почти чёрный (`#0b0e12`). Токены `--app-panel*`, `--app-nav*`, `--app-level-*`,
`--app-food-plate` и `--app-satiety-*` — **фиксированно тёмные/светлые в обеих темах** (это
«корпус устройства», а не поверхность темы), значения в `:root` и `html.dark` совпадают. Поэтому:

- текст/иконки **внутри** сцены и на мятных подложках — `text-app-ink`;
- текст на тёмной панели — `text-app-panel-text` / `text-app-panel-muted`, на навигации —
  `text-app-nav-text` / `text-app-nav-active-text`;
- текст/иконки на карточках (`bg-app-card`, `bg-app-accent-soft` и т.п.) — `text-app-text`,
  а не `text-app-ink`: в тёмной теме чёрный текст на тёмной карточке не читается;
- жёсткие тени/рамки в тёмной теме остаются тёмными — это дизайн-решение (пиксельный «ink»),
  не баг.

### 10.3. Пиксельные утилиты и правила

Все утилиты объявлены в `src/index.css` в `@layer utilities`; в компонентах только их имена.

| Утилита | Что даёт | Где уместна |
|---|---|---|
| `.pixel-frame` | рамка 3px `--app-ink`, radius 0, тень `4px 4px 0` | карточки, панели, крупные блоки |
| `.pixel-frame-sm` | рамка 2px + тень `2px 2px 0`, radius 0 | компактные вложенные карточки, списки |
| `.pixel-screen` | мятный LCD + inset 3px `--app-screen-deep` + внешняя тень 4px | экран питомца, «игровые» экраны |
| `.pixel-screen-inner` | мятный фон + inset без внешней тени | внутренние области LCD |
| `.pixel-floor` | «пол» из решётки `floor/floor-line` + верхняя ink-линия | низ сцены питомца |
| `.pixel-checker` | шахматка 16px | фон-паттерн |
| `.pixel-grid-bg` | сетка 16px из `--app-grid-line` | фоновые секции |
| `.retro-room-bg` | «комната»: фон + радиальное свечение `--app-room-glow` + сетка `--app-grid-line`; в тёмной теме — тёмно-зелёное свечение и видимая сетка, а не серый ореол | стартовый экран |
| `.lcd-scanlines` | горизонтальные сканлайны LCD | поверх сцены (`pointer-events-none`) |
| `.pixel-btn` | рамка 3px, radius 10px, тень `0 4px 0`, `:active` вдавливает | крупные CTA |
| `.pixel-btn-sm` | рамка 2px, radius 6px, тень `0 3px 0`, `:active` | кнопки в шапках, списках, строках |
| `.pixel-chip` | рамка 2px + тень 2px, radius 6px | XP, «Надето», «скоро», бейджи |
| `.pixel-plate` | рамка 2px `--app-panel-deep`, radius 6px, жёсткая тень `2px 2px 0` | плашки HUD (уровень/streak/coins), плашка еды на главном |
| `.sprite-frame` / `.pixelated` | `image-rendering: pixelated` | спрайты и пиксель-арт PNG |
| `.animate-pixel-bob` | покачивание 3.2s | старт-лягушка |
| `.animate-pixel-pop` | `steps(3)` pop 260ms | нажатия/появление элементов |
| `.animate-pet-rise` | появление питомца 900ms | сцена |
| `.animate-hop-squash` | прыжок со сквошем 260ms | прыжок питомца |

Анимации отключаются при `prefers-reduced-motion: reduce` (CSS) и настройкой
`settingsStore.animationsEnabled` (conditional-классы в компонентах). Старые утилиты
`start-gradient`, `egg-body/egg-spot/egg-shine`, `pet-emoji-shadow` из каркаса **удалены** —
старт теперь на PNG-лягушке и `.retro-room-bg`, питомец — на спрайтах.

Маппинг Tailwind (`tailwind.config.js`) — единственный источник классов для цветов/теней:

| Токен → Tailwind | Примеры |
|---|---|
| `app.bg` / `app.card` | `bg-app-bg`, `bg-app-card` |
| `app.text` / `app.hint` | `text-app-text`, `text-app-hint` |
| `app.border` / `app.ink` / `app.ink-soft` | `border-app-border`, `border-app-ink`, `bg-app-ink-soft` |
| `app.accent` / `app.accent-soft` / `app.accent-contrast` | `bg-app-accent`, `text-app-accent-contrast` |
| `app.success` / `app.danger` | `text-app-danger`, `bg-app-danger` |
| `app.screen` / `app.screen-deep` / `app.floor` / `app.floor-line` | `bg-app-screen`, `border-app-screen-deep` |
| `app.blue` / `app.blue-soft` / `app.blue-contrast` | `bg-app-blue`, `text-app-blue-contrast` |
| `app.yellow` / `app.purple` / `app.orange` | `bg-app-yellow`, `text-app-purple` |
| `app.panel` / `app.panel-deep` / `app.panel-text` / `app.panel-muted` | `bg-app-panel`, `border-app-panel-deep`, `text-app-panel-text` |
| `app.nav` / `app.nav-active` / `app.nav-active-text` / `app.nav-text` | `bg-app-nav`, `bg-app-nav-active`, `text-app-nav-text` |
| `app.level-track` / `app.level-fill` / `app.food-plate` | `bg-app-level-track`, `bg-app-level-fill`, `bg-app-food-plate` |
| `app.satiety-track` / `app.satiety-fill` | `bg-app-satiety-track`, `bg-app-satiety-fill` |
| `borderRadius.app` / `app-sm` | `rounded-app`, `rounded-app-sm` |
| `boxShadow.app` / `pixel` / `pixel-sm` / `pixel-lg` | `shadow-app`, `shadow-pixel`, `shadow-pixel-sm` |
| `fontFamily.app` / `display` | `font-app`, `font-display` |
| `borderWidth.3` / `5` | `border-3`, `border-5` |

Правила (обязательны):

1. **Не хардкодить цвета/радиусы/тени/шрифты** в `tsx`: только токены, Tailwind-классы и
   пиксельные утилиты. Хардкод допустим только внутри `src/index.css`, где объявлены токены.
2. `src/index.css` и `tailwind.config.js` — зона Lead: новые токены/утилиты/шрифты добавляются
   только по согласованию. Фича не правит эти файлы «под себя».
3. Не добавляй `blur-*`, `shadow-md/lg/xl`, `rounded-xl/2xl/3xl`, градиенты на кнопках и
   полупрозрачные «стеклянные» панели — это ломает пиксельный канон.
4. Не подключай внешние шрифты/CDN и не создавай новые `@font-face` — используй `font-app`/
   `font-display`.
5. Тема: проверяй обе схемы. На мятном LCD — `text-app-ink`, на карточках — `text-app-text`
   (см. предупреждение в 10.2).
6. Safe-area: `var(--app-safe-top)` / `var(--app-safe-bottom)`
   (`pb-[calc(1rem+var(--app-safe-bottom))]`), не зашивай отступы под конкретный телефон.
7. Тап-таргеты — не меньше 44px (`min-h-[44px]`), важные кнопки — 52px+ (`min-h-[52px]`).
8. Проверяй 320–390px: без горизонтального скролла. Вкладки могут скроллиться осознанно
   (`overflow-y-auto` в `BottomHalf`), меню — **нет** (тёмная панель `bg-app-panel` без скролла):
   шкала сытости, плашка еды и CTA «На болото» обязаны влезать целиком вместе с `BottomNav`.
9. Иконки — только `<PixelIcon name="..." />` из `@/components/ui` (PNG 64×64, `alt=""`,
   `image-rendering: pixelated`). Эмодзи в UI не использовать; новые иконки — файл в
   `src/assets/icons/` + имя в `PixelIconName` (зона Lead).

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
components/ui (PixelButton, PixelPanel, PixelIcon) ← types / React; чистая презентационная база
  ↑
components/hooks (useUiFeedback)        ← store + lib/telegram + lib/audio
  ↑
features (src/features)                 ← types + store + data + lib + components/hooks + components/ui
  ↑
modules/registry                        ← features + types
  ↑
components (src/components)             ← types + store + lib + modules + hooks + ui
  ↑
App.tsx                                 ← components + lib/telegram; только собирает
```

Фактические исключения, которые считаются нормой: фичи импортируют общий хук
`@/components/hooks/useUiFeedback` (звук/вибрация с учётом настроек), мок-данные `@/data/*` и
презентационные `@/components/ui/*` (например, `PixelButton`); `BottomHalf` импортирует реестр.
Разрешённые направления — снизу вверх (стрелка «используется»). Запрещено:

- `src/features/a` импортирует `src/features/b` — фичи изолированы; общение через стор/типы;
- фича импортирует «содержательные» компоненты `src/components/*` (кроме `components/hooks/useUiFeedback`
  и `components/ui/*`);
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
6. `src/index.css`, `tailwind.config.js`, `index.html`, `src/assets/**` — зона Lead; стилизую
   только через готовые токены, `PixelButton`/`PixelPanel`/`PixelIcon` и `.pixel-*`-утилиты.
7. Весь новый UI-текст — на русском; тап-таргеты ≥44px; проверяю light/dark и ширину 320–390px.
8. Использую селекторы стора, экшены для изменений, токены для стилей, `@/` для импортов.
9. После изменений: `run-pnpm.cmd typecheck` → 0, `run-pnpm.cmd build` → успех.
10. Если добавлен новый файл/API/токен/вкладка — обновил этот README (дерево, API, рецепты).

### 13.4. Рецепты типовых задач

- **Новая вкладка** — раздел 7 (4 шага: union `BottomTabId` → `src/features/<name>/<Name>View.tsx`
  с именованным экспортом → запись в `bottomTabRegistry` с `order` и (по желанию) `inNav: false`
  → иконка в `NAV_ICONS` в `BottomNav` для навигационной вкладки). Верхняя половина не меняется.
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
- **Пиксельная кнопка/панель** — используй готовую базу: `PixelButton`
  (`@/components/ui/PixelButton`; `tone`: `green`/`blue`/`cream`/`yellow`, `size`: `md`/`sm`) и
  `PixelPanel` (`card`/`screen`/`cream`). Произвольный блок — класс `.pixel-frame` или
  `.pixel-frame-sm` + `bg-app-card`. Не собирай рамку и тень вручную: `.pixel-btn`/`.pixel-btn-sm`
  уже дают физическое нажатие. Тап-таргет — не меньше `min-h-[44px]`.
- **Пиксельная иконка** — `<PixelIcon name="coin" className="h-6 w-6" />` из
  `@/components/ui/PixelIcon`. Имя — из `PixelIconName` (`lily`, `chest`, `crown`, `compass`,
  `heart`, `coin`, `fire`, `strawberry`, `book`), PNG лежит в `src/assets/icons/`. Эмодзи в UI
  не использовать (исключение — `emoji` в данных `shopItems`/реестра вкладок).
- **Заголовок, число, XP** — `font-display` (Jambilee) + размер 9–13px, для CTA до 20px;
  помни, что **кириллицы в Jambilee нет** — русский текст в `font-display` падает на
  `Pixelify Sans` из стека. Тело и длинные кнопки — `font-app`. Не подключай сторонние шрифты.
- **Новый спрайт/анимация питомца** — PNG-кадры в `src/assets/pet/` (кадр 64×64, спрайт-листы
  горизонтальные), рендер через `sprite-frame`/`pixelated`; пороги и поведение — в `PetStage`
  (см. 9.3). Не забудь `settingsStore.animationsEnabled`.
- **Смена темы/цвета/шрифта** — только Lead: токены в `src/index.css` (`:root` и `html.dark`),
  маппинг в `tailwind.config.js`. Фича не правит эти файлы; компоненты не трогай, если они
  используют токены/утилиты.
- **Новый предмет магазина** — запись в `src/data/shopItems.ts`; чтобы он был доступен сразу,
  поставь `ownedByDefault: true` (иначе кнопка «скоро»); отрисовка на питомце — после возврата
  `PetOutfitSlot` (сейчас слой нарядов скрыт, см. §14).

### 13.5. Жёсткие запреты

| Запрещено | Почему |
|---|---|
| Новые npm-пакеты без согласования Lead | каркас зафиксирован, лишние зависимости ломают сборку/вес |
| `alert()` / `confirm()` / `prompt()` | в Telegram они заблокированы; только UI-состояния |
| Правка `src/types/index.ts` без Lead | это замороженный контракт |
| Хардкод цветов/радиусов/теней в `tsx` | ломает тему Telegram и dark mode; только `--app-*`/Tailwind-токены |
| Эмодзи в UI вместо `<PixelIcon>` | канон — свои PNG-иконки; эмодзи выглядят по-разному на платформах |
| Внешние шрифты/CDN (Google Fonts и т.п.) | лишняя сетевая зависимость и офлайн-провал в Telegram WebView; шрифты только self-hosted |
| `blur-*`, `shadow-md/lg/xl`, `rounded-xl+`, градиенты на кнопках | ломает пиксельный канон: только жёсткие тени и рамки `.pixel-*` |
| Правка `src/index.css` / `tailwind.config.js` без Lead | это фундамент стилей; фича не добавляет свои токены/утилиты |
| Ручная сборка рамки+тени вместо `.pixel-btn`/`.pixel-frame` | разъезжается геометрия и press-анимация |
| Английский текст в UI (кроме демо-слов уроков) | интерфейс русскоязычный, это требование ТЗ |
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

- [ ] старт: пиксельная лягушка-«устройство» по центру, текста нет; тап по ней → главный экран;
- [ ] верх: LCD-экран с лягушкой-питомцем, тап по питомцу даёт реакцию (спрайт/выражение, звук,
      haptic); питомец блуждает по полу, а не ходит пинг-понгом между краями;
      переключение вкладок не сбрасывает питомца. Полоски Health/Mood временно скрыты
      (`PetStats` сохранён в коде);
- [ ] HUD (`PetHud`): тёмная полоса над LCD, три плашки — уровень с заливкой по
      `getLevelProgress`, огонёк `streak`, монеты `coins`; цифры совпадают с `petStore`;
- [ ] меню: тёмная панель без скролла — сердце и подпись «Сытость» со шкалой `satiety`, плашка еды
      с `PixelIcon strawberry` и `x{food}`, CTA «На болото» с `PixelIcon book` → вкладка «Урок»;
- [ ] нижняя навигация (`BottomNav`): постоянная тёмно-зелёная полоса, вкладки из
      `bottomTabRegistry` с `inNav !== false` (Главная/Магазин/Гардероб/Настройки; «Урок» скрыт),
      активная — светло-зелёный квадрат, иконки PixelIcon, подписи `font-display` 10px;
- [ ] вкладки: урок/магазин/гардероб/настройки прокручиваются осознанно (внутренний
      `overflow-y-auto`), сверху «← Назад» и название вкладки; тап-таргеты ≥44px;
- [ ] урок: вкладка открывается списком уроков (сессия не активна); выбор урока; сборка ответа,
      «Проверить», верный/неверный путь, «Дальше», повторный клик по слову игнорируется, пустой
      ответ не проверяется; после последнего урока — экран «Все уроки пройдены!»; кнопки
      «Прослушать»/«Голосом» — `disabled` с бейджем «скоро»;
- [ ] магазин: надеть/снять обновляет питомца; недоступные товары — «скоро»;
- [ ] гардероб: только наряды и аксессуары (еда отфильтрована); надетое — «Снять», полученное —
      «Надеть», недоступное — «Скоро»; действия идут через `equipItem`/`unequipItem`;
- [ ] настройки: пиксельные переключатели влияют на поведение, сбросы работают через inline-UI;
- [ ] стиль: `font-display` только на коротких заголовках/числах (Jambilee, латиница), `font-app`
      на теле и кириллице; жёсткие 2–3px рамки и 4px тени без размытия; кнопки «вдавливаются»
      при нажатии; нет `blur-*`/градиентов; иконки — только `PixelIcon`, эмодзи в UI нет;
- [ ] обе темы: текст читаем — на мятном LCD используется `text-app-ink`, на тёмных панелях
      `text-app-panel-text`/`text-app-nav-text`, на карточках `text-app-text`; нет чёрного текста
      на тёмных поверхностях;
- [ ] прогресс уроков, статы, `coins`/`food`/`streak` переживают перезагрузку страницы
      (persist `petStore` version 2, ключи из раздела 6); в первый визит дня `streak` растёт на 1,
      повторный запуск в тот же день — нет;
- [ ] вне Telegram (обычный браузер): работает, тема светлая/тёмная по системе, ошибок в консоли нет;
- [ ] ширина 320–390px и высокий экран: нет горизонтального скролла, меню не скроллится, нижняя
      навигация с четырьмя вкладками влезает по ширине и не перекрывается safe-area; HUD-плашки
      уровня/streak/coins не обрезаются;
- [ ] деплой: push в `main` → workflow «Deploy to GitHub Pages» зелёный → живой URL обновился
      (см. раздел 2.5).

### 13.7. Что делать при конфликте требований

Если задача требует изменить контракт (публичный API, типы, persist-ключи, структуру реестра) —
остановись, опиши проблему и согласуй с Lead. Изменение контракта без согласования — блокер
приёмки, даже если код собирается.

### 13.8. Журнал решений

Короткая хроника архитектурных и визуальных решений (новые записи — сверху):

- **14.11.2026 — вторая итерация пиксельного редизайна.** Шрифт `Jambilee` (латиница/цифры) +
  `Pixelify Sans` (кириллица) вместо `Press Start 2P`; HUD и нижняя панель переведены на тёмные
  токены `--app-panel*`/`--app-nav*`; добавлена вкладка «Гардероб» (`WardrobeView`); блуждание
  пета вместо пинг-понга (`useFrogWalk`); `petStore` persist version 2 с миграцией
  (`satiety`, `coins`, `food`, `streak`, `lastVisitDate`).

---

## 14. Известные ограничения каркаса и план развития

### Ограничения (осознанные)

- **Нет бэкенда и авторизации.** Все данные — мок (`src/data/*`), прогресс — `localStorage`
  на устройстве. Данные Telegram-пользователя доступны через `useTelegram()`, но не используются
  для сохранения на сервере.
- **Магазин без экономики.** `coins` и `food` уже есть в `petStore` и HUD, но покупок и списаний
  нет: товары либо `ownedByDefault`, либо «скоро». `ShopItem.price` — только витрина.
- **Переодевание пока не отображается.** Слой нарядов `PetOutfitSlot` временно скрыт — эмодзи-заглушки
  убраны, пиксельные наряды в следующей итерации. Файл компонента и `equippedItemIds` сохранены.
- **Анимация питомца спрайтовая, но не скелетная.** Блуждание к цели, подскок, разворот, перенос и
  приземление работают на спрайт-листах; отдельного walk-листа нет — при движении крутятся кадры
  `idle`, статичны фон-пол и «комната» питомца.
- **Jambilee без кириллицы.** `font-display` для русских заголовков падает на `Pixelify Sans`
  (фолбэк в стеке `tailwind.config.js`); кириллического начертания Jambilee нет.
- **Health/Mood временно скрыты**: компонент `PetStats` сохранён, но не рендерится в `PetHalf`.
- **Аудио и голос — no-op** (`audioService.isSupported = false`, `voiceInputService.isSupported = false`).
- **Нет i18n**: интерфейс и комментарии на русском, уроки — английский как демо-язык.
- **Нет тестов и роутинга**: навигация — `uiStore`, URL не меняется, тестового раннера нет.

### Ближайшие шаги развития

1. **Бэкенд + Telegram-авторизация**: проверка `initData` на сервере, синхронизация статов и
   прогресса между устройствами (сторы остаются прежними, меняется слой persist/адаптер).
2. **Экономика магазина**: покупка предметов за `coins`, кормление за `food`, списание и
   пополнение через экшены `petStore`; UI уже готов к `owned`.
3. **Развитие питомца**: скелетные/покадровые анимации (walk-лист, реакции на кормление и сон),
   комната, скины; вернуть слой нарядов на пиксельных спрайтах одежды вместо эмодзи-заглушек.
4. **TTS/STT**: реализация `AudioService`/`VoiceInputService` по зафиксированным интерфейсам,
   включение кнопок «прослушать»/«голосом» и режима `LessonMode = 'voice'`.
5. **Контент уроков**: больше уроков и языковых пар, прогресс по уровням/повторениям (SRS).
6. **i18n** интерфейса (ru/en) и тестирование (unit для сторов, e2e для базовых сценариев).

---

## Журнал QA

Приёмочные проверки каркаса (типы, сборка, требования ТЗ, качество, соответствие README)
ведутся в отдельном отчёте: [`docs/QA-REPORT.md`](docs/QA-REPORT.md).

> **Актуально (12.11.2026, после ретро-редизайна):** повторная проверка — **PASS с оговорками**:
> 0 блокеров, 0 major, 4 minor, 2 nit. Новый вердикт и подробности — в начале
> [`docs/QA-REPORT.md`](docs/QA-REPORT.md).

Предыдущая проверка каркаса (12.11.2026, до редизайна):

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
Деплой:    push в main → .github/workflows/deploy.yml → https://zaharrr4ik.github.io/tamang/
Сторы:     petStore 'tamang.pet' | uiStore (без persist) |
           lessonStore 'tamang.lesson-progress' | settingsStore 'tamang.settings'
Верх/низ:  PetHalf (тёмная полоса PetHud + LCD с PetStage, постоянно; слой нарядов скрыт) +
           BottomHalf (реестр по uiStore.bottomTab + постоянный BottomNav)
Стиль:     .pixel-btn/.pixel-frame/.pixel-chip/.pixel-plate; font-display = Jambilee (латиница),
           font-app = Pixelify Sans (кириллица); иконки — PixelIcon
Новый модуль: types (union, Lead) → src/features/<name>/<Name>View.tsx →
           src/modules/registry.tsx (order, inNav) → иконка в NAV_ICONS (BottomNav)
Нельзя:    новые пакеты, alert/confirm, правка types/index.css/assets без Lead, хардкод цветов,
           blur-тени и градиенты у кнопок, внешние шрифты/CDN, импорт фич друг в друга, any
Готово:    typecheck=0, build=0 (Lead), ручной чек-лист раздела 13.6
```
