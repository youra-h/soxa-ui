import { defineConfig } from 'vite'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { openInEditor } from './src/vite-open-in-editor.ts'
import { aliases, constants, plugins } from './vite.base.ts'

const git = (args: string[]) =>
	execFileSync('git', args, { cwd: import.meta.dirname, encoding: 'utf8' }).trim()

/** A source archive can build without Git metadata; its report states that explicitly. */
function sourceProvenance() {
	try {
		return {
			commit: git(['rev-parse', 'HEAD']),
			workingTree: git(['status', '--porcelain']) ? 'modified' : 'clean',
		}
	} catch {
		return { commit: 'unknown', workingTree: 'unknown' }
	}
}

/**
 * The playground consumes workspace source directly, with built CSS for Oren.
 * Both HTML entries use the same framework plugins and aliases.
 */
export default defineConfig({
	plugins: [...plugins(), openInEditor()],
	define: {
		...constants(),
		__MANUAL_A11Y_SOURCE__: JSON.stringify(sourceProvenance()),
	},
	build: {
		rolldownOptions: {
			input: {
				playground: fileURLToPath(new URL('./index.html', import.meta.url)),
				accessibility: fileURLToPath(new URL('./accessibility.html', import.meta.url)),
			},
		},
	},
	resolve: {
		alias: aliases({ themeCss: true }),
	},
})
