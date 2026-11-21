# Browser environment and server HTML

This adapter extends native HTML elements. Chromium supports these customized
built-ins natively. Safari does not; the package imports @ungap/custom-elements
before defining its element classes. With the polyfill, connection may complete
in later microtasks. Keep the package's registration modules intact and test your
actual browser matrix. The maintained recipe is checked in Chromium and Playwright WebKit 27.2
with its real polyfill, using the matching Linux Docker image. This does not
establish testing of the Safari application or Firefox.

The Web Components entry evaluates DOM globals during import. Do not import it in
a Node server entry or try to render it as a universal framework component. In an
SSR host, load it in a browser-only entry/dynamic import guarded by the browser
boundary of that host, and configure theme/icons in the same client module.
The documented Node import probe records the actual 0.4.2 error.

A server can emit ordinary HTML containing the correct native tags and is names.
The browser upgrades it after registration, and the adapter builds its structure
and distributes initial light DOM. This is client enhancement, not Soxa SSR with
matching ids and hydration. Before JavaScript, a server-authored native Button
still has its native semantics; a div is="so-input" does not contain a working
input unless the server supplied one. Do not promise generated ARIA, icons,
teleported layers or interactive controls in no-JS HTML. Provide an application
fallback when those are required. The attached HTML states the JS requirement.
