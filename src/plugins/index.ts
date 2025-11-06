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
  // Registrar i18n primeiro para garantir disponibilidade global
  app.use(i18n)
  
  // Debug: verificar se o i18n foi registrado
  if (!import.meta.env.PROD) {
    console.log('i18n: plugin registered, global $t available:', !!app.config.globalProperties.$t)
  }
  
  app
    .use(vuetify)
    .use(router)
    .use(pinia)
}
