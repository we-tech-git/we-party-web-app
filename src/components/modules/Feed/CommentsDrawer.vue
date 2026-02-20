<script setup lang="ts">
  import { nextTick, onMounted, ref, watch } from 'vue'
  import {
    addEventComment,
    deleteEventComment,
    getEventComments,
    toggleLikeComment,
  } from '@/api/comments'
  import { useAuth } from '@/composables/useAuth'

  const props = defineProps<{
    eventId: string | number
    modelValue: boolean
  }>()

  const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
  }>()

  interface Comment {
    id: string
    content: string
    createdAt: string
    likesCount: number
    isLikedByMe: boolean
    user: {
      id: string
      name: string
      profileImage?: string
    }
  }

  const { loggedUser } = useAuth()
  const comments = ref<Comment[]>([])
  const newComment = ref('')
  const loading = ref(false)
  const sending = ref(false)
  const deletingId = ref<string | null>(null)
  const likingId = ref<string | null>(null)
  const commentsContainer = ref<HTMLElement | null>(null)

  // Local liked state (optimistic)
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
      const data = res?.data?.comments || res?.data?.content || res?.data || []
      comments.value = (Array.isArray(data) ? data : []).map((c: any) => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt,
        likesCount: c.likesCount ?? c._count?.likes ?? c.likes ?? 0,
        isLikedByMe: c.isLikedByMe ?? c.likedByMe ?? false,
        user: c.user ?? { id: '', name: 'Usuário' },
      }))
      // Reset local state
      localLiked.value = {}
      localLikeDelta.value = {}
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
      if (commentsContainer.value) {
        commentsContainer.value.scrollTop = commentsContainer.value.scrollHeight
      }
    } catch (error) {
      console.error('Erro ao enviar comentário:', error)
    } finally {
      sending.value = false
    }
  }

  async function handleDelete (commentId: string) {
    if (deletingId.value) return
    deletingId.value = commentId
    try {
      await deleteEventComment(props.eventId, commentId)
      comments.value = comments.value.filter(c => c.id !== commentId)
    } catch (error) {
      console.error('Erro ao excluir comentário:', error)
    } finally {
      deletingId.value = null
    }
  }

  async function handleToggleLike (comment: Comment) {
    if (likingId.value === comment.id) return
    likingId.value = comment.id

    // Optimistic update
    const wasLiked = isCommentLiked(comment)
    localLiked.value[comment.id] = !wasLiked
    localLikeDelta.value[comment.id] = (localLikeDelta.value[comment.id] || 0) + (wasLiked ? -1 : 1)

    try {
      await toggleLikeComment(props.eventId, comment.id)
    } catch (error) {
      // Revert on failure
      localLiked.value[comment.id] = wasLiked
      localLikeDelta.value[comment.id] = (localLikeDelta.value[comment.id] || 0) + (wasLiked ? 1 : -1)
      console.error('Erro ao curtir comentário:', error)
    } finally {
      likingId.value = null
    }
  }

  function close () {
    emit('update:modelValue', false)
  }

  watch(() => props.modelValue, open => {
    if (open) {
      fetchComments()
      // Lock body scroll when drawer is open
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  })

  onMounted(() => {
    if (props.modelValue) fetchComments()
  })
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer-fade">
      <div v-if="modelValue" class="comments-backdrop" @click.self="close">
        <div class="comments-drawer" @click.stop>
          <!-- Handle bar -->
          <div class="drawer-handle" @click="close">
            <div class="handle-bar" />
          </div>

          <!-- Header -->
          <div class="drawer-header">
            <div class="drawer-title-group">
              <h4 class="drawer-title">Comentários</h4>
              <span v-if="!loading" class="comment-count">{{ comments.length }}</span>
            </div>
            <button aria-label="Fechar" class="close-btn" type="button" @click="close">
              <svg
                fill="none"
                height="18"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                viewBox="0 0 24 24"
                width="18"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Comentários -->
          <div ref="commentsContainer" class="comments-list">
            <div v-if="loading" class="loading-state">
              <v-progress-circular color="#ff5fa6" indeterminate size="36" />
            </div>

            <div v-else-if="comments.length === 0" class="empty-state">
              <div class="empty-icon">
                <svg
                  fill="none"
                  height="48"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.2"
                  viewBox="0 0 24 24"
                  width="48"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <span class="empty-title">Nenhum comentário ainda</span>
              <span class="empty-sub">Seja o primeiro a comentar!</span>
            </div>

            <TransitionGroup v-else name="comment-item">
              <div v-for="comment in comments" :key="comment.id" class="comment-row">
                <div class="comment-avatar-wrapper">
                  <img
                    v-if="resolveAsset(comment.user?.profileImage)"
                    :alt="comment.user?.name"
                    class="comment-avatar"
                    :src="resolveAsset(comment.user?.profileImage)"
                  >
                  <div
                    v-else
                    class="comment-avatar placeholder"
                    :style="{ backgroundColor: getAvatarColor(comment.user?.name || '') }"
                  >
                    {{ getInitial(comment.user?.name || '') }}
                  </div>
                </div>

                <div class="comment-content">
                  <div class="comment-bubble">
                    <div class="comment-header">
                      <span class="comment-author">{{ comment.user?.name || 'Usuário' }}</span>
                      <span class="comment-time">{{ formatDate(comment.createdAt) }}</span>
                    </div>
                    <p class="comment-text">{{ comment.content }}</p>
                  </div>

                  <!-- Actions row -->
                  <div class="comment-actions">
                    <button
                      class="action-btn like-btn"
                      :class="{ active: isCommentLiked(comment) }"
                      type="button"
                      @click.stop="handleToggleLike(comment)"
                    >
                      <svg
                        aria-hidden="true"
                        :fill="isCommentLiked(comment) ? 'currentColor' : 'none'"
                        height="14"
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        viewBox="0 0 24 24"
                        width="14"
                      >
                        <path
                          d="M12 21s-6.6-4.35-9-8.4C1 8.67 3.42 5 7.2 5c1.9 0 3.45 1.17 4.8 2.6C13.35 6.17 14.9 5 16.8 5 20.58 5 23 8.67 21 12.6c-2.4 4.05-9 8.4-9 8.4Z"
                        />
                      </svg>
                      <span v-if="commentLikesCount(comment) > 0" class="like-count">
                        {{ commentLikesCount(comment) }}
                      </span>
                    </button>

                    <button
                      v-if="isMyComment(comment)"
                      class="action-btn delete-action-btn"
                      :disabled="deletingId === comment.id"
                      type="button"
                      @click.stop="handleDelete(comment.id)"
                    >
                      <template v-if="deletingId !== comment.id">
                        <svg
                          fill="none"
                          height="13"
                          stroke="currentColor"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          viewBox="0 0 24 24"
                          width="13"
                        >
                          <path
                            d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14Z"
                          />
                        </svg>
                        <span>Excluir</span>
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
                </div>
              </div>
            </TransitionGroup>
          </div>

          <!-- Input -->
          <div class="input-area">
            <div class="input-wrapper">
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
                class="send-btn"
                :disabled="!newComment.trim() || sending"
                type="button"
                @click="handleSend"
              >
                <svg
                  v-if="!sending"
                  fill="none"
                  height="18"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                  width="18"
                >
                  <path d="m22 2-7 20-4-9-9-4z" />
                  <path d="m22 2-11 11" />
                </svg>
                <v-progress-circular
                  v-else
                  color="#fff"
                  indeterminate
                  size="16"
                  :width="2"
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Backdrop */
.comments-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(6px);
}

