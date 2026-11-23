# Toast appearance in Oren

## Who is affected

Applications using Toasts with Oren can opt into the soft view. Existing
calls and custom themes require no migration.

## Before

```ts
const { show } = useToasts()
show({ text: 'Message sent', type: 'success' })
```

## After

Pass `view: 'soft'` to use the same tinted surface and neutral text as Alert soft.

```ts
const { show } = useToasts()
show({ text: 'Message sent', type: 'success', view: 'soft' })
```

## Verification

Check the notification in the light and dark Oren schemes. The icon uses the
message type color. The title, description and close button use the neutral
text color. The original call still uses the standard success fill.
