import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

/**
 * `createVuetify()` sozinho não registra `v-icon`/`v-menu`/etc. — no app
 * real isso funciona por causa do `vite-plugin-vuetify` (auto-import que
 * transforma o template em build time), que não existe no ambiente de
 * teste. Aqui registramos tudo explicitamente pra qualquer componente que
 * use tags do Vuetify montar sem "Failed to resolve component".
 */
export function createTestVuetify () {
  return createVuetify({ components, directives })
}
