// src/plugins/vuetify.ts

// Composables
import { createVuetify } from 'vuetify'

// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        dark: false,
        colors: {
          'primary': '#FF5FA6',
          'secondary': '#FFBA4B',
          'surface': '#FFFFFF',
          'background': '#FFF5F7',
          'on-surface': '#1F2937',
          'on-background': '#1F2937',
        },
      },
    },
  },
})
