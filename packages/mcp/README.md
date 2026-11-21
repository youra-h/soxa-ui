# @soxa-ui/mcp

Read-only stdio MCP for Soxa UI. The package includes canonical JSON documents
and generated API from the exact published setup artifacts for **0.3.0, 0.4.1
and 0.4.2**. No checkout or corpus build is required by consumers. After npm
has installed the package, server execution requires no network.

Requires Node **^22.12.0 || ^24 || >=26**. MCP package versions are independent
of library versions and documentation revisions. Start with list_versions and
choose an exact version, audience and framework. Unknown versions and latest
are rejected. Guide coverage is sample for all six adapters; contributor guides
remain pending. Read the reported provenance and validation records for limits.

## Connect

After publication, launch with npx -y @soxa-ui/mcp@<published-mcp-version>.
The executable name is soxa-mcp. The placeholder is the MCP package version,
not a UI version. This source manifest starts at 0.0.0; the initial patch
changeset proposes 0.0.1 through the normal release preparation process.

VS Code .vscode/mcp.json:

```json
{
  "servers": {
    "soxa": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@soxa-ui/mcp@<published-mcp-version>"]
    }
  }
}
```

Claude Desktop uses the same command/args under mcpServers. On Windows clients
that require a shell for .cmd files, use command cmd and args
["/c", "npx", "-y", "@soxa-ui/mcp@<published-mcp-version>"]. A preinstalled
soxa-mcp executable also works. Configuration examples do not establish that an
interactive client was tested; see the repository's delivery validation record.

The server writes protocol messages to stdout and diagnostics to stderr. Close
stdin to terminate. It reads only its bundled corpora, never application files.
Optional --corpus <directory> pairs explicitly replace the bundled selection;
duplicate versions and inconsistent metadata are rejected. Restart to change
corpora. The retrieval contract and paging are documented in the repository's
AI documentation MCP guide.

## Static data for a website

Install an exact MCP package version as a build dependency. Resolve
@soxa-ui/mcp/catalog.json with Node's import.meta.resolve and read it as JSON.
Each entry has directory corpora/<library-version>, provenance and coverage.
Resolve @soxa-ui/mcp/corpora/<library-version>/index.json, then read the
indexed documents/<id>.json files. Check record hashes as required by the
consumer. Copy only selected public JSON into the site's static output.
The exports expose JSON only; server modules are not browser imports.
No HTTP backend or automatic website publication is included.

## Release preparation

Maintainers run npm run build:mcp and npm run check:mcp-package from the
repository. prepack verifies existing generated data and fails if it is missing
or corrupt; it never downloads or builds on the consumer's machine.
Use npm run release:plan -- mcp and the separately authorized release workflow.
GitHub Actions publishes with provenance and verifies the exact registry
version. A tarball or PR is preparation, not an npm publication.
