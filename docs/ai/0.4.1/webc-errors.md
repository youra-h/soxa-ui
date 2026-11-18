# Mistakes to avoid in 0.4.1

- A so-button tag or the wrong native tag with is never becomes the registered
  Button. Import its entry and construct the matching native element.
- is added later is not a constructor. Use HTML parsing with the is attribute
  present, or createElement with its is option after registration.
- ctrl may be absent immediately after parsing/upgrading. Registration completion
  and a particular element's readiness are different facts.
- disabled="false" still supplies a boolean flag. Objects, dates in ranges,
  item arrays and locale objects belong in properties.
- Canonical scoped-slot objects are not a Web Components feature. Unknown slot
  names are discarded, and initial light DOM is distributed once.
- Native input/change events are not so:change:value. Internal part events do
  not all bubble, and DOM event typing needs explicit payload narrowing.
- Setting an attribute after assembly on a field wrapper is not equivalent to
  supplying initial native field attributes. Use declared component props for
  reactive changes; keep names and labels in the original markup/prop contract.
- A Select name submits its display text; use an application-owned hidden field
  for a domain identifier, as demonstrated by destinationCode.
- Importing browser elements in Node is not SSR. Do not silence a missing-DOM
  error with globals or claim framework-style hydration.

The root import intentionally favors complete registration over bundle size. Vite
reports a chunk above its default 500 kB warning threshold. Per-element public
entries can reduce that graph; this recipe does not assert a bundle-size budget.
Read webc-validation for actual checks and any remaining published-release limits.

In 0.4.1 Calendar removes its label reference when the month-picker heading
is unmounted. The browser smoke requires zero dangling references after the
form/calendar scenario; this is bounded scenario coverage.

For programmatic detached subtrees, construct customized elements with
createElement(tag, { is }) before narrowing or assigning properties. Detached
innerHTML can still contain ordinary native nodes in the WebKit polyfill until
connection and asynchronous upgrade. The maintained example uses direct element
construction; this avoids writing own properties before an element is upgraded.
