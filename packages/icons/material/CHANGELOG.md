# @soxa-ui/icons-material

## 0.3.3

### Patch Changes

- Updated dependencies [815c2c6]
- Updated dependencies [2e8653a]
  - @soxa-ui/setup@0.6.0

## 0.3.2

### Patch Changes

- Updated dependencies [dd6ea64]
- Updated dependencies [9688944]
- Updated dependencies [1a52ea6]
- Updated dependencies [2598c1b]
- Updated dependencies [5b88716]
  - @soxa-ui/setup@0.5.0

## 0.3.1

### Patch Changes

- Graduate the approved beta packages to stable versions.

## 0.3.1-beta.0

### Patch Changes

- Updated dependencies [5f7f821]
- Updated dependencies [8e68380]
- Updated dependencies [5ba63f4]
- Updated dependencies [f6c476e]
- Updated dependencies [eec067c]
- Updated dependencies [274d746]
  - @soxa-ui/setup@0.4.0-beta.0

## 0.3.0

### Minor Changes

- 1c78107: Publish Soxa UI packages under the `@soxa-ui` scope. Replace the previous npm scope in every dependency and import (including theme CSS, theme setup, icons, and TypeScript module augmentations) with `@soxa-ui/<package>`. Keep the core, plugins, setup, and adapters on the same release. Component exports, props, events, and the `so-*`, `data-so-*`, and `--so-*` styling contracts are unchanged. See `docs/migration-to-soxa.md` for the package mapping and upgrade steps.

### Patch Changes

- 82d69a5: Add the copy icon for custom actions and CodeBlock.
- d1d4764: Versioned on their own: a theme or an icon pack no longer shares the version of the library and depends on it by a range (`^` and a library version) instead of its exact version, so it keeps working with the library releases that do not break its contract. The icon packs take `@soxa-ui/setup` as a peer dependency now.
- Updated dependencies [53fb45f]
- Updated dependencies [21e6143]
- Updated dependencies [ab9735f]
- Updated dependencies [a15bae2]
- Updated dependencies [0909342]
- Updated dependencies [ba29be7]
- Updated dependencies [db54848]
- Updated dependencies [1ffabcd]
- Updated dependencies [1bb3ea8]
- Updated dependencies [de65c13]
- Updated dependencies [9c002f7]
- Updated dependencies [7327698]
- Updated dependencies [7335dd6]
- Updated dependencies [28bcd83]
- Updated dependencies [e682670]
- Updated dependencies [1c78107]
- Updated dependencies [ac39aa9]
- Updated dependencies [cfffb4b]
- Updated dependencies [0690162]
  - @soxa-ui/setup@0.3.0

## 0.3.0-beta.1

### Minor Changes

- 1c78107: Publish Soxa UI packages under the `@soxa-ui` scope. Replace the previous npm scope in every dependency and import (including theme CSS, theme setup, icons, and TypeScript module augmentations) with `@soxa-ui/<package>`. Keep the core, plugins, setup, and adapters on the same release. Component exports, props, events, and the `so-*`, `data-so-*`, and `--so-*` styling contracts are unchanged. See `docs/migration-to-soxa.md` for the package mapping and upgrade steps.

### Patch Changes

- Updated dependencies [1c78107]
  - @soxa-ui/setup@0.3.0-beta.1

## 0.3.0-beta.0

### Patch Changes

- d1d4764: Versioned on their own: a theme or an icon pack no longer shares the version of the library and depends on it by a range (`^` and a library version) instead of its exact version, so it keeps working with the library releases that do not break its contract. The icon packs take `@soxa-ui/setup` as a peer dependency now.
- Updated dependencies [7327698]
- Updated dependencies [7335dd6]
- Updated dependencies [28bcd83]
- Updated dependencies [e682670]
- Updated dependencies [ac39aa9]
- Updated dependencies [cfffb4b]
- Updated dependencies [0690162]
  - @soxa-ui/setup@0.3.0-beta.0

## 0.3.0-alpha.7

### Patch Changes

- Updated dependencies [26cc7e3]
- Updated dependencies [5d8b7ca]
- Updated dependencies [d278f0f]
- Updated dependencies [1a322fe]
  - @soxa-ui/setup@0.3.0-alpha.7

## 0.3.0-alpha.6

### Patch Changes

