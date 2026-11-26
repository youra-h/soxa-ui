import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readChangesets } from '@changesets/read'
import { npmPackages } from '../release-notes/release-notes.mjs'
import { compareSnapshots, hash, snapshotPackage } from './snapshot.mjs'
import { isPublishedPackage, metadata, publishedPackage } from './registry.mjs'
import { validateReviews } from './review.mjs'

const root = fileURLToPath(new URL('../../', import.meta.url))
const directory = join(root, 'tools/release-compatibility')
const baselineFile = join(directory, 'baseline.json')
const reviewsFile = join(directory, 'reviews.json')
const output = join(root, 'node_modules/.cache/soxa-compatibility')
const read = (file) => JSON.parse(readFileSync(file, 'utf8'))
const write = (file, value) => writeFileSync(file, JSON.stringify(value, null, 2) + '\n')
const [command, ...extra] = process.argv.slice(2)
try {
	if (!['baseline', 'check', 'report'].includes(command) || extra.length)
		throw new Error(
			'Usage: compatibility:baseline | check:compatibility | compatibility:report',
		)
	const packages = npmPackages(root).sort((a, b) => a.name.localeCompare(b.name))
	if (command === 'baseline') {
		// Advance only to versions already present in this checkout AND in npm.
		const records = []
		for (const pkg of packages) {
			console.log('Pin published baseline ' + pkg.name + '@' + pkg.version)
			records.push(await metadata(pkg.name, pkg.version))
		}
		write(baselineFile, { schemaVersion: 1, packages: records })
		console.log('Pinned exact published versions; review records must now be reconciled.')
	} else {
		const baseline = read(baselineFile)
		if (baseline.schemaVersion !== 1 || !baseline.packages?.length)
			throw new Error('Invalid published compatibility baseline')
		const baselineNames = new Set(baseline.packages.map((pkg) => pkg.name))
		if (baselineNames.size !== baseline.packages.length)
			throw new Error('Duplicate baseline package')
		for (const pkg of packages) {
			if (baselineNames.has(pkg.name)) continue
			if (await isPublishedPackage(pkg.name))
				throw new Error('Missing published baseline package: ' + pkg.name)
			console.log('No published version to compare for ' + pkg.name)
		}
		mkdirSync(output, { recursive: true })
		const temporary = mkdtempSync(join(tmpdir(), 'soxa-compatibility-'))
		try {
			const changes = []
			for (const record of baseline.packages) {
				const pkg = packages.find((item) => item.name === record.name)
				if (!pkg) throw new Error('Published package removed: ' + record.name)
				console.log(
					'Compare ' + record.name + '@' + record.version + ' with built ' + pkg.version,
				)
				const previous = await publishedPackage(
					record,
					join(output, 'archives'),
					join(temporary, record.name.replace('/', '-')),
				)
				changes.push(
					...compareSnapshots(
						snapshotPackage(previous),
						snapshotPackage(join(root, pkg.dir)),
					),
				)
			}
			const reviews = read(reviewsFile)
			const errors = validateReviews(
				changes,
				reviews,
				packages,
				await readChangesets(root),
				root,
				baseline,
			)
			write(join(output, 'report.json'), {
				schemaVersion: 1,
				baseline: hash(baseline),
				changes,
				errors,
			})
			console.log(
				changes.length + ' changed/removed contracts; ' + errors.length + ' review errors.',
			)
			console.log('Report: ' + join(output, 'report.json'))
			if (command === 'check' && errors.length) throw new Error(errors.join('\n'))
			if (command === 'check') {
				// Documentation-only edits must not silently remove the upgrade entry point.
				const index = readFileSync(join(root, 'docs/upgrade/README.md'), 'utf8')
				for (const review of reviews)
					if (!index.includes(review.guide.slice('docs/upgrade/'.length)))
						throw new Error('Upgrade index does not link ' + review.guide)
			}
		} finally {
			if (
				dirname(temporary) !== resolve(tmpdir()) ||
				!temporary.split(/[\\/]/).at(-1).startsWith('soxa-compatibility-')
			)
				throw new Error('Unexpected compatibility temporary directory')
			rmSync(temporary, { recursive: true, force: true })
		}
	}
} catch (error) {
	console.error(error.message)
	process.exitCode = 1
}
