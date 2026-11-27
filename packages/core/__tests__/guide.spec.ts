import { describe, expect, it, vi } from 'vitest'
import { TGuide, type IGuideStep } from '@soxa-ui/core'

const welcome: IGuideStep = { id: 'welcome', title: 'Welcome', mode: 'modal' }
const scene: IGuideStep = {
	id: 'scene',
	title: 'Scene',
	anchor: { point: { x: 100, y: 200 } },
}
const finish: IGuideStep = { id: 'finish', title: 'Finish', mode: 'modal' }

describe('Guide', () => {
	it('navigates by order and ID and completes on the last step', () => {
		const guide = new TGuide({ steps: [welcome, scene, finish] })
		const complete = vi.fn()
		guide.events.on('complete', complete)

		expect(guide.next()).toBe(false)
		expect(guide.start()).toBe(true)
		expect(guide.step).toBe(welcome)
		expect(guide.modal).toBe(true)
		expect(guide.previous()).toBe(false)
		expect(guide.next()).toBe(true)
		expect(guide.modal).toBe(false)
		expect(guide.goTo('unknown')).toBe(false)
		expect(guide.goTo('finish')).toBe(true)
		expect(guide.previous()).toBe(true)
		expect(guide.stepNumber).toBe(2)
		expect(guide.next()).toBe(true)
		expect(guide.next()).toBe(true)
		expect(guide.step).toBeUndefined()
		expect(guide.visible).toBe(false)
		expect(complete).toHaveBeenCalledTimes(1)
	})

	it('retains the step by ID while replacing its data and changing the order', () => {
		const guide = new TGuide({ steps: [welcome, scene, finish] })
		guide.start('scene')
		const updated: IGuideStep = { ...scene, anchor: { point: { x: 10, y: 20 } } }
		const change = vi.fn()
		guide.events.on('change:step', change)

		guide.steps = [finish, welcome, updated]

		expect(guide.step).toBe(updated)
		expect(guide.stepNumber).toBe(3)
		expect(change).toHaveBeenCalledExactlyOnceWith({ oldValue: scene, newValue: updated })
		guide.previous()
		expect(guide.step).toBe(welcome)
	})

	it('handles an empty set, duplicate IDs and a cancelled close', () => {
		const guide = new TGuide()
		expect(guide.start()).toBe(false)
		guide.steps = [welcome]
		guide.start()

		expect(() => {
			guide.steps = [scene, scene]
		}).toThrow('IDs must be unique')
		expect(guide.step).toBe(welcome)

		guide.events.on('close:before', (event) => event.preventDefault())
		guide.requestClose('escape')
		expect(guide.visible).toBe(true)
		guide.steps = undefined
		expect(guide.visible).toBe(false)
	})
})
