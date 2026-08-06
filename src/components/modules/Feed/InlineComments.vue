<script setup lang="ts">
  import type { CommentNodeData, CommentSortMode, CommentTreeContext } from './commentTree'
  import { computed, nextTick, onMounted, onUnmounted, provide, ref, watch } from 'vue'
  import { unwrapList } from '@/api'
  import {
    addEventComment,
    deleteEventComment,
    getEventComments,
    replyToComment,
    toggleLikeComment,
  } from '@/api/comments'
  import { useAuth } from '@/composables/useAuth'
  import { getAvatarColor, getInitial, resolveAsset } from './commentDisplay'
  import CommentNode from './CommentNode.vue'
  import {
    collectParentIds,
    commentTreeKey,
    countComments,
    findCommentById,
    normalizeCommentTree,
    removeCommentById,
    sortCommentTree,
  } from './commentTree'

  const props = defineProps<{
    eventId: string | number
    visible: boolean
  }>()

  const emit = defineEmits<{
    (e: 'update:count', count: number): void
  }>()

  const { loggedUser } = useAuth()

  const comments = ref<CommentNodeData[]>([])
  const newComment = ref('')
  const loading = ref(false)
  const sending = ref(false)
  const deletingId = ref<string | null>(null)
  const likingId = ref<string | null>(null)
  const listEl = ref<HTMLElement | null>(null)
  const errorMessage = ref('')

  // Resposta ancorada no nó clicado — em qualquer profundidade
  const replyingToId = ref<string | null>(null)
  const replyToName = ref('')
  const replyText = ref('')
  const sendingReply = ref(false)

  // Like otimista: chaveado por id, então vale para qualquer nível
  const localLiked = ref<Record<string, boolean>>({})
  const localLikeDelta = ref<Record<string, number>>({})

  // Threads recolhidas (estilo Reddit) — chaveado por id, vale para qualquer nível
  const collapsedIds = ref<Set<string>>(new Set())

  const sortMode = ref<CommentSortMode>('best')
  const SORT_OPTIONS: { value: CommentSortMode, label: string }[] = [
    { value: 'best', label: 'Melhores' },
    { value: 'new', label: 'Recentes' },
    { value: 'old', label: 'Antigos' },
  ]

  // Realce temporário do nó recém-enviado, para o olho achar onde ele caiu
  // na árvore — especialmente útil em thread funda, que rola fora da vista.
  const freshIds = ref<Set<string>>(new Set())
  let freshTimer: ReturnType<typeof setTimeout> | null = null

  function markFresh (id: string) {
    freshIds.value = new Set(freshIds.value).add(id)
    if (freshTimer) clearTimeout(freshTimer)
    freshTimer = setTimeout(() => {
      freshIds.value = new Set()
    }, 2600)
  }

  const totalCount = computed(() => countComments(comments.value))
  const hasCollapsible = computed(() => collectParentIds(comments.value).length > 0)
  const allCollapsed = computed(() => {
    const ids = collectParentIds(comments.value)
    return ids.length > 0 && ids.every(id => collapsedIds.value.has(id))
  })

  function applySort () {
    sortCommentTree(comments.value, sortMode.value)
  }

  function toggleCollapseAll () {
    collapsedIds.value = allCollapsed.value ? new Set() : new Set(collectParentIds(comments.value))
  }

  function syncCount () {
    emit('update:count', totalCount.value)
  }

  function isMyComment (comment: CommentNodeData): boolean {
    return !!loggedUser.value?.id && loggedUser.value.id === comment.user.id
  }

  function isCommentLiked (comment: CommentNodeData): boolean {
    return localLiked.value[comment.id] ?? comment.isLikedByMe
  }

  function commentLikesCount (comment: CommentNodeData): number {
    return Math.max(0, comment.likesCount + (localLikeDelta.value[comment.id] || 0))
  }

  async function fetchComments () {
    loading.value = true
    try {
      const res = await getEventComments(props.eventId)
      comments.value = normalizeCommentTree(unwrapList(res, 'comments', 'content'))
      applySort()
      localLiked.value = {}
      localLikeDelta.value = {}
      // Toda thread nasce recolhida: só as raízes aparecem de cara, e cada
      // nível de resposta se abre sob demanda pelo botão "Ver respostas".
      collapsedIds.value = new Set(collectParentIds(comments.value))
      syncCount()
    } catch (error) {
      console.error('Erro ao buscar comentários:', error)
      comments.value = []
      syncCount()
    } finally {
      loading.value = false
    }
  }

  async function handleSend () {
    const text = newComment.value.trim()
    if (!text || sending.value) return
    sending.value = true
    errorMessage.value = ''
    try {
      const res = await addEventComment(props.eventId, text)
      const created = res?.data?.data ?? res?.data
      const newId = created?.id ?? `temp-${Date.now()}`

      // Inserção otimista: adiciona o comentário à árvore imediatamente
      comments.value.push({
        id: newId,
        content: text,
        createdAt: created?.createdAt ?? new Date().toISOString(),
        likesCount: 0,
        isLikedByMe: false,
        parentCommentId: null,
        replies: [],
        user: {
          id: loggedUser.value?.id ?? '',
          name: loggedUser.value?.name ?? 'Você',
          profileImage: loggedUser.value?.profileImage,
          role: null,
        },
      })

      newComment.value = ''
      applySort()
      markFresh(newId)
      syncCount()

      await nextTick()
      // Com ordenação por "Melhores" o comentário novo não cai necessariamente
      // no fim da lista, então rolamos até ele e não até o fundo.
      const fresh = listEl.value?.querySelector('.cn-node--fresh')
      if (fresh) {
        fresh.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else if (listEl.value) {
        listEl.value.scrollTop = listEl.value.scrollHeight
      }
    } catch (error) {
      console.error('Erro ao enviar comentário:', error)
      errorMessage.value = 'Não foi possível enviar o comentário.'
    } finally {
      sending.value = false
    }
  }

  function startReply (comment: CommentNodeData) {
    replyingToId.value = comment.id
    replyToName.value = comment.user.name
    replyText.value = ''
    errorMessage.value = ''
  }

  function cancelReply () {
    replyingToId.value = null
    replyToName.value = ''
    replyText.value = ''
  }

  async function handleSendReply () {
    const text = replyText.value.trim()
    const parentId = replyingToId.value
    if (!text || sendingReply.value || !parentId) return

    sendingReply.value = true
    errorMessage.value = ''
    try {
      const res = await replyToComment(props.eventId, parentId, text)
      const created = res?.data?.data ?? res?.data

      // Insere sob o pai correto para a resposta aparecer no lugar certo
      // antes do refetch; se o pai sumiu, o refetch corrige.
      const parent = findCommentById(comments.value, parentId)
      if (parent) {
        const newId = created?.id ?? `temp-${Date.now()}`
        parent.replies.push({
          id: newId,
          content: text,
          createdAt: created?.createdAt ?? new Date().toISOString(),
          likesCount: 0,
          isLikedByMe: false,
          parentCommentId: parentId,
          replies: [],
          user: {
            id: loggedUser.value?.id ?? '',
            name: loggedUser.value?.name ?? 'Você',
            profileImage: loggedUser.value?.profileImage,
            role: null,
          },
        })
        // A thread do pai precisa estar aberta, senão a resposta nasce escondida
        if (collapsedIds.value.has(parentId)) {
          const next = new Set(collapsedIds.value)
          next.delete(parentId)
          collapsedIds.value = next
        }
        applySort()
        markFresh(newId)
        syncCount()
      }

      // Sem refetch aqui de propósito: o GET da árvore, em alguns backends,
      // monta o include aninhado sem cobrir todos os 5 níveis (ver
      // docs/BACKEND_COMMENT_THREADS_SPEC.md), então buscar de novo pode
      // devolver uma árvore truncada e apagar a resposta que acabou de
      // aparecer certinha. O POST já devolveu o nó completo — o insert
      // otimista acima é a fonte de verdade até a próxima abertura do painel.
      cancelReply()
    } catch (error: any) {
      console.error('Erro ao enviar resposta:', error)
      errorMessage.value = error?.response?.status === 400
        ? 'Este tópico atingiu o limite de respostas.'
        : 'Não foi possível enviar a resposta.'
    } finally {
      sendingReply.value = false
    }
  }

  async function handleDelete (comment: CommentNodeData) {
    if (deletingId.value) return
    deletingId.value = comment.id
    errorMessage.value = ''
    try {
      await deleteEventComment(props.eventId, comment.id)
      // Remove em qualquer profundidade, junto com os descendentes —
      // espelha o cascade do backend sem precisar de refetch.
      removeCommentById(comments.value, comment.id)
      if (replyingToId.value === comment.id) cancelReply()
      syncCount()
    } catch (error) {
      console.error('Erro ao excluir comentário:', error)
      errorMessage.value = 'Não foi possível excluir o comentário.'
    } finally {
      deletingId.value = null
    }
  }

  async function handleToggleLike (comment: CommentNodeData) {
    if (likingId.value === comment.id) return
    likingId.value = comment.id
    const wasLiked = isCommentLiked(comment)
    localLiked.value[comment.id] = !wasLiked
    localLikeDelta.value[comment.id] = (localLikeDelta.value[comment.id] || 0) + (wasLiked ? -1 : 1)
    try {
      const res = await toggleLikeComment(props.eventId, comment.id)

      // O toggle devolve `{ liked, likesCount }` (ver spec). Usar esse número
      // como verdade — em vez de manter o ±1 otimista empilhado sobre o
      // `likesCount` que veio do GET — é o que impede a contagem de divergir
      // do banco e "dobrar" a própria curtida no reload seguinte.
      const payload = res?.data?.data ?? res?.data
      const serverCount = payload?.likesCount ?? payload?._count?.likes
      const serverLiked = payload?.liked ?? payload?.isLikedByMe

      if (typeof serverCount === 'number' && Number.isFinite(serverCount)) {
        comment.likesCount = Math.max(0, serverCount)
        localLikeDelta.value[comment.id] = 0
      }
      if (typeof serverLiked === 'boolean') {
        localLiked.value[comment.id] = serverLiked
      }
    } catch (error) {
      console.error('Erro ao curtir comentário:', error)
      localLiked.value[comment.id] = wasLiked
      localLikeDelta.value[comment.id] = (localLikeDelta.value[comment.id] || 0) + (wasLiked ? 1 : -1)
    } finally {
      likingId.value = null
    }
  }

  function toggleCollapse (comment: CommentNodeData) {
    const next = new Set(collapsedIds.value)
    if (next.has(comment.id)) {
      next.delete(comment.id)
    } else {
      next.add(comment.id)
      // Fechar uma thread cancela uma resposta em andamento dentro dela,
      // senão o campo de resposta fica "vivo" mas invisível.
      if (replyingToId.value && findCommentById(comment.replies, replyingToId.value)) {
        cancelReply()
      }
    }
    collapsedIds.value = next
  }

  // provide/inject evita repassar 10 props e re-emitir eventos em cada um
  // dos 5 níveis do CommentNode recursivo.
  const treeContext: CommentTreeContext = {
    isLiked: isCommentLiked,
    likesCount: commentLikesCount,
    isMine: isMyComment,
    isLiking: (id: string) => likingId.value === id,
    isDeleting: (id: string) => deletingId.value === id,
    isReplyingTo: (id: string) => replyingToId.value === id,
    isCollapsed: (id: string) => collapsedIds.value.has(id),
    isFresh: (id: string) => freshIds.value.has(id),
    toggleLike: handleToggleLike,
    startReply,
    cancelReply,
    submitReply: handleSendReply,
    remove: handleDelete,
    toggleCollapse,
    replyText,
    sendingReply,
    replyToName,
  }
  provide(commentTreeKey, treeContext)

  watch(() => props.visible, val => {
    if (val) fetchComments()
  })

  watch(sortMode, applySort)

  onUnmounted(() => {
    if (freshTimer) clearTimeout(freshTimer)
  })

  // Busca a contagem real assim que o card monta no feed, sem esperar o
  // usuário abrir o painel — o `commentsCount` que vem da listagem de
  // eventos é só um valor inicial e pode estar desatualizado.
  onMounted(() => {
    if (!props.visible) fetchComments()
  })
</script>

<template>
  <div class="inline-comments-wrapper" :class="{ expanded: visible }">
    <div class="inner">
      <!-- Header -->
      <div class="ic-header">
        <div class="ic-title-group">
          <h4 class="ic-title">Comentários</h4>
          <span v-if="!loading" class="ic-count-badge">{{ totalCount }}</span>
        </div>

        <div v-if="!loading && comments.length > 0" class="ic-tools">
          <div class="ic-sort" role="group">
            <button
              v-for="opt in SORT_OPTIONS"
              :key="opt.value"
              class="ic-sort-btn"
              :class="{ 'is-active': sortMode === opt.value }"
              type="button"
              @click="sortMode = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>

          <button
            v-if="hasCollapsible"
            class="ic-collapse-all"
            :title="allCollapsed ? 'Expandir todas as threads' : 'Recolher todas as threads'"
            type="button"
            @click="toggleCollapseAll"
          >
            <svg
              aria-hidden="true"
              fill="none"
              height="13"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2.2"
              viewBox="0 0 24 24"
              width="13"
            >
              <path v-if="allCollapsed" d="M7 13l5 5 5-5M7 6l5 5 5-5" />
              <path v-else d="M17 11l-5-5-5 5M17 18l-5-5-5 5" />
            </svg>
            {{ allCollapsed ? 'Expandir' : 'Recolher' }}
          </button>
        </div>
      </div>

      <div v-if="errorMessage" class="ic-error">{{ errorMessage }}</div>

      <!-- Lista -->
      <div ref="listEl" class="ic-list">
        <div v-if="loading" class="ic-loading">
          <v-progress-circular color="#ff5fa6" indeterminate size="28" />
        </div>

        <div v-else-if="comments.length === 0" class="ic-empty">
          <svg
            fill="none"
            height="28"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            viewBox="0 0 24 24"
            width="28"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>Seja o primeiro a comentar!</span>
        </div>

        <TransitionGroup v-else name="ic-item">
          <div v-for="comment in comments" :key="comment.id" class="ic-thread">
            <CommentNode :comment="comment" :depth="1" />
          </div>
        </TransitionGroup>
      </div>

      <!-- Input -->
      <div class="ic-input-area">
        <div class="ic-input-avatar-wrap">
          <img
            v-if="resolveAsset(loggedUser?.profileImage)"
            alt="Você"
            class="ic-avatar"
            :src="resolveAsset(loggedUser?.profileImage)"
          >
          <div
            v-else
            class="ic-avatar placeholder"
            :style="{ backgroundColor: getAvatarColor(loggedUser?.name || '') }"
          >
            {{ getInitial(loggedUser?.name || '') }}
          </div>
        </div>

        <div class="ic-input-pill">
          <input
            v-model="newComment"
            :disabled="sending"
            maxlength="500"
            placeholder="Escreva um comentário..."
            type="text"
            @keyup.enter="handleSend"
          >
        </div>

        <button
          class="ic-comment-btn"
          :disabled="!newComment.trim() || sending"
          type="button"
          @click="handleSend"
        >
          <v-progress-circular
            v-if="sending"
            color="#fff"
            indeterminate
            size="16"
            :width="2"
          />
          <span v-else>Comentar</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ─── Expand / Collapse wrapper ─── */
.inline-comments-wrapper {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.inline-comments-wrapper.expanded {
  grid-template-rows: 1fr;
  margin-top: 0.85rem;
}

.inner {
  overflow: hidden;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.inline-comments-wrapper.expanded .inner {
  opacity: 1;
  background: #ffffff;
  border-radius: 22px;
  border: 1px solid rgba(0, 0, 0, 0.07);
  box-shadow: 0 10px 28px rgba(20, 20, 40, 0.1);
}

/* ─── Header ─── */
.ic-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 1rem 1.1rem 0.6rem;
}

.ic-title-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.ic-tools {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

/* Segmentado de ordenação: compacto, sem virar um dropdown a mais */
.ic-sort {
  display: inline-flex;
  padding: 2px;
  border-radius: 999px;
  background: #f1f2f7;
}

.ic-sort-btn {
  border: none;
  background: transparent;
  border-radius: 999px;
  padding: 0.24rem 0.6rem;
  font-size: 0.73rem;
  font-weight: 700;
  color: #8b8fa1;
  cursor: pointer;
  transition: all 0.18s ease;
}

.ic-sort-btn:hover {
  color: #4a4d5c;
}

.ic-sort-btn.is-active {
  background: #fff;
  color: #ff2f92;
  box-shadow: 0 1px 3px rgba(20, 20, 40, 0.14);
}

.ic-collapse-all {
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
  border: none;
  border-radius: 999px;
  background: transparent;
  padding: 0.3rem 0.55rem;
  font-size: 0.73rem;
  font-weight: 700;
  color: #8b8fa1;
  cursor: pointer;
  transition: all 0.18s ease;
}

.ic-collapse-all:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #4a4d5c;
}

.ic-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 800;
  color: #16171f;
  letter-spacing: -0.01em;
}

.ic-count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 7px;
  border-radius: 999px;
  background: rgba(255, 47, 146, 0.12);
  color: #ff2f92;
  font-size: 0.76rem;
  font-weight: 800;
}

