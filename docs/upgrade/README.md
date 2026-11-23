# Upgrading Soxa UI

Start with the guide for the version you are installing, then read each package's
changelog for the complete fixes and additions. Core, setup, plugins and adapters
must share a version. Themes and icon packs have independent versions; use the
compatibility ranges in their manifests.

| Upgrade                                    | Status                                      | Guide                                      |
| ------------------------------------------ | ------------------------------------------- | ------------------------------------------ |
| Components and themes 0.5.0 to 0.6.0       | Release line                                | [Upgrade instructions](./0.6.0.md)         |
| Components 0.4.2 and themes 0.4.1 to 0.5.0 | Release line; install after npm publication | [Upgrade instructions](./0.5.0.md)         |
| MCP 0.0.1 to 0.0.2                         | Adds Soxa UI 0.6.0 documentation            | [MCP upgrade instructions](./mcp-0.0.2.md) |
| Toasts soft view                           | Optional since 0.6.0                        | [Toast appearance](./toasts-soft-view.md)  |
| Previous npm scope to Soxa UI              | Historical package rename                   | [Scope migration](../migration-to-soxa.md) |

A guide describes consumer action, not permission to publish. An approved release
still goes through the normal release PR, CI and owner merge.
