export const SCOPES = ['components', 'themes', 'icons', 'mcp']

/** One release boundary for planning, publication validation and GitHub histories. */
export function scopeOfPackage(pkg, shared) {
	if (shared.has(pkg.name)) return 'components'
	if (pkg.dir === 'packages/mcp') return 'mcp'
	if (pkg.dir?.startsWith('packages/themes/')) return 'themes'
	if (pkg.dir?.startsWith('packages/icons/')) return 'icons'
	throw new Error('Unknown release scope: ' + pkg.name)
}
