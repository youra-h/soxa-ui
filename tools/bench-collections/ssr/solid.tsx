import { renderToString } from 'solid-js/web'
import { Fixture } from '../solid-fixture'
import { TComponent } from '@soxa-ui/core'
import { TPluginBundle } from '@soxa-ui/plugins'
import '../setup'
export const prototypes = { component: TComponent, bundle: TPluginBundle }
export const render = (spec: never) => renderToString(() => <Fixture spec={spec} />)
