import { mount, unmount, tick } from 'svelte'
import Fixture from './Fixture.svelte'
import { install } from './client'
install(async (element, spec) => {
	const app = mount(Fixture, { target: element, props: { spec } })
	await tick()
	return () => {
		void unmount(app)
	}
})
