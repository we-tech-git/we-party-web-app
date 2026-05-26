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
   * Todos usando stroke outline para consistência visual
   */
  const iconPaths = computed<Record<NavIcon, string>>(() => ({
    home: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
    top: 'M3 3h18M3 12h18M3 21h18',
    bookmark: 'M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z',
    bell: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0',
    profile: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
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
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                viewBox="0 0 24 24"
                width="20"
              >
                <path :d="getIconPath(item.icon)" />
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
  --sidebar-min-height: 540px;

  --nav-item-gap: 0.75rem;
  --nav-button-padding: 0.9rem 1rem;
  --nav-button-border-radius: 1.445rem;
  --nav-icon-size: 2.25rem;
  --nav-icon-border-radius: 0.875rem;

  --color-bg: #ffffff;
  --color-bg-hover: #eef0ff;
  --color-text: #707799;
  --color-text-active: #ffffff;
  --gradient-primary: linear-gradient(135deg, #ffba4b 0%, #ff5fa6 100%);

  --transition-speed: 0.2s;

  /* Mobile */
  --mobile-z-index: 1000;
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
   RESPONSIVE - COMPACT SIDEBAR (1024px range)
   Sidebar icon-only: labels hidden, icons centered
   ============================================ */
@media (max-width: 1100px) {
  .sidebar {
    padding-right: 0;
    align-items: center;
  }

  .nav-button {
    justify-content: center;
    gap: 0;
    padding: 0.75rem;
    width: auto;
    min-width: 2.75rem;
  }

  .nav-label {
    display: none;
  }

  .nav-icon {
    width: 2rem;
    height: 2rem;
  }
}

/* ============================================
   RESPONSIVE - MOBILE (Bottom Navigation - Instagram Style)
   ============================================ */
@media (max-width: 960px) {
  .sidebar {
    position: fixed !important;
    inset: auto 0 0 0 !important;
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
    box-shadow: 0 -4px 30px rgba(20, 27, 68, 0.12);
    gap: 0;
    /* Glass effect */
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border-top: 1px solid rgba(255, 255, 255, 0.6);
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

  .nav-button:active {
    transform: scale(0.92);
  }

  .nav-icon {
    width: 2rem;
    /* 32px - melhor área de toque */
    height: 2rem;
    background: transparent;
    border-radius: 0.625rem;
    /* 10px */
    transition: transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
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

/* Mobile Extra Small */
@media (max-width: 400px) {
  .sidebar {
    padding: 0.5rem 0.5rem calc(0.5rem + env(safe-area-inset-bottom, 0px));
  }

  .nav-button {
    min-width: 3rem;
    padding: 0.4rem;
  }

  .nav-icon {
    width: 1.75rem;
    height: 1.75rem;
  }
}

/* Fallback for browsers without backdrop-filter */
@supports not (backdrop-filter: blur(20px)) {
  @media (max-width: 960px) {
    .sidebar {
      background: rgba(255, 255, 255, 0.98);
    }
  }
}

/* Force fixed positioning - override any parent styles */
@media (max-width: 960px) {
  aside.sidebar {
    position: fixed !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    top: auto !important;
    z-index: 1000 !important;
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
