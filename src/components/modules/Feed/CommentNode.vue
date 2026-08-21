<script setup lang="ts">
  import type { CommentNodeData } from './commentTree'
  import { computed, inject, ref } from 'vue'
  import UserAvatar from '@/components/UI/UserAvatar/UserAvatar.vue'
  import { formatDate, getHandle } from './commentDisplay'
  import { commentTreeKey, countComments, MAX_COMMENT_DEPTH } from './commentTree'

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
  const hasReplies = computed(() => replyCount.value > 0)
  const collapsed = computed(() => ctx.isCollapsed(props.comment.id))

  /** Total de nós escondidos quando a thread é recolhida (inclui netos e além). */
  const hiddenCount = computed(() => countComments(props.comment.replies))

  /** Comentários longos entram truncados; o usuário decide expandir. */
  const LONG_TEXT_CHARS = 320
  const expandedText = ref(false)
  const isLong = computed(() => props.comment.content.length > LONG_TEXT_CHARS)
</script>

<template>
  <div
    class="cn-node"
    :class="{
      'cn-node--root': depth === 1,
      'cn-node--fresh': ctx.isFresh(comment.id),
      'cn-node--replying': ctx.isReplyingTo(comment.id),
    }"
  >
    <div class="cn-head">
      <div class="cn-avatar-col">
        <UserAvatar
          :image="comment.user.profileImage"
          :name="comment.user.name"
          :size="isCompact ? 30 : 40"
        />
      </div>

      <div class="cn-content">
        <div class="cn-meta">
          <span class="cn-author">{{ comment.user.name }}</span>
          <span v-if="comment.user.role === 'ADMIN'" class="cn-badge cn-badge--admin">Admin</span>
          <span v-if="ctx.isMine(comment)" class="cn-badge cn-badge--you">Você</span>
          <span class="cn-handle">@{{ getHandle(comment.user.name) }}</span>
          <span class="cn-sep">·</span>
          <span class="cn-time">{{ formatDate(comment.createdAt) }}</span>

          <button
            v-if="hasReplies"
            :aria-expanded="!collapsed"
            class="cn-chevron"
            :title="collapsed ? 'Expandir thread' : 'Recolher thread'"
            type="button"
            @click.stop="ctx.toggleCollapse(comment)"
          >
            <svg
              aria-hidden="true"
              fill="none"
              height="11"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2.4"
              viewBox="0 0 24 24"
              width="11"
            >
              <path v-if="collapsed" d="m6 9 6 6 6-6" />
              <path v-else d="m6 15 6-6 6 6" />
            </svg>
          </button>
        </div>

        <p class="cn-text" :class="{ 'cn-text--clamped': isLong && !expandedText }">
          {{ comment.content }}
        </p>
        <button
          v-if="isLong"
          class="cn-more-text"
          type="button"
          @click="expandedText = !expandedText"
        >
          {{ expandedText ? 'Ver menos' : 'Ver mais' }}
        </button>

        <div class="cn-actions">
          <button
            class="cn-act cn-act--like"
            :class="{ 'is-on': ctx.isLiked(comment) }"
            :disabled="ctx.isLiking(comment.id)"
            type="button"
            @click.stop="ctx.toggleLike(comment)"
          >
            <svg
              aria-hidden="true"
              :fill="ctx.isLiked(comment) ? 'currentColor' : 'none'"
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
            <span class="cn-num">{{ ctx.likesCount(comment) }}</span>
          </button>

          <button
            v-if="canReply"
            class="cn-act"
            type="button"
            @click.stop="ctx.startReply(comment)"
          >
            <svg
              aria-hidden="true"
              fill="none"
              height="14"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              viewBox="0 0 24 24"
              width="14"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Responder
          </button>

          <button
            v-if="hasReplies"
            class="cn-act cn-act--thread"
            type="button"
            @click.stop="ctx.toggleCollapse(comment)"
          >
            {{ collapsed
              ? `Ver ${hiddenCount} ${hiddenCount === 1 ? 'resposta' : 'respostas'}`
              : 'Ocultar respostas' }}
          </button>

          <span v-if="!canReply" class="cn-depth-note">Fim da thread</span>

          <button
            v-if="ctx.isMine(comment)"
            class="cn-act cn-act--danger"
            :disabled="ctx.isDeleting(comment.id)"
            type="button"
            @click.stop="ctx.remove(comment)"
          >
            {{ ctx.isDeleting(comment.id) ? 'Excluindo…' : 'Excluir' }}
          </button>
        </div>

        <!-- Campo de resposta, ancorado no nó realmente clicado -->
        <div v-if="ctx.isReplyingTo(comment.id)" class="cn-reply-box">
          <div class="cn-reply-field">
            <input
              v-model="ctx.replyText.value"
              :disabled="ctx.sendingReply.value"
              maxlength="500"
              :placeholder="`Respondendo a ${ctx.replyToName.value}…`"
              type="text"
              @keyup.enter="ctx.submitReply()"
              @keyup.esc="ctx.cancelReply()"
            >
            <span class="cn-reply-len">{{ ctx.replyText.value.length }}/500</span>
            <button
              class="cn-reply-cancel"
              title="Cancelar"
              type="button"
              @click="ctx.cancelReply()"
            >✕</button>
            <button
              aria-label="Enviar resposta"
              class="cn-reply-send"
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
      </div>
    </div>

    <!-- ── Galho: só monta quando aberto; recolhido vira o botão "Ver respostas" acima ── -->
    <div v-if="hasReplies && !collapsed" class="cn-branch">
      <button
        class="cn-spine"
        :title="`Recolher ${replyCount === 1 ? 'a resposta' : 'as respostas'}`"
        type="button"
        @click.stop="ctx.toggleCollapse(comment)"
      />
      <div class="cn-children">
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
/* Meia-largura do avatar deste nível: alinha a linha do galho com o centro
   do avatar do pai, que é o que faz a árvore "encaixar" visualmente. */
