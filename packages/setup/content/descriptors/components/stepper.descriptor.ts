/**
 * Stepper owner, item, panel and collection descriptors.
 */

import {
	TStepper,
	TStepperCollectionFacade,
	TStepperContent,
	TStepperItem,
	TStepperItemCollectionFacade,
} from '@soxa-ui/core'
import type { IStepperItem, TStepperValue } from '@soxa-ui/core'
import { defineComponent, defineDescriptor, defineType } from '../../../protected/define'
import {
	ActionPluginDescriptor,
	CollectionBundlesPluginDescriptor,
	CollectionInitialPartPluginDescriptor,
	CollectionInitialPluginDescriptor,
} from '../plugins'
import { CollectionDescriptor } from './collection'
import { ComponentViewDescriptor } from './component-view.descriptor'
import { OWNER_STYLE_PROPS } from './stylable.descriptor'
import { ValueControlDescriptor } from './value-control.descriptor'

const stepScope = {
	value: defineType<string | number>([String, Number]),
	number: defineType<number>(Number),
	active: defineType<boolean>(Boolean),
	completed: defineType<boolean>(Boolean),
	error: defineType<boolean>(Boolean),
}

const navigationScope = {
	value: defineType<TStepperValue>([String, Number]),
	canNext: defineType<boolean>(Boolean),
	canPrevious: defineType<boolean>(Boolean),
	next: defineType<() => boolean>(Function),
	previous: defineType<() => boolean>(Function),
}

export const StepperDescriptor = defineDescriptor(() =>
	defineComponent({
		ctor: TStepper,
		plugins: [
			CollectionInitialPluginDescriptor,
			CollectionBundlesPluginDescriptor,
			ActionPluginDescriptor.with({
				focusTarget: (root) =>
					root.querySelector(':scope > ol > li > button[aria-current="step"]:enabled') ??
					root.querySelector(':scope > ol > li > button:enabled'),
			}),
		],
		extends: ValueControlDescriptor(),
		contribution: {
			props: {
				value: { type: [String, Number], triggers: ['change:value'] },
				linear: { type: Boolean, triggers: ['change:linear'] },
				interactive: { type: Boolean, triggers: ['change:interactive'] },
				orientation: { type: String, triggers: ['change:orientation'] },
			},
			slots: {
				default: { description: 'Declarative steps in list order' },
				item: {
					scope: { item: defineType<IStepperItem>(Object) },
					description: 'Replace the default rendering of a data item',
				},
				content: {
					scope: navigationScope,
					description: 'Panels and controls outside the list',
				},
			},
			events: ['change:linear', 'change:interactive', 'change:orientation'],
		},
	}),
)

export const StepperCollectionDescriptor = defineDescriptor(() =>
	defineComponent({
		ctor: TStepperCollectionFacade,
		extends: CollectionDescriptor(),
		contribution: {
			props: {
				stepper_canNext: { type: Boolean, protected: true, triggers: ['change:steps'] },
				stepper_canPrevious: { type: Boolean, protected: true, triggers: ['change:steps'] },
			},
			events: ['item:activate:before', 'change:activation'],
		},
	}),
)

export const StepperItemDescriptor = defineDescriptor(() =>
	defineComponent({
		ctor: TStepperItem,
		plugins: [
			CollectionInitialPartPluginDescriptor,
			ActionPluginDescriptor.with({
				focusTarget: (item) =>
					item.querySelector(':scope > button.so-stepper-item__trigger'),
			}),
		],
		extends: ValueControlDescriptor(),
		contribution: {
			props: {
				value: { type: [String, Number], triggers: ['change:value'] },
				...OWNER_STYLE_PROPS,
				text: { type: String, triggers: ['change:text'] },
				description: { type: String, triggers: ['change:description'] },
				completed: { type: Boolean, triggers: ['change:completed'] },
				error: { type: Boolean, triggers: ['change:error'] },
			},
			slots: {
				leading: { scope: stepScope, description: 'Metadata before the step header' },
				indicator: {
					scope: stepScope,
					description: 'Replace the default status icon or step number',
				},
				default: { scope: stepScope, description: 'Replace the step label' },
				subtitle: { scope: stepScope, description: 'Replace the description' },
				separator: {
					scope: stepScope,
					description: 'Decorative connector to the next step',
				},
				details: {
					scope: stepScope,
					description: 'Metadata or controls after the step header',
				},
			},
			events: ['change:text', 'change:description', 'change:completed', 'change:error'],
		},
	}),
)

export const StepperCollectionItemDescriptor = defineDescriptor(() =>
	defineComponent({
		ctor: TStepperItemCollectionFacade,
		contribution: {
			props: {
				active: { type: Boolean, protected: true, triggers: ['change:active'] },
				stepper_number: { type: Number, protected: true, triggers: ['change:steps'] },
				stepper_hasSeparator: {
					type: Boolean,
					protected: true,
					triggers: ['change:steps'],
				},
				stepper_canActivate: { type: Boolean, protected: true, triggers: ['change:steps'] },
				stepper_interactive: { type: Boolean, protected: true, triggers: ['change:steps'] },
			},
		},
	}),
)

export const StepperContentDescriptor = defineDescriptor(() =>
	defineComponent({
		ctor: TStepperContent,
		extends: ComponentViewDescriptor(),
		contribution: {
			props: {
				value: { type: [String, Number], triggers: ['change:value'] },
				active: { type: Boolean, protected: true, triggers: ['change:active'] },
			},
			slots: {
				default: { description: 'Content of the corresponding active step' },
			},
			events: ['change:value'],
		},
	}),
)
