/**
 * Helpers de apresentação compartilhados por InlineComments e CommentNode.
 * Versões equivalentes ainda vivem inline em CommentsDrawer, EventDetails e
 * NewEventDetails — migrar aquelas para cá é um passo seguinte.
 */

const AVATAR_COLORS = [
  '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
  '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50',
]

/** Data relativa curta ("agora", "5min", "3h", "2d") com fallback para dd/mmm. */
export function formatDate (dateStr: string): string {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) {
    return ''
  }
  const diffMin = Math.floor((Date.now() - d.getTime()) / 60_000)
  if (diffMin < 1) {
    return 'agora'
  }
  if (diffMin < 60) {
    return `${diffMin}min`
  }
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) {
    return `${diffH}h`
  }
  const diffD = Math.floor(diffH / 24)
  if (diffD < 7) {
    return `${diffD}d`
  }
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export function getInitial (name: string): string {
  return (name || 'U').charAt(0).toUpperCase()
}

/** Deriva um @handle legível a partir do nome, sem acentos nem símbolos. */
export function getHandle (name: string): string {
  if (!name) {
    return 'usuario'
  }
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9.]/g, '')
}

/** Cor estável por nome, para avatares sem foto. */
export function getAvatarColor (name: string): string {
  if (!name) {
    return AVATAR_COLORS[0]!
  }
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (name.codePointAt(i) || 0) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash % AVATAR_COLORS.length)]!
}

/** Resolve caminhos relativos de mídia contra a base da API. */
export function resolveAsset (val?: string): string {
  if (!val) {
    return ''
  }
  if (/^https?:\/\//i.test(val)) {
    return val
  }
  const base = (import.meta.env.VITE__BASE_URL || '').replace(/\/$/, '')
  return `${base}${val.startsWith('/') ? val : `/${val}`}`
}
