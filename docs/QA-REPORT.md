# Отчёт QA

- **Проект:** `C:\Users\kotaz\Downloads\tamang\tamang-app` (Telegram Mini App «Tamang» — тамагочи для изучения языков).
- **Ревьюер:** независимый QA (агент `qa-agent`), код писали State- и UI-агенты.
- **Дата первичного ревью:** 12.11.2026; **повторная проверка после исправлений:** 12.11.2026 — см. §8.
- **Объём проверки:** 35 файлов `src/**`, конфиги (`package.json`, `tsconfig.json`, `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`, `index.html`, `pnpm-workspace.yaml`), `docs/CONTRACT.md`, `docs/ARCHITECTURE.md`, `README.md`, `prom1.txt`, артефакты `dist/`.
- **Что изменено QA:** только этот файл (`docs/QA-REPORT.md`). Код QA не правил: изменения в `src/`, `README.md` и `docs/` внесены разработчиками по замечаниям §4 и проверены повторно (§8). Новые npm-пакеты не устанавливались, тест-фреймворки в проект не добавлялись.

---

## 1. Итоговый вердикт

**PASS (приёмочный).**

- Блокеров — **0**. Мейджеров — **0**.
- Первично найдено: **minor — 6**, **nit — 6** (таблица в §4). После фиксов: 6 minor и nit #7 исправлены; nit #8–#12 приняты осознанно и не требуют правок.
- Требования ТЗ `prom1.txt` выполнены, контракт `docs/CONTRACT.md` соблюдён: сигнатуры сторов, persist-ключи, дерево §7, данные уроков/магазина, Telegram-слой и правила UI совпадают с фактическим кодом.
- `typecheck` — код 0, `build` — код 0 в обоих прогонах (до и после фиксов), `dist/` создан и содержит рабочие относительные ссылки на ассеты.
- Вне браузера реально прогнаны: **169 → 170** проверок логики сторов и **80 → 83** проверки SSR-рендера UI (все без провалов; рост числа — добавленные проверки фиксов).

Оговорка: замечаний, требующих правок до выдачи, не осталось — все minor закрыты, оставшиеся nit осознанно приняты (§8). Ограничение метода: в проекте нет git-репозитория (ни в `tamang-app`, ни в родительской папке), поэтому историю правок и требование «`src/types/index.ts` меняет только Lead» проверить по VCS невозможно — проверялась только согласованность фактического содержимого с контрактом.

---

## 2. Выполненные команды и результаты

Node/pnpm не в PATH — всё через обёртку `C:\Users\kotaz\Downloads\tamang\run-pnpm.cmd` (она печатает команду в stderr; строки `cmd : ... NativeCommandError` — это шум PowerShell/обёртки, а не ошибки инструментов).

### 2.1. Typecheck

```text
> cmd /c C:\Users\kotaz\Downloads\tamang\run-pnpm.cmd typecheck
$ tsc --noEmit            ← печатает обёртка (stderr)
EXIT=0
```

Повторный прогон после фиксов — `TYPECHECK_EXIT=0` (см. §8).

### 2.2. Production-сборка

```text
> cmd /c C:\Users\kotaz\Downloads\tamang\run-pnpm.cmd build
$ tsc --noEmit && vite build      ← печатает обёртка (stderr)
vite v5.4.11 building for production...
✓ 73 modules transformed.
dist/index.html                   0.88 kB │ gzip:  0.57 kB
dist/assets/index-BZtO78jP.css   19.43 kB │ gzip:  4.81 kB
dist/assets/index-3GLhg40_.js   186.87 kB │ gzip: 58.74 kB
✓ built in 1.03s
EXIT=0
```

Это результат повторного прогона после фиксов (§8). Первичный прогон до фиксов: `dist/index.html 0.75 kB`, `index-DTaZDhi9.css 19.28 kB`, `index-z_EWjw_6.js 186.74 kB`, `✓ built in 1.01s`, также `EXIT=0`.

### 2.3. Содержимое `dist/` (после фиксов)

| Файл | Размер на диске |
|---|---|
| `dist/index.html` | 937 B |
| `dist/assets/index-BZtO78jP.css` | 19 428 B |
| `dist/assets/index-3GLhg40_.js` | 189 463 B |

До фиксов было: 812 B / 19 279 B / 189 341 B. Других файлов (в т.ч. `.map`) в `dist/` нет. В `dist/index.html` ссылки относительные (`./assets/...`) — работает благодаря `base: './'` в `vite.config.ts:11`; сохранены `viewport-fit=cover`, два `theme-color` (light/dark) и SDK Telegram.

### 2.4. Статический анализ (grep по `src/**`)

