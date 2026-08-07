import { ref } from 'vue'
import { toggleLikeComment } from '@/api/comments'

/**
 * Forma mínima que um nó de comentário precisa ter para ser curtido.
 * `isLikedByMe` é opcional porque nem todo endpoint devolve o campo.
 */
export interface LikeableComment {
  id: string
  likesCount: number
  isLikedByMe?: boolean
}

/**
 * Estado de curtida de comentários.
 *
 * Cada tela que lista comentários mantinha sua própria cópia dessa lógica e
 * elas divergiram: duas descartavam a resposta do toggle e deixavam o ±1
 * otimista empilhado sobre a contagem do GET, o que dobrava a própria curtida
 * no reload seguinte. Aqui existe uma implementação só.
 *
 * Detalhe importante: os overrides **não** são zerados quando a lista é
 * recarregada. O endpoint de listagem nem sempre devolve `isLikedByMe`, e o
 * mapeamento coage o campo ausente para `false` — indistinguível de um "não
 * curtiu" real. Zerar o override fazia o coração apagar após um refetch, o
 * usuário clicava de novo e o backend (que é toggle) **descurtia**. É esse o
 * bug de "consigo curtir o mesmo comentário mais de uma vez".
 *
 * @param eventId - getter, porque a tela pode trocar de evento sem remontar.
 */
export function useCommentLikes (eventId: () => string | number) {
  // O que o usuário fez nesta sessão, chaveado por id do comentário.
  // Sobrepõe o que veio do GET enquanto o componente estiver montado.
  const likedOverride = ref<Record<string, boolean>>({})
  const countOverride = ref<Record<string, number>>({})
  const pendingId = ref<string | null>(null)

  function isLiked (comment: LikeableComment): boolean {
    return likedOverride.value[comment.id] ?? comment.isLikedByMe ?? false
  }

  function likesCount (comment: LikeableComment): number {
    return Math.max(0, countOverride.value[comment.id] ?? comment.likesCount ?? 0)
  }

  function isPending (comment: LikeableComment): boolean {
    return pendingId.value === comment.id
  }

  async function toggle (comment: LikeableComment) {
    // O endpoint é um toggle: dois POSTs no mesmo comentário se anulam.
    if (pendingId.value === comment.id) {
      return
    }
    pendingId.value = comment.id

    const wasLiked = isLiked(comment)
    const previousCount = likesCount(comment)

    likedOverride.value[comment.id] = !wasLiked
    countOverride.value[comment.id] = Math.max(0, previousCount + (wasLiked ? -1 : 1))

    try {
      const res: any = await toggleLikeComment(eventId(), comment.id)

      // A spec devolve `{ data: { liked, likesCount } }`. Usar esse número como
      // verdade — em vez de manter o ±1 otimista — é o que impede a contagem de
      // divergir do banco. Ver docs/BACKEND_COMMENT_THREADS_SPEC.md.
      const payload = res?.data?.data ?? res?.data ?? res
      const serverCount = payload?.likesCount ?? payload?._count?.likes
      const serverLiked = payload?.liked ?? payload?.isLikedByMe

      if (typeof serverLiked === 'boolean') {
        likedOverride.value[comment.id] = serverLiked
        // Grava também no nó para que uma reordenação ou um re-render a partir
        // da árvore já carregada não volte ao valor antigo.
        comment.isLikedByMe = serverLiked
      }
      if (typeof serverCount === 'number' && Number.isFinite(serverCount)) {
        const normalized = Math.max(0, serverCount)
        countOverride.value[comment.id] = normalized
        comment.likesCount = normalized
      }
    } catch (error) {
      // Restaura o estado exato de antes do clique.
      likedOverride.value[comment.id] = wasLiked
      countOverride.value[comment.id] = previousCount
      console.error('Erro ao curtir comentário:', error)
    } finally {
      pendingId.value = null
    }
  }

  /**
   * Descarta os overrides. Só faz sentido ao trocar de evento — dentro do mesmo
   * evento os overrides precisam sobreviver ao refetch (ver nota acima).
   */
  function reset () {
    likedOverride.value = {}
    countOverride.value = {}
  }

  return { isLiked, likesCount, isPending, toggle, reset }
}
