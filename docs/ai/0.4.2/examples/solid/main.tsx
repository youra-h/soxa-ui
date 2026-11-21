import { render } from 'solid-js/web'
import './setup'
import Recipes from './Recipes'

const root = document.getElementById('app')
if (!root) throw new Error('Missing app root')
render(() => <Recipes />, root)
