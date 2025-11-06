// Fallback para traduções quando i18n falha em produção
import ptBR from '@/locales/pt-BR.json'
import enUS from '@/locales/en-US.json'

const translations = {
  'pt-BR': ptBR,
  'en-US': enUS,
}

// Função de fallback para traduções
export function getTranslation(key: string, locale: string = 'pt-BR'): string {
  try {
    const keys = key.split('.')
    let value: any = translations[locale as keyof typeof translations]

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        // Se não encontrar na linguagem atual, tenta no fallback
        if (locale !== 'en-US') {
          return getTranslation(key, 'en-US')
        }
        return key // Retorna a chave se não encontrar tradução
      }
    }

    return typeof value === 'string' ? value : key
  } catch (error) {
    if (!import.meta.env.PROD) {
      console.error('Translation fallback error:', error)
    }
    return key
  }
}

// Plugin para adicionar ao Vue como backup
export function createFallbackPlugin() {
  return {
    install(app: any) {
      app.config.globalProperties.$tf = getTranslation

      // Monitorar se o $t está funcionando
      const originalT = app.config.globalProperties.$t
      if (originalT) {
        app.config.globalProperties.$t = function(key: string, ...args: any[]) {
          try {
            const result = originalT.call(this, key, ...args)
            // Se retorna a chave, significa que a tradução falhou
            if (result === key || result.includes('.')) {
              if (!import.meta.env.PROD) {
                console.warn('i18n: falling back for key:', key)
              }
              return getTranslation(key)
            }
            return result
          } catch (error) {
            if (!import.meta.env.PROD) {
              console.error('i18n: error, using fallback:', error)
            }
            return getTranslation(key)
          }
        }
      } else {
        // Se $t não existir, usa apenas o fallback
        app.config.globalProperties.$t = getTranslation
      }
    }
  }
}
