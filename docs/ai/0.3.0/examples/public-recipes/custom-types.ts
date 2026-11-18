import studio from '@example/soxa-theme/setup'
import { TButton } from '@soxa-ui/core'

void studio
new TButton({ variant: 'studio', view: 'soft' })
// @ts-expect-error The custom theme does not declare Oren's accent variant.
new TButton({ variant: 'accent' })
// @ts-expect-error Unknown view is rejected by the theme registry.
new TButton({ view: 'invented' })
