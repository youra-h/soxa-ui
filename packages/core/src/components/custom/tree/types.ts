/** Values are unique across the entire tree, including different branches. */
export type TTreeKey = string | number

/** Input for a tree node. Values identify nodes across moves and data updates. */
export interface ITreeNode {
	readonly value: TTreeKey
	readonly text: string
	readonly disabled?: boolean
	/** Navigation target for a leaf. */
	readonly href?: string
	readonly children?: readonly ITreeNode[]
	/** A branch whose children can be loaded on demand. */
	readonly hasChildren?: boolean
}

/** Load an open branch. Replacing the input nodes or the loader aborts pending requests. */
export type TTreeLoadChildren = (request: {
	value: TTreeKey
	text: string
	/** Pass through to the underlying request so it can stop on cancellation. */
	signal: AbortSignal
}) => Promise<readonly ITreeNode[]>
