# Changes documented by the 0.4.2 corpus

Component packages are pinned to 0.4.2. Base and Oren remain at 0.4.1; Material
and Lucide remain at 0.3.1. All API records come from published setup 0.4.2.

Compared with the published 0.4.1 artifact, the generated contract changes
affect Tabs, Tabs.Item, Tabs.Content, Tags, Tags.Item and plugin metadata.
The release prepares collection membership before model construction, improves
server-rendered tab-panel links across adapters and releases abandoned React
collection assemblies. Read the selected adapter API for exact inputs.

Existing consumer recipes retain sample coverage. Historical 0.4.1 validation
does not prove this release; read release-validation for current evidence.
Web Components remain browser enhancement, not framework SSR. No independent
AI-authoring or complete accessibility coverage is claimed.

The retained React/Next Tabs recipe still has the active-panel SSR omission
and two pre-hydration / one inactive hydrated panel reference gaps. New API
metadata alone does not prove this older scenario is fixed.
