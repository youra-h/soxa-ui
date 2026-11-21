export default defineNuxtConfig({
	compatibilityDate: '2026-11-14',
	devtools: { enabled: false },
	css: ['@soxa-ui/theme-oren'],
	app: { head: { title: 'Soxa travel preferences', htmlAttrs: { lang: 'en' } } },
})