- a6a77f8: Every package declares `sideEffects`, so the application's bundler drops the modules a page does not use: a page with one button no longer pulls every component of the core, every plugin and every component of the adapter (React: 184 → 82 KB gzip of JS). The core, plugins, icons and adapters are `false`, the themes keep their stylesheets (`["*.css"]`), and `@soxa-ui/webc` is `true`: importing it defines every element, as before.
- 2dec183: The repository moved to github.com/youra-h/soxa-ui: package repository, homepage and issue links point there
- Updated dependencies [101269c]
- Updated dependencies [a73c5bf]
- Updated dependencies [2dec183]
- Updated dependencies [54f5b1d]
  - @soxa-ui/setup@0.3.0-alpha.6

## 0.3.0-alpha.5

### Patch Changes

- @soxa-ui/setup@0.3.0-alpha.5

## 0.3.0-alpha.4

### Patch Changes

- Updated dependencies [6f96bae]
- Updated dependencies [8eb76c2]
- Updated dependencies [1c703ad]
  - @soxa-ui/setup@0.3.0-alpha.4

## 0.3.0-alpha.3

### Minor Changes

- bb71433: Цвет иконки — лестница приоритетов, одна для обоих пакетов и любого способа рисования: правило темы для места сильнее цвета темы по умолчанию, а тот — цвета, с которым иконка загружена. Пакеты красят рисунок ссылкой на переменную `--so-icon-color` с цветом из SVG запасным значением (атрибутом SVG, а не `style`): без темы иконка Material — `#1f1f1f`, Lucide — цвета текста, а Lucide снова рисует линиями толщиной 1.5, звезда залита. Тема oren задаёт цвет переменной, а не `fill`. Что сломалось: тема больше не заливает `fill: currentColor` свой `<svg>` в слоте кнопки и в коробке значка тоста, а своя иконка роли (`useIcons`) без покраски рисуется умолчанием SVG — чёрной. Чтобы она брала цвет темы, покрасьте её так же: `<g fill="var(--so-icon-color, currentColor)">…</g>` (у иконки линиями — `stroke`).

### Patch Changes

- Updated dependencies [582d3a6]
- Updated dependencies [28470f6]
- Updated dependencies [0471962]
- Updated dependencies [fc30695]
- Updated dependencies [64be9ca]
- Updated dependencies [fcd14b4]
- Updated dependencies [a09886b]
- Updated dependencies [7a86466]
- Updated dependencies [ad1de00]
- Updated dependencies [53a3fe6]
  - @soxa-ui/setup@0.3.0-alpha.3

## 0.3.0-alpha.2

### Patch Changes

- @soxa-ui/setup@0.3.0-alpha.2

## 0.3.0-alpha.1

### Minor Changes

- 0091f1d: Пакет иконок подключается через `useIcons` вместо `setIcons` — в ряд с `useTheme`, `usePlugins`, `useExtensions` и `useMotion`. Как обновиться: `setIcons(…)` → `useIcons(…)`, аргументы и поведение те же.

### Patch Changes

- Updated dependencies [0f59387]
- Updated dependencies [ad16bef]
- Updated dependencies [0179add]
- Updated dependencies [89db4ae]
- Updated dependencies [74f6de3]
- Updated dependencies [4fc4efa]
- Updated dependencies [b45c170]
- Updated dependencies [0091f1d]
- Updated dependencies [7137eaa]
- Updated dependencies [9d181a3]
- Updated dependencies [d7ee0bc]
- Updated dependencies [fba7c84]
- Updated dependencies [0da817b]
- Updated dependencies [b3cb2f3]
- Updated dependencies [8d55e75]
  - @soxa-ui/setup@0.3.0-alpha.1

## 0.3.0-alpha.0

### Minor Changes

- 1411d88: Тост: вид сообщения `type` (`info`, `success`, `warning`, `error`) со значком вида и `loading` — кольцо на месте значка; ожидающий тост сам не закрывается. `variant` и `size` у тоста сняты: вместо `show({ variant: 'negative' })` пишите `show({ type: 'error' })`. Новые роли иконок `notification`, `info`, `success`, `warning` — свой пакет иконок должен их закрыть.
- ce9316e: NumberInput (Vue): поле числа в формате локали — шаг и границы, ↑/↓, PageUp/PageDown, Home/End, кнопки «−» и «+» с удержанием, `formatOptions` (процент, валюта, единица), событие `commit`; `createScale` принимает открытые границы, а `shift` шкалы со значения вне сетки шагает к соседнему узлу со стороны сдвига (с 2,5 при шаге 1 — на 3 и на 2). Ломающее: роли иконок `minus` и `plus` — дополните ими свой пакет иконок; раздел локали `numberInput` — дополните им свой `TLocale` (`extendLocale` возьмёт из основы).

