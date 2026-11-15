const consumerUrl = process.env.CONSUMER_URL || 'http://127.0.0.1:4149'
import fs from 'node:fs'
import { chromium } from 'playwright'
const b = await chromium.launch()
const c = await b.newContext({ javaScriptEnabled: false })
const p = await c.newPage()
await p.goto(consumerUrl + '/?request=raw-a11y')
const a = await p.evaluate(() => {
	const ids = [...document.querySelectorAll('[id]')].map((x) => x.id)
	return {
		duplicateIds: ids.filter((x, i) => ids.indexOf(x) !== i),
		missingReferences: [
			...document.querySelectorAll('[aria-labelledby],[aria-describedby],[aria-controls]'),
		]
			.flatMap((x) =>
				['aria-labelledby', 'aria-describedby', 'aria-controls'].flatMap((a) =>
					(x.getAttribute(a) || '')
						.split(/\s+/)
						.filter(Boolean)
						.map((id) => ({ attribute: a, id })),
				),
			)
			.filter((r) => !document.getElementById(r.id)),
	}
})
fs.writeFileSync('raw-aria-results.json', JSON.stringify(a, null, 2))
console.log(JSON.stringify(a))
await b.close()