| Проверка | Команда/шаблон | Результат |
|---|---|---|
| `any` | `\bany\b` | **1** — только слово в комментарии `src/lib/telegram/types.ts:7` («Никаких `any`…»); в коде `any` нет |
| `console.*`, `alert`, `confirm`, `prompt` | `console\.|alert\(|confirm\(|prompt\(` | **0** |
| Хардкод цветов в компонентах | `#[0-9a-fA-F]{3,8}` в `src/**/*.tsx` | **0** (все hex — только слой токенов `src/index.css`; `theme-color` в `index.html:9-10` теперь с light/dark media-вариантами, см. §8) |
| `@ts-ignore`, `as any`, `as unknown` | — | **0** |
| Импорты «фича → фича» | `from '@/features/` | **0** (единственные импорты фич — из `src/modules/registry.tsx:3-6`) |
| `textarea`, `contentEditable`, `input type=` | — | **0** (свободного ввода нет — соответствует заделу: голос ещё не подключён) |
| `100dvh`, `100svh`, `dvh`, `svh` | — | в `src/**/*.tsx` — **0**; правило `@supports (height: 100dvh)` добавлено в `src/index.css:154-164` (см. §8) |
| persist-ключи | `STORE_KEY = 'tamang` | `tamang.lesson-progress` (`lessonStore.ts:8`), `tamang.pet` (`petStore.ts:7`), `tamang.settings` (`settingsStore.ts:5`) — совпадают с контрактом |

Импорты (70 директив) проверены по слоям: `features → components/hooks, data, store, types, lib/telegram`; `store → types, data, ./petStore`; `components → store, lib, modules, data`; `App → lib/telegram, components`; `lib/data → types`. Циклических импортов нет; пара `TelegramProvider ⇄ useTelegram` разорвана объявлением контекста в `src/lib/telegram/useTelegram.ts:26-27`.

### 2.5. Прогон логики вне браузера (Node, временная папка)

