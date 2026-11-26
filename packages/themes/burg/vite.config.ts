import path from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
	root: import.meta.dirname,
	build: {
		outDir: 'dist',
		// CSS watch and one-off rebuilds share dist with the separate setup build.
		emptyOutDir: false,
		rollupOptions: {
			input: path.resolve(import.meta.dirname, 'src/index.css'),
			output: { assetFileNames: 'index.css' },
		},
	},
})
