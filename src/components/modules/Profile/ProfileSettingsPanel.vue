<script setup lang="ts">
  // Extraído de Profile.vue na Fase 5 (REFACTOR_AUDIT_PLAN.md) — 1ª fatia da
  // decomposição do conteúdo principal da página (depois dos 7 modais,
  // partes 1-6). Painel "Configurações" da aba de tabs — autocontido,
  // sem refs cruzando fronteira.
  //
  // `notificationsEnabled` segue a convenção `modelValue`/`update:modelValue`
  // do resto do design system. `edit-profile`/`logout` continuam no pai
  // (abrem o modal de editar perfil e fazem logout de verdade).
  import { useI18n } from 'vue-i18n'

  defineProps<{
    notificationsEnabled: boolean
    /** Controla se os eventos curtidos aparecem no perfil público (`/profile/:id`). */
    showLikedEventsEnabled: boolean
    /** Controla se as presenças confirmadas aparecem no perfil público (`/profile/:id`). */
    showConfirmedEventsEnabled: boolean
  }>()

  const emit = defineEmits<{
    'update:notificationsEnabled': [value: boolean]
    'update:showLikedEventsEnabled': [value: boolean]
    'update:showConfirmedEventsEnabled': [value: boolean]
    'edit-profile': []
    'logout': []
  }>()

  const { t } = useI18n()
</script>

<template>
  <div class="settings-panel">
    <div class="settings-group">
      <h4 class="settings-group-title">{{ t('profile.settings.general') }}</h4>
      <div class="setting-item" @click="emit('update:notificationsEnabled', !notificationsEnabled)">
        <div class="setting-left">
          <div class="setting-icon-wrap">
            <i class="mdi mdi-bell-outline" />
          </div>
          <div>
            <span class="setting-name">{{ t('profile.settings.notifications') }}</span>
            <span class="setting-desc">{{ t('profile.settings.notificationsDesc') }}</span>
          </div>
        </div>
        <div class="toggle-switch" :class="{ checked: notificationsEnabled }" />
      </div>

      <div class="setting-item language-setting">
        <div class="setting-left">
          <div class="setting-icon-wrap">
            <i class="mdi mdi-web" />
          </div>
          <div>
            <span class="setting-name">{{ t('profile.settings.language') }}</span>
            <span class="setting-desc">{{ t('profile.settings.languageDesc') }}</span>
          </div>
        </div>
        <div class="language-selector">
          <LanguageSwitcher />
        </div>
      </div>

    </div>

    <div class="settings-group">
      <h4 class="settings-group-title">{{ t('profile.settings.account') }}</h4>
      <div class="setting-item" @click="emit('edit-profile')">
        <div class="setting-left">
          <div class="setting-icon-wrap">
            <i class="mdi mdi-account-edit-outline" />
          </div>
          <div>
            <span class="setting-name">{{ t('profile.settings.editProfile') }}</span>
            <span class="setting-desc">{{ t('profile.settings.editProfileDesc') }}</span>
          </div>
        </div>
        <i class="mdi mdi-chevron-right setting-arrow" />
      </div>
      <div class="setting-item danger" @click="emit('logout')">
        <div class="setting-left">
          <div class="setting-icon-wrap danger">
            <i class="mdi mdi-logout" />
          </div>
          <div>
            <span class="setting-name">{{ t('profile.settings.logout') }}</span>
            <span class="setting-desc">{{ t('profile.settings.logoutDesc') }}</span>
          </div>
        </div>
        <i class="mdi mdi-chevron-right setting-arrow" />
      </div>
    </div>

    <div class="settings-group">
      <h4 class="settings-group-title">{{ t('profile.settings.privacy') }}</h4>
      <div
        class="setting-item"
        data-testid="profile-settings-show-liked-events"
        @click="emit('update:showLikedEventsEnabled', !showLikedEventsEnabled)"
      >
        <div class="setting-left">
          <div class="setting-icon-wrap">
            <i class="mdi mdi-heart-outline" />
          </div>
          <div>
            <span class="setting-name">{{ t('profile.settings.showLikedEvents') }}</span>
            <span class="setting-desc">{{ t('profile.settings.showLikedEventsDesc') }}</span>
          </div>
        </div>
        <div class="toggle-switch" :class="{ checked: showLikedEventsEnabled }" />
      </div>
      <div
        class="setting-item"
        data-testid="profile-settings-show-confirmed-events"
        @click="emit('update:showConfirmedEventsEnabled', !showConfirmedEventsEnabled)"
      >
        <div class="setting-left">
          <div class="setting-icon-wrap">
            <i class="mdi mdi-calendar-check-outline" />
          </div>
          <div>
            <span class="setting-name">{{ t('profile.settings.showConfirmedEvents') }}</span>
            <span class="setting-desc">{{ t('profile.settings.showConfirmedEventsDesc') }}</span>
          </div>
        </div>
        <div class="toggle-switch" :class="{ checked: showConfirmedEventsEnabled }" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-panel {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.settings-group {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.settings-group-title {
  margin: 0;
  padding: 1rem 1.25rem 0.5rem;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #9aa0b8;
  font-weight: 700;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.85rem 1.25rem;
  cursor: pointer;
  transition: background 0.15s;
}

.setting-item:hover {
  background: rgba(0, 0, 0, 0.015);
}

.setting-item:not(:last-child) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
}

.setting-left {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.setting-icon-wrap {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(255, 154, 77, 0.1), rgba(255, 95, 143, 0.1));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
  color: #ff5fa6;
}

.setting-icon-wrap.danger {
  background: rgba(244, 63, 94, 0.08);
  color: #f43f5e;
}

.setting-name {
  display: block;
  font-size: 0.92rem;
  font-weight: 600;
  color: #1a1c2e;
}

.setting-desc {
  display: block;
  font-size: 0.78rem;
  color: #9aa0b8;
  margin-top: 1px;
}

.setting-arrow {
  font-size: 1.25rem;
  color: #c4c9de;
}

.setting-item.danger .setting-name {
  color: #f43f5e;
}

.setting-item.danger .setting-desc {
  color: #fca5a5;
}

.toggle-switch {
  width: 44px;
  height: 24px;
  background: #e0e2ed;
  border-radius: 99px;
  position: relative;
  cursor: pointer;
  transition: background 0.2s;
  flex-shrink: 0;
}

.toggle-switch::after {
  content: '';
  position: absolute;
  left: 2px;
  top: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: transform 0.2s;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.toggle-switch.checked {
  background: #22c55e;
}

.toggle-switch.checked::after {
  transform: translateX(20px);
}

/* ── Language Setting ── */
.setting-item.language-setting {
  cursor: default;
}

.setting-item.language-setting:hover {
  background: transparent;
}

.language-selector {
  flex-shrink: 0;
}
</style>
