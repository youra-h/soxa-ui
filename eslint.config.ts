import { fileURLToPath } from 'node:url'
import { globalIgnores } from 'eslint/config'
import { includeIgnoreFile } from '@eslint/compat'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import pluginSvelte from 'eslint-plugin-svelte'
import svelteParser from 'svelte-eslint-parser'
import tseslint from 'typescript-eslint'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'
import soxa from './tools/eslint/plugin'

export default defineConfigWithVueTs(
	{
		name: 'app/files-to-lint',
		files: ['**/*.{ts,mts,tsx,vue,svelte}'],
	},

	// Чего не видит git, того не видит и линтер. Второй список игнорируемых
	// путей неизбежно расходится с `.gitignore`: ручной уже разошёлся — в нём
	// не было ни `packages/playground/*/scratch/` (черновики и снимки отладки,
	// которые AGENTS.md сам предлагает туда класть), ни `test-results/`, ни
	// `packages/_plugins/`, и `npm run lint` краснел на файлах, которых в
	// репозитории нет. Поэтому список один — сам `.gitignore`.
	includeIgnoreFile(fileURLToPath(new URL('.gitignore', import.meta.url)), 'soxa/gitignore'),

	// `.angular` объявлен в `packages/ui/angular/.gitignore`: корневой файл о
	// нём не знает, а `includeIgnoreFile` читает ровно один файл.
	globalIgnores(['**/.angular/**']),
	// Generated benchmark inputs are immutable experimental evidence, not maintained source.
	// Their syntax, runtime, console and behavior are checked by the comparison harness.
	globalIgnores(['benchmarks/ai/inputs/**', 'benchmarks/ai/runs/**']),
	// Upstream source fixtures keep their published syntax; the benchmark validates their runtime.
	globalIgnores(['tools/bench-collections/shadcn/**']),

	pluginVue.configs['flat/essential'],
	vueTsConfigs.recommended,

	// Компоненты Svelte: `<script lang="ts">` разбирает TS-парсер внутри
	// svelte-eslint-parser, поэтому блоки ниже (no-casts, no-explicit-any) видят
	// в них те же узлы, что в `.ts`. `.svelte.ts` сюда не входят — это обычный
	// TypeScript, их по-прежнему разбирает парсер из vueTsConfigs.
	{
		name: 'soxa/svelte-components',
		files: ['**/*.svelte'],
		plugins: { svelte: pluginSvelte },
		processor: 'svelte/svelte',
		languageOptions: {
			parser: svelteParser,
			parserOptions: {
				parser: tseslint.parser,
				extraFileExtensions: ['.svelte'],
			},
		},
		rules: {
			'svelte/comment-directive': 'error',
			'svelte/system': 'error',
		},
	},

	// Библиотека компонентов: Button, Select, Input — это имена продукта.
	// Оба правила рассчитаны на прикладной код, где односложное имя рискует
	// столкнуться с будущим HTML-элементом и потому просит префикс. В SFC
	// библиотеки компоненты импортируются явно, компилятор резолвит локальный
	// биндинг, и коллизии с нативными тегами не возникает.
	// Подчёркивание — принятая в проекте пометка «связывание нужно, значение
	// нет»: пустые хуки для наследников (onEngineBound(_engine)), сигнатуры,
	// которые держит контракт базового класса, и отбрасывание ключей при
	// деструктуризации ({ class: _, style: __, ...rest }). Правило про это не
	// знало и требовало удалить то, что удалять нельзя.
	{
		name: 'soxa/unused-underscore',
		rules: {
			// `interface ISwitchProps extends IInputControlProps<boolean> {}` —
			// не пустышка, а именованная точка расширения: у компонента есть свой
			// публичный тип пропсов, на который ссылаются адаптеры и в который
			// добавляют поля, когда они появляются. Замена на алиас отняла бы
			// и слияние деклараций, и понятное имя в ошибках типов.
			'@typescript-eslint/no-empty-object-type': [
				'error',
				{ allowInterfaces: 'with-single-extends' },
			],
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_',
					destructuredArrayIgnorePattern: '^_',
				},
			],
		},
	},

	// Пространство имён — только в объявлении типов. Типы JSX у Solid — namespace
	// (`JSX` из `solid-js`), и дополнить его иначе, чем
	// `declare module 'solid-js' { namespace JSX { … } }`, нельзя: так адаптер
	// Solid объявляет свойство узла, которого нет в его типах
	// (`ExplicitProperties`, `packages/ui/solid/src/types.ts`). Рантайм-namespace
	// по-прежнему запрещён: опция пропускает его только внутри `declare`.
	{
		name: 'soxa/namespace-declarations',
		files: ['**/*.{ts,mts,tsx,vue,svelte}'],
		rules: {
			'@typescript-eslint/no-namespace': ['error', { allowDeclarations: true }],
		},
	},

	// `any` пропускается только там, где он стирает инвариантность, а не прячет
	// тип. Встроенное правило этих позиций не различает (см. AGENTS.md,
	// «`any`: где он честный»).
	{
		name: 'soxa/no-explicit-any',
		files: ['**/*.{ts,mts,tsx,vue,svelte}'],
		plugins: { soxa },
		rules: {
			'@typescript-eslint/no-explicit-any': 'off',
			'soxa/no-explicit-any': 'error',
		},
	},

	// Приведения, которые прячут несовпавший контракт, запрещены целиком
	// (см. AGENTS.md, «Никаких костылей»). `as any` ловит soxa/no-explicit-any,
	// `@ts-ignore`/`@ts-nocheck` — ban-ts-comment из recommended. Что блок
	// действительно включён на путях пакетов, проверяет tools/eslint/__tests__.
	{
		name: 'soxa/no-casts',
		files: ['**/*.{ts,mts,tsx,vue,svelte}'],
		rules: {
			// `x!` — то же приведение к «не пусто» без проверки. Definite
			// assignment у поля (`private _a!: string`) правило не ловит.
			'@typescript-eslint/no-non-null-assertion': 'error',
			'@typescript-eslint/consistent-type-assertions': [
				'error',
				{ assertionStyle: 'as', objectLiteralTypeAssertions: 'allow' },
			],
			'no-restricted-syntax': [
				'error',
				{
					selector: "TSAsExpression[typeAnnotation.type='TSNeverKeyword']",
					message:
						'`as never` прячет несовпавший контракт — почините тип (AGENTS.md, «Никаких костылей»).',
				},
				{
					selector:
						"TSAsExpression > TSAsExpression[typeAnnotation.type='TSUnknownKeyword']",
					message:
						'`as unknown as X` прячет несовпавший контракт — почините тип (AGENTS.md, «Никаких костылей»).',
				},
				{
					selector: "TSAsExpression[typeAnnotation.typeName.name='TEvented']",
					message:
						'`as TEvented<…>` — свои события класс шлёт через TEventSink (AGENTS.md, «События item-адаптера»).',
				},
				// Сосед по коллекции приведением: `x.extensions.selection as …`,
				// `x?.extensions?.filter as …` и вся карта — `x.extensions as …`.
				// Перенос строки перед типом и `?.` дерево не меняют; цепочка с
				// `?.` в нём — ChainExpression вокруг обращений. Приведение члена
				// соседа (`x.extensions.selection.selected as …`) правило не ловит.
				{
					selector:
						"TSAsExpression:matches([expression.property.name='extensions'], [expression.object.property.name='extensions'], [expression.expression.property.name='extensions'], [expression.expression.object.property.name='extensions'])",
					message:
						'Соседа по коллекции находят охранником `*Of` (`selectionOf(ctx)`, `batchOf(engine)`), а не приведением `extensions` (docs/agents/collections.md, «Сосед по коллекции — по контракту»).',
				},
			],
		},
	},

	// Держите движок — `engine`, фасад — `facade`, контекст фасада —
	// `collectionAdapter` (AGENTS.md, «Переменная — `engine`, а не `collection`»).
	// `id-denylist` ловит имя у объявления, параметра, поля (и `#collection`),
	// ключа объекта и члена типа и запись `x.collection = …`. Чтение чужого
	// свойства, имена, где слово лишь часть (`TCollectionEngine`,
	// `collectionAdapter`), строки и пути он пропускает. Что блок включён на
	// путях пакетов, проверяет tools/eslint/__tests__.
	{
		name: 'soxa/no-collection-name',
		files: ['**/*.{ts,mts,tsx,vue,svelte}'],
		rules: {
			'id-denylist': ['error', 'collection', '_collection'],
		},
	},

	// В тестах ядра `any` запрещён в любой позиции: инвариантных карт событий в
	// констрейнтах там нет, а любой `any` глушит проверку, ради которой тест.
	{
		name: 'soxa/core-tests-no-any',
		files: ['packages/core/__tests__/**/*.ts'],
		rules: {
			'soxa/no-explicit-any': 'off',
			'@typescript-eslint/no-explicit-any': 'error',
		},
	},

	{
		name: 'soxa/ui-component-names',
		files: ['packages/ui/**/*.vue'],
		rules: {
			'vue/multi-word-component-names': 'off',
			'vue/no-reserved-component-names': 'off',
		},
	},

	// Компоненты Vue — только проводка того, что отдал адаптер (AGENTS.md,
	// «Механизмы фреймворка — только в адаптерном слое»). `'vue'` тут не
	// импортируют вовсе — реактивность и `toRaw` живут в `src/adapter/**`.
	// Второй запрет ловит именно ту забытую проводку, из-за которой заведена
	// задача 869f1qdxd: `createAdapterContext` напрямую пропускает снятие
	// прокси с `ctrl`/`engine`, которое делает `createVueAdapterContext`.
	{
		name: 'soxa/vue-components-no-framework',
		files: ['packages/ui/vue/src/components/**/*.{ts,vue}'],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					paths: [
						{
							name: 'vue',
							message:
								'Механизмы Vue — только в src/adapter/** (AGENTS.md, «Механизмы фреймворка — только в адаптерном слое»).',
						},
						{
							name: '@soxa-ui/setup',
							importNames: ['createAdapterContext'],
							message:
								'Используйте createVueAdapterContext из src/adapter/common — он снимает Vue-прокси с ctrl/engine.',
						},
					],
				},
			],
		},
	},
	// Компоненты React — только проводка того, что отдал адаптер (AGENTS.md,
	// «Механизмы фреймворка — только в адаптерном слое»). Значения из 'react'
	// запрещены (это ловит и `import * as React` → `React.useRef`), но типы
	// (`ElementType`, `ReactElement`) компонентам нужны — `allowTypeImports`
	// пропускает `import type { ... } from 'react'`. Отсюда
	// `@typescript-eslint/no-restricted-imports`, а не базовое `no-restricted-imports`:
	// только у него есть эта опция. Контекст компонент собирает функцией
	// `create`, которую отдаёт `useAdapterContext`: она несёт основу `id` от
	// `useId`, и прямой `createAdapterContext` её молча потерял бы.
	{
		name: 'soxa/react-components-no-framework',
		files: ['packages/ui/react/src/components/**/*.{ts,tsx}'],
		rules: {
			'@typescript-eslint/no-restricted-imports': [
				'error',
				{
					paths: [
						{
							name: 'react',
							allowTypeImports: true,
							message:
								'Механизмы React — только в src/adapter/** (AGENTS.md, «Механизмы фреймворка — только в адаптерном слое»).',
						},
						{
							name: '@soxa-ui/setup',
							importNames: ['createAdapterContext'],
							message:
								'Собирайте контекст функцией create из useAdapterContext — она несёт основу id от useId.',
						},
					],
				},
			],
		},
	},
	// Атрибуты узла разметки компонента Solid — от помощника адаптера, а не
	// спредом прямо из состояния: набор, сменившийся во время гидратации, спред
	// запомнил бы как записанный, и до узла он не дошёл бы
	// (packages/ui/solid/src/adapter/common/root.ts, шапка, «Гидратация»).
	// Своё правило, а не `no-restricted-syntax`: flat config заменил бы им
	// селекторы `soxa/no-casts` на этих путях. Что блок включён, проверяет
	// tools/eslint/__tests__.
	{
		name: 'soxa/solid-part-props',
		files: ['packages/ui/solid/src/components/**/*.tsx'],
		plugins: { soxa },
		rules: {
			'soxa/solid-part-props': 'error',
		},
	},
	// Ветки и петли компонента Solid — примитивы адаптера, а не Solid: ветка или
	// петля Solid, сменившаяся в окне гидратации, ищет новый узел по ключу
	// чужого окна (`Hydration Mismatch`) и не снимает старый, а примитивы
	// адаптера держат прежнее до конца окна
	// (packages/ui/solid/src/adapter/runtime/flow.ts). `Switch` и `Match` — туда
	// же: своих у адаптера пока нет. Что блок включён, проверяет
	// tools/eslint/__tests__.
	{
		name: 'soxa/solid-components-flow',
		files: ['packages/ui/solid/src/components/**/*.{ts,tsx}'],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					paths: [
						{
							name: 'solid-js',
							importNames: ['Show', 'For', 'Index', 'Switch', 'Match'],
							message:
								'Ветки и петли компонента — из src/adapter/runtime/flow: они переживают окна гидратации (шапка модуля).',
						},
					],
				},
			],
		},
	},
	skipFormatting,
)