### Patch Changes

- 8b22fd5: Значки видов тоста `notification`, `info`, `success` и `warning` — контурные, как `error`.
- 4718cd0: Значок ошибки error — контурный круг вместо залитого: у текста ошибки Field он читался сплошным красным пятном
- Updated dependencies [8bbb7d8]
- Updated dependencies [7731c71]
- Updated dependencies [7872e77]
- Updated dependencies [f4676b7]
- Updated dependencies [5f4c58a]
- Updated dependencies [f06e5f9]
- Updated dependencies [8e2e31e]
- Updated dependencies [1411d88]
- Updated dependencies [ce9316e]
- Updated dependencies [47e560d]
- Updated dependencies [e977046]
- Updated dependencies [4429cbc]
  - @soxa-ui/setup@0.3.0-alpha.0

## 0.2.0

### Minor Changes

- eae46e4: Table во Vue: таблица по паттернам APG Table и Sortable Table — колонки данными (`columns`), сортировка кнопкой в заголовке колонки, выбор строк колонкой чекбоксов, слоты `header`, `cell` и `empty`, стили темы oren. Колонке — `rowHeader` (её ячейки называют строки, `th scope="row"`) и `widthStyle`, строке — набор `headerAria`, таблице — `selectAllLabel`. Чекбоксы колонки выбора держит таблица: `selectAll` фасада и `checkBoxOf(row)` расширения `table`; их отметку она пишет от выбора, а клик по ним выполняет командой выбора. Ломающее: режим выбора строк таблицы по умолчанию — `none`, колонки выбора нет, пока режим не задан; у `TTableShownSelection` новое значение `empty` — выбирать нечего (строк нет, все выключены или выключена таблица), раньше на его месте было `none`; новая роль иконки `arrowUpward` — свой пакет иконок дополните ею. CheckBox и Switch возвращают поле к модели, когда запись отметки отменили в `change:value:before`.
- 7c9d5c6: Пакеты переехали в скоуп `@soxa-ui`: прежний скоуп занят в npm чужой учётной записью. Адаптеры названы по фреймворку, без повторения слова ui — `@soxa-ui/vue`, `@soxa-ui/react`, `@soxa-ui/angular`, `@soxa-ui/svelte`, `@soxa-ui/solid`, `@soxa-ui/webc`. Остальные пакеты сохранили прежние имена в новом скоупе: `@soxa-ui/core`, `@soxa-ui/setup`, `@soxa-ui/plugins`, `@soxa-ui/theme-oren`, `@soxa-ui/icons-material`. Как обновиться: сменить скоуп в импортах и в манифесте, у адаптеров дополнительно убрать из имени пакета префикс `ui-`.
- 080cf7a: Поле формы Field (во Vue): подпись, подсказка и ошибка, связанные с контролом сами — `<Field label="Почта" helper="…" error="…" invalid position="start"><Input /></Field>`. Текст части — проп `label`, `helper`, `error`, своя разметка — слот `label-content`, `helper-content`, `error-content`; ошибка видна при `invalid` и встаёт на место подсказки. Подпись называет Input, Select, CheckBox, Switch и Rating своим `for` (без своего `id` контрол получает `id` поля), DateInput, DatePicker и RadioGroup — ссылкой `aria-labelledby`; справка — `aria-describedby` контрола, ошибка — `aria-invalid` и `data-invalid`. У `TValueControl` появилось свойство инстанса `invalid` (не проп): `data-invalid` и `aria-invalid` — только у невалидного; у DateInput итог — своё или вне границ, и `data-invalid="false"` у валидного поля даты больше не ставится. У `TControl` — `labelable`, у `TAriaPlugin` — второй вход `links`. Select кладёт свой набор `aria` на `<input>` комбобокса — `aria_label` Select теперь называет поле; корни Input, CheckBox и Switch во Vue несут `dataset`. Новая роль иконки `error` (в `@soxa-ui/icons-material` она есть): своему пакету иконок её нужно закрыть. Тема oren: стили Field — подпись сверху, в начале или в конце строки, общая колонка подписей формы через `--so-field-columns`, — вид ошибки контролов по их `data-invalid` и одна шкала подписи у Label, Field и текста радио. Ломающее: база кнопки очистки переименована — `TField` → `TClearable`, `IField`/`IFieldProps`/`TFieldEvents` → `IClearable`/`IClearableProps`/`TClearableEvents`, `FieldDescriptor` → `ClearableDescriptor`, `TFieldNamesPlugin` → `TClearableNamesPlugin`, `FieldNamesPluginDescriptor` → `ClearableNamesPluginDescriptor`; имя `TField` и `FieldDescriptor` теперь у поля формы. Раздел локали `field` прежний.

