import { createI18n } from 'vue-i18n'

import enUS from '../locales/en-US.json'
// Importando os arquivos de tradução
import ptBR from '../locales/pt-BR.json'

// Criando a instância do i18n
const i18n = createI18n({
  legacy: false, // Essencial para usar a Composition API do Vue 3
  locale: 'pt-BR', // Define o idioma padrão
  fallbackLocale: 'en-US', // Idioma de fallback caso uma tradução não exista
  messages: {
    'pt-BR': ptBR,
    'en-US': enUS,
  },
})

export default i18n
