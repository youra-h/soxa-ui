# Nuxt universal rendering

The attached config/plugin target Nuxt 4. Register useTheme/useIcons at plugin
module scope, outside defineNuxtPlugin's per-app callback. Registries are
process-wide; per-request registration accumulates plugins. The same module
executes on server and browser. Put CSS in nuxt.config's css array; the setup
import brings TypeScript augmentation.
Copy TravelRecipes.vue and CtrlExample.vue into app/components. app.vue imports Recipes.
Keep refs, controllers and user data inside setup. A module-level controller
would leak state between requests. Use stable initial dates/values/ids, avoiding
random/current-time/browser-only values in the initial render. The recipe fixes
a date and timeZone UTC. Keep locale and timezone consistent across SSR/client.
DOM-only actions belong in onMounted with onUnmounted cleanup. Do not wrap the
form in ClientOnly to hide hydration problems. Smoke checks server HTML without
JavaScript, consecutive requests, names/id references, hydration warnings and
interactive remounting. No source alias or client-only plugin is needed.
