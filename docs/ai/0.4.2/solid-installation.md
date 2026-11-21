# Install and configure Solid consumers

Retrieve this record's example files preserving their paths. Copy examples/solid
or examples/solidstart into a new directory outside any library workspace. Both
contain complete package.json and tsconfig.json files. Use Node 24+, run npm
install, npm run check and npm run build. For SolidStart run npm start after the
build; for Vite run npm run dev. Keep the generated package lock.

The recipes pin Solid 1.9.17, Vite 8.3.5, vite-plugin-solid 2.11.16 and TypeScript
6.0.3. SolidStart additionally pins @solidjs/start 2.2.3, @solidjs/router 0.16.1 and
Nitro 3.0.261103-rc. These are tested combinations, not minimum support claims.
Component packages and the independent Base/Oren themes are pinned to 0.4.2;
Material icons are independently pinned to 0.3.1. Core is direct because CtrlExample imports TButton.

The Solid compiler must process Soxa's JSX source selected by its solid export
condition. Use vite-plugin-solid for Vite and the SolidStart plugin for the
universal app. A generic JSX/React transform or Soxa's browser default build is
not a server-rendering substitute. No workspace alias or bundler alias to Soxa
source is needed.

Import setup.ts once in the entry/app module on both server and browser.
It loads Oren CSS and registers theme behavior and Material icons. Static
registrations are process configuration; do not repeat them per request.
Theme declarations provide values such as variant="accent". The sample subtree
selects data-so-theme="oren"; library strings use LocaleProvider locale={enUS} (enUS from @soxa-ui/plugins).
Application labels still belong to the application. Registration is not a reason
to store mutable form state in module scope.

Keep lib: ["ESNext", "DOM", "DOM.Iterable"] in these strict configs: the pinned
SolidStart/Nitro stack declares Error.isError. Both consumers use
skipLibCheck=false; the separate CSR check also verifies published Soxa
declarations without importing the server stack. Invalid Button.disabled is
guarded by @ts-expect-error; erased public types would make the guard fail.
