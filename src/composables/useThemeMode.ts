/**
 * useThemeMode Composable
 * Gerencia o modo escuro/claro globalmente com persistência no localStorage
 */

import { ref, watch } from 'vue'

const STORAGE_KEY = 'DARK_MODE'

function getInitialDark (): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored !== null) {
    return stored === 'true'
  }
  // Usa preferência do sistema operacional como padrão
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

// Estado global reativo compartilhado entre todos os componentes
const isDark = ref(getInitialDark())

function applyDarkClass (dark: boolean) {
  if (typeof document === 'undefined') {
    return
  }
  document.documentElement.classList.toggle('dark', dark)
}

// Aplica a classe imediatamente ao carregar (antes do mount)
applyDarkClass(isDark.value)

// Persiste e aplica ao DOM a cada mudança
watch(isDark, value => {
  localStorage.setItem(STORAGE_KEY, String(value))
  applyDarkClass(value)
})

export function useThemeMode () {
  const toggleDark = () => {
    isDark.value = !isDark.value
  }

  const setDark = (value: boolean) => {
    isDark.value = value
  }

  return {
    isDark,
    toggleDark,
    setDark,
  }
}
