/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Composables
import { createApp } from 'vue'

import i18n from '@/plugins/i18n'
import { logger } from '@/utils/logger'

// Components
import App from './App.vue'
// Plugins
import { registerPlugins } from './plugins'

// Styles
import 'unfonts.css'
// src/main.ts
import './styles/main.css'

const app = createApp(App)

registerPlugins(app)

app.use(i18n)

// Rede de segurança global: captura erros que escapam do ErrorBoundary
// (ex.: handlers de eventos assíncronos e watchers sem catch).
// O logger só imprime em desenvolvimento — silencioso em produção.
app.config.errorHandler = (err, _instance, info) => {
  logger.error('[GlobalErrorHandler]', info, err)
}

app.mount('#app')
