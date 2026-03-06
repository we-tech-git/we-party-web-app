<script setup lang="ts">
  import { nextTick, ref, watch } from 'vue'
  import {
    addEventComment,
    deleteEventComment,
    getEventComments,
    toggleLikeComment,
  } from '@/api/comments'
  import { useAuth } from '@/composables/useAuth'

  const props = defineProps<{
    eventId: string | number
    visible: boolean
  }>()

  const emit = defineEmits<{
    (e: 'update:count', count: number): void
  }>()

  interface Comment {
    id: string
    content: string
    createdAt: string
    likesCount: number
    isLikedByMe: boolean
    parentCommentId?: string | null
    replies?: Comment[]
    user: {
      id: string
      name: string
      profileImage?: string
      role?: string
    }
  }

  const { loggedUser } = useAuth()
  const comments = ref<Comment[]>([])
  const newComment = ref('')
  const loading = ref(false)
  const sending = ref(false)
  const deletingId = ref<string | null>(null)
  const likingId = ref<string | null>(null)
  const listEl = ref<HTMLElement | null>(null)

  // Reply state
  const replyingTo = ref<Comment | null>(null)
  const replyText = ref('')
  const sendingReply = ref(false)

  // Optimistic like state
  const localLiked = ref<Record<string, boolean>>({})
  const localLikeDelta = ref<Record<string, number>>({})

  function formatDate (dateStr: string): string {
    const d = new Date(dateStr)
    if (Number.isNaN(d.getTime())) return ''
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMin = Math.floor(diffMs / 60_000)
    if (diffMin < 1) return 'agora'
    if (diffMin < 60) return `${diffMin}min`
    const diffH = Math.floor(diffMin / 60)
    if (diffH < 24) return `${diffH}h`
    const diffD = Math.floor(diffH / 24)
    if (diffD < 7) return `${diffD}d`
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }

  function getInitial (name: string): string {
    return (name || 'U').charAt(0).toUpperCase()
  }

  const avatarColors = [
    '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
    '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50',
  ]

  function getAvatarColor (name: string): string {
    if (!name) return avatarColors[0] ?? '#F44336'
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = (name.codePointAt(i) || 0) + ((hash << 5) - hash)
    }
    return avatarColors[Math.abs(hash % avatarColors.length)] ?? '#F44336'
  }

  function resolveAsset (val?: string): string {
    if (!val) return ''
    if (/^https?:\/\//i.test(val)) return val
    const base = (import.meta.env.VITE__BASE_URL || '').replace(/\/$/, '')
    const path = val.startsWith('/') ? val : `/${val}`
    return `${base}${path}`
  }

  function isMyComment (comment: Comment): boolean {
    return loggedUser.value?.id === comment.user?.id
  }

  function isCommentLiked (comment: Comment): boolean {
    if (comment.id in localLiked.value) return localLiked.value[comment.id] ?? false
    return comment.isLikedByMe ?? false
  }

  function commentLikesCount (comment: Comment): number {
    const base = comment.likesCount || 0
    const delta = localLikeDelta.value[comment.id] || 0
    return Math.max(0, base + delta)
  }

  async function fetchComments () {
    loading.value = true
    try {
      const res = await getEventComments(props.eventId)
      const raw = res?.data?.data || res?.data?.comments || res?.data?.content || res?.data || []
      const dataArr: any[] = Array.isArray(raw) ? raw : []

      function mapComment (c: any): Comment {
        return {
          id: c.id,
          content: c.content,
          createdAt: c.createdAt,
          likesCount: c.likesCount ?? c._count?.likes ?? c.likes ?? 0,
          isLikedByMe: c.isLikedByMe ?? c.likedByMe ?? false,
          parentCommentId: c.parentCommentId ?? c.parentId ?? null,
          replies: [],
          user: {
            ...(c.user ?? { id: '', name: 'Usuário' }),
            role: c.user?.role ?? c.user?.userType ?? null,
          },
        }
      }

      // Flatten: coleta todos os comentários incluindo replies aninhadas do backend
      const allComments: Comment[] = []
      for (const c of dataArr) {
        allComments.push(mapComment(c))
        // Se o backend já retorna replies aninhadas, extraí-las
        const nestedReplies = c.replies || c.children || []
        if (Array.isArray(nestedReplies)) {
          for (const r of nestedReplies) {
            const mapped = mapComment(r)
            // Garantir parentCommentId mesmo se não veio do backend
            if (!mapped.parentCommentId) mapped.parentCommentId = c.id
            allComments.push(mapped)
          }
        }
      }

      // Group replies under parent comments
      const topLevel: Comment[] = []
      const byId: Record<string, Comment> = {}
      for (const cm of allComments) byId[cm.id] = cm
      for (const cm of allComments) {
        if (cm.parentCommentId && byId[cm.parentCommentId]) {
          byId[cm.parentCommentId]!.replies!.push(cm)
        } else {
          topLevel.push(cm)
        }
      }
      comments.value = topLevel
      localLiked.value = {}
      localLikeDelta.value = {}
      emit('update:count', topLevel.length)
    } catch (error) {
      console.error('Erro ao buscar comentários:', error)
      comments.value = []
    } finally {
      loading.value = false
    }
  }

  async function handleSend () {
    const text = newComment.value.trim()
    if (!text || sending.value) return
    sending.value = true
    try {
      await addEventComment(props.eventId, text)
      newComment.value = ''
      await fetchComments()
      await nextTick()
      if (listEl.value) {
        listEl.value.scrollTop = listEl.value.scrollHeight
      }
    } catch (error) {
      console.error('Erro ao enviar comentário:', error)
    } finally {
      sending.value = false
    }
  }

  function startReply (comment: Comment) {
    replyingTo.value = comment
    replyText.value = ''
  }

  function cancelReply () {
    replyingTo.value = null
    replyText.value = ''
  }

  async function handleSendReply () {
    const text = replyText.value.trim()
    if (!text || sendingReply.value || !replyingTo.value) return
    const parentId = replyingTo.value.id
    const parentName = replyingTo.value.user?.name || 'Usuário'
    sendingReply.value = true
    try {
      const res = await addEventComment(props.eventId, text, parentId)

      // Insere a reply otimisticamente sob o comentário pai
      const replyData = res?.data?.data || res?.data
      const newReply: Comment = {
        id: replyData?.id || `temp-${Date.now()}`,
        content: text,
        createdAt: new Date().toISOString(),
        likesCount: 0,
        isLikedByMe: false,
        parentCommentId: parentId,
        replies: [],
        user: {
          id: loggedUser.value?.id || '',
          name: loggedUser.value?.name || 'Você',
          profileImage: loggedUser.value?.profileImage,
          role: undefined,
        },
      }

      // Encontra o comentário pai e adiciona a reply
      const parent = comments.value.find(c => c.id === parentId)
      if (parent) {
        if (!parent.replies) parent.replies = []
        parent.replies.push(newReply)
      }

      cancelReply()

      // Sincroniza com o servidor em background
      fetchComments()
    } catch (error) {
      console.error('Erro ao enviar resposta:', error)
    } finally {
      sendingReply.value = false
    }
  }

  async function handleDelete (commentId: string) {
    if (deletingId.value) return
    deletingId.value = commentId
    try {
      await deleteEventComment(props.eventId, commentId)
      comments.value = comments.value.filter(c => c.id !== commentId)
      emit('update:count', comments.value.length)
    } catch (error) {
      console.error('Erro ao excluir comentário:', error)
    } finally {
      deletingId.value = null
    }
  }

  async function handleToggleLike (comment: Comment) {
    if (likingId.value === comment.id) return
    likingId.value = comment.id
    const wasLiked = isCommentLiked(comment)
    localLiked.value[comment.id] = !wasLiked
    localLikeDelta.value[comment.id] = (localLikeDelta.value[comment.id] || 0) + (wasLiked ? -1 : 1)
    try {
      await toggleLikeComment(props.eventId, comment.id)
    } catch {
      localLiked.value[comment.id] = wasLiked
      localLikeDelta.value[comment.id] = (localLikeDelta.value[comment.id] || 0) + (wasLiked ? 1 : -1)
    } finally {
      likingId.value = null
    }
  }

  watch(() => props.visible, val => {
    if (val) fetchComments()
  })
</script>

<template>
  <div class="inline-comments-wrapper" :class="{ expanded: visible }">
    <div class="inner">
      <!-- Comments list -->
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
          <div v-for="comment in comments" :key="comment.id" class="ic-row">
            <div class="ic-avatar-wrap">
              <img
                v-if="resolveAsset(comment.user?.profileImage)"
                :alt="comment.user?.name"
                class="ic-avatar"
                :src="resolveAsset(comment.user?.profileImage)"
              >
              <div
                v-else
                class="ic-avatar placeholder"
                :style="{ backgroundColor: getAvatarColor(comment.user?.name || '') }"
              >
                {{ getInitial(comment.user?.name || '') }}
              </div>
            </div>

            <div class="ic-body">
              <div class="ic-bubble">
                <div class="ic-header">
                  <span class="ic-author">{{ comment.user?.name || 'Usuário' }}</span>
                  <span v-if="comment.user?.role === 'ADMIN'" class="ic-admin-badge">Admin</span>
                  <span class="ic-time">{{ formatDate(comment.createdAt) }}</span>
                </div>
                <p class="ic-text">{{ comment.content }}</p>
              </div>

              <div class="ic-actions">
                <button
                  class="ic-action-btn"
                  :class="{ active: isCommentLiked(comment) }"
                  type="button"
                  @click.stop="handleToggleLike(comment)"
                >
                  <svg
                    :fill="isCommentLiked(comment) ? 'currentColor' : 'none'"
                    height="13"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    viewBox="0 0 24 24"
                    width="13"
                  >
                    <path
                      d="M12 21s-6.6-4.35-9-8.4C1 8.67 3.42 5 7.2 5c1.9 0 3.45 1.17 4.8 2.6C13.35 6.17 14.9 5 16.8 5 20.58 5 23 8.67 21 12.6c-2.4 4.05-9 8.4-9 8.4Z"
                    />
                  </svg>
                  <span v-if="commentLikesCount(comment) > 0">{{ commentLikesCount(comment) }}</span>
                </button>

                <!-- Botão Responder -->
                <button class="ic-action-btn reply" type="button" @click.stop="startReply(comment)">
                  <svg
                    fill="none"
                    height="12"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    viewBox="0 0 24 24"
                    width="12"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  Responder
                </button>

                <button
                  v-if="isMyComment(comment)"
                  class="ic-action-btn delete"
                  :disabled="deletingId === comment.id"
                  type="button"
                  @click.stop="handleDelete(comment.id)"
                >
                  <template v-if="deletingId !== comment.id">
                    <svg
                      fill="none"
                      height="12"
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      viewBox="0 0 24 24"
                      width="12"
                    >
                      <path
                        d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14Z"
                      />
                    </svg>
                    Excluir
                  </template>
                  <v-progress-circular
                    v-else
                    color="#ff5fa6"
                    indeterminate
                    size="12"
                    :width="2"
                  />
                </button>
              </div>

              <!-- Input de resposta inline -->
              <div v-if="replyingTo?.id === comment.id" class="ic-reply-input-area">
                <div class="ic-reply-input-wrap">
                  <input
                    v-model="replyText"
                    :disabled="sendingReply"
                    maxlength="500"
                    :placeholder="`Respondendo a ${comment.user?.name || 'Usuário'}...`"
                    type="text"
                    @keyup.enter="handleSendReply"
                    @keyup.esc="cancelReply"
                  >
                  <button class="ic-reply-cancel" type="button" @click="cancelReply">✕</button>
                  <button
                    aria-label="Enviar resposta"
                    class="ic-send-btn ic-send-btn--sm"
                    :disabled="!replyText.trim() || sendingReply"
                    type="button"
                    @click="handleSendReply"
                  >
                    <svg
                      v-if="!sendingReply"
                      fill="none"
                      height="13"
                      stroke="currentColor"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      viewBox="0 0 24 24"
                      width="13"
                    >
                      <path d="m22 2-7 20-4-9-9-4z" />
                      <path d="m22 2-11 11" />
                    </svg>
                    <v-progress-circular
                      v-else
                      color="#fff"
                      indeterminate
                      size="11"
                      :width="2"
                    />
                  </button>
                </div>
              </div>

              <!-- Replies aninhadas -->
              <div v-if="comment.replies && comment.replies.length > 0" class="ic-replies">
                <div v-for="reply in comment.replies" :key="reply.id" class="ic-reply-row">
                  <div class="ic-avatar-wrap">
                    <img
                      v-if="resolveAsset(reply.user?.profileImage)"
                      :alt="reply.user?.name"
                      class="ic-avatar ic-avatar--sm"
                      :src="resolveAsset(reply.user?.profileImage)"
                    >
                    <div
                      v-else
                      class="ic-avatar ic-avatar--sm placeholder"
                      :style="{ backgroundColor: getAvatarColor(reply.user?.name || '') }"
                    >
                      {{ getInitial(reply.user?.name || '') }}
                    </div>
                  </div>
                  <div class="ic-body">
                    <div class="ic-bubble ic-bubble--reply">
                      <div class="ic-header">
                        <span class="ic-author">{{ reply.user?.name || 'Usuário' }}</span>
                        <span v-if="reply.user?.role === 'ADMIN'" class="ic-admin-badge">Admin</span>
                        <span class="ic-time">{{ formatDate(reply.createdAt) }}</span>
                      </div>
                      <p class="ic-text">{{ reply.content }}</p>
                    </div>
                    <div class="ic-actions">
                      <button
                        class="ic-action-btn"
                        :class="{ active: isCommentLiked(reply) }"
                        type="button"
                        @click.stop="handleToggleLike(reply)"
                      >
                        <svg
                          :fill="isCommentLiked(reply) ? 'currentColor' : 'none'"
                          height="11"
                          stroke="currentColor"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          viewBox="0 0 24 24"
                          width="11"
                        >
                          <path
                            d="M12 21s-6.6-4.35-9-8.4C1 8.67 3.42 5 7.2 5c1.9 0 3.45 1.17 4.8 2.6C13.35 6.17 14.9 5 16.8 5 20.58 5 23 8.67 21 12.6c-2.4 4.05-9 8.4-9 8.4Z"
                          />
                        </svg>
                        <span v-if="commentLikesCount(reply) > 0">{{ commentLikesCount(reply) }}</span>
                      </button>
                      <button
                        v-if="isMyComment(reply)"
                        class="ic-action-btn delete"
                        :disabled="deletingId === reply.id"
                        type="button"
                        @click.stop="handleDelete(reply.id)"
                      >
                        <template v-if="deletingId !== reply.id">
                          <svg
                            fill="none"
                            height="11"
                            stroke="currentColor"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            viewBox="0 0 24 24"
                            width="11"
                          >
                            <path
                              d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14Z"
                            />
                          </svg>
                          Excluir
                        </template>
                        <v-progress-circular
                          v-else
                          color="#ff5fa6"
                          indeterminate
                          size="10"
                          :width="2"
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TransitionGroup>
      </div>

      <!-- Input -->
      <div class="ic-input-area">
        <div class="ic-input-wrap">
          <input
            v-model="newComment"
            :disabled="sending"
            maxlength="500"
            placeholder="Escreva um comentário..."
            type="text"
            @keyup.enter="handleSend"
          >
          <button
            aria-label="Enviar comentário"
            class="ic-send-btn"
            :disabled="!newComment.trim() || sending"
            type="button"
            @click="handleSend"
          >
            <svg
              v-if="!sending"
              fill="none"
              height="16"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              viewBox="0 0 24 24"
              width="16"
            >
              <path d="m22 2-7 20-4-9-9-4z" />
              <path d="m22 2-11 11" />
            </svg>
            <v-progress-circular
              v-else
              color="#fff"
              indeterminate
              size="14"
              :width="2"
            />
          </button>
        </div>
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
}

