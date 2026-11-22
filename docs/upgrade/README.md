# Upgrading Soxa UI

Start with the guide for the version you are installing, then read each package's
changelog for the complete fixes and additions. Core, setup, plugins and adapters
must share a version. Themes and icon packs have independent versions; use the
compatibility ranges in their manifests.

| Upgrade                                                     | Status                                                 | Guide                                      |
| ----------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------ |
| Components 0.4.2 and themes 0.4.1 to the planned 0.5.0 line | Unreleased; version calculated from pending changesets | [Upgrade instructions](./0.5.0.md)         |
| Previous npm scope to Soxa UI                               | Historical package rename                              | [Scope migration](../migration-to-soxa.md) |

A guide describes consumer action, not permission to publish. An approved release
still goes through the normal release PR, CI and owner merge.
