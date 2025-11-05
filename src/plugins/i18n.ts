import { createI18n } from 'vue-i18n'

// Importando os arquivos de tradução diretamente
import ptBR from '@/locales/pt-BR.json'
import enUS from '@/locales/en-US.json'

// Criando a instância do i18n
const i18n = createI18n({
  legacy: false, // Usar Composition API
  locale: 'pt-BR', // Idioma padrão
  fallbackLocale: 'en-US', // Fallback
  globalInjection: true, // Injeção global do $t
  messages: {
    'pt-BR': ptBR,
    'en-US': enUS,
  },
  // Desabilitar warnings em produção
  silentTranslationWarn: import.meta.env.PROD,
  silentFallbackWarn: import.meta.env.PROD,
  missingWarn: !import.meta.env.PROD,
  fallbackWarn: !import.meta.env.PROD,
})

export default i18n
