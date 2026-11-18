# Public theme and extension recipes

This is a consumer npm workspace, independent of the library repository. It uses
only exact published Soxa 0.4.1 packages and its own small example theme. Copy
this whole directory to a new directory outside a Soxa checkout, then run:

```sh
npm install --no-audit --no-fund
npm run build:theme
npm run check
npm run build
node inspect-contracts.mjs > installed-contracts.json
npm run dev
```

Open `/` for Oren and `/custom.html` for the minimal custom theme. Each page has
its own entry, CSS and behavior registration. The local workspace exists so the
theme's own package reference resolves while compiling its declarations. It is
not a dependency on a Soxa source workspace. Node 22.12+ and npm are required.
The retained lock/evidence of the automated check records the actual tools used.

To distribute the theme as a separate package:

```sh
npm pack --workspace=@example/soxa-theme --pack-destination .
```

Install that tarball in a separate application alongside compatible core/setup
packages and its adapter. Import `@example/soxa-theme` for CSS and its public
`/setup` export for `useTheme`. Never import the theme's TypeScript sources in
that application. The pack includes `dist` and the root `index.d.ts` only.
The theme has no complete visual treatment for controls other than Button and
horizontal Tabs. Its registration includes Base's three layout plugins.

`configure.ts` installs Material and overrides close with Lucide; it also exports
a typed, trusted custom SVG alternative. `text-audit.ts` declares an external
plugin, `plugin-types.ts` declares its public contract types, and `AuditButton.vue`
passes its prop bag and receives its envelope on Vue's event channel. `App.vue`
retains a raw controller while toggling that child and listens to the same
envelope through the core bus. The base plugin owns the owner-bus subscription;
the app removes its own subscription on teardown. Page CSS belongs to the app.

The automated published-package check builds this workspace, packs the theme,
then installs it in a second consumer without workspaces, aliases or Soxa sources.
It checks both pages in Chromium and retains an evidence file plus package locks.
This is a limited shared recipe; framework start/controller records retain their
own coverage and release limitations.