/* Drawer */
.comments-drawer {
  width: 100%;
  max-width: 520px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #111827 0%, #0c1220 100%);
  border-radius: 28px 28px 0 0;
  box-shadow:
    0 -10px 60px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(255, 255, 255, 0.06);
  overflow: hidden;
}

/* Handle bar */
.drawer-handle {
  display: flex;
  justify-content: center;
  padding: 12px 0 4px;
  cursor: pointer;
}

.handle-bar {
  width: 40px;
  height: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
  transition: background 0.2s ease;
}

.drawer-handle:hover .handle-bar {
  background: rgba(255, 255, 255, 0.4);
}

/* Header */
.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 1.25rem 0.85rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.drawer-title-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.drawer-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #fff;
  margin: 0;
}

.comment-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: 999px;
  background: rgba(255, 95, 166, 0.15);
  color: #ff5fa6;
  font-size: 0.72rem;
  font-weight: 700;
}

.close-btn {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 95, 166, 0.15);
  color: #ff5fa6;
  border-color: rgba(255, 95, 166, 0.25);
}

/* Comments list */
.comments-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 1.25rem;
  min-height: 180px;
  scroll-behavior: smooth;
}

.comments-list::-webkit-scrollbar {
  width: 3px;
}

.comments-list::-webkit-scrollbar-track {
  background: transparent;
}

