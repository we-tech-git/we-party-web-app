/**
 * Valida o `?next=` do login: só caminho relativo da própria app.
 *
 * Bloqueia open redirect (`https://…`, `//host`, `/\host`) e volta ao próprio
 * login. Devolve `null` quando o valor não serve — quem chama usa o destino
 * padrão.
 */
export function getSafeNextPath (next: unknown): string | null {
  if (typeof next !== 'string' || !next.startsWith('/')) {
    return null
  }
  if (next.startsWith('//') || next.includes('\\')) {
    return null
  }
  if (/^\/login(?:[/?#]|$)/i.test(next)) {
    return null
  }
  return next
}

/** Rota de login guardando o destino original (com query, ex.: `?ref=`) em `?next=`. */
export function loginPathWithNext (fullPath?: string): string {
  const next = getSafeNextPath(fullPath)
  return next ? `/login?next=${encodeURIComponent(next)}` : '/login'
}
