// src/plugins/vuetify.ts

// Composables
import { createVuetify } from 'vuetify'

// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  theme: {
    // 1. Forçamos o uso do tema 'light' que definimos abaixo
    defaultTheme: 'light',
    themes: {
      light: {
        dark: false, // Indica que este não é um tema escuro
        colors: {
          primary: '#1867C0', // Cor de exemplo, pode mudar depois
          secondary: '#5CBBF6', // Cor de exemplo, pode mudar depois
          surface: '#FFFFFF', // 2. Definimos o fundo (surface) como BRANCO
        },
      },
    },
  },
})
