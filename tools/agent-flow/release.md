# Release preparation

Run only after an explicit owner request. Read docs/agents/build.md first.

Use an existing clean pool worktree. Never switch the main folder or create a
worktree. Check GitHub authentication, fetch origin and inspect unfinished
release PRs. Start a release branch from origin/main in the assigned workspace.

Choose the requested scope: components, themes, icons, mcp or all. Run
`npm run release:plan -- <scope>` and inspect every bumped package. The component
fixed group shares one version; themes and icon packs version independently.
Dependency updates outside the selected scope block preparation. Preview all
before proposing a coordinated release. No pending changes means no release.

Before versioning, build the packages and run npm run check:compatibility. Review the
exact published-contract deltas and write the version-specific consumer guide under
docs/upgrade/ with Who is affected, Before, After and Verification sections. Link it
from the upgrade index and breaking changesets. The prepare command checks this
before changing versions; the guide is retained in GitHub Release notes. A review
record explains compatibility but never supplies owner permission for a breaking API.
After actual publication, advance the exact npm baseline with compatibility:baseline
and reconcile stale reviews in a separate normal PR.

Run npm install --no-audit --no-fund and verify manifests and lock remain
unchanged before versioning. Use `npm run release:prepare -- <scope>`; never
hand-edit versions or CHANGELOG. The first stable graduation uses all and removes
the shared beta state. Subsequent releases are stable; a new prerelease needs a
separate owner decision.

Review .release/plan.json, exact version changes, dependency-only edits, consumed
changesets and the playground's unchanged version. Update README's library
status/component entries when releasing components. Run setup manifest/version
guards, release tooling tests, formatting, the full build and package checks.
CI on the release PR must pass, including consumer installation tests.

Name the branch release/v<version>, or release/<first-package>@<version> for a
theme/icon-only release. Commit in English and open a Russian release PR with
the generated notes for every scope. Components, themes and icons receive
separate GitHub Releases even if one coordinated PR graduates them together.

The owner merges release PRs. The workflow verifies the exact planned packages,
publishes to npm and verifies registry installation. Never run npm publish or
changeset publish locally, and do not merge the release PR yourself.

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
