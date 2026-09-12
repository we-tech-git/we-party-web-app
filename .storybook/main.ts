import type { StorybookConfig } from '@storybook/vue3-vite'
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import Vue from '@vitejs/plugin-vue'

// Config dedicada do Storybook — igual ao vitest.config.ts (ver
// REFACTOR_AUDIT_PLAN.md, Fase 0/3): não reaproveita o vite.config.mts de
// produção porque ele carrega plugins (PWA, rotas file-based, i18n, fontes)
// que o catálogo de componentes não precisa.
const config: StorybookConfig = {
  stories: ['../src/components/UI/**/*.stories.@(ts|mts)'],
  addons: ['@storybook/addon-docs'],
  framework: {
    name: '@storybook/vue3-vite',
    options: {},
  },
  core: {
    builder: {
      name: '@storybook/builder-vite',
      // Aponta pra um vite.config "vazio" (.storybook/vite.config.ts) em
      // vez de deixar o builder descobrir sozinho o vite.config.mts da
      // raiz — ver comentário nesse arquivo.
      options: { viteConfigPath: '.storybook/vite.config.ts' },
    },
  },
  viteFinal: async viteConfig => {
    viteConfig.plugins = [...(viteConfig.plugins ?? []), Vue(), tailwindcss()]
    viteConfig.resolve = {
      ...viteConfig.resolve,
      alias: {
        ...viteConfig.resolve?.alias,
        '@': fileURLToPath(new URL('../src', import.meta.url)),
      },
    }
    return viteConfig
  },
}

export default config
