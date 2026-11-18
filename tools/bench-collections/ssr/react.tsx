import { renderToString } from 'react-dom/server'
import { Fixture } from '../react-fixture'
import { TComponent } from '@soxa-ui/core'
import { TPluginBundle } from '@soxa-ui/plugins'
import '../setup'
export const prototypes = { component: TComponent, bundle: TPluginBundle }
export const render = (spec: never) => renderToString(<Fixture spec={spec} />)
