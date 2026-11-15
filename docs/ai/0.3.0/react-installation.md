# Install and register React

Use Node 22.12+ (the checked toolchain uses Node 24) and exact published pins:

```sh
npm install --save-exact react@19.3.0 react-dom@19.3.0 @soxa-ui/react@0.3.0 @soxa-ui/core@0.3.0 @soxa-ui/setup@0.3.0 @soxa-ui/plugins@0.3.0 @soxa-ui/theme-base@0.3.0 @soxa-ui/theme-oren@0.3.0 @soxa-ui/icons-material@0.3.0
npm install --save-dev --save-exact typescript@6.0.2 @types/react@19.2.14 @types/react-dom@19.2.3 vite@8.2.2 @vitejs/plugin-react@6.0.1
```

React and React DOM ^19.3.0 are the adapter's peers. Keep a lockfile; use no
workspace aliases or package source imports. The attached main.tsx registers
useIcons(material) and useTheme(oren) at module scope and imports the Oren CSS.
The setup import also brings Oren's type augmentation into the TypeScript program:
Button variant="accent" must typecheck. CSS alone supplies appearance; registration
supplies component behavior and role icons. Register once per module environment,
not on each render or request. Create an HTML root with id="root" for main.tsx.

Use strict TypeScript with jsx=react-jsx, moduleResolution=Bundler, target=ES2022,
lib=[ES2024, DOM, DOM.Iterable], noEmit and skipLibCheck=false. ES2024 declarations cover Next 16.2.3 dependencies
that use PromiseWithResolvers; the emitted JavaScript target remains ES2022. The negative disabled="yes" example is guarded by
@ts-expect-error: an unused directive means public props stopped being checked.
For Next.js use react-next's registration boundary and CSS layout instead.
