import { fileURLToPath, URL } from 'node:url'
import Vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

// Config dedicada do Vitest, separada do vite.config.mts: o build de produção
// carrega plugins (PWA, Vuetify loader, rotas file-based, i18n, fontes) que
// teste unitário não precisa e que só deixariam a suíte mais lenta/instável.
// Ver REFACTOR_AUDIT_PLAN.md — Fase 0 / seção 2.8.
export default defineConfig({
  plugins: [Vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.spec.ts'],
    setupFiles: ['src/test/setup.ts'],
    // Sem isso, `import * as components from 'vuetify/components'` (usado
    // pra registrar o Vuetify inteiro em teste — ver src/test/vuetify.ts)
    // quebra: o barrel da Vuetify importa `.css` por efeito colateral, e
    // fora do pipeline do Vite (`server.deps.inline`) o Node tenta
    // resolver isso como módulo JS de verdade e falha.
    server: {
      deps: {
        inline: ['vuetify'],
      },
    },
  },
})
