import { render as ssr } from 'svelte/server'
import Fixture from '../Fixture.svelte'
import { TComponent } from '@soxa-ui/core'
import { TPluginBundle } from '@soxa-ui/plugins'
import '../setup'
export const prototypes = { component: TComponent, bundle: TPluginBundle }
export const render = (spec: never) => ssr(Fixture, { props: { spec } }).body