.cn-node {
  --spine-x: 15px;
  --cn-accent: #ff2f92;
}

.cn-node--root {
  --spine-x: 20px;
}

/* ─── Cabeça ─── */
.cn-head {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
}

.cn-avatar-col {
  flex-shrink: 0;
}

.cn-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.cn-avatar.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
  font-weight: 800;
  color: #fff;
}

.cn-avatar--sm {
  width: 30px;
  height: 30px;
  font-size: 0.78rem;
}

.cn-content {
  flex: 1;
  min-width: 0;
}

/* ─── Linha de identificação ─── */
.cn-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.35rem;
  line-height: 1.2;
}

.cn-author {
  font-size: 0.9rem;
  font-weight: 750;
  color: #14151f;
}

.cn-handle {
  font-size: 0.8rem;
  color: #9599ab;
  font-weight: 500;
}

.cn-sep {
  color: #cfd2de;
  font-size: 0.75rem;
}

.cn-time {
  font-size: 0.79rem;
  color: #9599ab;
  font-weight: 500;
}

.cn-badge {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  border-radius: 14px;
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.cn-badge--admin {
  background: linear-gradient(135deg, #ff9a4d 0%, #ff5f8f 100%);
  color: #fff;
}

.cn-badge--you {
  background: rgba(76, 111, 255, 0.12);
  color: #4c6fff;
}

/* Chevron discreto: recolher sem precisar mirar na linha */
.cn-chevron {
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  margin-left: auto;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #b9bcc9;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.cn-chevron:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #5c6070;
}

/* ─── Texto ─── */
.cn-text {
  margin: 0.22rem 0 0;
  font-size: 0.91rem;
  line-height: 1.55;
  color: #2c2e3b;
  word-break: break-word;
  white-space: pre-wrap;
}

.cn-text--clamped {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 5;
  line-clamp: 5;
  overflow: hidden;
}

.cn-more-text {
  margin-top: 0.15rem;
  border: none;
  background: transparent;
  padding: 0;
  font-size: 0.79rem;
  font-weight: 700;
  color: var(--cn-accent);
  cursor: pointer;
}

/* ─── Ações ─── */
.cn-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.3rem;
  margin-left: -0.4rem;
}

.cn-act {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  border: none;
  border-radius: 14px;
  background: transparent;
  padding: 0.28rem 0.55rem;
  font-size: 0.79rem;
  font-weight: 700;
  color: #8b8fa1;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.cn-act:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.05);
  color: #40434f;
}

.cn-act--like:hover:not(:disabled),
.cn-act--like.is-on {
  color: var(--cn-accent);
  background: rgba(255, 47, 146, 0.09);
}

.cn-act--thread {
  color: #7f83f5;
}

.cn-act--thread:hover {
  background: rgba(127, 131, 245, 0.11);
  color: #5b60e8;
}

.cn-act--danger:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.cn-act:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.cn-num {
  font-variant-numeric: tabular-nums;
}

.cn-depth-note {
  padding: 0 0.4rem;
  font-size: 0.74rem;
  font-weight: 600;
  color: #c3c6d4;
}

/* ─── Galho / linha-guia interativa ─── */
.cn-branch {
  position: relative;
  margin-top: 0.15rem;
}

/* Faixa clicável larga o suficiente para o dedo, com a linha fina no meio */
.cn-spine {
  position: absolute;
  top: 0;
  bottom: 0;
  left: calc(var(--spine-x) - 9px);
  width: 18px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  z-index: 1;
}

.cn-spine::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 2px;
  transform: translateX(-50%);
  border-radius: 14px;
  background: #e4e6ef;
  transition: background 0.18s ease, width 0.18s ease;
}