.inner {
  overflow: hidden;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.inline-comments-wrapper.expanded .inner {
  opacity: 1;
  background: #ffffff;
  border-radius: 0 0 24px 24px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-top: 2px solid rgba(255, 186, 75, 0.3);
}

/* ─── Comments list ─── */
.ic-list {
  max-height: 320px;
  overflow-y: auto;
  padding: 0.75rem 1rem 0.25rem;
  scroll-behavior: smooth;
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

/* ─── Comment row ─── */
.ic-row {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  padding: 0.6rem 0;
}

.ic-row+.ic-row {
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.ic-avatar-wrap {
  flex-shrink: 0;
  padding-top: 2px;
}

.ic-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  object-fit: cover;
  border: 1.5px solid rgba(0, 0, 0, 0.08);
}

.ic-avatar.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  font-weight: 700;
  color: #fff;
}

.ic-body {
  flex: 1;
  min-width: 0;
}

.ic-bubble {
  background: rgba(0, 0, 0, 0.03);
  border-radius: 4px 14px 14px 14px;
  padding: 0.45rem 0.75rem;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.ic-header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.15rem;
}

.ic-author {
  font-size: 0.75rem;
  font-weight: 700;
  color: #1a1a1a;
}

.ic-time {
  font-size: 0.65rem;
  color: rgba(0, 0, 0, 0.4);
  font-weight: 500;
}

.ic-text {
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.45;
  color: rgba(0, 0, 0, 0.8);
  word-break: break-word;
}

/* ─── Comment actions ─── */
.ic-actions {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.2rem 0.35rem 0;
}

.ic-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  border: none;
  background: transparent;
  color: rgba(0, 0, 0, 0.4);
  cursor: pointer;
  font-size: 0.68rem;
  font-weight: 600;
  padding: 0.15rem 0;
  transition: color 0.2s ease;
}

