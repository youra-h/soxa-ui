import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { view } from '../vue-fixture'
import { TComponent } from '@soxa-ui/core'
import { TPluginBundle } from '@soxa-ui/plugins'
import '../setup'
export const prototypes = { component: TComponent, bundle: TPluginBundle }
export const render = (spec: never) => renderToString(createSSRApp({ render: () => view(spec) }))