.cn-spine:hover::before {
  width: 3px;
  background: var(--cn-accent);
}

.cn-children {
  padding-left: calc(var(--spine-x) + 13px);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-top: 0.75rem;
  border-radius: 10px;
  transition: background 0.18s ease;
}

/* O pulo do gato do Reddit: passar o mouse na linha acende o galho inteiro,
   deixando óbvio o que vai ser recolhido antes do clique. */
.cn-spine:hover ~ .cn-children {
  background: rgba(255, 47, 146, 0.045);
}

/* ─── Realces de estado ─── */
/* `> .cn-head` mantém o realce no próprio nó: as respostas dele ficam em
   .cn-branch, que é irmão, então não herdam o destaque. */
.cn-node--replying > .cn-head .cn-author {
  color: var(--cn-accent);
}

@keyframes cn-fresh-in {
  from {
    background: rgba(255, 47, 146, 0.14);
  }
  to {
    background: transparent;
  }
}

.cn-node--fresh > .cn-head {
  animation: cn-fresh-in 2.4s ease-out;
  border-radius: 12px;
}

/* ─── Campo de resposta ─── */
.cn-reply-box {
  margin-top: 0.55rem;
}

.cn-reply-field {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  background: #fff;
  border: 1.5px solid rgba(255, 95, 166, 0.45);
  border-radius: 14px;
  padding: 0.18rem 0.22rem 0.18rem 0.85rem;
  box-shadow: 0 0 0 3px rgba(255, 95, 166, 0.07);
}

.cn-reply-field input {
  flex: 1;
  background: transparent;
  border: none;
  color: #1a1a1a;
  font-size: 0.85rem;
  outline: none;
  min-width: 0;
  padding: 0.32rem 0;
}

.cn-reply-field input::placeholder {
  color: rgba(0, 0, 0, 0.33);
}

.cn-reply-len {
  flex-shrink: 0;
  font-size: 0.66rem;
  font-weight: 600;
  color: #b9bcc9;
  font-variant-numeric: tabular-nums;
}

.cn-reply-cancel {
  flex-shrink: 0;
  background: transparent;
  border: none;
  color: rgba(0, 0, 0, 0.3);
  font-size: 0.72rem;
  cursor: pointer;
  padding: 0.2rem 0.25rem;
  transition: color 0.15s;
}

.cn-reply-cancel:hover {
  color: rgba(0, 0, 0, 0.6);
}

.cn-reply-send {
  display: grid;
  place-items: center;
  width: 27px;
  height: 27px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #ff9a4d 0%, #ff5f8f 100%);
  color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.cn-reply-send:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* ─── Responsivo ─── */
@media (max-width: 480px) {
  .cn-node {
    --spine-x: 13px;
  }

  .cn-node--root {
    --spine-x: 17px;
  }

  .cn-avatar {
    width: 34px;
    height: 34px;
  }

  .cn-avatar--sm {
    width: 26px;
    height: 26px;
    font-size: 0.7rem;
  }

  .cn-children {
    padding-left: calc(var(--spine-x) + 9px);
  }

  .cn-author {
    font-size: 0.85rem;
  }

  .cn-text {
    font-size: 0.86rem;
  }

  .cn-handle {
    display: none;
  }
}
</style>
