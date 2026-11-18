# Local Soxa UI documentation MCP

This read-only stdio server answers consumer documentation queries from the
same versioned corpus used by the website. It reads `index.json` and only the
requested document files. It does not import a library runtime, inspect an
application directory, use credentials, run commands or make network requests.
Build the corpus from the exact published setup API first, as described in the
[source guide](./README.md).

## Delivery and installation

The server is delivered with the public documentation tools at an immutable
documentation commit, separately from the library version. There is no new npm
package, npm release, `npx` executable or independent documentation database.
`serverInfo.version` is the transport implementation version; each answer carries
the selected corpus's `libraryVersion` and `docsRevision` independently.

Requirements: Node 22.12+ and an already built schema-1 corpus. In the source
guide's downloader command, add `--include-mcp` to fetch the three server modules:

```sh
node fetch.mjs --revision <full-docs-commit-sha> --version 0.3.0 --out source --include-mcp
```

Choose a documentation commit containing the server. The downloader's default
still fetches only the two builder modules, so older pinned documentation
commits remain usable without MCP. An explicitly requested MCP download fails
if that revision has no server files; it never falls back to a newer commit.
The corpus build command remains unchanged.

Configure a client to launch Node directly, using absolute paths. For example,
a stdio client's server definition is:

```json
{
  "command": "node",
  "args": [
    "<absolute-source-directory>/tools/ai-docs/mcp.mjs",
    "--corpus",
    "<absolute-corpus-directory>"
  ]
}
```

It works independently of the client's working directory. Add another
`--corpus <directory>` pair to serve a different exact library version.
Duplicate versions are rejected, including different documentation revisions
for the same library version: select one revision explicitly in the config.
Restart the process to select rebuilt documentation; indexes are snapshots for
the lifetime of the server.

The tested client is `@modelcontextprotocol/sdk` **1.32.2** with
`Client` + `StdioClientTransport`, using the definition above. No SDK dependency
is required by the server itself. The consumer smoke installs the SDK only in
its isolated temporary validation directory.

VS Code's configuration uses `servers` with `type: "stdio"`; Claude Desktop's
uses `mcpServers` with the command and args above. These are configuration
templates, **not verified desktop integrations**. No interactive editor/desktop
client or AI conversation has been tested in this change. A deterministic SDK
session is retained and reproducible below.

## Retrieval contract

Start with `list_versions` or `resources/read` on `soxa://versions`. This small
catalog reports the exact versions, documentation/release revisions, published
API digest, package pins and per-framework coverage. `sample` means a verified
slice, not a complete framework guide; `pending` is not support. API coverage
and authored guide coverage remain separate.

Every other tool requires `version`, `audience` and `framework`. Version means
an exact available version such as `0.3.0`; `latest`, ranges and unavailable
versions fail. Framework is `vue`, `react`, `angular`, `solid`, `svelte`,
`webc` or `all` for shared records only. Nuxt is covered by Vue records,
Next.js by React records, and so on. Framework-specific queries include shared
records. Consumer and contributor records never cross audiences; contributor
coverage is currently pending and its queries return an explicit absence.

| Tool               | Result                                                                                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `list_versions`    | Exact versions, coverage and provenance; no document bodies.                                                                                                       |
| `list_components`  | Paged component IDs with generated API for the selected adapter.                                                                                                   |
| `get_component`    | One component's generated JSON record with actual imports/bindings, props/defaults, events/models and slots. Requires `component`, e.g. `select` or `date-picker`. |
| `list_documents`   | Paged metadata, optionally filtered by `component` or `topic`; no prose/code.                                                                                      |
| `get_document`     | One full JSON record by `id`, including prose, source URLs, related IDs, hashes and attached examples.                                                             |
| `list_examples`    | Paged example metadata, optionally filtered by `component` or `topic`. IDs are local to their parent `documentId`.                                                 |
| `get_example`      | One attached example by parent `id` + `example`; exact code, language, descriptive source path and hash.                                                           |
| `get_installation` | Paged installation document IDs; read one with `get_document`. Package pins are in provenance.                                                                     |
| `styling_guide`    | Paged theme/icon document IDs; read one with `get_document`.                                                                                                       |

