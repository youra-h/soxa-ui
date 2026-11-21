# Troubleshoot the checked release

- An unknown prop or callback: inspect the generated api-react-* record and installed
  0.4.2 types. Use onChangeValue's newValue, not event.target.value. Do not silence
  a mismatch with a cast or change the package version to make a recipe pass.
- An unstyled control or missing icon: verify the Oren CSS import, the setup
  registration and one installed copy of every Soxa package. In Next, registration
  belongs in the client providers module, while CSS belongs in the layout.
- A theme variant type error: include @soxa-ui/theme-oren/setup in the compilation;
  do not widen the prop type. Keep the documented theme version pinned.
- A Next serialization error: move callbacks, scoped render functions and ctrl
  creation into a 'use client' entry. Serializable Tabs parts can stay in page.tsx.
- Hydration warnings: compare initial values, locale/time zone, ids and markup;
  keep per-request state separate. Missing portal panels in SSR HTML is expected.
- Repeated controller notifications: pair on/off with one handler in an effect and
  test StrictMode and remount. Never subscribe during render.
- React test warnings about act: wrap application test updates in act and await
  committed updates; never filter console warnings to turn a failing test green.

Report a reproducible 0.4.2 library defect separately with exact pins, inputs and
errors. This documentation does not promise fixes from a newer unpublished API.

In 0.4.2 collection assembly and server-rendered tab-panel links changed.
Read release-changes and release-validation for this version. Historical React
Tabs SSR omissions are not accepted as exceptions without a current check.

The retained declarative React Tabs recipe still omits its active panel in raw
SSR on published 0.4.2. The measured reference gaps are two Tabs panels before
hydration and one inactive panel afterward. Other missing references are not
accepted. This bounded observation does not establish every configuration.
