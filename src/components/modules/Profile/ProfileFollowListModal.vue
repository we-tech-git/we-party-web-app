<script setup lang="ts">
  // Extraído de Profile.vue na Fase 5 (REFACTOR_AUDIT_PLAN.md) — 1ª fatia da
  // decomposição do mega-arquivo (5.646 linhas). Diferente de LandingPage.vue
  // (seções de scroll), Profile.vue é dominado por modais quase idênticos
  // (Teleport + Transition "modal" + overlay) — 7 no total. Modal de
  // Seguidores e Modal de Seguindo eram ~95% o mesmo template/CSS (só
  // diferindo no título, ícone/texto de vazio, e a lógica do botão: em
  // "seguidores" alterna Seguir/Seguindo por pessoa, em "seguindo" é sempre
  // "Deixar de seguir"). Repetição real confirmada dentro do próprio
  // arquivo (não especulativa), por isso virou 1 componente com prop
  // `variant` em vez de 2 componentes quase-cópia.
  //
  // `toggleFollowUser`/`fetchFollowersList`/`fetchFollowingList` continuam
  // no pai — `toggleFollowUser` também é usado pela lista de recomendações
  // (fora dos modais) e mexe em `followStats` do pai — por isso o componente
  // só emite `toggle-follow` em vez de reimplementar a chamada de API.
  // `goToProfile` (via `useUserNavigation`) é seguro chamar de novo aqui:
  // o composable só lê router/auth, não guarda estado próprio por chamada
  // (diferente do `usePwaInstall` da Landingpage, que tinha esse cuidado).
  //
  // `.modal-overlay`/`.modal-container`/`.modal-header`/`.modal-close`/
  // `.modal-body`/transições `.modal-enter-*`/`.modal-leave-*`: esqueleto
  // genérico duplicado de propósito — os outros 5 modais ainda não
  // extraídos também usam. `.modal-overlay` redeclara variáveis CSS
  // (`--color-primary` etc.) porque o modal é teleportado pra fora de
  // `.profile-page-layout`, onde essas variáveis normalmente vêm de fora —
  // sem redeclarar aqui, ficam undefined (lição da Fase 5 parte 1 da
  // Landingpage: sempre checar as classes "base", não só as exclusivas).
  import type { FollowUser } from './types'

  import { useI18n } from 'vue-i18n'
  import { useUserNavigation } from '@/composables/useUserNavigation'

  const props = defineProps<{
    visible: boolean
    variant: 'followers' | 'following'
    list: FollowUser[]
    loading: boolean
  }>()

  const emit = defineEmits<{
    'close': []
    'toggle-follow': [user: FollowUser]
  }>()

  const { t } = useI18n()
  const { goToProfile } = useUserNavigation()

  function openProfile (userId: FollowUser['id']) {
    emit('close')
    goToProfile(userId)
  }

  function buttonLabel (person: FollowUser): string {
    if (props.variant === 'following') return t('profile.followingModal.unfollow')
    return person.isFollowing ? t('profile.followersModal.following') : t('profile.followersModal.follow')
  }
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="modal-overlay" @click.self="emit('close')">
        <div class="modal-container follow-modal">
          <div class="modal-header">
            <h2>{{ t(`profile.${variant}Modal.title`) }}</h2>
            <button class="modal-close" type="button" @click="emit('close')">
              <i class="mdi mdi-close" />
            </button>
          </div>
          <div class="modal-body follow-modal-body">
            <div v-if="loading" class="follow-modal-loading">
              <AppLoader size="sm" :text="t(`profile.${variant}Modal.loading`)" />
            </div>
            <ul v-else-if="list.length > 0" class="follow-modal-list">
              <li v-for="person in list" :key="person.id" class="follow-modal-item">
                <div class="follow-modal-avatar" style="cursor: pointer;" @click="openProfile(person.id)">
                  <UserAvatar :image="person.profileImage" :name="person.name" :size="48" />
                </div>
                <div class="follow-modal-info" style="cursor: pointer;" @click="openProfile(person.id)">
                  <span class="follow-modal-name">{{ person.name }}</span>
                  <span v-if="person.username" class="follow-modal-username">@{{ person.username }}</span>
                </div>
                <button
                  class="follow-modal-btn"
                  :class="{ following: variant === 'following' || person.isFollowing }"
                  type="button"
                  @click="emit('toggle-follow', person)"
                >
                  {{ buttonLabel(person) }}
                </button>
              </li>
            </ul>
            <div v-else class="follow-modal-empty">
              <i :class="variant === 'followers' ? 'mdi mdi-account-group-outline' : 'mdi mdi-account-search-outline'" />
              <p>{{ t(`profile.${variant}Modal.empty`) }}</p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Duplicado de Profile.vue — esqueleto genérico de modal, ver comentário
   no <script>. */
