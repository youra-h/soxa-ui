# Install and register

Retrieve the files attached to this record, preserving paths. Copy examples/webc
to a new directory outside any Soxa workspace. With Node 24+, run npm install,
npm run check and npm run build; npm run dev serves development. Keep the lock.
The checked stack is TypeScript 6.0.3 and Vite 8.3.5; these are tested versions,
not a minimum-support claim. Component packages and themes are pinned to 0.4.1; icons use 0.3.1.
Oren and Material are independently pinned here to 0.4.1 and 0.3.1.

The example imports the root of @soxa-ui/webc, registering all elements. For a
smaller graph use public entries such as @soxa-ui/webc/button,
@soxa-ui/webc/select, @soxa-ui/webc/date-picker and @soxa-ui/webc/accordion.
Each entry registers required parts and the locale provider. Import a class from
the same entry when narrowing a node. Importing the root to obtain a class still
brings all elements. Unknown is attributes fail silently as ordinary HTML.

Use the exact native tag and is name from the API selector and example:
button[is="so-button"], div[is="so-input"], span[is="so-check-box"],
div[is="so-select"], div[is="so-date-picker"], div[is="so-accordion"] and
div[is="so-accordion-item"]. A bare so-button tag is not this adapter's Button.
so-locale-provider is an autonomous element and has no is attribute.

Programmatic construction uses document.createElement('button', { is: 'so-button' }).
Setting is on an already-created ordinary button does not construct its class.
Narrow with instanceof TButtonElement (TypeScript 5.3+) before assigning props;
querySelector alone does not know the element type. No blanket type cast is needed.

Import setup.ts once and run its theme/icon registration synchronously before
inserting markup, or immediately after registration imports before top-level await.
Oren CSS and useTheme(oren) serve different purposes: both are required here.
The HTML root selects data-so-theme="oren". Assign the locale object enUS from
@soxa-ui/plugins to provider.locale; application text still belongs to your app.
No workspace alias, sibling sources or unpublished helpers are needed.

For programmatic detached subtrees, construct customized elements with
createElement(tag, { is }) before narrowing or assigning properties. Detached
innerHTML can still contain ordinary native nodes in the WebKit polyfill until
connection and asynchronous upgrade. The maintained example uses direct element
construction; this avoids writing own properties before an element is upgraded.
