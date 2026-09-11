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
  },
})