.ic-error {
  margin: 0 1.1rem 0.5rem;
  padding: 0.55rem 0.85rem;
  border-radius: 12px;
  background: rgba(239, 68, 68, 0.08);
  color: #d92d2d;
  font-size: 0.82rem;
  font-weight: 600;
}

/* ─── Lista ─── */
.ic-list {
  max-height: 460px;
  overflow-y: auto;
  padding: 0.25rem 1.1rem;
  scroll-behavior: smooth;
  /* Esmaece o conteúdo cortado nas bordas em vez de fatiá-lo no meio,
     deixando claro que a lista rola. */
  -webkit-mask-image: linear-gradient(to bottom, transparent 0, #000 14px, #000 calc(100% - 14px), transparent 100%);
  mask-image: linear-gradient(to bottom, transparent 0, #000 14px, #000 calc(100% - 14px), transparent 100%);
}

.ic-list::-webkit-scrollbar {
  width: 3px;
}

.ic-list::-webkit-scrollbar-track {
  background: transparent;
}

.ic-list::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 999px;
}

.ic-loading {
  display: flex;
  justify-content: center;
  padding: 1.5rem 0;
}

.ic-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  padding: 1.5rem 0;
  color: rgba(0, 0, 0, 0.35);
  font-size: 0.82rem;
}

