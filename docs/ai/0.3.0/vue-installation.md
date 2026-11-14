# Install the checked Vue consumer

Use Node 22.12+ (Node 24 is checked), Vue 3.5 and a Vite Vue TypeScript app.
Install exact packages and retain the lock:

```sh
npm install --save-exact @soxa-ui/vue@0.3.0 @soxa-ui/core@0.3.0 @soxa-ui/setup@0.3.0 @soxa-ui/plugins@0.3.0 @soxa-ui/theme-base@0.3.0 @soxa-ui/theme-oren@0.3.0 @soxa-ui/icons-material@0.3.0
```

The attached vue-main shows startup. Copy TravelRecipes.vue and CtrlExample.vue
together and preserve relative imports. No workspace alias or library checkout
is needed. The theme stylesheet supplies appearance; useTheme(oren) supplies
behavior and TypeScript augmentation. useIcons(material) supplies role icons.
Register before mounting. Use only values declared by your selected theme;
the example checks Oren variant="accent". The minimal vue-button recipe is
headless. Missing role icons produce warnings when a component needs them.
