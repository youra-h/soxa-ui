import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { ICON_ROLES, missingIconRoles } from '@soxa-ui/setup'
import * as material from '@soxa-ui/icons-material'
import * as lucide from '@soxa-ui/icons-lucide'

const read = (name) => JSON.parse(readFileSync(new URL(import.meta.resolve(name)), 'utf8'))
const classes = read('@soxa-ui/theme-base/theme-contract.json')
const variables = read('@soxa-ui/theme-base/theme-variables.json')
const api = read('@soxa-ui/setup/api.json')
assert.equal(api.libraryVersion, '0.4.1')
assert.equal(api.typeContext, 'library-without-theme')
assert.deepEqual(missingIconRoles(material), [])
assert.deepEqual(missingIconRoles(lucide), [])
assert.ok(variables['base-reads']['--so-button-height-normal'])
assert.ok(classes.roots.some((entry) => entry.name === 'so-button'))
console.log(
	JSON.stringify(
		{
			libraryVersion: api.libraryVersion,
			typeContext: api.typeContext,
			replacementIcon: lucide.close,
			iconRoles: ICON_ROLES,
			classes,
			variables,
		},
		null,
		2,
	),
)
