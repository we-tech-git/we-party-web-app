import { createI18n } from 'vue-i18n'

// Importando os arquivos de tradução com caminhos relativos
import ptBR from '../locales/pt-BR.json'
import enUS from '../locales/en-US.json'

// Configuração mais robusta para produção
const messages = {
  'pt-BR': ptBR,
  'en-US': enUS,
}

// Debug logs
if (!import.meta.env.PROD) {
  console.log('i18n: ptBR loaded:', !!ptBR, Object.keys(ptBR).length)
  console.log('i18n: enUS loaded:', !!enUS, Object.keys(enUS).length)
  console.log('i18n: messages object:', messages)
}

// Criando a instância do i18n com configuração mais explícita
const i18n = createI18n({
  legacy: false,
  locale: 'pt-BR',
  fallbackLocale: 'en-US',
  globalInjection: true,
  messages,
  // Configuração específica para produção
  silentTranslationWarn: import.meta.env.PROD,
  silentFallbackWarn: import.meta.env.PROD,
  missingWarn: !import.meta.env.PROD,
  fallbackWarn: !import.meta.env.PROD,
  // Configurações adicionais para garantir funcionamento em produção
  warnHtmlMessage: !import.meta.env.PROD,
  escapeParameter: false,
})

// Debug final
if (!import.meta.env.PROD) {
  console.log('i18n: instance created with locale:', i18n.global.locale.value)
  console.log('i18n: available locales:', i18n.global.availableLocales)
  console.log('i18n: testing translation:', i18n.global.t('login.title'))
}

export default i18n
