<script setup lang="ts">
  import type { CommentNodeData } from './commentTree'
  import { computed, inject } from 'vue'
  import { formatDate, getAvatarColor, getHandle, getInitial, resolveAsset } from './commentDisplay'
  import { commentTreeKey, MAX_COMMENT_DEPTH } from './commentTree'

  const props = defineProps<{
    comment: CommentNodeData
    /** Nível na árvore: raiz = 1. */
    depth: number
  }>()

  const ctx = inject(commentTreeKey)!

  /** No último nível não há para onde aninhar, então o botão some. */
  const canReply = computed(() => props.depth < MAX_COMMENT_DEPTH)

  /** Avatares encolhem a partir do nível 2 para o recuo caber na tela. */
  const isCompact = computed(() => props.depth > 1)

  const replyCount = computed(() => props.comment.replies.length)
</script>

<template>
  <div class="cn-row">
    <div class="cn-avatar-wrap">
      <img
        v-if="resolveAsset(comment.user.profileImage)"
        :alt="comment.user.name"
        class="cn-avatar"
        :class="{ 'cn-avatar--sm': isCompact }"
        :src="resolveAsset(comment.user.profileImage)"
      >
      <div
        v-else
        class="cn-avatar placeholder"
        :class="{ 'cn-avatar--sm': isCompact }"
        :style="{ backgroundColor: getAvatarColor(comment.user.name) }"
      >
        {{ getInitial(comment.user.name) }}
      </div>
    </div>

    <div class="cn-body">
      <div class="cn-bubble" :class="{ 'cn-bubble--reply': isCompact }">
        <div class="cn-meta-line">
          <span class="cn-author">{{ comment.user.name }}</span>
          <span v-if="comment.user.role === 'ADMIN'" class="cn-admin-badge">Admin</span>
          <span class="cn-handle">@{{ getHandle(comment.user.name) }}</span>
          <span class="cn-dot">·</span>
          <span class="cn-time">{{ formatDate(comment.createdAt) }}</span>
        </div>
        <p class="cn-text">{{ comment.content }}</p>
      </div>

      <div class="cn-actions-row">
        <button
          class="cn-action-btn like"
          :class="{ active: ctx.isLiked(comment) }"
          :disabled="ctx.isLiking(comment.id)"
          type="button"
          @click.stop="ctx.toggleLike(comment)"
        >
          <svg
            aria-hidden="true"
            :fill="ctx.isLiked(comment) ? 'currentColor' : 'none'"
            :height="isCompact ? 13 : 14"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            viewBox="0 0 24 24"
            :width="isCompact ? 13 : 14"
          >
            <path
              d="M12 21s-6.6-4.35-9-8.4C1 8.67 3.42 5 7.2 5c1.9 0 3.45 1.17 4.8 2.6C13.35 6.17 14.9 5 16.8 5 20.58 5 23 8.67 21 12.6c-2.4 4.05-9 8.4-9 8.4Z"
            />
          </svg>
          <span class="cn-like-count">{{ ctx.likesCount(comment) }}</span>
        </button>

        <button
          v-if="canReply"
          class="cn-action-btn reply"
          type="button"
          @click.stop="ctx.startReply(comment)"
        >
          Responder
        </button>

        <span v-if="replyCount > 0" class="cn-reply-count">
          {{ replyCount }} {{ replyCount === 1 ? 'resposta' : 'respostas' }}
        </span>

        <button
          v-if="ctx.isMine(comment)"
          class="cn-action-btn delete"
          :disabled="ctx.isDeleting(comment.id)"
          type="button"
          @click.stop="ctx.remove(comment)"
        >
          {{ ctx.isDeleting(comment.id) ? '...' : 'Excluir' }}
        </button>
      </div>

      <!-- Campo de resposta, ancorado no nó realmente clicado -->
      <div v-if="ctx.isReplyingTo(comment.id)" class="cn-reply-input-area">
        <div class="cn-reply-input-wrap">
          <input
            v-model="ctx.replyText.value"
            :disabled="ctx.sendingReply.value"
            maxlength="500"
            :placeholder="`Respondendo a ${ctx.replyToName.value}...`"
            type="text"
            @keyup.enter="ctx.submitReply()"
            @keyup.esc="ctx.cancelReply()"
          >
          <button class="cn-reply-cancel" type="button" @click="ctx.cancelReply()">✕</button>
          <button
            aria-label="Enviar resposta"
            class="cn-send-btn"
            :disabled="!ctx.replyText.value.trim() || ctx.sendingReply.value"
            type="button"
            @click="ctx.submitReply()"
          >
            <svg
              v-if="!ctx.sendingReply.value"
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

      <!-- Recursão: cada nível se renderiza a si mesmo até MAX_COMMENT_DEPTH -->
      <div v-if="comment.replies.length > 0" class="cn-replies">
        <CommentNode
          v-for="reply in comment.replies"
          :key="reply.id"
          :comment="reply"
          :depth="depth + 1"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.cn-row {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
}

