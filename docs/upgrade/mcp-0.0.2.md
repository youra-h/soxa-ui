# Upgrading the Soxa UI MCP to 0.0.2

## Who is affected

MCP clients and build scripts that need documentation for Soxa UI 0.6.0.
This MCP release adds its API for all six adapters, upgrade notes, and a Vue
and Oren appearance sample. The catalog still serves 0.3.0, 0.4.1 and 0.4.2.

## Before

The `@soxa-ui/mcp@0.0.1` package serves documented library versions through
0.4.2.

## After

Once `@soxa-ui/mcp@0.0.2` is available in npm, change the pinned npm package
argument in your client configuration and restart the MCP server.

```json
{
  "command": "npx",
  "args": ["-y", "@soxa-ui/mcp@0.0.2"]
}
```

If your build uses the static JSON exports, update its MCP dependency to
`0.0.2` and select `@soxa-ui/mcp/corpora/0.6.0/index.json`.
MCP documentation requests still use the exact library version, here `0.6.0`.

## Verification

1. Run `list_versions` and check that it offers `0.6.0`.
2. Request `get_component` for `dialog` with version `0.6.0`, audience
   `consumer` and your adapter. Confirm the API includes `backdrop`.
3. For the Vue recipe, retrieve `vue-appearance` for version `0.6.0`. It
   contains the blurred dialog and soft/outlined notification examples.
