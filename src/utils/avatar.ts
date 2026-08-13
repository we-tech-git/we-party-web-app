/**
 * Helpers de avatar compartilhados — iniciais + gradiente estável por usuário.
 *
 * Usados pelo componente global `UserAvatar` e por qualquer tela que precise
 * derivar as iniciais ou o gradiente fora do componente. A regra de iniciais é
 * a definida pelo produto: inicial do primeiro nome, ou do primeiro + segundo
 * nome quando o usuário cadastrou mais de um nome.
 */

export const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#FF5FA6,#FF9D3D)',
  'linear-gradient(135deg,#7C5CFF,#C54BFF)',
  'linear-gradient(135deg,#3E7BFB,#5B93FF)',
  'linear-gradient(135deg,#10A87D,#34D399)',
  'linear-gradient(135deg,#F59E0B,#FBBF24)',
  'linear-gradient(135deg,#EC4899,#F472B6)',
  'linear-gradient(135deg,#06B6D4,#3B82F6)',
  'linear-gradient(135deg,#8B5CF6,#EC4899)',
]

/**
 * Iniciais exibidas quando não há foto: primeiro + segundo nome (ou só o
 * primeiro quando o nome é uma palavra só).
 */
export function getInitials (name: string): string {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) {
    return '?'
  }
  const first = parts[0]?.[0] ?? ''
  if (parts.length === 1) {
    return first.toUpperCase()
  }
  const second = parts[1]?.[0] ?? ''
  return (first + second).toUpperCase()
}

/**
 * Gradiente estável por `seed` (normalmente o nome): o mesmo usuário mantém a
 * mesma cor entre renders e telas, evitando "piscar" de um aleatório puro.
 */
export function getAvatarGradient (seed: string): string {
  if (!seed) {
    return AVATAR_GRADIENTS[0]!
  }
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (seed.codePointAt(i) || 0) + ((hash << 5) - hash)
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length]!
}

/**
 * Resolve caminhos relativos de mídia contra a base da API; URLs absolutas
 * (http/https) e URLs de dados locais (blob:/data:) passam intactas.
 */
export function resolveAvatarImage (val?: string | null): string {
  if (!val) {
    return ''
  }
  if (/^(https?:|blob:|data:)/i.test(val)) {
    return val
  }
  const base = (import.meta.env.VITE__BASE_URL || '').replace(/\/$/, '')
  const path = val.startsWith('/') ? val : `/${val}`
  return `${base}${path}`
}
