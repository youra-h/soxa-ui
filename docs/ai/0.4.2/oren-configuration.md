# Configure Oren for 0.4.2

Install the adapter and the packages your application imports directly. This
recipe pins Oren, Base, setup, core, plugins and icon packs independently to
0.4.2; it does not resolve `latest`. Framework installation records explain
where to put CSS in Vite, Nuxt, Next.js, Angular CLI, SvelteKit and SolidStart.

Load Oren's stylesheet and call `useTheme(oren)` from its public `/setup` export
before mounting components. CSS alone omits the layout plugins used by active
Tabs marks, sticky Table heads and stacked Toasts. Keep the returned unregister
function for application teardown. It affects future mounts, not CSS or plugins
already installed on mounted components. Configure registries once per runtime
module graph; do not register them on every render or per server request.

Oren light is the default. Use `data-so-theme="oren"` or `"oren-dark"` on the
document or an explicit subtree. The application paints the page and sets its
font; Oren styles library nodes. Portalled content may leave a subtree, so put
the scheme on a common ancestor or the document when it must cover overlays.
Changing the scheme attribute selects CSS; it does not install another behavior.

Override documented variables on the ancestor of the affected controls. The
example sets `--so-button-height-normal: 3rem` on its main area. Oren's palette
variables, including the `--so-accent-*` scale, come from the installed Oren CSS;
inspect that release's values before overriding a family. Do not treat numeric
steps as interchangeable lightness values across schemes. Base's variable
reference describes shared geometry, surfaces and values owned by plugins.

Use `dir="rtl"` on a native ancestor for RTL. Base propagates the writing-direction
sign; use logical CSS properties in your application. A nested `dir="ltr"` can
restore LTR. Locale and direction are separate choices: use the adapter's
LocaleProvider when translating library labels.

`useMotion('system')` follows the system (the default); `'reduce'` removes motion
and `'full'` enables it regardless of the system. Call it in the browser.
The document attribute `data-so-motion="reduce"` or `"full"` can express a server
preference before JavaScript starts. System mode has no attribute. Reduced motion
does not remove color/opacity transitions or promise that every effect is absent.
The example exercises all three modes and the reduced-motion system preference.

The example's main entry installs Oren, Material icons and an application plugin.
Its custom entry installs a separate theme instead. The validation record states
the exact tested controls and environments; neither example proves every theme
component or every browser.
