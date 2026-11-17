# Independent SolidStart workshop consumer

This app was authored from the public Solid 0.3.0 corpus. It has no library checkout dependency or source aliases.

Run with Node 24+:

```sh
npm ci
npx playwright install chromium
node verifier.mjs
```

The verifier runs strict TypeScript (skipLibCheck=false and a negative disabled prop guard), production build, npm dependency validation, and Chromium checks. It starts and stops its own production server with HOST=127.0.0.1 and PORT=0. The first home request has JavaScript disabled; there is no HTTP readiness warm-up.

The original documentation revision e5a005fc2b428963e6974a58bf3366bedbfc3723 omitted the Router root Suspense boundary. A fresh process returned an empty route on its first request; original-cold-ssr.txt preserves that response. The corrected public revision 7ccbde9db519476a26a8e40839cf2e3eddbe8d7c supplies the boundary; its cold SSR check passes. Original and final input file hashes are separate JSON files.

The independent interface includes a controlled registration form, Select data/render scope, DatePicker, live Accordion header, root-ref focus and a per-instance TButton subscription. Cleanup removes the listener before deliberately changing the disposed controller text; the observed event count remains unchanged. Three remounts and client navigation verify this behavior. This is not a heap-leak audit.

Evidence retains exact packages, npm lock digest, published tarball origins/integrities, source hashes, measured checks and bounded release limitations. Exact npm 0.3.0 has two closed-portal aria-controls targets missing in SSR and one hidden calendar picker dialog aria-labelledby target missing after open/close. Full ARIA validity and all Solid component patterns are not claimed.

Initial author/test corrections were an empty mkdir parent, PowerShell JSON BOM, and verifier assumptions about Select input text/native calendar td roles. These were test/config authoring mistakes, separately recorded from the genuine cold-SSR documentation defect.

Retained sources are formatted using the repository formatter and replayed separately.
The original independent evidence remains in original-browser-evidence.json; its
source hashes describe the original bytes before formatting. Raw response snapshots
are stored as .txt here to preserve their bytes; original evidence names them .html.
The replay evidence hashes describe the retained formatted sources and raw .txt files.
