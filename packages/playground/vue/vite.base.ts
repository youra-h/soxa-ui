import vue from '@vitejs/plugin-vue'
import react from '@vitejs/plugin-react'
import solid from 'vite-plugin-solid'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import type { PluginOption } from 'vite'
import { angular } from './src/vite-angular.ts'

/**
 * Плагины, константы и алиасы стенда — одни на три конфига: dev-сервер и
 * сборку (`vite.config.ts`), дымовые тесты в jsdom (`vitest.config.ts`) и
 * браузерный прогон (`vitest.browser.config.ts`). Пока у каждого был свой
 * список, они расходились молча: хост фреймворка, подключённый в одном, падал
 * бы в другом.
 *
 * Стенд потребляет соседние воркспейсы **исходниками**, а не сборкой: правка в
 * `packages/core` видна сразу, без промежуточного билда.
 */

const resolve = (to: string) => path.resolve(import.meta.dirname, to)

/**
 * Плагины фреймворков — каждый на свои папки.
 *
 * Оболочка стенда — Vue, а хосты превью — на своих фреймворках, и `.tsx` у
 * React и Solid одинаковые: плагин фреймворка берёт только папку своего хоста
 * и исходники своего адаптера (`include`), иначе соседний компилировал бы чужой
 * JSX. Пути модулей Vite отдаёт с прямыми слешами.
 *
 * Горячей замены у Solid нет (`hot: false`): solid-refresh ломается вне
 * dev-сервера, а плагины одни на dev-сервер и оба прогона тестов. Правка хоста
 * Solid или его адаптера перезагружает страницу стенда.
 *
 * У Svelte файлы свои — `.svelte` и модули с рунами `.svelte.ts`, — и они
 * есть только в хосте Svelte и исходниках его адаптера: плагину Svelte делить
 * нечего, и `include` ему не нужен. Конфиг Svelte он берёт отсюда же — им
 * пользуется и svelte-check хоста.
 *
 * Angular компилирует свой компилятор (`src/vite-angular.ts`) — `.ts` хоста
 * Angular и исходников его адаптера (`include`) по программе `tsconfig.json`
 * хоста; остальной `.ts` компилирует сам Vite. Там же линкер пакетов Angular.
 */
export function plugins(): PluginOption[] {
	return [
		vue(),
		react({
			include: [
				/\/playground\/vue\/src\/hosts\/react\/.+\.[jt]sx?$/,
				/\/ui\/react\/src\/.+\.[jt]sx?$/,
			],
		}),
		solid({
			hot: false,
			include: [
				/\/playground\/vue\/src\/hosts\/solid\/.+\.[jt]sx?$/,
				/\/ui\/solid\/src\/.+\.[jt]sx?$/,
			],
		}),
		svelte(),
		angular({
			tsconfig: resolve('src/hosts/angular/tsconfig.json'),
			include: [
				/\/playground\/vue\/src\/hosts\/angular\/.+\.ts$/,
				/\/ui\/angular\/src\/.+\.ts$/,
			],
		}),
	]
}

/**
 * Константы сборки (`define`): версия библиотеки — под названием стенда в
 * шапке (`AppHeader.vue`, объявлена в `env.d.ts`).
 *
 * Версия у библиотечных пакетов одна, и двигает её выпуск, поэтому стенд не
 * держит свою копию, а берёт её из манифеста ядра: написанная руками, она
 * отстала бы с первым же выпуском.
 */
export function constants(): Record<string, string> {
	const file = resolve('../../core/package.json')
	const manifest: unknown = JSON.parse(readFileSync(file, 'utf-8'))

	if (
		typeof manifest !== 'object' ||
		manifest === null ||
		!('version' in manifest) ||
		typeof manifest.version !== 'string'
	) {
		throw new Error(`[playground] ${file}: нет версии`)
	}

	return { __SOXA_VERSION__: JSON.stringify(manifest.version) }
}

/**
 * The playground uses built CSS for Oren and reads Burg's plain CSS directly
 * from the workspace. Both CSS aliases are skipped for jsdom. The Oren setup
 * alias comes before its package root because aliases also match prefixes.
 */
export function aliases({ themeCss }: { themeCss: boolean }): Record<string, string> {
	return {
		'@soxa-ui/theme-oren/setup': resolve('../../themes/oren/setup/index.ts'),
		'@soxa-ui/theme-base/setup': resolve('../../themes/base/setup/index.ts'),
		...(themeCss
			? {
					'@soxa-ui/theme-oren': resolve('../../themes/oren/dist/index.css'),
					'@soxa-ui/theme-burg': resolve('../../themes/burg/src/index.css'),
				}
			: {}),
		'@soxa-ui/core': resolve('../../core/src'),
		'@soxa-ui/icons-lucide': resolve('../../icons/lucide/src'),
		'@soxa-ui/icons-material': resolve('../../icons/material/src'),
		'@soxa-ui/plugins': resolve('../../plugins/src'),
		'@soxa-ui/setup': resolve('../../setup/index.ts'),
		'@soxa-ui/vue': resolve('../../ui/vue/src/index.ts'),
		'@soxa-ui/react': resolve('../../ui/react/src/index.ts'),
		'@soxa-ui/solid': resolve('../../ui/solid/src/index.ts'),
		'@soxa-ui/svelte': resolve('../../ui/svelte/src/index.ts'),
		'@soxa-ui/webc': resolve('../../ui/webc/src/index.ts'),
		'@soxa-ui/angular': resolve('../../ui/angular/src/index.ts'),
		'@soxa-ui/playground-shared': resolve('../shared/src/index.ts'),
	}
}
