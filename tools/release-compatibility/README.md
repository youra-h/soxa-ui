# Release compatibility and upgrade instructions

Run after building the packages:

```sh
npm run compatibility:report
npm run check:compatibility
```

The report compares every publishable package with an **exact published baseline**:
component packages and themes 0.6.0, icon packs 0.3.3 and MCP 0.0.1.
[baseline.json](./baseline.json) records each version, npm tarball URL and sha512
integrity. The checker verifies archives on every read and never substitutes latest,
a sibling source checkout or an unbuilt package. Network or parse failures fail the check.

The generated report is at node_modules/.cache/soxa-compatibility/report.json.
It contains before/after values, package names and SHA-256 IDs of exact deltas.
Only verified archives are cached; extracted package contracts are rebuilt every run.

## What is checked

- Supported package entry points and their conditions; external peer ranges and engines.
- Declaration graphs reachable from every typed entry, including core, plugins, setup,
  all six adapters, theme setup and icons. Function/constructor signatures, generic
  constraints, required/optional properties, protected members and referenced types
  are compared, not only names of root exports.
- Published setup API metadata: component/plugin props, defaults, events, slots and
  framework bindings.
- Published base-theme class/data contracts and variable descriptions/default semantics.

Formatting, comments, private storage, object-property order and generated numbered
Angular import aliases are normalized. New standalone declarations/entries are additive.
Changes to existing declarations are conservative review candidates: adding an optional
member can therefore require an explicit compatible review. The reachable declaration
graph also contains private adapter dependencies; a change there need not be a supported
consumer API break.

## Reviewing a delta

1. Read both sides in the report and inspect the actual supported package exports.
2. Record exact delta IDs in [reviews.json](./reviews.json), with a reason and either
   compatible or breaking impact. Each review pins the hash of the complete baseline.
3. Link a consumer guide under [docs/upgrade](../../docs/upgrade/README.md) with the
   required Who is affected / Before / After / Verification sections.
4. For a breaking delta, reference a minor changeset before 1.0 (major afterwards)
   for the affected package, linking the same guide. Fixed-group releases still move
   together. This classification does not grant owner approval for a breaking change.
5. Rerun the check. A new, changed, duplicated or stale delta cannot reuse an old waiver.
   A compatible addition must explain why old consumer usage still works.

The initial reviews cover the already merged collection changes, manual separator
additions and theme spacing migration. They do not authorize further API changes.

## Release workflow

CI runs fixture tests without a build, then compares built packages in the build job.
release:prepare requires a reviewed version-specific guide and runs the compatibility
check before Changesets consumes pending changesets or changes versions. Release PR CI
checks the versioned packages again; consumed breaking changes must retain their guide
in the generated changelog. GitHub Release notes link the guide even when long notes
are folded into package changelog links.

See [release preparation](../agent-flow/release.md) and the
[consumer upgrade index](../../docs/upgrade/README.md). These commands do not publish
or merge a release.

After a release has actually been published and the checkout has those exact versions,
advance the baseline deliberately:

```sh
npm run compatibility:baseline
```

Commit the new pins, remove or reconcile stale reviews and rerun the build/check.
Never advance the baseline to hide an unreviewed change: baseline accepts only exact
versions already available from npm. Keep the old upgrade guides for consumers.
All existing publishable packages must remain represented; onboarding a newly published
package requires updating its baseline pin.

## Limits

This is a conservative declaration/metadata comparison, not a TypeScript assignability
proof or a runtime/visual/a11y compatibility proof. Arbitrary behavioral changes, CSS
rules absent from the public theme registries, external framework implementation changes
and unsupported deep imports remain outside its evidence. Existing adapter tests,
theme guards, minimum-version tests and clean consumer installation tests stay required.
A green result means no **unreviewed detected** contract changes.
