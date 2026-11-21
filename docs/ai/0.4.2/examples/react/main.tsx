import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { useIcons, useTheme } from '@soxa-ui/setup'
import * as material from '@soxa-ui/icons-material'
import oren from '@soxa-ui/theme-oren/setup'
import '@soxa-ui/theme-oren'
import TravelRecipes from './TravelRecipes'

useIcons(material)
useTheme(oren)

const root = document.getElementById('root')
if (!root) throw new Error('Missing application root')
createRoot(root).render(
	<StrictMode>
		<TravelRecipes />
	</StrictMode>,
)
