# SSR коллекций: исследовательская фикстура

Текущая задача — [1an4hvw5ytb](https://app.clickup.com/t/1an4hvw5ytb).
**Выбранный владельцем explicit initial реализован во всех шести адаптерах.**
[Контракт, карта проверок и измеренная стоимость кандидата](TRANSPORT.md).
Содержимое fixture и старые JSON ниже сохраняют историю предыдущего transport
эксперимента; они не заменяют production-тесты нового initial.

Решение владельца от **15.11.2026 13:26** требует одного механизма для
React/Vue/Svelte/Solid с Angular как контролем и проверкой применимого
клиентского lifecycle Web Components. Все три задачи исправлений —
[React/Next](https://app.clickup.com/t/1an4hvw5ykt),
[Tab-остановки](https://app.clickup.com/t/1an4hvw5ytc),
[собственные id](https://app.clickup.com/t/1an4hvw5yte) — ожидают этот механизм.
Общая приёмка — [1an4hvw5yut](https://app.clickup.com/t/1an4hvw5yut).
Прежний вывод о снятии зависимости Vue/Svelte/Solid заменён этим решением.
Зелёные исследовательские тесты не означают готовность задачи и не разблокируют
отдельные исправления.

## Запуск

```sh
npm run check:ssr-collection-prototype
```

Полный запуск создаёт временную папку, устанавливает закреплённые опубликованные
пакеты и выполняет исторические отрицательные/положительные проверки,
гидратацию и новый native gate. Нужен доступ к npm registry. Репозиторий и его
node_modules не изменяются. Результаты и путь к фикстуре печатаются в конце.

Только новый native эксперимент:

```sh
npm run check:ssr-collection-prototype -- --native-only
npm run check:ssr-collection-prototype -- --native-only --reuse <absolute-fixture-directory>
```

`--reuse` принимает только внешнюю временную фикстуру этого инструмента,
проверяет pinned dependencies в lock-файле и не запускает установку.
React 19.3.1, Vue 3.5.44, Svelte 5.57.2, Solid 1.9.17, Angular 22.2.3,
Soxa 0.4.0, jsdom 30.1.3; полный список — [run.mjs](run.mjs).

## Происхождение и исторический результат

Baseline перенесён из [PR #881](https://github.com/youra-h/soxa-ui/pull/881),
head `5ce1f7bd0`, без merge чужой ветки. Исходный main — `42fd3e3f1`.
Отрицательные assertions и два исторических результата сохранены:
[React/Vue](results/2026-11-15.json),
[Vue/Svelte/Solid и Angular control](results/2026-11-15-cross.json).

Baseline исполняет инструментированные Candidate-компоненты в scan, затем
рисует окончательное дерево Soxa на подготовленном engine. Простые синхронные
примеры проходят: панель/одна остановка Tab, параллельные request plans,
гидратация в jsdom. **Кандидат как общий механизм отвергнут**:

1. React scan сохраняет вкладку из отброшенного primary Suspense.
2. После streaming/onAllReady в плане остаётся исчезнувший fallback.
3. Native useId меняется при подмене scan-обёрток окончательным деревом.
4. Сбор элементов не доставляет поздний пользовательский id панели раннему табу.
5. Внешний engine отклоняется без изменения; поддержка ownership не реализована.
6. Vue/Svelte/Solid ordinal scan смещает идентичность вложенного набора,
   обнаруженного в неактивной панели, но отсутствующего в final.

Это ошибки/ограничения кандидата, а не доказательство невозможности других
решений или тождества renderer. Новые native проверки в
[TRANSPORT.md](TRANSPORT.md) отдельно проверяют неизменённое настоящее дерево.

Исторические замеры: 100 вкладок, прогрев, девять раундов и чередование режимов.
Для стоимости discovery сравниваются prototype и prepared с одинаковым полным
HTML; React baseline панели не рисует и равной работой не является. Heap delta
сразу после вызова не является peak/retained memory или доказательством cleanup.
Новый transport gate не даёт производственных измерений стоимости.

Гидратация baseline проверялась в jsdom, включая отдельно собранные клиентские
Svelte/Solid-модули и Angular provideClientHydration. Реальный Tab, раскладка,
полные Next/Nuxt/SvelteKit/SolidStart и новые production-регрессии не заявляются.
В историческом baseline публичное API и protected не менялись; tools-only
changeset ему не требовался. Текущая production-интеграция несёт patch changeset
и два protected изменения по отдельному согласию владельца 2319.
Merge/release не входят в этот этап.

## Измерение текущего initial

После `npm run build`:

```powershell
$env:NODE_ENV = 'production'
node --expose-gc tools/ssr-collection-prototype/initial-performance.mjs
```

[Скрипт](initial-performance.mjs) сравнивает полный SSR с прежним items при
эквивалентном HTML и отдельно измеряет capture и удерживаемый снимок.
[Сохранённый запуск](results/2026-11-15-initial-performance.json) привязан к
хешам собранного JS. Это один локальный production React SSR замер; он не
измеряет HTTP, RSC или гидратацию и не утверждает приемлемость deep copy.
