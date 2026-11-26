import { libConfig } from '../../../tools/vite/lib.config.ts'

export default libConfig({
	name: '@soxa-ui/theme-burg',
	root: import.meta.dirname,
	entry: 'setup/index.ts',
	outDir: 'dist/setup',
})
