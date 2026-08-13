import type { InjectionKey } from 'vue'

/**
 * Profundidade máxima da árvore de comentários (raiz = nível 1).
 * Espelha a validação do backend; ver docs/BACKEND_COMMENT_THREADS_SPEC.md.
 */
export const MAX_COMMENT_DEPTH = 5

export interface CommentUser {
  id: string
  name: string
  profileImage?: string
  role?: string | null
}

export interface CommentNodeData {
  id: string
  content: string
  createdAt: string
  likesCount: number
  isLikedByMe: boolean
  parentCommentId: string | null
  replies: CommentNodeData[]
  user: CommentUser
}

function mapUser (raw: any): CommentUser {
  return {
    id: raw?.id ?? '',
    name: raw?.name ?? 'Usuário',
    profileImage: raw?.profileImage,
    role: raw?.role ?? raw?.userType ?? null,
  }
}

/**
 * Converte um nó cru da API no formato interno. O backend não é consistente
 * entre endpoints (likesCount vs _count.likes, parentId vs parentCommentId),
 * então a tolerância a apelidos fica concentrada aqui.
 */
function mapNode (raw: any, fallbackParentId: string | null): CommentNodeData {
  return {
    id: String(raw?.id ?? ''),
    content: raw?.content ?? '',
    createdAt: raw?.createdAt ?? '',
    likesCount: raw?.likesCount ?? raw?._count?.likes ?? raw?.likes ?? 0,
    // `likedByCurrentUser` é o nome que a listagem do backend usa
    // (GET /events/:id/comments). Sem ele nesta lista, o campo caía sempre em
    // `false`: o coração nunca acendia, o usuário clicava de novo e o endpoint
    // — que é toggle — descurtia o comentário.
    isLikedByMe:
      raw?.isLikedByMe ?? raw?.likedByCurrentUser ?? raw?.likedByMe ?? false,
    parentCommentId: raw?.parentCommentId ?? raw?.parentId ?? fallbackParentId,
    replies: [],
    user: mapUser(raw?.user),
  }
}

/**
 * Achata a resposta da API numa lista única, descendo recursivamente por
 * `replies`/`children`. Aceita tanto a árvore aninhada quanto uma lista plana,
 * porque o nó filho carrega o pai no próprio `parentCommentId`.
 */
function flatten (raw: any[], parentId: string | null, out: CommentNodeData[]): void {
  if (!Array.isArray(raw)) {
    return
  }
  for (const item of raw) {
    if (!item?.id) {
      continue
    }
    const node = mapNode(item, parentId)
    out.push(node)
    const children = item.replies ?? item.children
    if (Array.isArray(children)) {
      flatten(children, node.id, out)
    }
  }
}

/**
 * Monta a árvore de comentários a partir da resposta da API.
 *
 * Um nó vira raiz quando não tem pai, quando o pai não veio na resposta
 * (página parcial) ou quando anexá-lo ultrapassaria MAX_COMMENT_DEPTH —
 * assim nada some da tela mesmo se o backend devolver mais níveis do que o
 * contrato promete.
 *
 * A profundidade é resolvida subindo pela cadeia de pais, com memo, então o
 * resultado **não depende da ordem** em que a API devolveu os nós: uma lista
 * plana com o filho antes do pai (o que uma CTE recursiva produz naturalmente)
 * monta a mesma árvore que a versão aninhada.
 */
export function normalizeCommentTree (raw: any[]): CommentNodeData[] {
  const flat: CommentNodeData[] = []
  flatten(raw, null, flat)

  const byId = new Map<string, CommentNodeData>()
  for (const node of flat) {
    byId.set(node.id, node)
  }

  const depthOf = new Map<string, number>()

  /** `guard` carrega a cadeia em resolução, para cortar ciclos vindos da API. */
  function resolveDepth (node: CommentNodeData, guard: Set<string>): number {
    const cached = depthOf.get(node.id)
    if (cached !== undefined) {
      return cached
    }

    const parent = node.parentCommentId ? byId.get(node.parentCommentId) : undefined
    // Sem pai na resposta, auto-referência ou ciclo → promove a raiz.
    if (!parent || parent === node || guard.has(node.id)) {
      node.parentCommentId = null
      depthOf.set(node.id, 1)
      return 1
    }

    guard.add(node.id)
    const depth = resolveDepth(parent, guard) + 1
    guard.delete(node.id)

    if (depth > MAX_COMMENT_DEPTH) {
      node.parentCommentId = null
      depthOf.set(node.id, 1)
      return 1
    }

    depthOf.set(node.id, depth)
    return depth
  }

  // Duas passadas: resolver a profundidade de todos antes de anexar, porque
  // resolveDepth pode zerar o `parentCommentId` de um ancestral no caminho.
  for (const node of flat) {
    resolveDepth(node, new Set())
  }

  const roots: CommentNodeData[] = []
  for (const node of flat) {
    const parent = node.parentCommentId ? byId.get(node.parentCommentId) : undefined
    if (parent && depthOf.get(node.id)! > 1) {
      parent.replies.push(node)
    } else {
      node.parentCommentId = null
      roots.push(node)
    }
  }

  return roots
}

