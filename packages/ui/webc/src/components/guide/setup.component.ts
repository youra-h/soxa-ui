import { GuideDescriptor, type DescriptorPluginOutputs } from '@soxa-ui/setup'
import type { IGuide } from '@soxa-ui/core'
import { createWebcAdapterContext, useAdapter } from '../../adapter'
import type { TBinding, TUpdateListener } from '../../adapter'

export type TGuideOutputs = DescriptorPluginOutputs<typeof GuideDescriptor>

export function setupGuide(
	host: HTMLElement,
	ctrl: IGuide | undefined,
	props: Record<string, unknown>,
	onUpdate: TUpdateListener,
): TBinding<IGuide, unknown, TGuideOutputs> {
	const adapter = createWebcAdapterContext(host, GuideDescriptor(), { ctrl, props })

	return useAdapter(adapter, host, onUpdate)
}
