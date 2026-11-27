import { createRouter, createWebHashHistory } from 'vue-router'
import OverviewPage from './views/OverviewPage.vue'
import ComponentPage from './views/ComponentPage.vue'
import TestsPage from './views/TestsPage.vue'
import AppSidebar from './components/AppSidebar.vue'
import TestsSidebar from './components/TestsSidebar.vue'
import { scenariosOf, testsPath } from './catalog'
import { isFramework, loadHost } from './hosts'
import { DEFAULT_ROUTE, rememberProperties } from './navigation'

/**
 * История в хеше, а не в путях: стенд открывают и как dev-сервер, и как
 * статику из файла — при `createWebHistory` второй вариант отдаёт 404 на любой
 * маршрут, кроме корня.
 *
 * Первый сегмент — фреймворк превью: `/react/button`, `/vue/tests/events`.
 * Оболочка одна, на Vue, а компонент рисует хост выбранного фреймворка.
 *
 * Левая панель — именованный вид маршрута: у страницы свойств меню
 * компонентов, у страницы тестов меню тем.
 */
export const router = createRouter({
	history: createWebHashHistory(),
	routes: [
		{ path: '/', redirect: DEFAULT_ROUTE },
		{
			path: '/:framework(vue)/stepper/examples',
			name: 'stepper-examples',
			components: {
				default: () => import('./views/StepperExamples.vue'),
				sidebar: AppSidebar,
			},
		},
		{
			path: '/:framework',
			name: 'overview',
			components: { default: OverviewPage, sidebar: AppSidebar },
			props: { default: true },
		},
		{
			// Без темы — первая доступная; тем нет — пустое состояние страницы
			path: '/:framework/tests',
			name: 'tests',
			components: { default: TestsPage, sidebar: TestsSidebar },
			props: { default: true },
		},
		{
			// Без компонента — первый в теме; темы нет — страница так и скажет
			path: '/:framework/tests/:topic',
			name: 'topic',
			components: { default: TestsPage, sidebar: TestsSidebar },
			props: { default: true },
		},
		{
			path: '/:framework/tests/:topic/:component',
			name: 'scenarios',
			components: { default: TestsPage, sidebar: TestsSidebar },
			props: { default: true },
		},
		{
			path: '/:framework/:id',
			name: 'component',
			components: { default: ComponentPage, sidebar: AppSidebar },
			props: { default: true },
		},
		{ path: '/:pathMatch(.*)*', redirect: DEFAULT_ROUTE },
	],
})

/**
 * Хост фреймворка грузится до входа на страницу: страницы получают его
 * готовым (`hostOf`). Неизвестный фреймворк — на стенд по умолчанию.
 *
 * Здесь же, а не в `beforeEnter` маршрута, — тесты без темы или компонента:
 * `beforeEnter` не зовётся, когда меняются только параметры, а переход
 * `/vue/tests` → `/react/tests` — ровно такой.
 */
router.beforeEach(async (to) => {
	const { framework } = to.params

	if (framework === undefined) return true
	if (!isFramework(framework)) return DEFAULT_ROUTE

	const host = await loadHost(framework)

	if (to.name === 'tests' || to.name === 'topic') {
		const topic = typeof to.params.topic === 'string' ? to.params.topic : undefined

		return testsPath(framework, scenariosOf(host), topic) ?? true
	}

	return true
})

router.afterEach(rememberProperties)