Временные файлы: `C:\Users\kotaz\AppData\Local\Temp\tamang-qa\` (в проект не добавлялись). `localStorage` замокан; импортировались **реальные** `@/store`, `@/data/lessons`, `@/data/shopItems`, `@/data/petConfig`.

```text
run-pnpm.cmd exec esbuild <logic-test.ts> --bundle --format=esm --platform=node --tsconfig=tamang-app/tsconfig.json
→ EXIT=0
node.exe logic-test.mjs
→ PASS: 170, FAIL: 0        ← после фиксов; первично было PASS: 169, FAIL: 0
```

Покрытие граничных случаев: валидность данных (см. §5), дефолты и persist-политика всех 4 сторов, `clamp` статов, `NaN`-дельты, возврат выражения в `idle` через 1200 мс, `addXp` (0/-5/NaN — игнор, `2.6 → +3`), `equip/unequip` без дублей, `renamePet` (пустое — игнор, обрезка до 24), `resetPet`, весь цикл урока (пустой/неверный/верный ответ, повторная проверка, повторный клик, `removeWordAt`, `clearAnswer`, `nextLesson`, `exitLesson`, `resetProgress`, повторное прохождение без награды), сбросы, ключи и состав persist-данных.

### 2.6. SSR-прогон рендера UI (Node + `react-dom/server`)

Тот же временный каталог: `<App/>` рендерится в строку и проверяется утверждениями для всех состояний (старт, меню, магазин, настройки, список уроков, активный урок, выбранные слова, верный/неверный ответ, финал, список после прохождения, возврат в меню).

```text
esbuild smoke.tsx --bundle --format=cjs --platform=node --jsx=automatic
→ EXIT=0
node.exe smoke.cjs
→ PASS: 83, FAIL: 0         ← после фиксов; первично было PASS: 80, FAIL: 0
```

Важно: zustand в SSR отдаёт `getInitialState()` как server snapshot, поэтому для сквозного прокликивания состояний во временном mock-окружении точечно подменён `useSyncExternalStore` на клиентскую версию (это только QA-приём в файле вне проекта, к приложению отношения не имеет). Проверено: правильная разметка по всем экранам, у всех кнопок есть `type="button"`, `aria-label`/`aria-hidden` на месте, `role="progressbar"` (2), `role="switch"` (ровно 3), в HTML нет `undefined`/`NaN`/`<textarea>`/`<input>`, кнопки аудио/голоса и кнопка «Проверить» при пустом ответе — `disabled`.

---

## 3. Чек-лист требований ТЗ (`prom1.txt`)

| # | Требование | Статус | Где реализовано |
|---|---|---|---|
| 1 | Экран запуска: крупное яйцо по центру + кнопка «Play!» поверх/внутри | ✅ | `src/components/StartScreen.tsx` — адаптивное яйцо (CSS `.egg-body`, строки 35–55), кнопка Play (58–66), подсказка (69–71); скролл и центрирование — 26–27 |
| 2 | Нажатие Play → главный экран | ✅ | `StartScreen.tsx:14-18` → `uiStore.start()`; SSR-проверка перехода пройдена |
| 3 | Главный экран поделён на 2 половины | ✅ | `src/components/MainScreen.tsx` (flex-col) + `PetHalf` (верх, `h-[48%] min-h-[232px]`) и `BottomHalf` (низ, `flex-1`) |
| 4 | Верх постоянный: тамагочи-эмодзи, реагирует на клики | ✅ | `src/components/pet/PetStage.tsx:20-36` (`onClick → petClick()`); expression `happy` → `idle` через `reactionTimeoutMs=1200` (проверено прогоном) |
| 5 | Верх: базовые статы Health/Mood (полоски + числа) | ✅ | `src/components/pet/PetStats.tsx:18-47` (полоски `role="progressbar"`), 53–74 (`Здоровье` ❤️/`Настроение` 😊) |
| 6 | Пустой компонент/контейнер под переодевание и сложные анимации | ✅ | `src/components/pet/PetOutfitSlot.tsx` — слой одежды (44–46) + пустой контейнер `data-slot="pet-animation-layer"` (48–58) |
| 7 | Низ динамический: по умолчанию меню из 3 кнопок (Урок/Магазин/Настройки) | ✅ | `src/features/menu/MenuView.tsx:15-37` (`MENU_ACTIONS`), рендер 63+ |
| 8 | При выборе действия меняется только низ, верх остаётся | ✅ | `src/components/BottomHalf.tsx:11-14` рендерит компонент из реестра по `uiStore.bottomTab`; `PetHalf` не читает `bottomTab` и не перемонтируется |
| 9 | Урок открывается в нижней половине, стиль Duolingo: фраза питомца + кнопки-слова + рабочая проверка | ✅ | `src/features/lesson/LessonView.tsx`: карточка фразы (~229–260), банк слов (317–332), трей ответа (290–314), фидбек (335–356), «Проверить»/«Очистить» (383–395); проверка засчитывается, XP начисляется за первое прохождение (прогон) |
| 10 | Задел под голосовой ввод и аудио-воспроизведение | ✅ | `src/lib/audio.ts` (no-op `AudioService`), `src/lib/voice.ts` (no-op `VoiceInputService`), кнопки `disabled` с бейджем «скоро» — `LessonView.tsx:265-286`; интерфейсы в `src/types/index.ts` |
| 11 | Строго модульная архитектура, функциональные компоненты | ✅ | `src/modules/registry.tsx` (реестр вкладок), фичи изолированы, «фича→фича» импортов нет; все компоненты — функции |
| 12 | Глобальный стейт (статы питомца, открытый экран нижней панели) | ✅ | 4 zustand-стора: `petStore`, `uiStore`, `lessonStore`, `settingsStore` (+ баррель `src/store/index.ts`); `setState` из компонентов нет |
| 13 | Telegram CSS-переменные для нативного вида | ✅ | `src/index.css:11-65` (`--app-*` из `--tg-theme-*`, тёмная тема `html.dark`), `src/lib/telegram/TelegramProvider.tsx:84-104` (`ready/expand/disableVerticalSwipes/setHeaderColor/setBackgroundColor`), подписка `themeChanged` (105–131) |
| 14 | persist статов, прогресса и настроек | ✅ | `petStore.ts:161-171`, `lessonStore.ts:222-228`, `settingsStore.ts:45-48`; ключи совпадают с контрактом (проверено и на диске: 3 записи в `localStorage`) |
| 15 | README (AI Context Protocol) с обязательным разделом «Инструкция для ИИ-ассистента» | ✅ | `README.md:899-1025` (§13: порядок чтения, карта зависимостей, чек-лист, рецепты, запреты, Definition of Done); структура проекта — §4 (124–197), совпадает с реальным деревом |
| 16 | «Файл глобального хранилища» | ✅ | `src/store/index.ts` + 4 стора, начальные значения и ключи по контракту |
| 17 | UI, готовый к сборке без доработок | ✅ | `typecheck` = 0, `build` = 0, `dist/` (937 B / 19 428 B / 189 463 B после фиксов) |
| 18 | UX 320–430px, длинные тексты, переполнение, скролл низа, отсутствие горизонтального скролла, кнопки не обрезаются | ✅ | `body { overflow: hidden }` + `overflow-hidden` на `App`/`MainScreen`; длинные имена/описания — `truncate`/`line-clamp-2`; низ — `min-h-0 flex-1 overflow-y-auto overscroll-contain` + safe-area (`BottomHalf.tsx:19,30`); старт-экран скроллится и яйцо адаптивное (проблема #2 исправлена, §8); nit #7 закрыт `dvh`-правилом |

### Целостность контракта (проверено отдельно)

- **Сигнатуры сторов** — точное совпадение с `docs/CONTRACT.md` §3: `petStore` (`addXp`, `petClick`, `applyStatDelta`, `setExpression`, `equipItem`, `unequipItem`, `renamePet`, `resetPet`), `uiStore` (`setScreen`, `start`, `openTab`, `backToMenu`), `lessonStore` (`startLesson`, `selectWord`, `removeWordAt`, `clearAnswer`, `checkAnswer`, `nextLesson`, `exitLesson`, `resetProgress`), `settingsStore` (`toggleSound/Haptics/Animations`, `resetSettings`).
- **`checkAnswer`**: XP и `mood +4` начисляются ровно один раз за первое завершение урока; повторное прохождение пройденного урока даёт обратную связь **без** награды; повторный `checkAnswer` при `status='correct'` возвращает `true` **без** повторного начисления (`src/store/lessonStore.ts:132-176`); `completedLessonIds` без дублей. Проверено 170 ассертами.
- **`petClick`**: `health +1`, `mood +4`, clamp 0..100, `expression='happy'`, `lastInteractionAt=now`, возврат в `idle` через 1200 мс (повторный клик продлевает).
- **Данные**: 4 урока и 7 товаров; `correctWordIds ⊆ words[].id`, `translation` — точная склейка текстов правильных слов через пробел (проверено для всех 4 уроков), id уникальны, `ownedByDefault` ровно у 3 товаров, `xpReward` положительный, дистракторы присутствуют.
- **`persist`**: у `petStore` персистятся ровно `name/stats/equippedItemIds/totalXp/lastInteractionAt` (без `expression`), у `lessonStore` — только `completedLessonIds`, у `settingsStore` — 3 флага; `uiStore` не персистится.

---

## 4. Таблица найденных проблем

Колонка «статус» — итог повторной проверки 12.11.2026 (детали в §8).

| # | severity | файл:строка | описание | предлагаемый фикс | статус |
|---|---|---|---|---|---|
| 1 | minor | `index.html:9` | Единственный хардкод цвета вне `src/index.css`: `<meta name="theme-color" content="#f7f3e8" />`. Не переключается под тёмную тему (в браузере статус-бар/тулбар останется светлым; в Telegram цвет шапки задаётся через `setHeaderColor`). Нарушает пункт самопроверки QA «нет `#hex` вне `src/index.css`». | Добавить второй `<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#17212b" />` (и светлый с `media="(prefers-color-scheme: light)"`). | ✅ исправлено: `index.html:9-10` — два meta (light `#f7f3e8`, dark `#17212b`) |
| 2 | minor | `src/components/StartScreen.tsx:26` (совместно с `src/App.tsx:12`) | `main` имел `h-full` без `overflow-y-auto`, внутри фиксированное яйцо `h-64 w-48`, `gap-7` и паддинги safe-area; `App`/`body` — `overflow-hidden`. На очень низких вьюпортах (~≤480 px по высоте) контент старт-экрана обрезался без возможности прокрутки. | `main` → `h-full overflow-y-auto`, внутри обёртка `min-h-full flex-col justify-center`, яйцо адаптивное (`clamp`). | ✅ исправлено: `StartScreen.tsx:26-27` (`overflow-y-auto`, `min-h-full`), яйцо `h-[clamp(11rem,30vh,16rem)] aspect-[3/4]` (:38) |
| 3 | minor | `src/features/lesson/LessonView.tsx:359-367` | После **неверного** ответа была доступна кнопка «Дальше →», которая вызывает `nextLesson()` и уводит на следующий незавершённый урок, оставляя текущий непройденным (случайный «пропуск» урока). | При `isWrong` не показывать «Дальше» (оставить только «Попробовать снова»). | ✅ исправлено: «Дальше →» только при `isCorrect` (:363-371), при `isWrong` — только «Попробовать снова» (:372-380) |
| 4 | minor | `src/store/lessonStore.ts:132-170` | Повторное прохождение уже пройденного урока снова начисляло XP/mood: `addXp` вызывался на каждый верный `checkAnswer`, дедупликация была только для `completedLessonIds`. | Начислять награду только при первом завершении (`if (!completedLessonIds.includes(lesson.id))`). | ✅ исправлено: `isFirstCompletion` (:156-173) — награда только за первое прохождение; контракт §3.3 обновлён |
| 5 | minor | `README.md:1057-1065` | «Журнал QA» утверждал, что `docs/QA-REPORT.md` ещё не создан («Если файла нет — значит ревью не завершено»). После записи отчёта формулировка устарела. | Обновить раздел: отчёт создан, дата/вердикт, список фиксов. | ✅ исправлено: `README.md:1063-1074` — журнал обновлён (отчёт создан 12.11.2026, PASS, ссылка, список фиксов) |
| 6 | minor | `docs/CONTRACT.md` ↔ `src/data/petConfig.ts:25-26,43,50-61` | В замороженном контракте `PET_CONFIG` был описан без `levelThresholds`, функции `getPetLevel` не было, хотя в коде и README §9.1 они есть (аддитивное расширение). | Узаконить в контракте (`levelThresholds`, `getPetLevel`) либо пометить как согласованное расширение. | ✅ исправлено: `CONTRACT.md` §6 (:184-190) + §9 «Журнал изменений контракта» (:243-251) |
| 7 | nit | `src/index.css:67-71` | Высота была задана только `height: 100%`; `100dvh/100svh` не было — в мобильном браузере при динамическом тулбаре низ мог уезжать под панель. | Добавить `height: 100dvh` под `@supports`. | ✅ исправлено: `index.css:154-164` — `@supports (height: 100dvh)` с fallback на `height: 100%` |
| 8 | nit | `index.html:5-8` | `maximum-scale=1.0, user-scalable=no` запрещает масштабирование (a11y). Для Mini App типично. | Оставить осознанно и зафиксировать в README §14. | ➖ принято осознанно (не менялось; типичная практика для Mini App) |
| 9 | nit | `src/lib/telegram/TelegramProvider.tsx:134-136` | Тёмная тема навешивается на `<html>` в `useEffect` после первого кадра: при старте в тёмной теме возможна короткая светлая вспышка. | Выставлять класс инлайн-скриптом до загрузки бандла. | ➖ принято осознанно (низкий риск, окно ~1 кадр) |
| 10 | nit | `src/store/settingsStore.ts:18,38` | Контрактный экшен `resetSettings()` не используется в UI (есть сбросы питомца и прогресса, но не настроек). | Добавить кнопку или оставить как публичное API. | ➖ принято осознанно (публичное API по контракту) |
| 11 | nit | `src/components/StartScreen.tsx:61` (и остальные кнопки) | Кастомный `focus-visible`-ринт есть только у Play; остальные кнопки полагаются на дефолтный outline. | Общий класс фокуса. | ➖ принято осознанно (дефолтный outline не убирается, доступность сохранена) |
| 12 | nit | `src/store/uiStore.ts:14,27`; `src/store/petStore.ts:21,119`; `src/store/petStore.ts:27,141`; `src/lib/audio.ts:29,37`; `src/lib/voice.ts:11-30`; `src/modules/index.ts` (баррель) | Публичные члены контракта, которые нигде не вызываются: `uiStore.setScreen`, `petStore.setExpression`, `petStore.renamePet`, `audioService.playPhrase/stopAll`, весь `voiceInputService`, баррель `src/modules/index.ts`. Это **осознанный задел** (README §12/§9 и контракт), не мёртвый код; `voiceInputService` не импортируется, т.к. кнопка «Голосом» пока `disabled`. | Ничего не менять по существу. | ➖ принято осознанно (точки расширения под голос/аудио/переименование) |

