<script setup lang="ts">
  /**
   * Breadcrumb "← Voltar [ / Seção atual ]" usado no topo das páginas internas
   * (Feed / Top eventos / Eventos favoritos / Perfil). Centralizado aqui para
   * que todas as páginas com esse cabeçalho tenham o mesmo visual.
   */
  import { useI18n } from 'vue-i18n'

  const props = withDefaults(defineProps<{
    /** Rótulo da seção atual, exibido após o separador. Omitido = só "Voltar". */
    current?: string
    ariaLabel?: string
    backAriaLabel?: string
  }>(), {
    current: '',
    ariaLabel: undefined,
    backAriaLabel: undefined,
  })

  const emit = defineEmits<{
    back: []
  }>()

  const { t } = useI18n()
</script>

<template>
  <nav :aria-label="props.ariaLabel ?? t('profile.aria.navigation')" class="breadcrumb-nav">
    <button
      :aria-label="props.backAriaLabel ?? t('profile.aria.backToFeed')"
      class="breadcrumb-back"
      type="button"
      @click="emit('back')"
    >
      <span aria-hidden="true" class="back-icon">
        <svg
          fill="none"
          height="16"
          stroke="currentColor"
          stroke-width="2.5"
          viewBox="0 0 24 24"
          width="16"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </span>
      <span class="back-text">{{ t('common.back') }}</span>
    </button>
    <template v-if="props.current">
      <span aria-hidden="true" class="breadcrumb-separator">
        <svg
          fill="none"
          height="14"
          stroke="currentColor"
          stroke-width="2"
          viewBox="0 0 24 24"
          width="14"
        >
          <path d="m9 18 6-6-6-6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </span>
      <span class="breadcrumb-current">{{ props.current }}</span>
    </template>
  </nav>
</template>

<style scoped>
.breadcrumb-nav {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 248, 250, 0.95) 100%);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(255, 95, 166, 0.08);
  border: 1px solid rgba(255, 186, 75, 0.15);
  margin-bottom: 0.5rem;
}

.breadcrumb-back {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(255, 154, 77, 0.15) 0%, rgba(255, 95, 143, 0.15) 100%);
  color: #ff5fa6;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.breadcrumb-back:hover {
  background: linear-gradient(135deg, #ff9a4d 0%, #ff5f8f 100%);
  color: white;
  transform: translateX(-3px);
  box-shadow: 0 4px 15px rgba(255, 95, 166, 0.3);
}

.breadcrumb-back:active {
  transform: scale(0.97);
}

.back-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  transition: background 0.2s ease;
}

.breadcrumb-back:hover .back-icon {
  background: rgba(255, 255, 255, 0.3);
}

.back-text {
  letter-spacing: 0.02em;
}

.breadcrumb-separator {
  display: flex;
  align-items: center;
  color: #c4c9de;
}

.breadcrumb-current {
  font-weight: 700;
  font-size: 0.95rem;
  color: #2d2f55;
  padding: 0.35rem 0.85rem;
  background: linear-gradient(135deg, rgba(255, 154, 77, 0.1) 0%, rgba(255, 95, 143, 0.1) 100%);
  border-radius: 10px;
}

@media (max-width: 640px) {
  .breadcrumb-nav {
    padding: 0.6rem 1rem;
    border-radius: 14px;
    gap: 0.5rem;
  }

  .breadcrumb-back {
    padding: 0.4rem 0.85rem;
    font-size: 0.85rem;
    gap: 0.4rem;
  }

  .back-icon {
    width: 22px;
    height: 22px;
  }

  .back-icon svg {
    width: 14px;
    height: 14px;
  }

  .breadcrumb-current {
    font-size: 0.85rem;
    padding: 0.3rem 0.7rem;
  }

  .breadcrumb-separator svg {
    width: 12px;
    height: 12px;
  }
}

@media (max-width: 480px) {
  .breadcrumb-nav {
    padding: 0.5rem 0.85rem;
    border-radius: 12px;
    gap: 0.4rem;
  }

  .breadcrumb-back {
    padding: 0.35rem 0.7rem;
    font-size: 0.8rem;
    border-radius: 10px;
  }

  .back-icon {
    width: 20px;
    height: 20px;
    border-radius: 6px;
  }

  .back-text {
    display: none;
  }

  .breadcrumb-current {
    font-size: 0.8rem;
    padding: 0.25rem 0.6rem;
    border-radius: 8px;
  }
}
</style>