### Patch Changes

- 9e0c6e7: Dialog: новый компонент (Vue) — модальное окно, паттерн Dialog (Modal) APG. Открытость — `visible` (`v-model:visible`); имя окну даёт слот `title` (`aria-labelledby`), содержимое — слот по умолчанию, ряд действий — `footer`. Место — `placement`: `center` (по умолчанию), `start`, `end`, `top`, `bottom`, стороны логические; размер — `width` и `height` (число — px, строка — CSS-значение, не заданы — размер темы); `maximized` разворачивает окно на весь экран, `maximizable` показывает кнопку разворота (имя `maximizeLabel`, состояние — `aria-pressed`). Крестик (`closable`, `closeLabel`), Escape и нажатие по подложке просят окно закрыться: событие `close:before` с причиной (`button`, `outside`, `escape`) отменяется `preventDefault()`, а `dismissible: false` оставляет только крестик; запись `visible` из кода и `v-model` события не шлют. `alert` делает окно предупреждением (`role="alertdialog"`, описание — содержимое). Фокус уходит в окно и возвращается при любом закрытии, Tab ходит по кругу, страница под окном спрятана от скринридера и не прокручивается, нажатие по подложке фокус не уносит. Иконки кнопки разворота — роли `arrowsOutward` и `arrowsInward` (`@soxa-ui/icons-material`); тема oren рисует окно и подложку (`.so-dialog`, `.so-dialog__backdrop`, `--placement-*`, `data-maximized`, переменные `--so-dialog-width` и `--so-dialog-height`).
  
  Ломающее. Слой выделен в общую базу `TLayer` (`@soxa-ui/core`): Frame и окно делят один стек z-index, и его базу задают у `TLayer` — `TLayer.baseZIndex = 5000`; запись в `TFrame.baseZIndex` больше не действует. В `@soxa-ui/plugins` правило «после нажатия мимо фокус не возвращать» переехало из базы `TOverlayFocusPlugin` в `TPopoverFocusPlugin`: `TModalFocusPlugin` возвращает фокус при любом закрытии и гасит `mousedown` нажатия мимо. Своя стратегия на базе `TOverlayFocusPlugin`, которой нужно прежнее правило, подписывается на `dismiss` у `TDismissPlugin` сама. Нажатие мимо и Escape плагины слоя передают владельцу, который принимает запрос закрытия (`requestClose`, тип-гард `isCloseRequestable`), с причиной; остальных закрывают записью открытости, как раньше.
