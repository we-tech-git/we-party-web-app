import { createI18n } from 'vue-i18n'

// Importando os arquivos de tradução com caminhos relativos
import ptBR from '../locales/pt-BR.json'
import enUS from '../locales/en-US.json'

// Configuração mais robusta para produção
const messages = {
  'pt-BR': ptBR,
  'en-US': enUS,
}

// Criando a instância do i18n com configuração mais explícita
const i18n = createI18n({
  legacy: false,
  locale: 'pt-BR',
  fallbackLocale: 'en-US',
  globalInjection: true,
  messages,
  // Silenciar todos os warnings em produção
  silentTranslationWarn: true,
  silentFallbackWarn: true,
  missingWarn: false,
  fallbackWarn: false,
  warnHtmlMessage: false,
  escapeParameter: false,
})

export default i18n
