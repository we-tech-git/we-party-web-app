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
  /** Caminho da rota (ex.: "/public/Login"). Usado para montar canonical e og:url. */
  path: string
  /** URL absoluta da imagem para og:image/twitter:image. */
  image?: string
}

export function useSeoMeta (options: SeoMetaOptions) {
  const { title, description, path, image = DEFAULT_OG_IMAGE } = options
  const url = `${SITE_URL}${path}`

  useHead({
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
  })
}
