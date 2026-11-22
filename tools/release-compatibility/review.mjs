import { existsSync, readFileSync } from 'node:fs'
import { resolve, relative, isAbsolute } from 'node:path'
import semver from 'semver'
import { hash } from './snapshot.mjs'
import { entriesOf } from '../release-notes/release-notes.mjs'

/** A checked-in review explains exact changes; it is not owner authorization. */
export function validateReviews(changes, reviews, packages, changesets, root, baseline) {
	const errors = []
	const reviewed = new Map()
	for (const review of reviews) {
		if (
			!review.id ||
			!['compatible', 'breaking'].includes(review.impact) ||
			!review.reason?.trim()
		)
			errors.push('Invalid compatibility review: ' + review.id)
		if (review.baseline !== hash(baseline))
			errors.push('Stale baseline in review: ' + review.id)
		const file = resolve(root, review.guide ?? '')
		const path = relative(root, file).replaceAll('\\', '/')
		if (isAbsolute(path) || path.startsWith('..') || !path.startsWith('docs/upgrade/'))
			errors.push('Review needs an upgrade guide under docs/upgrade/: ' + review.id)
		else if (!existsSync(file)) errors.push('Missing upgrade guide: ' + review.guide)
		else {
			const text = readFileSync(file, 'utf8')
			for (const section of [
				'## Who is affected',
				'## Before',
				'## After',
				'## Verification',
			])
				if (!text.includes(section))
					errors.push('Missing ' + section + ' in ' + review.guide)
		}
		if (!Array.isArray(review.changes) || !review.changes.length)
			errors.push('Review must identify exact contract changes: ' + review.id)
		for (const id of review.changes ?? []) {
			if (reviewed.has(id)) errors.push('Duplicate review of ' + id)
			reviewed.set(id, review)
		}
	}
	for (const change of changes) {
		const review = reviewed.get(change.id)
		if (!review) {
			errors.push('Unreviewed ' + change.package + ' ' + change.key + ' (' + change.id + ')')
			continue
		}
		if (review.impact !== 'breaking') continue
		const pkg = packages.find((item) => item.name === change.package)
		const previous = baseline.packages.find((item) => item.name === change.package)
		if (!pkg || !previous) {
			errors.push('Missing package version for ' + change.package)
			continue
		}
		const bump = semver.major(previous.version) === 0 ? 'minor' : 'major'
		const alreadyBumped =
			semver.major(pkg.version) > semver.major(previous.version) ||
			(bump === 'minor' && semver.minor(pkg.version) > semver.minor(previous.version))
		const pending = changesets.some(
			(cs) =>
				cs.id === review.changeset &&
				cs.releases.some(
					(release) => release.name === change.package && release.type === bump,
				) &&
				cs.summary.includes(review.guide),
		)
		const changelog = pkg.dir ? resolve(root, pkg.dir, 'CHANGELOG.md') : null
		const released =
			alreadyBumped &&
			changelog &&
			existsSync(changelog) &&
			entriesOf(readFileSync(changelog, 'utf8'), pkg.version).some(
				(entry) =>
					entry.kind === (bump === 'minor' ? 'Minor Changes' : 'Major Changes') &&
					entry.text.includes(review.guide),
			)
		if (!released && !pending)
			errors.push(
				'Breaking change needs ' +
					bump +
					' changeset ' +
					review.changeset +
					' linking ' +
					review.guide +
					': ' +
					change.package,
			)
	}
	const ids = new Set(changes.map((change) => change.id))
	for (const id of reviewed.keys())
		if (!ids.has(id)) errors.push('Stale compatibility review: ' + id)
	return errors
}
