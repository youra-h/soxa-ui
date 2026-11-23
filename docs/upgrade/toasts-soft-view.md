# Toast appearance in Oren

## Who is affected

Applications using Toasts with Oren can set a view for the container and
override it on individual notifications. Existing calls and custom themes
require no migration.

## Before

```vue
<Toasts>
  <App />
</Toasts>
```

```ts
const { show } = useToasts()
show({ text: 'Message sent', type: 'success' })
```

## After

`Toasts` and its items accept `outlined`, `filled` and `soft`. Set the view
on the container to style its notifications by default.

```vue
<Toasts view="filled">
  <App />
</Toasts>
```

Inside the container, use `show()` to override the view for one notification.
The outlined notification below has a neutral surface and no message type.

```ts
const { show } = useToasts()
show({ text: 'Message sent', type: 'success' })
show({ text: 'You have a new message', view: 'outlined' })
```

## Verification

Check the same container in both Oren schemes. The success toast uses a
solid signal color, while the ordinary toast has an outline. Change the
container view to `soft` to see the success toast adopt a tinted surface.
The other toast keeps its outline. Clearing its own `view` on the item
controller restores the current container view.
