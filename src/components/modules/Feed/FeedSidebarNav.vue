<script setup lang="ts">
  import { computed } from 'vue'

  // ============================================
  // TYPES & INTERFACES
  // ============================================

  interface NavItem {
    id: string
    label: string
    icon: NavIcon
  }

  type NavIcon = 'home' | 'top' | 'bookmark' | 'bell' | 'profile'

  // ============================================
  // PROPS & EMITS
  // ============================================

  const props = defineProps<{
    items: NavItem[]
    active: string
  }>()

  const emit = defineEmits<{
    select: [id: string]
  }>()

  // ============================================
  // COMPOSABLES & COMPUTED
  // ============================================

  /**
   * Mapa de ícones SVG
   * Centraliza todos os ícones para fácil manutenção
   */
  const iconPaths = computed<Record<NavIcon, string>>(() => ({
    home: 'M4 9.5 12 4l8 5.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1z',
    top: 'm4 17 4.5-10 3.5 7 2.5-5 5 8z',
    bookmark: 'M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1z',
    bell: 'M18 15v-3a6 6 0 0 0-12 0v3l-1.5 1.5a1 1 0 0 0 .7 1.7H18.8a1 1 0 0 0 .7-1.7z',
    profile: 'M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm0 10c-4.418 0-8 2.015-8 4.5V20h16v-1.5c0-2.485-3.582-4.5-8-4.5z',
  }))

  /**
   * Verifica se o item está ativo
   */
  const isActive = (itemId: string): boolean => props.active === itemId

  // ============================================
  // METHODS
  // ============================================

  /**
   * Lida com a seleção de item de navegação
   * Previne cliques redundantes no item já ativo
   */
  function handleSelect (id: string): void {
    if (isActive(id)) return
    emit('select', id)
  }

  /**
   * Retorna o caminho SVG do ícone
   */
  function getIconPath (icon: NavIcon): string {
    return iconPaths.value[icon] || iconPaths.value.home
  }
</script>

<template>
  <aside class="sidebar">
    <nav aria-label="Navegação principal">
      <ul class="nav-list" role="list">
        <li v-for="item in items" :key="item.id" class="nav-item">
          <button
            :aria-current="isActive(item.id) ? 'page' : undefined"
            class="nav-button"
            :class="{ 'is-active': isActive(item.id) }"
            type="button"
            @click="handleSelect(item.id)"
          >
            <span aria-hidden="true" class="nav-icon">
              <svg
                class="icon-svg"
                fill="none"
                height="20"
                viewBox="0 0 24 24"
                width="20"
              >
                <path :d="getIconPath(item.icon)" fill="currentColor" />
              </svg>
            </span>
            <span class="nav-label">{{ item.label }}</span>
          </button>
        </li>
      </ul>
    </nav>
  </aside>
</template>

<style scoped>
/* ============================================
   CSS VARIABLES (Design Tokens)
   ============================================ */
