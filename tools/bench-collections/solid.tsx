import { render } from 'solid-js/web'
import { Fixture } from './solid-fixture'
import { install } from './client'
install((element, spec) => render(() => <Fixture spec={spec} />, element))
