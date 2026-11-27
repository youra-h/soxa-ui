import { GuideDescriptor } from '@soxa-ui/setup'
import type { IGuide } from '@soxa-ui/core'
import { createAngularAdapterContext, useAdapter } from '../../adapter'
import type { TBinding } from '../../adapter'

export function setupGuide(ctrl: IGuide | undefined, props: object): TBinding<IGuide> {
	const adapter = createAngularAdapterContext(GuideDescriptor(), { ctrl, props })

	return useAdapter(adapter)
}
