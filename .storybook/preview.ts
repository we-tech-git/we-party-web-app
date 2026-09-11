import type { Preview } from '@storybook/vue3-vite'
import { setup } from '@storybook/vue3-vite'
import { createVuetify } from 'vuetify'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import '../src/styles/main.css'

// Mesmo tema de src/plugins/vuetify.ts — mantidos em sincronia à mão até
// a Fase 2 seguinte (radius/sombra/etc.) decidir se vale a pena extrair
// isso pra um arquivo compartilhado entre app e Storybook.
const vuetify = createVuetify({
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        dark: false,
        colors: {
          'primary': '#ff5f8f',
          'secondary': '#ff9a4d',
          'surface': '#FFFFFF',
          'background': '#FFF5F7',
          'on-surface': '#1F2937',
          'on-background': '#1F2937',
        },
      },
    },
  },
})

setup(app => {
  app.use(vuetify)
})

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
}

export default preview
