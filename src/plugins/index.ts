/**
 * plugins/index.ts
 *
 * Automatically included in `./src/main.ts`
 */

// Types
import type { App } from 'vue'
import router from '../router'
import pinia from '../stores'

// Plugins
import i18n from './i18n'
import vuetify from './vuetify'

export function registerPlugins (app: App) {
  app
    .use(i18n)
    .use(vuetify)
    .use(router)
    .use(pinia)
}