.comments-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 999px;
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3.5rem 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: 3rem 0;
}

.empty-icon {
  display: grid;
  place-items: center;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.15);
  margin-bottom: 0.5rem;
}

.empty-title {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.95rem;
  font-weight: 600;
}

.empty-sub {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.25);
}

/* Comment row */
.comment-row {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  padding: 0.75rem 0;
}

.comment-row+.comment-row {
  border-top: 1px solid rgba(255, 255, 255, 0.04);
}

.comment-avatar-wrapper {
  flex-shrink: 0;
  padding-top: 2px;
}

.comment-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.08);
}

.comment-avatar.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  font-size: 0.8rem;
  font-weight: 700;
  color: #fff;
  border: 2px solid rgba(255, 255, 255, 0.12);
}

.comment-content {
  flex: 1;
  min-width: 0;
}

.comment-bubble {
  background: rgba(255, 255, 255, 0.04);
  border-radius: 4px 16px 16px 16px;
  padding: 0.55rem 0.85rem;
  border: 1px solid rgba(255, 255, 255, 0.04);
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin-bottom: 0.2rem;
}

.comment-author {
  font-size: 0.8rem;
  font-weight: 700;
  color: #fff;
}

.comment-time {
  font-size: 0.68rem;
  color: rgba(255, 255, 255, 0.3);
  font-weight: 500;
}

.comment-text {
  margin: 0;
  font-size: 0.84rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.78);
  word-break: break-word;
}

/* Comment actions */
.comment-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.3rem 0.4rem 0;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.35);
  cursor: pointer;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.2rem 0;
  transition: all 0.2s ease;
}

.action-btn:hover {
  color: rgba(255, 255, 255, 0.6);
}

.like-btn.active {
  color: #ff5fa6;
}

.like-btn.active:hover {
  color: #ff78b5;
}

.like-count {
  font-variant-numeric: tabular-nums;
}

.delete-action-btn:hover:not(:disabled) {
  color: #ef4444;
}

.delete-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Input area */
.input-area {
  flex-shrink: 0;
  padding: 0.85rem 1.25rem;
  padding-bottom: calc(0.85rem + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(0, 0, 0, 0.25);
}

.input-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  padding: 0.3rem 0.35rem 0.3rem 1rem;
  transition: border-color 0.2s ease;
}

.input-wrapper:focus-within {
  border-color: rgba(255, 95, 166, 0.4);
  background: rgba(255, 255, 255, 0.08);
}

.input-wrapper input {
  flex: 1;
  padding: 0.45rem 0;
  border: none;
  background: transparent;
  color: #fff;
  font-size: 0.88rem;
  outline: none;
  min-width: 0;
}

.input-wrapper input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.send-btn {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #ffba4b 0%, #ff5fa6 100%);
  color: #fff;
  cursor: pointer;
  transition: all 0.25s ease;
  flex-shrink: 0;
}

.send-btn:hover:not(:disabled) {
  transform: scale(1.08);
  box-shadow: 0 4px 16px rgba(255, 95, 166, 0.4);
}

.send-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Transitions */
.drawer-fade-enter-active {
  transition: opacity 0.25s ease;
}

.drawer-fade-enter-active .comments-drawer {
  transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}

.drawer-fade-leave-active {
  transition: opacity 0.2s ease;
}

.drawer-fade-leave-active .comments-drawer {
  transition: transform 0.2s ease;
}

.drawer-fade-enter-from {
  opacity: 0;
}

.drawer-fade-enter-from .comments-drawer {
  transform: translateY(100%);
}

.drawer-fade-leave-to {
  opacity: 0;
}

.drawer-fade-leave-to .comments-drawer {
  transform: translateY(100%);
}

.comment-item-enter-active {
  transition: all 0.3s ease;
}

.comment-item-leave-active {
  transition: all 0.2s ease;
}

.comment-item-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.comment-item-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* Responsive */
@media (max-width: 640px) {
  .comments-drawer {
    max-height: 90vh;
    border-radius: 22px 22px 0 0;
  }

  .comments-list {
    padding: 0.5rem 1rem;
  }

  .input-area {
    padding: 0.75rem 1rem;
    padding-bottom: calc(0.75rem + env(safe-area-inset-bottom, 0px));
  }

  .comment-bubble {
    padding: 0.5rem 0.75rem;
  }
}

@media (max-width: 480px) {
  .comments-drawer {
    max-width: 100%;
  }

  .drawer-header {
    padding: 0.5rem 1rem 0.75rem;
  }
}
</style>
