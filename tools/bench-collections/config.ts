import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import react from '@vitejs/plugin-react'
import solid from 'vite-plugin-solid'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { resolve } from 'node:path'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { angular } from '../../packages/playground/vue/src/vite-angular.ts'
const root = import.meta.dirname
export function config(framework: string, variant: string, server: boolean) {
	const pk = resolve(root, '.cache', variant, 'packages')
	const aliases: Record<string, string> = {
		...Object.fromEntries(
			['radix-ui', 'tailwind-merge', 'class-variance-authority', 'clsx'].map((name) => [
				name,
				fileURLToPath(import.meta.resolve(name)),
			]),
		),
		'@soxa-ui/theme-oren/setup': resolve(pk, 'themes/oren/setup/index.ts'),
		'@soxa-ui/theme-base/setup': resolve(pk, 'themes/base/setup/index.ts'),
		'@soxa-ui/theme-oren': resolve(root, '../../packages/themes/oren/dist/index.css'),
		$fixture: resolve(root, `angular/${variant}.ts`),
		'@soxa-ui/core': resolve(pk, 'core/src/index.ts'),
		'@soxa-ui/plugins': resolve(pk, 'plugins/src/index.ts'),
		'@soxa-ui/setup': resolve(pk, 'setup/index.ts'),
		'@soxa-ui/icons-material': resolve(pk, 'icons/material/src/index.ts'),
		...Object.fromEntries(
			['vue', 'react', 'solid', 'svelte', 'angular', 'webc'].map((fw) => [
				`@soxa-ui/${fw}`,
				resolve(pk, `ui/${fw}/src/index.ts`),
			]),
		),
	}
	const tsconfig = resolve(root, `.cache/angular-${variant}.json`)
	writeFileSync(
		tsconfig,
		JSON.stringify(
			{
				extends: resolve(root, '../../tsconfig.base.json'),
				compilerOptions: {
					experimentalDecorators: true,
					module: 'ESNext',
					target: 'ES2022',
					useDefineForClassFields: false,
					paths: Object.fromEntries(
						Object.entries(aliases).map(([key, path]) => [key, [path]]),
					),
					types: ['node'],
					skipLibCheck: true,
				},
				angularCompilerOptions: { strictTemplates: true },
				files: [resolve(root, `angular/${variant}.ts`)],
			},
			null,
			2,
		),
	)
	const plugins =
		framework === 'vue'
			? [vue()]
			: framework === 'react'
				? [react()]
				: framework === 'solid'
					? [solid({ ssr: server, hot: false })]
					: framework === 'svelte'
						? [svelte()]
						: framework === 'angular'
							? [
									angular({
										tsconfig,
										include: [
											/\/ui\/angular\/src\/.+\.ts$/,
											/\/bench-collections\/angular\/.+\.ts$/,
										],
									}),
								]
							: []
	return defineConfig({
		configFile: false,
		root,
		plugins,
		resolve: {
			alias: aliases,
			dedupe: [
				'react',
				'react-dom',
				'vue',
				'solid-js',
				'svelte',
				'@angular/core',
				'@angular/common',
				'@angular/platform-browser',
				'@angular/forms',
				'rxjs',
			],
		},
		define: {
			'process.env.NODE_ENV': JSON.stringify('production'),
			__BENCH_VARIANT__: JSON.stringify(variant),
			__BENCH_FRAMEWORK__: JSON.stringify(framework),
			__BENCH_SERVER__: JSON.stringify(server),
		},
		ssr: { noExternal: true, target: 'node' },
		build: {
			...(server
				? {
						ssr: resolve(
							root,
							`ssr/${framework}.${['react', 'solid'].includes(framework) ? 'tsx' : 'ts'}`,
						),
					}
				: {}),
			target: server ? 'node24' : 'esnext',
			outDir: resolve(root, `dist/${variant}/${framework}/${server ? 'server' : 'client'}`),
			emptyOutDir: true,
			minify: server ? false : true,
			...(server ? {} : { rolldownOptions: { input: resolve(root, `${framework}.html`) } }),
		},
		logLevel: 'warn',
	})
}
