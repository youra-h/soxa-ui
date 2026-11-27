# @soxa-ui/theme-burg

Burg is a theme for Soxa UI. The initial Button styles include `filled`,
`outlined`, and `plain` views in light and dark schemes. Theme Base handles size,
spacing, and disabled state.

| Button size | Height | Font size |
| ----------- | ------ | --------- |
| `sm`        | 28px   | 12px      |
| `normal`    | 30px   | 13px      |
| `lg`        | 32px   | 14px      |
| `xl`        | 34px   | 15px      |
| `2xl`       | 36px   | 16px      |

These values use `rem` and assume a 16px root font size. To give a button fully
rounded ends, set `--so-button-radius: 9999px` on the button or its container.
This setting overrides the shared `--so-radius`.

### Button press effect

Set `--so-button-press-effect` on a button, container, or theme boundary.

| Value             | While pressed                 |
| ----------------- | ----------------------------- |
| `translateY(1px)` | Moves the face down by 1px    |
| `scaleX(0.97)`    | Narrows the face to 97% width |
| `none`            | Keeps the face in place       |

The face returns to rest on release. The effect follows the Soxa motion policy.

### Lists, fields, and progress

ListBox, Select, and Menu share row colors for highlighting and selection.
The shared Input height scale runs from 26px to 34px in 2px steps. Input is
28px tall with 13px text at normal size. Input, Select, and Textarea share a
neutral focus ring flush with the field border. ProgressLinear and
ProgressSpinner share an indicator color and follow the Soxa motion policy
while progress is unknown.

CheckBox has a 16px square box at normal size and fills checked and mixed
states by default. Use `outlined` for a visible border and unfilled box, or
`plain` for the mark alone. Switch uses a 29px × 18px track at normal size and
follows the Soxa motion policy.

Label and Field follow the shared caption scale. Field uses muted helper text
and the error color for validation messages. RadioGroup takes its ring size
from the CheckBox scale. Its `dot` view marks selection with a center dot and
`ring` uses a thicker border.

### Overlays

Tooltip uses a compact inverse surface. Popover follows the radius of the
collection panels. Dialog and AlertDialog use a 14px radius by default at a
16px root font size. Drawer rounds the corners facing the page. All three
modal components share the `dim`, `blur`, and `none` backdrop views. The
`--so-backdrop-blur` variable defaults to 3px.

### Chat content and attachments

CodeBlock uses a muted code surface and a 34px toolbar at normal size.
FileUpload pairs a dashed drop target with compact file rows. Use its
`item-progress` slot with ProgressLinear for per-file progress.
Tags use a 24px pill and 12px text at normal size. Avatar and AvatarGroup
keep the shared size scale. Separator uses the shared line thickness.

Set `data-so-theme="burg"` or `data-so-theme="burg-dark"` on the document root
or the container of the themed components. Load the stylesheet and register
the layout plugins at the application entry point.

```ts
import '@soxa-ui/theme-burg'
import burg from '@soxa-ui/theme-burg/setup'
import { useTheme } from '@soxa-ui/setup'

useTheme(burg)
```

Run these commands from the repository root. The full package build uses the
built declarations of Core, Setup, and Theme Base. The CSS build and the theme
checks also work directly from a checkout with dependencies installed.

```sh
npm run build:css --workspace=@soxa-ui/theme-burg
npm run watch --workspace=@soxa-ui/theme-burg
npm run build --workspace=@soxa-ui/theme-burg
npm run test:theme
```
