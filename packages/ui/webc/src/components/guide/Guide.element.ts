import { GuideDescriptor } from '@soxa-ui/setup'
import type { IGuide } from '@soxa-ui/core'
import { ElementBase, defineElement, type TElementClassOf, type TElementType } from '../../adapter'
import { guideTemplate } from './guide.template'
import { setupGuide } from './setup.component'

export const TGuideElement: TElementClassOf<typeof HTMLDivElement, typeof GuideDescriptor, IGuide> =
	ElementBase(HTMLDivElement, {
		descriptor: GuideDescriptor,
		template: guideTemplate,
		root: { strategy: 'host', teleport: { target: 'target' } },
		setup: setupGuide,
	})

defineElement('so-guide', TGuideElement, 'div')

export type TGuideElementProps = TElementType<typeof TGuideElement>