.modal-overlay {
  --color-primary: #ff5fa6;
  --color-text-primary: #1a1c2e;
  --color-text-secondary: #555b77;
  --color-border: rgba(0, 0, 0, 0.04);
  --color-border-strong: #e0e2ed;
  --shadow-primary: 0 4px 16px rgba(255, 95, 166, 0.25);

  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-container {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.12);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 0;
  background: white;
  border-radius: 20px 20px 0 0;
  z-index: 1;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.15rem;
  color: #1a1c2e;
}

.modal-close {
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: #555b77;
  transition: all 0.2s;
}

.modal-close:hover {
  background: rgba(0, 0, 0, 0.08);
  color: #1a1c2e;
}

.modal-body {
  padding: 0 1.5rem 1.5rem;
}

.modal-enter-active {
  transition: all 0.15s ease-out;
}

.modal-leave-active {
  transition: all 0.1s ease-in;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container {
  transform: scale(0.97) translateY(8px);
}

.modal-leave-to .modal-container {
  transform: scale(0.98) translateY(4px);
}

/* Exclusivo dos modais de seguidores/seguindo. `--color-text-muted`/
   `--transition-fast`/`--radius-full` abaixo NÃO estão na lista de
   redeclaração do `.modal-overlay` acima — o original em Profile.vue
   também não redeclarava (só era definido em `.profile-page-layout`,
   fora do escopo do modal teleportado). Mantido idêntico de propósito:
   é um bug pré-existente (já registrado como C1b no diagnóstico), não
   introduzido por esta extração — corrigir aqui seria mudar
   comportamento por fora do escopo desta fatia. */
.follow-modal {
  width: min(480px, 90vw);
  max-height: 70vh;
}

.follow-modal-body {
  padding: 0 !important;
  max-height: 400px;
  overflow-y: auto;
}

.follow-modal-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
}

.follow-modal-loading i {
  font-size: 2rem;
  color: var(--color-primary);
}

.follow-modal-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.follow-modal-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  transition: background var(--transition-fast);
}

.follow-modal-item:last-child {
  border-bottom: none;
}

.follow-modal-item:hover {
  background: rgba(255, 95, 166, 0.04);
}

.follow-modal-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.follow-modal-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.follow-modal-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.follow-modal-name {
  font-weight: 600;
  font-size: 1rem;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.follow-modal-username {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.follow-modal-btn {
  padding: 0.5rem 1rem;
  border-radius: var(--radius-full);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  background: linear-gradient(135deg, #ff9a4d, #ff5f8f);
  color: white;
  border: none;
  flex-shrink: 0;
  white-space: nowrap;
}

.follow-modal-btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-primary);
}

.follow-modal-btn.following {
  background: transparent;
  border: 1px solid var(--color-border-strong);
  color: var(--color-text-secondary);
}

.follow-modal-btn.following:hover {
  background: rgba(239, 68, 68, 0.08);
  border-color: #ef4444;
  color: #ef4444;
  box-shadow: none;
}

.follow-modal-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
}

.follow-modal-empty i {
  font-size: 3rem;
  opacity: 0.5;
}

.follow-modal-empty p {
  margin: 0;
  font-size: 0.95rem;
}
</style>
