import { defineConfig } from 'vite'

export default defineConfig({
	build: {
		rollupOptions: {
			input: { index: 'index.css', setup: 'setup.ts' },
			preserveEntrySignatures: 'strict',
			external: (id) => id.startsWith('@soxa-ui/'),
			output: {
				format: 'es',
				entryFileNames: '[name].js',
				assetFileNames: '[name][extname]',
			},
		},
	},
})
