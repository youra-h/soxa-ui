# Svelte 0.3.0 validation

Checked 2026-11-15 with exact published packages. Runnable source is pinned to
`4ffd0a93fc544241b73a02b9d22a43cd0f694393`. This is a **runtime sample with strict
type readiness blocked**. Full versions, lock and input hashes are in
[structured evidence](./svelte-validation.json).

| Check                                                                            | Result                                                      |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Strict Svelte and SvelteKit templates                                            | Failed: one Teleport library error each, zero warnings      |
| TypeScript 5.9.3 independent declaration reproduction                            | Same TS2440                                                 |
| Negative numeric Button text guard                                               | Additional consumer input error correctly detected          |
| CSR and universal SSR production builds                                          | Passed                                                      |
| Chromium controlled form, keyboard/date, scoped snippets and three ctrl remounts | Passed                                                      |
| Kit hydration, route away/back and two independent no-JS requests                | Passed                                                      |
| Browser warnings/errors/pageerror                                                | Zero                                                        |
| Full ARIA validity                                                               | Not established; three bounded observations below           |
| Independent empty-context meeting signup                                         | Production and 9 browser checks passed; strict types failed |
| Vue/Nuxt, React/Next, Angular regression smokes                                  | Passed                                                      |
| Corpus validator/retrieval tests                                                 | 33 passed                                                   |
| Immutable public source delivery                                                 | 79 files, 119527 bytes; 410 records built                   |

Run `npm run check:ai-docs:svelte`. Every installed Soxa package is checked to
resolve once at 0.3.0. The published setup API version and digest are verified.
The command continues production/browser checks after strict type errors and
exits nonzero at the end. It is deliberately not added to shared CI while exact
0.3.0 fails. No declaration edits, skipLibCheck or warning filters are applied.

Teleport.svelte.d.ts imports its own default name and declares that name again.
This library defect reproduces on TypeScript 6.0.3 and 5.9.3. Runtime success is
not a passing type result. A future patch requires separately versioned records;
0.3.0 cannot silently adopt a new package or current development source.

Raw no-JS SSR has two missing aria-controls targets: the closed Select listbox
and DatePicker popup. After calendar open/close, a hidden dialog has one missing
aria-labelledby target. The smoke bounds exact roles, labels, classes, hidden
state and target suffixes, rejecting additional gaps. Initial values, selected
text, icons and unique ids are verified independently of those ARIA limits.

Node 24.20.0 and Chromium 156 on Windows were used. Pins: Svelte 5.57.2,
SvelteKit 3.0.0, Vite 8.3.5, TypeScript 6.0.3 and svelte-check 4.7.7.
Kit build retains an inherited NO_COLOR/FORCE_COLOR advisory; Angular retains
its existing bundle advisory. Browser diagnostics were not filtered.

Selective download used the public full SHA above, then its downloaded builder
with published setup API. All declared Svelte paths were tracked and byte-equal
to fetched files, including Kit src/lib and plus-prefixed routes. The downloader
only gains literal plus in safe paths; traversal and encoded paths remain rejected.

An independent agent received only exported consumer JSON at that immutable SHA.
It built a different meeting signup with nested labels, controlled input/checkbox/
select, item-leading and Accordion scopes. Production plus nine Chromium checks
passed, zero browser diagnostics; strict check found only the same Teleport error.
Its CSR scenario does not claim independent SSR, date or ctrl lifetime coverage.
Final input/example hashes are recorded separately from maintained recipe hashes.