New adapter guides become available through the normal versioned manifest and
corpus build, without registering another framework-specific tool. The initial
0.3.0 corpus already includes all six adapters with their recorded coverage.
The server does not upgrade any `sample` status to `ready`.

Lists accept integer `offset` (default 0) and `limit` (default 20, maximum 50).
They return `total`, `items` and `nextOffset`, which is null at the end. A page
can contain fewer than `limit` items to keep serialized items within 24,000
UTF-16 units. Empty selections are explicit errors, not silent fallback.

Read tools return JSON in `text` chunks, with `encoding: "json"`, `offset`,
`total` and `nextOffset`. Their `limit` defaults to 12,000 UTF-16 units and
has a maximum of 16,000. Follow `nextOffset`, concatenate `text` **in order**,
then `JSON.parse` the complete string. Escape-heavy chunks can be shorter to
keep their JSON-encoded text within 24,000 UTF-16 units. Each result carries
provenance outside the chunk. Source hashes refer to original document/example
content, not to the serialized transport envelope.

Documents are also readable through the resource template:

```text
soxa://docs/{version}/{audience}/{framework}/{id}?offset={offset}&limit={limit}
```

For example, `soxa://docs/0.3.0/consumer/vue/vue-installation?offset=0&limit=12000`.
The resource JSON envelope uses the same chunk contract. Resource discovery
lists only the version catalog; use `list_documents` for the selected boundary.
Related IDs are hints, never automatic context expansion or bulk loading.

## Protocol and validation

The transport supports newline-delimited JSON-RPC 2.0 with MCP protocol
negotiation for `2025-11-25`, `2025-06-18`, `2025-03-26` and `2024-11-05`.
Clients initialize, send `notifications/initialized`, discover tools/resources,
and close stdin to end the process. Stdout contains only protocol messages.
Requests are limited to 64 KiB per line; an oversized line is discarded through
its newline and subsequent requests remain readable. Batch requests are not
supported. Startup rejects unknown schema, conflicting versions and inconsistent
coverage/metadata; selected records are checked against the index and content
hashes before delivery. Corpus files are limited to 4 MiB, and document symlinks
cannot escape the configured corpus directory.

```sh
npm run test:ai-docs
npm run check:ai-docs:mcp
```

Offline tests cover argument/boundary validation, versions, chunk reconstruction,
pagination, corrupted metadata/content, symlink/junction containment, stdio
lifecycle, error codes, resource reads, UTF-8 output and oversized requests.
The second command needs npm and installed Playwright Chromium. It:

1. Copies public delivery inputs outside the library checkout and installs the
   exact published `@soxa-ui/setup@0.3.0` API plus SDK 1.32.2.
2. Builds the corpus, starts a fresh scripted SDK client and discovers/retrieves
   records through MCP only. The client cannot read corpus or library source
   files through its tools, and does not use private memory or a prior chat.
3. Retrieves Select and DatePicker API, installation, styling and the Vue form,
   entry point and controller examples. It reconstructs all code from MCP chunks
   and checks the delivered code's hashes.
4. Installs the reported exact published packages in a separate Vue/Vite
   application, checks types, builds for production and exercises the form in
   Chromium, including Select/DatePicker keyboard selection, Escape and models.

The command prints a retained temporary directory with the SDK client,
`mcp-transcript.json`, `mcp-evidence.json`, external consumer sources and both
package locks. These files allow replay and inspection. This is a real protocol
client session and deterministic consumer construction, not an interactive AI
authoring evaluation. Validation of each adapter's other recipes remains in
its existing separate smoke; the MCP smoke rebuilds only the Vue consumer.
