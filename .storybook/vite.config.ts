import { defineConfig } from 'vite'

// Config "vazia" proposital — existe só pra impedir que o builder do
// Storybook descubra e mescle automaticamente o vite.config.mts da raiz
// (que carrega PWA, rotas file-based, i18n, fontes: nada disso faz
// sentido pra build de um catálogo de componentes, e o plugin de PWA
// chega a quebrar o build por causa do limite de precache). Ver
// `main.ts` (`core.builder.options.viteConfigPath`) e `vitest.config.ts`
// pro mesmo raciocínio aplicado aos testes.
export default defineConfig({})
