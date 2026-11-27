import { GuideDescriptor } from '@soxa-ui/setup'
import { useComponent } from '../../adapter'
import type { GuideProps } from './base.component'

export function useSetupGuide(props: GuideProps) {
	return useComponent((create) => create(GuideDescriptor(), { ctrl: props.ctrl, props }), props)
}