- 3a72379: Tags и Select: у ряда тегов два режима переполнения — `wrap` и `scroll`, оба — раскладка темы, без замера ряда и панели. Свою раскладку тегов собирают слотами: `default` у Tags отдаёт показанные теги (`shown`) — их кладут в `Scroller` или делят на ряд и `Popover` за кнопкой, — а новый слот `tags` у Select подменяет ряд тегов в поле и получает инстанс тегов и его коллекцию (`tags`, `engine`) — то, что встроенный `Tags` берёт `:ctrl` и `:engine`. Тема oren красит видом и вариантом набора тег на любой глубине внутри набора, поэтому своя раскладка в слоте выглядит так же, как ряд. Ряд `scroll` в поле Select занимает место по своим тегам, но не больше половины поля: ввод стоит сразу за последним тегом, а тесный ряд прокручивается в своей половине.
- 7b387fb: Пакеты soxa зависят друг от друга точной версией: набор у потребителя всегда собран из одного выпуска.
- 73fa583: Пакет иконок называет происхождение и лицензию самих иконок: это Material Symbols от Google под Apache-2.0, код пакета остаётся под MIT. Поле license — MIT AND Apache-2.0, текст Apache-2.0 уезжает в тарболле файлом LICENSE-Apache-2.0, README называет источник, а dist/index.js открывается комментарием @license — откуда иконки, под какой лицензией и что в них изменено.
- 7bee975: DatePicker: новый компонент (Vue) — поле даты и календарь в панели, паттерн Date Picker Dialog APG. Режим `mode`: `single` (по умолчанию) — поле DateInput с кнопкой календаря в его конце, `range` — поля начала и конца в одной коробке и одна кнопка. Значение — дата `YYYY-MM-DD` или пара `[начало, конец]` (`v-model:value`); его меняют и набор в поле, и выбор в календаре, а недонабранный конец значения не даёт, но и не стирается. Панель открывают кнопка календаря и Alt+↓ на поле (`open`, `v-model:open`, события `open` и `close`): фокус уходит на день сетки — выбранную дату или сегодня, Tab ходит по кругу в панели, Escape закрывает и возвращает фокус, нажатие мимо закрывает панель и оставляет фокус там, куда нажали. Выбор дня закрывает панель (`closeOnSelect`), в диапазоне — второй день; первый Escape посреди диапазона снимает начатый выбор. Полям и календарю DatePicker раздаёт `disabled`, `size`, `variant`, `locale`, `min`, `max`, полям — `readonly` и `required`, календарю — `unavailable`, `weekStart` и `timeZone`. Имена: `triggerLabel` — кнопка и панель, `startLabel` и `endLabel` — концы диапазона, имя поля — `aria_label`. Слоты `trigger-icon` и `item` (содержимое дня), экземпляры — `ctrl.field`, `ctrl.start`, `ctrl.end`, `ctrl.calendar` и `ctrl.engine`. Calendar принимает движок снаружи (`engine`), выбор календаря сообщает выбор пользователя событием `choose`, у фокуса календаря — команда `resetFocus`. Плагины `TDatePickerFocusPlugin`, `TDatePickerTriggerPlugin` и `TDatePickerIdsPlugin`, ловушка Tab модального оверлея — общая утилита `trapTab`, место первого фокуса у `TOverlayFocusPlugin` — точка `_focusCandidates`. Значок кнопки — роль `calendar` (`@soxa-ui/icons-material`, Material Symbols «Calendar Month»); тема oren рисует кнопку, коробку диапазона и панель (`.so-date-picker`, `--single`, `--range`), из темы Select ушло мёртвое правило `.so-select--disabled`.
- 3bfa716: Rating: новый компонент (Vue) — оценка звёздами, паттерн Rating Slider APG: ползунок с одной ручкой на нативном `input[type="range"]`, звёзды — его зрительная шкала. `value` — оценка от 0 до `max` (сколько звёзд, по умолчанию 5), `step` — шаг (по умолчанию 1, `0.5` — половинки), `v-model:value`; событие `commit` — одно на действие. Нажатие ставит звезду под указателем целиком, на левой половине при шаге 0,5 — половину; протяжка ведёт оценку; стрелки — шаг, PageUp и PageDown — звезда, Home — «оценки нет», End — наибольшая; в RTL ряд растёт справа. Наведение показывает оценку, которую поставит нажатие (`preview`, событие `change:preview`); касание — не наведение. `readonly` — оценка только для показа: не меняется и не подсвечивает наведение, у поля `aria-readonly`. Как звучит значение («4 из 5») — `aria-valuetext` из нового раздела локали `rating` во всех шести готовых локалях, числа — по тегу локали; своя полная локаль (`TLocale`) дописывает строку `rating.value` с местами `{value}` и `{max}` или собирается поверх готовой через `extendLocale`. Значок — новая роль иконки `star` (`@soxa-ui/icons-material`, Material Symbols «Star»), слот `icon` со scope `{ value, filled }` рисуется и в пустом, и в залитом слое звезды. Плагины `TRatingHoverPlugin` и `TRatingNamesPlugin`; нажатие и клавиши ведут плагины Slider: `TRating` реализует контракт `ISlidable`. Тема oren рисует звёзды (`.so-rating`, `__track`, `__star`, `__star-fill`): залитая часть — доля `--so-rating-fraction`, цвет без варианта — `caution`.
- 2788652: Пакеты открыты к публикации: сняты private, добавлены publishConfig, files, README и LICENSE. Фреймворк адаптера стал peer-зависимостью, тема и иконки — devDependency: приложение выбирает их само, и второй копии Vue, React или Angular в нём больше не появится. Соседи по скоупу объявлены диапазоном ^0.1.0 вместо "любая версия".
- 3daf6b0: Пакеты отдают собранный ESM и описания типов из dist, а не исходники
- Updated dependencies [85bcbed]
- Updated dependencies [f535f0d]
- Updated dependencies [bb9cd8f]
- Updated dependencies [fe0551e]
- Updated dependencies [45fce47]
- Updated dependencies [b97ee10]
- Updated dependencies [dd5c935]
- Updated dependencies [c9d24bc]
- Updated dependencies [c124dad]
- Updated dependencies [b919172]
- Updated dependencies [eae46e4]
- Updated dependencies [9e0c6e7]
- Updated dependencies [a7cf90d]
- Updated dependencies [ed00f0c]
- Updated dependencies [8b89d9e]
- Updated dependencies [cf94344]
- Updated dependencies [89815b8]
- Updated dependencies [b4243ba]
- Updated dependencies [4f1c80f]
- Updated dependencies [581d47a]
- Updated dependencies [b84aaf2]
- Updated dependencies [de54fc7]
- Updated dependencies [3a72379]
- Updated dependencies [2e53a0f]
- Updated dependencies [0d1a6cb]
- Updated dependencies [e982bdf]
- Updated dependencies [dd268c6]
- Updated dependencies [b0938c0]
- Updated dependencies [5efeeb0]
- Updated dependencies [7b387fb]
- Updated dependencies [d88ab2e]
- Updated dependencies [f2bc1f9]
- Updated dependencies [4fa09bc]
- Updated dependencies [9e22258]
- Updated dependencies [1a1a8e9]
- Updated dependencies [6903a74]
- Updated dependencies [a58f169]
- Updated dependencies [e76d680]
- Updated dependencies [700c746]
- Updated dependencies [7c9d5c6]
- Updated dependencies [ccd7713]
- Updated dependencies [6071ef5]
- Updated dependencies [17bc937]
- Updated dependencies [19d58ac]
- Updated dependencies [a91b783]
- Updated dependencies [bd02d06]
- Updated dependencies [5d2d8a9]
- Updated dependencies [268439c]
- Updated dependencies [95c608b]
- Updated dependencies [c449ef7]
- Updated dependencies [60f8114]
- Updated dependencies [021af92]
- Updated dependencies [21ba816]
- Updated dependencies [0c6f41d]
- Updated dependencies [01e60e2]
- Updated dependencies [05d9f0a]
- Updated dependencies [a8e75d7]
- Updated dependencies [c0c7b0a]
- Updated dependencies [e376e9c]
- Updated dependencies [ff6b7a2]
- Updated dependencies [b715bb9]
- Updated dependencies [a1d81be]
- Updated dependencies [dcee2e2]
- Updated dependencies [0f36216]
- Updated dependencies [bf6a08c]
- Updated dependencies [8d5c70b]
- Updated dependencies [4785689]
- Updated dependencies [6103988]
- Updated dependencies [7b97cec]
- Updated dependencies [7fd538d]
- Updated dependencies [eaffd69]
- Updated dependencies [0abcc93]
- Updated dependencies [7bee975]
- Updated dependencies [cd29b8f]
- Updated dependencies [7cea82e]
- Updated dependencies [3bfa716]
- Updated dependencies [260b56e]
- Updated dependencies [5659d22]
- Updated dependencies [b37a7a1]
- Updated dependencies [b1fad65]
- Updated dependencies [b3dccfc]
- Updated dependencies [2c76370]
- Updated dependencies [3c38d3d]
- Updated dependencies [f7b4492]
- Updated dependencies [268439c]
- Updated dependencies [5f48561]
- Updated dependencies [9aa7f6f]
- Updated dependencies [89ab825]
- Updated dependencies [6bd5ac2]
- Updated dependencies [2788652]
- Updated dependencies [cab24c8]
- Updated dependencies [20c28fa]
- Updated dependencies [3daf6b0]
- Updated dependencies [62d2c7c]
- Updated dependencies [de9a974]
- Updated dependencies [84ab767]
- Updated dependencies [5e219b7]
- Updated dependencies [883e44a]
- Updated dependencies [090daba]
- Updated dependencies [080cf7a]
- Updated dependencies [c3032e2]
- Updated dependencies [0471882]
- Updated dependencies [cd197a5]
- Updated dependencies [87a7a4d]
- Updated dependencies [130ecc5]
- Updated dependencies [b2288b1]
- Updated dependencies [e6213d6]
- Updated dependencies [b2d21dd]
- Updated dependencies [01b6fbc]
- Updated dependencies [8d77de0]
- Updated dependencies [5c86dce]
- Updated dependencies [1b8b606]
- Updated dependencies [daad2de]
- Updated dependencies [b50cc61]
- Updated dependencies [55eccf2]
- Updated dependencies [83dd6f6]
  - @soxa-ui/setup@0.2.0
