# Install the Svelte consumer

Use Node 22.12+ and the attached complete project files. Save them by their
example paths into a new consumer directory, then run npm install, npm run check,
and npm run build. Keep the generated package-lock.json. The SvelteKit project
includes the same Recipes.svelte and CtrlExample.svelte under src/lib. Its npm
prepare script copies sveltekit-config.json to tsconfig.json before checking or
building, so SvelteKit can resolve its generated $app/tsconfig after installation.
Keep both package.json and sveltekit-config.json when downloading the example.

Core/setup/plugins/adapters use exact 0.4.1. This recipe independently selects
Oren 0.4.1 and Material icons 0.3.1; compatible peer ranges were verified in the
installed lock. Do not replace these with latest. The package files record the
checked Svelte, Kit, Vite, TypeScript and svelte-check versions.

Import @soxa-ui/theme-oren for CSS, and its /setup export for useTheme(oren).
Register useIcons(material) and useTheme once in setup.ts for CSR, or a module
script in the Kit layout for both server and client. CSS alone does not register
behavior or icons. Importing the theme also supplies its type augmentation for
variant values such as accent. Generated API has no theme-specific enumeration.

There is no requirement to clone the library, run a monorepo build or access its
private project memory. Strict npm run check currently reports the published
Teleport declaration defect described in svelte-errors; do not hide it with
skipLibCheck, a cast, a package edit or a warning filter.