.ic-action-btn:hover {
  color: rgba(0, 0, 0, 0.65);
}

.ic-action-btn.active {
  color: #ff5fa6;
}

.ic-action-btn.active:hover {
  color: #ff78b5;
}

.ic-action-btn.delete:hover:not(:disabled) {
  color: #ef4444;
}

.ic-action-btn.delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ic-action-btn.reply:hover {
  color: #2563eb;
}

/* Admin badge */
.ic-admin-badge {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  border-radius: 999px;
  background: linear-gradient(135deg, #ffba4b 0%, #ff5fa6 100%);
  color: #fff;
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

/* Reply input inline */
.ic-reply-input-area {
  margin-top: 0.4rem;
}

.ic-reply-input-wrap {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background: #fff;
  border: 1px solid rgba(255, 95, 166, 0.4);
  border-radius: 999px;
  padding: 0.2rem 0.25rem 0.2rem 0.75rem;
  box-shadow: 0 0 0 3px rgba(255, 95, 166, 0.06);
}

.ic-reply-input-wrap input {
  flex: 1;
  background: transparent;
  border: none;
  color: #1a1a1a;
  font-size: 0.78rem;
  outline: none;
  min-width: 0;
  padding: 0.3rem 0;
}

.ic-reply-input-wrap input::placeholder {
  color: rgba(0, 0, 0, 0.35);
}

.ic-reply-cancel {
  background: transparent;
  border: none;
  color: rgba(0, 0, 0, 0.3);
  font-size: 0.7rem;
  cursor: pointer;
  padding: 0.15rem 0.25rem;
  transition: color 0.2s;
}

.ic-reply-cancel:hover {
  color: rgba(0, 0, 0, 0.6);
}

.ic-send-btn--sm {
  width: 26px !important;
  height: 26px !important;
}

/* Nested replies */
.ic-replies {
  margin-top: 0.4rem;
  padding-left: 0.65rem;
  border-left: 2px solid rgba(255, 95, 166, 0.2);
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.ic-reply-row {
  display: flex;
  align-items: flex-start;
  gap: 0.45rem;
}

.ic-avatar--sm {
  width: 24px !important;
  height: 24px !important;
  font-size: 0.62rem !important;
}

.ic-bubble--reply {
  background: rgba(255, 95, 166, 0.05) !important;
  border-color: rgba(255, 95, 166, 0.1) !important;
}

/* ─── Input area ─── */
.ic-input-area {
  padding: 0.6rem 1rem 0.75rem;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(0, 0, 0, 0.02);
}

.ic-input-wrap {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 999px;
  padding: 0.25rem 0.3rem 0.25rem 0.85rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.ic-input-wrap:focus-within {
  border-color: rgba(255, 95, 166, 0.5);
  box-shadow: 0 0 0 3px rgba(255, 95, 166, 0.08);
}

.ic-input-wrap input {
  flex: 1;
  padding: 0.35rem 0;
  border: none;
  background: transparent;
  color: #1a1a1a;
  font-size: 0.82rem;
  outline: none;
  min-width: 0;
}

.ic-input-wrap input::placeholder {
  color: rgba(0, 0, 0, 0.35);
}

.ic-send-btn {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #ffba4b 0%, #ff5fa6 100%);
  color: #fff;
  cursor: pointer;
  transition: all 0.25s ease;
  flex-shrink: 0;
}

.ic-send-btn:hover:not(:disabled) {
  transform: scale(1.08);
  box-shadow: 0 4px 14px rgba(255, 95, 166, 0.4);
}

.ic-send-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* ─── Transitions ─── */
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

/* ─── Responsive ─── */
@media (max-width: 640px) {
  .ic-list {
    max-height: 260px;
    padding: 0.6rem 0.75rem 0.2rem;
  }

  .ic-input-area {
    padding: 0.5rem 0.75rem 0.6rem;
  }
}

@media (max-width: 480px) {
  .ic-list {
    max-height: 220px;
  }

  .ic-avatar {
    width: 26px;
    height: 26px;
  }

  .ic-bubble {
    padding: 0.4rem 0.6rem;
  }

  .ic-replies {
    padding-left: 0.45rem;
  }

  .ic-avatar--sm {
    width: 20px !important;
    height: 20px !important;
  }

  .ic-text {
    font-size: 0.75rem;
  }

  .ic-reply-input-wrap input {
    font-size: 0.74rem;
  }
}

@media (max-width: 360px) {
  .ic-list {
    max-height: 180px;
    padding: 0.5rem 0.6rem 0.15rem;
  }

  .ic-input-area {
    padding: 0.4rem 0.6rem 0.5rem;
  }

  .ic-author {
    font-size: 0.68rem;
  }

  .ic-actions {
    gap: 0.4rem;
  }

  .ic-action-btn {
    font-size: 0.62rem;
  }
}
</style>
