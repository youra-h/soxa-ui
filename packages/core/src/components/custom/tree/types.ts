export type TTreeKey = string | number

/** Input for a tree node. Values identify nodes across moves and data updates. */
export interface ITreeNode {
	readonly value: TTreeKey
	readonly text: string
	readonly disabled?: boolean
	readonly href?: string
	readonly children?: readonly ITreeNode[]
	/** A branch whose children can be loaded on demand. */
	readonly hasChildren?: boolean
}

export type TTreeLoadChildren = (request: {
	value: TTreeKey
	text: string
	signal: AbortSignal
}) => Promise<readonly ITreeNode[]>
