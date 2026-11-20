---
'@soxa-ui/core': patch
'@soxa-ui/setup': patch
---

A markup group (`Select.Group`, `ListBox.Group`, `Menu.Group`) whose items are all left out of the shown ones — for example by the Select filter — now hides together with its label, as a group from data does. The `groupSeparators` documentation now states that separators are drawn only between sections drawn from data, not between groups written in markup.
