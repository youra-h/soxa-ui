import './setup'
import { mount } from 'svelte'
import Recipes from './Recipes.svelte'

const target = document.getElementById('app')
if (!target) throw new Error('Missing app root')
mount(Recipes, { target })
