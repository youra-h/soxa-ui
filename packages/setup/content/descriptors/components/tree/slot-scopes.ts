import type { TTreeItem } from '@soxa-ui/core'
import { defineType } from '../../../../protected/define'

/** Build matching scope metadata for owner slots and the forwarded item slots. */
export function treeSlotScopes() {
	const icon = {
		item: defineType<TTreeItem>(Object),
		expanded: defineType<boolean>(Boolean),
		branch: defineType<boolean>(Boolean),
		loading: defineType<boolean>(Boolean),
	}

	return {
		icon,
		row: {
			...icon,
			text: defineType<string>(String),
			selected: defineType<boolean>(Boolean),
		},
	}
}
