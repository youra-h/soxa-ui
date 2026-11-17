# Published Web Components consumer validation

The attached evidence records exact npm package versions/integrities, API digest,
strict type checking (including negative prop checks with skipLibCheck=false),
production build, browser interactions, raw HTML without JavaScript, and a Node
import probe. Checks run in a fresh consumer directory outside the monorepo with
registry packages, without source aliases or modified dependency declarations.

The checked scenario includes visible labels, keyboard Input/CheckBox/Select/
Calendar/Accordion, reverse property writes, native FormData and domain code,
cancelable before events, icons, unique ids and three unmount/remount cycles with
an open DatePicker. Aborted application listeners are tested by dispatching on a
retained detached element. This is a bounded scenario, not an accessibility
certification, all-component audit or heap-leak measurement.

Run npm run check:ai-docs:webc for Chromium, or append -- --webkit to add
the matching Playwright Linux image through Docker. Docker must be running.
The optional run uses read-only consumer/tool mounts and creates no host ports.

Only results explicitly recorded in the evidence are established. Client upgrade
of server-authored HTML is recorded separately from browser-constructed markup;
no framework SSR/hydration support is asserted. The maintained recipe also passes
Playwright WebKit 27.2 with the polyfill in Linux Docker; this is not a test of
the Safari application or Firefox. The Vite chunk-size warning remains visible.

After opening/closing Calendar, exact 0.3.0 retains one hidden dialog's
aria-labelledby target ending in -picker-0 without a matching element. This is
the same bounded release observation documented in solid-validation. It is kept
visible and bounded in this check; additional broken references fail validation.
The example does not patch the published package or claim complete ARIA validity.
