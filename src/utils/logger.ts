/**
 * Utilitário de logging que só funciona em desenvolvimento
 * Evita expor dados sensíveis em produção
 */
export const logger = {
  log: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.log(...args)
    }
  },

  warn: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.warn(...args)
    }
  },

  error: (...args: any[]) => {
    // Erros sempre são logados, mesmo em produção
    console.error(...args)
  },

  info: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.info(...args)
    }
  },

  debug: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.debug(...args)
    }
  },
}