.sidebar {
  --sidebar-padding-right: 1.5rem;
  --sidebar-gap: 2rem;
  --sidebar-border-radius: 2rem;
  --sidebar-min-height: 540px;

  --nav-item-gap: 0.75rem;
  --nav-button-padding: 0.9rem 1rem;
  --nav-button-border-radius: 1.125rem;
  --nav-icon-size: 2.25rem;
  --nav-icon-border-radius: 0.875rem;

  --color-bg: #ffffff;
  --color-bg-hover: #eef0ff;
  --color-text: #707799;
  --color-text-active: #ffffff;
  --gradient-primary: linear-gradient(135deg, #ffba4b 0%, #ff5fa6 100%);

  --transition-speed: 0.2s;
  --shadow-active: 0 1.125rem 2.125rem rgba(255, 95, 166, 0.32);

  /* Mobile */
  --mobile-z-index: 200;
  --mobile-padding: 0.75rem 1rem;
  --mobile-border-radius: 1.5rem 1.5rem 0 0;
  --mobile-shadow: 0 -0.625rem 2.5rem rgba(20, 27, 68, 0.15);
}

/* ============================================
   LAYOUT - DESKTOP
   ============================================ */
.sidebar {
  display: flex;
  flex-direction: column;
  gap: var(--sidebar-gap);
  padding-right: var(--sidebar-padding-right);
  border-radius: var(--sidebar-border-radius);
  min-height: var(--sidebar-min-height);

}

.nav-list {
  display: flex;
  flex-direction: column;
  gap: var(--nav-item-gap);
  margin: 0;
  padding: 0;
  list-style: none;
}

/* ============================================
   NAVIGATION BUTTON
   ============================================ */
.nav-button {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  width: 100%;
  padding: var(--nav-button-padding);
  border: 0;
  border-radius: var(--nav-button-border-radius);
  background: var(--color-bg);
  color: var(--color-text);
  font-weight: 600;
  font-size: 0.95rem;
  font-family: inherit;
  cursor: pointer;
  transition:
    background var(--transition-speed) ease,
    color var(--transition-speed) ease,
    transform var(--transition-speed) ease;
}

.nav-button:hover:not(.is-active) {
  transform: translateX(0.25rem);
  background: var(--color-bg-hover);
}

.nav-button:focus-visible {
  outline: 2px solid #ff5fa6;
  outline-offset: 2px;
}

.nav-button.is-active {
  background: var(--gradient-primary);
  color: var(--color-text-active);
  box-shadow: var(--shadow-active);
}

/* ============================================
   ICON
   ============================================ */
.nav-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--nav-icon-size);
  height: var(--nav-icon-size);
  border-radius: var(--nav-icon-border-radius);
  background: rgba(255, 255, 255, 0.65);
  color: inherit;
  flex-shrink: 0;
}

.nav-button.is-active .nav-icon {
  background: rgba(255, 255, 255, 0.2);
}

.icon-svg {
  display: block;
}

/* ============================================
   RESPONSIVE - TABLET
   ============================================ */
@media (max-width: 1240px) {
  .sidebar {
    position: sticky;
    top: var(--feed-sticky-offset, 5rem);
    min-height: auto;
  }
}

/* ============================================
   RESPONSIVE - MOBILE (Bottom Navigation)
   ============================================ */
@media (max-width: 960px) {
  .sidebar {
    position: fixed;
    inset: auto 0 0 0;
    /* top auto, right 0, bottom 0, left 0 */
    width: 100%;
    height: auto;
    min-height: auto;
    padding: var(--mobile-padding);
    padding-bottom: calc(0.75rem + env(safe-area-inset-bottom, 0px));
    border-radius: var(--mobile-border-radius);
    z-index: var(--mobile-z-index);
    flex-direction: row;
    justify-content: center;
    box-shadow: var(--mobile-shadow);
    gap: 0;
    background: var(--color-bg);
    margin-top: 0;
  }

  nav {
    width: 100%;
    max-width: 31.25rem;
    /* 500px */
  }

  .nav-list {
    flex-direction: row;
    width: 100%;
    justify-content: space-between;
    gap: 0;
  }

  .nav-item {
    flex: 1;
    display: flex;
    justify-content: center;
  }

  .nav-button {
    flex-direction: column;
    justify-content: center;
    gap: 0.25rem;
    padding: 0.5rem;
    background: transparent;
    font-size: 0.65rem;
    width: auto;
    min-width: 3.5rem;
    /* 56px */
  }

  .nav-button:hover:not(.is-active) {
    transform: none;
    background: transparent;
  }

  .nav-button.is-active {
    background: transparent;
    color: #ff5fa6;
    box-shadow: none;
  }

  .nav-button.is-active .nav-icon {
    background: var(--gradient-primary);
    color: white;
    box-shadow: 0 0.25rem 0.75rem rgba(255, 95, 166, 0.4);
  }

  .nav-icon {
    width: 1.75rem;
    /* 28px */
    height: 1.75rem;
    background: transparent;
    border-radius: 0.625rem;
    /* 10px */
  }

  .nav-label {
    /* Oculta label visualmente mas mantém para screen readers */
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
}

/* ============================================
   ANIMATIONS (Performance)
   ============================================ */
@media (prefers-reduced-motion: reduce) {
  .nav-button {
    transition: none;
  }

  .nav-button:hover:not(.is-active) {
    transform: none;
  }
}
</style>