.ic-thread {
  padding: 0.85rem 0;
}

.ic-thread + .ic-thread {
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

/* ─── Input area ─── */
.ic-input-area {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 1rem 1.1rem 1.1rem;
  border-top: 1px solid rgba(0, 0, 0, 0.07);
  background: #fff;
}

.ic-input-avatar-wrap {
  flex-shrink: 0;
}

.ic-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
}

.ic-avatar.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 800;
  color: #fff;
}

.ic-input-pill {
  flex: 1;
  display: flex;
  align-items: center;
  min-width: 0;
  background: #ffffff;
  border: 1.6px solid #ff5fa6;
  border-radius: 999px;
  padding: 0.3rem 1.1rem;
  transition: box-shadow 0.2s ease;
}

.ic-input-pill:focus-within {
  box-shadow: 0 0 0 3px rgba(255, 95, 166, 0.12);
}

.ic-input-pill input {
  flex: 1;
  padding: 0.4rem 0;
  border: none;
  background: transparent;
  color: #1a1a1a;
  font-size: 0.92rem;
  outline: none;
  min-width: 0;
}

.ic-input-pill input::placeholder {
  color: rgba(0, 0, 0, 0.35);
}

.ic-comment-btn {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border: none;
  border-radius: 999px;
  padding: 0.7rem 1.4rem;
  background: linear-gradient(135deg, #ffba4b 0%, #ff5fa6 100%);
  color: #fff;
  font-size: 0.9rem;
  font-weight: 800;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.25s ease;
}

.ic-comment-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(255, 95, 166, 0.35);
}