.cn-avatar-wrap {
  flex-shrink: 0;
  padding-top: 2px;
}

.cn-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
}

.cn-avatar.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 800;
  color: #fff;
}

.cn-avatar--sm {
  width: 36px;
  height: 36px;
  font-size: 0.85rem;
}

.cn-body {
  flex: 1;
  min-width: 0;
}

/* ─── Bubble ─── */
.cn-bubble {
  background: #f2f3f8;
  border-radius: 18px;
  padding: 0.8rem 1rem;
}

.cn-bubble--reply {
  background: rgba(255, 95, 166, 0.06);
}

.cn-meta-line {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 0.3rem;
}

.cn-author {
  font-size: 0.96rem;
  font-weight: 800;
  color: #14151f;
}

.cn-handle {
  font-size: 0.84rem;
  color: #8b8fa3;
  font-weight: 500;
}

.cn-dot {
  color: #c3c6d4;
  font-size: 0.8rem;
}

.cn-time {
  font-size: 0.82rem;
  color: #9a9dab;
  font-weight: 500;
}

.cn-text {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.5;
  color: #2a2c38;
  word-break: break-word;
}

/* ─── Ações ─── */
.cn-actions-row {
  display: flex;
  align-items: center;
  gap: 1.1rem;
  padding: 0.5rem 0.25rem 0;
}

.cn-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.32rem;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 700;
  color: #9a9dab;
  padding: 0.15rem 0;
  transition: color 0.2s ease;
}

.cn-action-btn.like {
  color: #c6c9d6;
}

.cn-action-btn.like.active {
  color: #ff2f92;
}

.cn-action-btn.like:hover:not(:disabled) {
  color: #ff2f92;
}

.cn-action-btn.like:disabled {
  cursor: default;
}

.cn-like-count {
  font-variant-numeric: tabular-nums;
}

.cn-action-btn.reply:hover {
  color: #4c6fff;
}

.cn-action-btn.delete:hover:not(:disabled) {
  color: #ef4444;
}

.cn-action-btn.delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cn-reply-count {
  font-size: 0.8rem;
  font-weight: 600;
  color: #b4b7c5;
}

.cn-admin-badge {
  display: inline-flex;
  align-items: center;
  padding: 1px 7px;
  border-radius: 999px;
  background: linear-gradient(135deg, #ffba4b 0%, #ff5fa6 100%);
  color: #fff;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

/* ─── Campo de resposta ─── */
.cn-reply-input-area {
  margin-top: 0.5rem;
}

.cn-reply-input-wrap {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background: #fff;
  border: 1px solid rgba(255, 95, 166, 0.4);
  border-radius: 999px;
  padding: 0.2rem 0.25rem 0.2rem 0.85rem;
  box-shadow: 0 0 0 3px rgba(255, 95, 166, 0.06);
}

.cn-reply-input-wrap input {
  flex: 1;
  background: transparent;
  border: none;
  color: #1a1a1a;
  font-size: 0.86rem;
  outline: none;
  min-width: 0;
  padding: 0.35rem 0;
}

.cn-reply-input-wrap input::placeholder {
  color: rgba(0, 0, 0, 0.35);
}

.cn-reply-cancel {
  background: transparent;
  border: none;
  color: rgba(0, 0, 0, 0.3);
  font-size: 0.75rem;
  cursor: pointer;
  padding: 0.2rem 0.3rem;
  transition: color 0.2s;
}

.cn-reply-cancel:hover {
  color: rgba(0, 0, 0, 0.6);
}

.cn-send-btn {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #ffba4b 0%, #ff5fa6 100%);
  color: #fff;
  cursor: pointer;
  transition: all 0.25s ease;
  flex-shrink: 0;
}

.cn-send-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* ─── Aninhamento ─── */
.cn-replies {
  margin-top: 0.85rem;
  padding-left: var(--cn-indent, 1rem);
  border-left: 2px solid rgba(255, 95, 166, 0.18);
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

@media (max-width: 480px) {
  .cn-avatar {
    width: 38px;
    height: 38px;
  }

  .cn-avatar--sm {
    width: 30px;
    height: 30px;
  }

  .cn-bubble {
    padding: 0.65rem 0.85rem;
  }

  .cn-author {
    font-size: 0.88rem;
  }

  .cn-text {
    font-size: 0.88rem;
  }

  .cn-row {
    gap: 0.5rem;
  }

  .cn-actions-row {
    gap: 0.8rem;
  }

  .cn-replies {
    padding-left: var(--cn-indent-sm, 0.6rem);
  }
}
</style>
