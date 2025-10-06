/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Composables
import { createApp } from 'vue'

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

app.mount('#app')
