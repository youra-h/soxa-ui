# Independent stable releases

The component library keeps its fixed version group. Themes and icon packs retain
their own versions and can be released on their own schedules.

Preview a scope without changing files:

```sh
npm run release:plan -- components
npm run release:plan -- themes
npm run release:plan -- icons
```

From a clean release branch, build the packages, review the
[compatibility report](../release-compatibility/README.md) and write the version-specific
[consumer upgrade guide](../../docs/upgrade/README.md). Then use the same scope with
`release:prepare`. Preparation checks the guide and published contracts before versioning.
Changesets generates versions, dependency updates and changelogs; the command
updates the lockfile and records the approved package versions in
`.release/plan.json`. No package is published by these commands.

Unrelated changesets remain pending. A mixed changeset is consumed only for the
selected packages; its remaining entries and summary stay under the same ID.
Prefer separate changesets per scope for new work.

If dependency compatibility requires a package outside the selected scope, the
command stops before writing files. Inspect an `all` plan to authorize the full
dependency closure. Dependency-only edits to development manifests do not cause
a package release.

The initial transition from the repository-wide beta uses
`npm run release:prepare -- all`. It graduates the current packages, consumes
the archived beta changesets and removes the shared prerelease state. Subsequent
releases are stable. A new prerelease requires a separate owner decision.

The owner merges release PRs. Publication verifies that every unpublished package
is present at its exact version in the approved manifest. Components, themes and
icons get separate GitHub Releases even when prepared in one coordinated PR.

An explicitly requested beta uses `npm run release:plan -- all --beta` and
`npm run release:prepare -- all --beta`. Review the dependency closure: themes and
icons retain independent version numbers but may need beta builds whose peer
ranges admit the component beta. The approved manifest records the beta channel;
publication uses npm's beta tag and GitHub prereleases, leaving latest unchanged.
Changesets archives the release notes for later stable graduation without adding
a repository-wide pre.json. A later stable release still requires an owner request.

## Independent documentation MCP

Use the mcp scope for @soxa-ui/mcp, outside the component fixed group.
The [build and publication rules](../../docs/agents/build.md#independent-documentation-mcp)
cover the native Node build, first scoped publication and required npm rights.
The same release authorization, exact-plan gate and owner merge rules apply.
