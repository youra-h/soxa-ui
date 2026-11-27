import { act } from 'react'
import { expect, it } from 'vitest'
import { Stepper } from '@soxa-ui/react'
import { find, mount } from './mount'

it('renders declarative steps and navigates their panels from the content scope', () => {
	const component = mount(
		<Stepper
			value="first"
			linear
			content={({ canNext, next, canPrevious, previous }) => (
				<>
					<Stepper.Content value="first">First panel</Stepper.Content>
					<Stepper.Content value="second">Second panel</Stepper.Content>
					<button type="button" id="previous" disabled={!canPrevious} onClick={previous}>
						Back
					</button>
					<button type="button" id="next" disabled={!canNext} onClick={next}>
						Next
					</button>
				</>
			)}
		>
			<Stepper.Item value="first" completed indicator={({ number }) => <b>{number}</b>}>
				First
			</Stepper.Item>
			<Stepper.Item value="second">Second</Stepper.Item>
		</Stepper>,
	)
	const root = component.root()
	const panel = () => find(root, '.so-stepper-content', HTMLElement)
	const next = find(root, '#next', HTMLButtonElement)
	const previous = find(root, '#previous', HTMLButtonElement)

	expect(panel().textContent).toBe('First panel')
	expect(find(root, '.so-stepper-item__indicator b', HTMLElement).textContent).toBe('1')
	expect(previous.disabled).toBe(true)

	act(() => next.click())
	expect(panel().textContent).toBe('Second panel')
	expect(next.disabled).toBe(true)

	act(() => previous.click())
	expect(panel().textContent).toBe('First panel')
})
