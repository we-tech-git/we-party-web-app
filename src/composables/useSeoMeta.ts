/**
 * useSeoMeta Composable
 * Define title/description/canonical/og:url únicos por rota pública.
 * As tags estáticas do index.html continuam como fallback (primeiro paint
 * e crawlers que não executam JS).
 */

import { useHead } from '@unhead/vue'

export const SITE_URL = 'https://wepartyapp.com'
const SITE_NAME = 'We Party'
const DEFAULT_OG_IMAGE = `${SITE_URL}/pwa-512x512.png`

interface SeoMetaOptions {
  /** Título completo da página (ex.: "Entrar | We Party"). */
  title: string
  /** Descrição única da página, em pt-BR, para meta description / og:description. */
  description: string
  /** Caminho da rota (ex.: "/login"). Usado para montar canonical e og:url. */
  path: string
  /** URL absoluta da imagem para og:image/twitter:image. */
  image?: string
}

/**
 * `options` aceita um objeto estático (páginas cujo título não muda) ou uma
 * função `() => SeoMetaOptions` (páginas cujo título depende de dado
 * assíncrono, ex. nome do interesse depois do fetch). Sempre chamar UMA VEZ
 * no topo do `setup()` — nunca dentro de `watch`/`watchEffect`: `useHead`
 * precisa do contexto de injeção do componente, que só existe durante a
 * execução síncrona de `setup()`. Passar a função crua pro `useHead`
 * (em vez de já invocar `options()` aqui) é o que garante a reatividade —
 * o `unhead` reavalia a função sozinho a cada mudança das dependências.
 */
export function useSeoMeta (options: SeoMetaOptions | (() => SeoMetaOptions)) {
  const resolve = typeof options === 'function' ? options : () => options

  useHead(() => {
    const { title, description, path, image = DEFAULT_OG_IMAGE } = resolve()
    const url = `${SITE_URL}${path}`

    return {
      title,
      meta: [
        { name: 'description', content: description },
        { property: 'og:site_name', content: SITE_NAME },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: url },
        { property: 'og:image', content: image },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
        { name: 'twitter:image', content: image },
      ],
      link: [
        { rel: 'canonical', href: url },
      ],
    }
  })
}
