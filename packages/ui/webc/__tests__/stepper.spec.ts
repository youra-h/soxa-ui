import { afterEach, expect, it } from 'vitest'
import { TStepperElement } from '@soxa-ui/webc/stepper'

afterEach(() => {
	document.body.replaceChildren()
})

it('keeps declarative items in the list and mounts only the active panel content', async () => {
	const host = document.createElement('div')
	host.innerHTML = `
		<div is="so-stepper" value="first" linear>
			<li is="so-stepper-item" value="first" text="First" completed>
				<b slot="indicator">One</b>
			</li>
			<li is="so-stepper-item" value="second" text="Second"></li>
			<div is="so-stepper-content" slot="content" value="first"><p>First panel</p></div>
			<div is="so-stepper-content" slot="content" value="second"><p>Second panel</p></div>
		</div>
	`
	document.body.append(host)
	await Promise.resolve()

	const root = host.querySelector('[is="so-stepper"]')
	if (!(root instanceof TStepperElement)) throw new Error('Stepper did not register')

	const panels = () =>
		[...root.querySelectorAll('.so-stepper-content p')].map((node) => node.textContent)
	expect(root.querySelector('.so-stepper__list .so-stepper-item__indicator b')?.textContent).toBe(
		'One',
	)
	expect(panels()).toEqual(['First panel'])

	const second = root.querySelectorAll<HTMLButtonElement>('.so-stepper-item__trigger')[1]
	expect(second.disabled).toBe(false)
	second.click()
	await Promise.resolve()

	expect(second.getAttribute('aria-current')).toBe('step')
	expect(panels()).toEqual(['Second panel'])
})
