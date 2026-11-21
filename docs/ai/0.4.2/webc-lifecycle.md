# Connection and cleanup

Use element.ctrl only after assembly. For ordinary supported-browser insertion
assembly may be synchronous; upgraded markup and the customized-built-in polyfill
need deferred work. customElements.whenDefined only establishes registration,
not completion of a particular element. Attach so:ready or so:element:ready listeners
before insertion if that notification is needed, and check an existing ctrl when
handling an already-assembled element. The example waits a rendering frame only to
announce test readiness; it is not a new library readiness API.

A component model supplied by an application can be assigned to ctrl before
connection; import its public class from @soxa-ui/core and make core a direct
same-version dependency when doing that. The DOM element is already the native
root/ref. It is not a framework expose object. The sample accesses keep.ctrl to
invoke hide(), and cancels the resulting so:hide:before event.

Each connection creates a new binding over the same model; disconnection removes
the binding, and a consumer move reconnects in the new place/locale context. This
is not a promise to preserve every collection selection after moving authored
items. Keep persistent domain state in application data and write it explicitly.

Keep an AbortController for application listeners, abort it during unmount and
remove the application subtree. The checked toggle constructs a fresh form each
time. Removing a Select/DatePicker while open must also remove its teleported
panel; the verifier checks three cycles. Library-owned internal layer movement
preserves the component's logical place; do not manually remove its remote panel
and leave the owner behind. The cleanup check observes removed layers and aborted
listeners, not heap-leak freedom.

For programmatic detached subtrees, construct customized elements with
createElement(tag, { is }) before narrowing or assigning properties. Detached
innerHTML can still contain ordinary native nodes in the WebKit polyfill until
connection and asynchronous upgrade. The maintained example uses direct element
construction; this avoids writing own properties before an element is upgraded.
