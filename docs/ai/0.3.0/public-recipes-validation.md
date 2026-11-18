# Published theme and extension validation

Run `npm run check:ai-docs:recipes` in the documentation source to reproduce the
isolated check. A standalone application can instead copy the attached complete
example directory and follow its README. The builder/downloader includes every
required example input through the manifest. It does not download private notes
or development instructions. All Soxa imports in the example resolve to exact npm
0.3.0 packages; the custom theme is built from application-owned example code.

The check builds the theme in a temporary npm workspace, verifies the emitted
root-type reference, packs it, then installs that tarball in a new consumer with
no workspaces or aliases. Strict types include positive custom-theme values and
negative probes without Oren augmentation. Both HTML entries are built for
production. Published Base class/data and variable JSON plus setup API metadata
are inspected directly, and both installed icon packs satisfy ICON_ROLES.

The browser scenario covers Oren and the small custom theme: Button activation
by Enter/Space, controller-driven text, external plugin prop update/reset, the
plugin envelope on the core and Vue buses, three child unmount/remount cycles,
no callback on retired plugins, active horizontal Tabs geometry and keyboard
arrows in LTR/RTL, a Switch with Space, dark scheme and the three motion modes.
A Lucide close role replaces Material's close role. Console warnings/errors,
page errors and failed network requests fail the check.

Coverage remains sample. This is a Vue integration check of the shared public
contracts, not a six-adapter rerun or a complete theme conformance suite. It does
not establish every component's visual design, automated accessibility compliance,
WebKit compatibility or server rendering. Other framework recipes retain their
own validation and known immutable 0.3.0 limitations. The example adds no motion
of its own, so changing the motion attribute does not validate a custom animated
theme. Inspect focus visibility, contrast, forced colors and all intended controls
before distributing a full theme.

The command retains package locks, theme tarball, installed-contracts JSON and
evidence with package origins/integrities, API/input/tool hashes and browser
outcomes. The source revision identifies the checked documentation checkout;
input hashes identify uncommitted documentation precisely during development.
Publication and deployment are separate actions.
