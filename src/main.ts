/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Composables
import { createApp } from 'vue'

import i18n from '@/plugins/i18n'

// Components
import App from './App.vue'
// Plugins
import { registerPlugins } from './plugins'

// Styles
import 'unfonts.css'
// src/main.ts
import './styles/main.css'

// ... resto do código

const app = createApp(App)

registerPlugins(app)

app.use(i18n)

app.mount('#app')
