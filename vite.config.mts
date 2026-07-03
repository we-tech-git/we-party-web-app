import { dirname, resolve } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import tailwindcss from '@tailwindcss/vite'
import Vue from '@vitejs/plugin-vue'
// Plugins
import AutoImport from 'unplugin-auto-import/vite'
import Fonts from 'unplugin-fonts/vite'
import Components from 'unplugin-vue-components/vite'

import { VueRouterAutoImports } from 'unplugin-vue-router'
import VueRouter from 'unplugin-vue-router/vite'
// Utilities
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import Layouts from 'vite-plugin-vue-layouts-next'
import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    VueRouter({
      dts: 'src/typed-router.d.ts',
    }),
    Layouts(),
    AutoImport({
      imports: [
        'vue',
        VueRouterAutoImports,
        {
          pinia: ['defineStore', 'storeToRefs'],
        },
      ],
      dts: 'src/auto-imports.d.ts',
      eslintrc: {
        enabled: true,
      },
      vueTemplate: true,
    }),
    Components({
      dts: 'src/components.d.ts',
    }),
    Vue({
      template: { transformAssetUrls },
    }),
    // https://github.com/vuetifyjs/vuetify-loader/tree/master/packages/vite-plugin#readme
    Vuetify({
      autoImport: true,
      styles: {
        configFile: 'src/styles/settings.scss',
      },
    }),
    VueI18nPlugin({
      include: [
        resolve(dirname(fileURLToPath(import.meta.url)), './src/locales/**'),
      ],
      strictMessage: false,
    }),
    // PWA — torna o app instalável (Adicionar à tela inicial / Instalar app)
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: [
        'logoweparty.png',
        'apple-touch-icon.png',
        'pwa-64x64.png',
      ],
      manifest: {
        name: 'We Party',
        short_name: 'We Party',
        description: 'Descubra eventos perto de você e conecte-se com pessoas que também vão.',
        lang: 'pt-BR',
        theme_color: '#FFB74D',
        background_color: '#fff5f5',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        // SPA fallback, mas sem interceptar chamadas de API
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/],
      },
      devOptions: {
        // Habilita o service worker em `yarn dev` para testar a instalação localmente
        enabled: true,
        type: 'module',
        suppressWarnings: true,
      },
    }),
    Fonts({
      fontsource: {
        families: [
          {
            name: 'Roboto',
            weights: [100, 300, 400, 500, 700, 900],
            styles: ['normal', 'italic'],
          },
        ],
      },
      google: {
        families: [
          {
            name: 'Baloo Thambi 2',
            styles: 'wght@400;500;600;700;800',
          },
          {
            name: 'Poppins',
            styles: 'wght@400;500;600;700',
          },
        ],
      },
    }),
  ],
  optimizeDeps: {
    include: ['vuetify'],
    exclude: [
      'unplugin-vue-router/runtime',
      'unplugin-vue-router/data-loaders',
      'unplugin-vue-router/data-loaders/basic',
    ],
  },
  define: { 'process.env': '{}' },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('src', import.meta.url)),
    },

    extensions: ['.js', '.json', '.jsx', '.mjs', '.ts', '.tsx', '.vue'],
  },
  build: {
    rollupOptions: {
      output: {
        // Melhora o preload de assets
        manualChunks: {
          vuetify: ['vuetify'],
          vue: ['vue', 'vue-router', 'pinia'],
        },
      },
    },
    // Remove avisos de chunks grandes
    chunkSizeWarningLimit: 1500,
  },
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'https://api.dev.wepartyapp.com',
        changeOrigin: true,
        secure: true,
        rewrite: path => path.replace(/^\/api/, ''),
      },
    },
  },
})