.ic-comment-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* ─── Transições ─── */
.ic-item-enter-active {
  transition: all 0.3s ease;
}

.ic-item-leave-active {
  transition: all 0.2s ease;
}

.ic-item-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.ic-item-leave-to {
  opacity: 0;
  transform: translateX(-15px);
}

/* ─── Responsivo ─── */
@media (max-width: 640px) {
  .ic-list {
    max-height: 320px;
  }

  .ic-input-area {
    padding: 0.85rem 0.85rem 0.9rem;
  }

  .ic-comment-btn {
    padding: 0.65rem 1.1rem;
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .ic-list {
    max-height: 260px;
  }

  .ic-avatar {
    width: 38px;
    height: 38px;
  }

  .ic-input-pill {
    padding: 0.25rem 0.85rem;
  }

  .ic-comment-btn {
    padding: 0.6rem 0.95rem;
    font-size: 0.82rem;
  }
}

@media (max-width: 360px) {
  .ic-header {
    padding: 0.85rem 0.85rem 0.25rem;
  }

  .ic-list {
    max-height: 220px;
    padding: 0.2rem 0.85rem;
  }

  .ic-input-area {
    padding: 0.7rem 0.7rem 0.8rem;
    gap: 0.45rem;
  }

  .ic-comment-btn {
    padding: 0.55rem 0.8rem;
    font-size: 0.78rem;
  }
}
</style>
