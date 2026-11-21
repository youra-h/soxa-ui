# Controllers and lifecycle

Use props/models for the form. For imperative control, import a core class and
pass a raw per-instance object as :ctrl. CtrlExample creates new TButton in
setup; never wrap it in reactive or a deeply reactive ref. A Vue template ref
refers to a Vue component/DOM surface, not this core model. Do not assume it
has model methods; explicit ctrl avoids that ambiguity.
Use one owner for a value: with ctrl, mutate its public properties and listen
to its events instead of mirroring the same state with props/models.
The example handles action:click on the Vue surface, changes ctrl.text, and
subscribes to the core change:text notification. Plugin action events are not
members of the raw TButton core event map.
The event bus on returns void, not a disposer. Retain the handler and call off
with that same function on unmount. The recipe subscribes onMounted and removes
its subscription onUnmounted. Repeated mounting starts at zero and one action
produces one notification. DOM work belongs after mount or the relevant element
ready notification. ready is not a promise that all async plugins completed.
Cancel application timers/listeners/observers on teardown.