Итого первично: **blocker — 0, major — 0, minor — 6, nit — 6.** После фиксов: **6 minor + nit #7 исправлены; nit #8–#12 приняты осознанно.**

---

## 5. Граничные случаи и что проверено

**Данные (прогон на реальных модулях):**
- 4 урока ≥ 3 требуемых, 7 товаров ≥ 5, `ownedByDefault` ровно у 3;
- уникальность id уроков и слов, `correctWordIds` — подмножество `words[].id`;
- `translation` — точная склейка текстов правильных слов через пробел (все 4 урока);
- `PET_CONFIG` = `100/0/4/1/1200` (max/min/clickMood/clickHealth/reactionTimeout), `getPetLevel(0)=1, (50)=2, (1050)=8`.

**Сторы:**
- дефолты: `name='Таманг'`, статы 100/100, `expression='idle'`, `equippedItemIds=[]`, `totalXp=0`, `lastInteractionAt=null`;
- `applyStatDelta` clamp 0..100, `NaN`/`undefined`-дельты игнорируются; `petClick` не выходит за границы, выражение возвращается в `idle` (проверено ожиданием 1400 мс);
- `addXp`: `0`, `-5`, `NaN` игнорируются, `2.6 → +3`; `equipItem` без дублей, пустой id игнор; `renamePet('   ')` игнор, длинное имя обрезается до 24; `resetPet` полностью сбрасывает;
- урок: пустой ответ → `false`/`wrong`/`attempts=1` **без** XP; повторный `selectWord` и слово из чужого урока игнорируются; порядок выбранных слов сохраняется; `removeWordAt` (валидный/вне диапазона/-1); неверный ответ → `wrong`/`attempts++`/без XP; `clearAnswer` из `wrong` → `assembling`; верный ответ → `correct`, `attempts++`, `completedLessonIds`, XP ровно один раз, `mood+4`; повторный `checkAnswer` → `true` без дублей; `nextLesson` берёт следующий незавершённый, очищает ответ/attempts; `exitLesson` → `null/idle/[]`; после всех уроков `nextLesson` → `status='completed'`; `startLesson()` при всех пройденных → первый урок; повторный вход в пройденный урок не даёт награды (фикс #4, §8); `resetProgress` чистит прогресс и сессию; `checkAnswer` при `status='completed'` → `false`;
- `settingsStore`: 3 флага `true`, тумблеры, `resetSettings`;
- persist: записаны ровно 3 ключа; в `tamang.pet` нет `expression`, в `tamang.lesson-progress` только `completedLessonIds`, в `tamang.settings` только 3 флага (функции не сериализуются).

**UI (SSR-рендер; 80 проверок в первом прогоне, 83 — в повторном):** старт → Play → меню; магазин (`Надеть` ×3, `Скоро` ×4, `disabled`); настройки (3 `role="switch"`, сбросы, «О приложении»); список уроков (`Пройдено уроков: 0…4`, «Повторить с начала»); активный урок (фраза, номер, «+10 XP», «Прослушать/Голосом/скоро», disabled аудио, пустой ответ); выбранные слова и «Убрать слово»; верный ответ («Верно!», «+10 XP питомцу», перевод, «Дальше»); неверный ответ («Пока неверно», «Попытка №1», «Попробовать снова», «Дальше» отсутствует); пустой ответ (store даёт `wrong`, кнопка «Проверить» disabled); финал («Все уроки пройдены!», «Вернуться к урокам», «В меню»); возврат в меню (кнопка «Назад» исчезает); во всех состояниях `totalXp` реально растёт, нет `undefined`/`NaN`, все кнопки — `type="button"`.

**Вёрстка/UX по коду:** `overflow-hidden` на `App`/`MainScreen` и `body` исключает горизонтальный скролл; длинные имя питомца, названия/описания товаров, `petPhrase` и `instruction` обрезаются (`truncate`, `line-clamp-2`); низ — самостоятельный скролл (`BottomHalf.tsx:30`) с `overscroll-contain` и `pb-[calc(var(--app-safe-bottom)+1.25rem)]`; верх учитывает `--app-safe-top`; яйцо адаптивное (`clamp(11rem, 30vh, 16rem)` при пропорции 3:4) вписывается в 320 px; сетка магазина `grid-cols-2` не переполняется; кнопки не имеют фиксированных ширин, кроме безопасных (`w-full`).

**Чего проверить вживую нельзя (вне браузера):** фактический перенос слов, реальный скролл в iOS WebView, haptic/звук, цвета Telegram-темы, поведение safe-area, срабатывание `theme-color` по `prefers-color-scheme` — см. §7.

---

## 6. Замечания по README / CONTRACT

1. **Дерево README §4 (строки 124–197) полностью совпадает с реальным деревом** (35 файлов `src/`, конфиги, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `.gitignore`; отдельная оговорка про `node_modules/` и `dist/`). Выдуманных файлов нет.
2. **Примеры README не расходятся с кодом:** §7 (новая вкладка: union → `src/features/garden/GardenView.tsx` → `registry.tsx` → `MENU_ACTIONS`) соответствует реальным API; §8 (новый урок, `lesson-weather`, `translation 'Сегодня солнечно'` = склейка слов) соответствует правилам данных; §9 (`PET_CONFIG`, `getPetLevel`, `PetOutfitSlot`, `data-slot`) совпадает с кодом; §10.1 таблица токенов совпадает с `src/index.css`; §13 «Инструкция для ИИ-ассистента» (899–1025) присутствует и содержательна — требование ТЗ выполнено.
3. **README §3 (версии)** совпадает с `package.json`/`pnpm-lock` (React 18.3.1, zustand 4.5.5, TS 5.6.3, Vite 5.4.11, Tailwind 3.4.15 и т.д.).
4. **«Журнал QA» обновлён** (`README.md:1063-1074`): указано, что отчёт создан 12.11.2026, вердикт PASS (0 blocker / 0 major / 6 minor / 6 nit), перечислены исправленные замечания и дана ссылка на этот отчёт. Устаревшая формулировка «файла нет — ревью не завершено» устранена (проблема #5 закрыта).
5. **CONTRACT ↔ код:** расхождение `levelThresholds`/`getPetLevel` узаконено: `docs/CONTRACT.md` §6 (строки 184–190) описывает поля/функцию, а новый §9 «Журнал изменений контракта» (243–251) фиксирует дату, причину и ссылку на замечание QA. Также в §3.3 (96–100) закреплено правило «награда только за первое завершение» и поведение `clearAnswer` из `wrong`. `docs/ARCHITECTURE.md` (198 строк) соответствует коду, §5 (117–138) описывает награду только за первое прохождение. Всё остальное (сторы, ключи, дерево §7, данные, Telegram-слой, запреты) контракту соответствует.
6. **Git:** репозитория нет ни в `tamang-app`, ни в `C:\Users\kotaz\Downloads\tamang` (`Test-Path .git` → False). README упоминает `.gitignore` (файл существует), но проверить историю/атрибуцию изменений `src/types/index.ts` невозможно; при сдаче проекта стоит инициализировать репозиторий.

---

## 7. Что проверить руками в Telegram

1. Открыть Mini App по `https://`-адресу (после `build` + деплоя `dist/`), убедиться, что SDK Telegram загрузился и приложение развернулось на весь экран (`expand`), свайп вниз не закрывает приложение (`disableVerticalSwipes`).
2. **Старт:** яйцо по центру, кнопка «Play!» поверх нижней части яйца, анимация покачивания; на iPhone SE/320 px, в ландшафте и при низком окне проверить, что экран прокручивается и ничего не обрезано (фикс #2: `overflow-y-auto` + адаптивное яйцо).
3. **Верх:** тапнуть по питомцу 5–10 раз — health/mood растут, эмодзи меняется на «happy», через ~1.2 с возвращается в «idle», полоски и числа совпадают, уровень/XP в шапке; проверить, что при переключении вкладок низ меняется, а верх не мигает и не сбрасывается.
4. **Тема:** переключить тему Telegram (светлая/тёмная) на открытом приложении — цвета должны обновиться без перезапуска (`themeChanged`); статус-бар/шапка — через `setHeaderColor`; проверить читаемость текста в тёмной теме.
5. **Меню → Магазин:** надеть/снять 3 доступных предмета (эмодзи появляется/исчезает на питомце), 4 недоступных товара — `disabled` с «Скоро»; после перезапуска надетые предметы сохранены (`tamang.pet`).
6. **Меню → Урок:** выбрать урок, собрать фразу из слов (тап по слову в трее убирает его), «Очистить», «Проверить» при пустом ответе недоступна; верный ответ — «Верно!», «+10 XP», «Дальше» ведёт к следующему уроку; неверный — «Пока неверно» и только «Попробовать снова» («Дальше» после ошибки теперь не показывается — проверить, что урок нельзя случайно пропустить, фикс #3).
7. **Кнопки «Прослушать»/«Голосом»:** должны быть `disabled` с подсказкой «скоро» и не вызывать ошибок/микрофон.
8. **Прогресс:** пройти все 4 урока — финальный экран «Все уроки пройдены!», «Вернуться к урокам»/«В меню»; закрыть и открыть приложение — пройденные уроки отмечены, XP сохранён (`tamang.lesson-progress`, `tamang.pet`). Повторно пройти уже пройденный урок и убедиться, что XP/mood больше не растут (фикс #4).
9. **Настройки:** выключить звук — тапы без звука; выключить вибрацию — без haptic; **включить вибрацию обратно — должен быть один короткий haptic** (фикс из §8, проверяется только в Telegram); выключить анимации — яйцо/эмодзи/попапы статичны; сброс питомца и сброс прогресса уроков (инлайн-подтверждение, без `alert`); после сброса состояние и `localStorage` почищены.
10. **Скролл и safe-area:** на устройстве с «бровью»/жестовой полосой нижний контент не должен уходить под системную панель; длинный список уроков/товаров скроллится внутри нижней половины, страница целиком не скроллится, горизонтального скролла нет; проверить поведение при скрытии/показе тулбара браузера (dvh-правило).
11. **Вне Telegram** (в обычном браузере): приложение должно работать, тема — из `prefers-color-scheme`, haptic/звук — no-op, в «О приложении» — «Открыто в браузере (вне Telegram)».
12. **Сборка:** `run-pnpm.cmd typecheck` и `run-pnpm.cmd build` уже перепрогнаны после фиксов — оба `EXIT=0` (см. §8); при новых изменениях повторить и сверить `dist/`.

---

## 8. Повторная проверка после исправлений

**Дата:** 12.11.2026 (первичное ревью — 16:28, фиксы разработчиков — 16:41–16:43, повторная проверка — после них). Код QA не правил: проверялись только файлы, изменённые разработчиками, и перепрогнанные тесты.

### 8.1. Команды и результаты (последовательно, не параллельно с Lead)

```text
> run-pnpm.cmd typecheck
$ tsc --noEmit
TYPECHECK_EXIT=0

> run-pnpm.cmd build
$ tsc --noEmit && vite build
vite v5.4.11 building for production...
✓ 73 modules transformed.
dist/index.html                   0.88 kB │ gzip:  0.57 kB
dist/assets/index-BZtO78jP.css   19.43 kB │ gzip:  4.81 kB
dist/assets/index-3GLhg40_.js   186.87 kB │ gzip: 58.74 kB
✓ built in 1.03s
BUILD_EXIT=0
```

`dist/` на диске: `index.html` 937 B, `assets/index-BZtO78jP.css` 19 428 B, `assets/index-3GLhg40_.js` 189 463 B; других файлов нет. (До фиксов: 812 / 19 279 / 189 341 B.) Хэши ассетов изменились, старые файлы не остались, ссылки в `dist/index.html` указывают на новые.

### 8.2. Целевые проверки исправлений

| # | Замечание | Что проверено реально | Результат |
|---|---|---|---|
| 1 | `theme-color` (#1) | `index.html:9-10`: два `<meta name="theme-color">` — `media="(prefers-color-scheme: light)" content="#f7f3e8"` и `media="(prefers-color-scheme: dark)" content="#17212b"` | ✅ подтверждено |
| 2 | StartScreen (#2) | `StartScreen.tsx:26` — `main` с `h-full overflow-y-auto`; :27 — обёртка `min-h-full flex-col justify-center`; :38 — яйцо `h-[clamp(11rem,30vh,16rem)] aspect-[3/4]`. SSR-проверки: HTML содержит `overflow-y-auto`, `clamp(11rem`, `min-h-full` | ✅ подтверждено (3 SSR-ассерта) |
| 3 | «Дальше» после ошибки (#3) | `LessonView.tsx:363-371` — кнопка «Дальше →» рендерится только при `isCorrect`; :372-380 — при `isWrong` только «Попробовать снова». SSR после неверного ответа: `hasNot(html, 'Дальше')` | ✅ подтверждено |
| 4 | Награда только за первое прохождение (#4) | `lessonStore.ts:156-173` — `isFirstCompletion = !completedLessonIds.includes(lesson.id)`, `addXp` + `applyStatDelta({mood: +4})` только внутри `if (isFirstCompletion)`. Логический прогон: первое прохождение +10 XP (xpReward) и `mood +4`; повторный `checkAnswer` при `correct` — `true` без изменений; повторный вход в пройденный урок + верный ответ — `totalXp` и `mood` **не изменились**, `completedLessonIds` без дублей | ✅ подтверждено (4 ассерта на replay + существующие 8) |
| 5 | README «Журнал QA» (#5) | `README.md:1063-1074` — отчёт создан, указан вердикт PASS (0/0/6/6), перечислены 6 фиксов, ссылка на отчёт. Семантика наград: §1 (стр. 35), §6.3 (стр. 366), §8 (стр. 603) — «XP и mood только за первое прохождение» | ✅ подтверждено |
| 6 | CONTRACT (#6) | `CONTRACT.md`: §3.3 (96–100) — награда только при первом завершении, повторное прохождение без награды; §6 (184–190) — `levelThresholds`/`getPetLevel`; §9 (243–251) — журнал изменений с датой, причиной и ссылкой на QA. `ARCHITECTURE.md` §5 (117–138) — то же правило в data-flow урока | ✅ подтверждено |
| 7 | `dvh` (#7) | `index.css:154-164` — `@supports (height: 100dvh) { html, body, #root { height: 100dvh; } }`; `height: 100%` остаётся fallback-ом | ✅ подтверждено |
| 8 | Haptics при включении вибрации (вне отчёта, найден Architect) | `SettingsView.tsx:90-95`: `handleToggleHaptics` вызывает `toggleHaptics()`, затем при `!hapticsEnabled` (значение до переключения) — прямой `haptic('light')` из `useTelegram()`, без чтения устаревшего флага через `useUiFeedback`; `typecheck` подтверждает типы | ✅ корректно по коду; фактический haptic проверяется только в Telegram (§7, шаг 9) |

### 8.3. Регрессионные прогоны

- **Логика (Node, реальные сторы/данные):** обновлены ожидания replay — `PASS: 170, FAIL: 0` (было 169/0; заменён устаревший ассерт «повторный проход начисляет XP» на два: XP не растёт, mood не растёт).
- **SSR-рендер UI:** добавлены 3 проверки старт-экрана и изменена проверка «Дальше» после ошибки — `PASS: 83, FAIL: 0` (было 80/0).
- **Статика повторно:** `any` в коде — 0 (1 в комментарии `types.ts:7`), `console/alert/confirm/prompt` — 0, hex в `*.tsx` — 0, «фича→фича» — 0; правило `dvh` теперь присутствует.
- **Регрессий не обнаружено:** typecheck/build зелёные, все ранее пройденные проверки (данные, сторы, persist, доступность, все состояния UI) по-прежнему проходят.

### 8.4. Что осталось и что нельзя проверить вне браузера

**Принято осознанно (не требует правок):** nit #8 (`user-scalable=no` — типично для Mini App), #9 (возможная светлая вспышка темы до `useEffect` — окно ~1 кадр), #10 (`resetSettings` без UI — публичное API по контракту), #11 (`focus-visible` только у Play — дефолтный outline сохранён), #12 (неиспользуемый задел API/баррель — осознанные точки расширения под голос, аудио, переименование).

**Не проверяется вне браузера (только руками в Telegram, см. §7):** фактический вызов haptic после включения вибрации (в Node/SSR провайдер — no-op), выбор `theme-color` браузером по `prefers-color-scheme`, визуальное поведение `100dvh` при скрытии тулбара, перенос слов и скролл в реальном WebView, safe-area на устройстве с «бровью».

### 8.5. Итоговый вердикт повторной проверки

**PASS.** Все 6 minor-замечаний и nit #7 подтверждённо исправлены, документация (README/CONTRACT/ARCHITECTURE) синхронизирована с новым поведением, `typecheck`/`build` — `EXIT=0`, регрессионные прогоны — 170/0 (логика) и 83/0 (UI), остальные nit осознанно приняты. Блокеров и замечаний, требующих правок до выдачи, нет.

---

### Приложение. Как воспроизвести прогоны QA

- Логика: `run-pnpm.cmd exec esbuild <temp>/logic-test.ts --bundle --format=esm --platform=node --tsconfig=tamang-app/tsconfig.json --outfile=<temp>/logic-test.mjs` → `node.exe logic-test.mjs` → ожидается `PASS: 170, FAIL: 0`.
- Рендер: то же с `smoke.tsx`, `--format=cjs --jsx=automatic` и mock-окружением (`localStorage`, `window.matchMedia`, `document.documentElement.classList`) → `PASS: 83, FAIL: 0`.
- Временные файлы лежат вне проекта (`C:\Users\kotaz\AppData\Local\Temp\tamang-qa\`); в `src/` ничего не добавлялось, тест-фреймворки не устанавливались.
