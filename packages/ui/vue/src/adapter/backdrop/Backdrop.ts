import { defineComponent, h, vShow, withDirectives, type PropType } from 'vue'
import type { TDatasetAttributes } from '@soxa-ui/core'

export default defineComponent({
	expose: [],
	props: {
		classes: Array as PropType<string[]>,
		dataset: Object as PropType<TDatasetAttributes>,
		styles: Object as PropType<Record<string, string | number>>,
		visible: Boolean,
	},
	setup(props) {
		return () =>
			withDirectives(
				h('div', {
					class: props.classes,
					style: props.styles,
					'aria-hidden': 'true',
					...props.dataset,
				}),
				[[vShow, props.visible]],
			)
	},
})