export type CommentSortMode = 'best' | 'new' | 'old'

function timeOf (node: CommentNodeData): number {
  const t = new Date(node.createdAt).getTime()
  return Number.isNaN(t) ? 0 : t
}

/**
 * Ordena a árvore **in place**, em todos os níveis. Mutar em vez de projetar
 * uma cópia preserva a identidade dos nós, então o insert otimista de uma
 * resposta (que acha o pai por id na árvore original) continua funcionando.
 */
export function sortCommentTree (nodes: CommentNodeData[], mode: CommentSortMode): void {
  nodes.sort((a, b) => {
    if (mode === 'new') {
      return timeOf(b) - timeOf(a)
    }
    if (mode === 'old') {
      return timeOf(a) - timeOf(b)
    }
    // 'best': mais curtidos primeiro, empate desfeito pelo mais recente
    return (b.likesCount - a.likesCount) || (timeOf(b) - timeOf(a))
  })
  for (const node of nodes) {
    sortCommentTree(node.replies, mode)
  }
}

/** Ids de todos os nós que têm respostas — usado pelo "recolher tudo". */
export function collectParentIds (nodes: CommentNodeData[], out: string[] = []): string[] {
  for (const node of nodes) {
    if (node.replies.length > 0) {
      out.push(node.id)
      collectParentIds(node.replies, out)
    }
  }
  return out
}

/** Total de nós da árvore, incluindo todas as respostas aninhadas. */
export function countComments (nodes: CommentNodeData[]): number {
  let total = 0
  for (const node of nodes) {
    total += 1 + countComments(node.replies)
  }
  return total
}

/**
 * Remove um nó em qualquer profundidade, junto com seus descendentes —
 * espelha o `onDelete: Cascade` do backend. Retorna true se removeu algo.
 */
export function removeCommentById (nodes: CommentNodeData[], id: string): boolean {
  const index = nodes.findIndex(node => node.id === id)
  if (index !== -1) {
    nodes.splice(index, 1)
    return true
  }
  for (const node of nodes) {
    if (removeCommentById(node.replies, id)) {
      return true
    }
  }
  return false
}

/** Busca um nó por id em qualquer profundidade. */
export function findCommentById (nodes: CommentNodeData[], id: string): CommentNodeData | null {
  for (const node of nodes) {
    if (node.id === id) {
      return node
    }
    const found = findCommentById(node.replies, id)
    if (found) {
      return found
    }
  }
  return null
}

/**
 * Ações e estado que o CommentNode recursivo consome. Passar isto por
 * provide/inject evita re-emitir cada evento em todos os 5 níveis.
 */
export interface CommentTreeContext {
  isLiked: (comment: CommentNodeData) => boolean
  likesCount: (comment: CommentNodeData) => number
  isMine: (comment: CommentNodeData) => boolean
  isLiking: (id: string) => boolean
  isDeleting: (id: string) => boolean
  isReplyingTo: (id: string) => boolean
  isCollapsed: (id: string) => boolean
  /** Nó recém-enviado, para o realce temporário de "acabou de chegar". */
  isFresh: (id: string) => boolean
  toggleLike: (comment: CommentNodeData) => void
  startReply: (comment: CommentNodeData) => void
  cancelReply: () => void
  submitReply: () => void
  remove: (comment: CommentNodeData) => void
  toggleCollapse: (comment: CommentNodeData) => void
  replyText: { value: string }
  sendingReply: { value: boolean }
  replyToName: { value: string }
}

export const commentTreeKey: InjectionKey<CommentTreeContext> = Symbol('commentTree')
