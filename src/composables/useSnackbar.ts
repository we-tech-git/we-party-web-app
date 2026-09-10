/**
 * useSnackbar
 *
 * Estado mínimo pro componente `Snackbar.vue` (`v-model` + `color` +
 * `message`). Várias telas (Profile.vue entre elas) reimplementam este
 * mesmo trio de refs — aqui fica um lugar único pra telas novas.
 */

import { ref } from 'vue'

export const SNACKBAR_COLORS = {
  success: '#22c55e',
  error: '#ef4444',
  info: '#6b7280',
} as const

export function useSnackbar () {
  const visible = ref(false)
  const message = ref('')
  const color = ref<string>(SNACKBAR_COLORS.success)

  function show (msg: string, snackColor: string = SNACKBAR_COLORS.success) {
    message.value = msg
    color.value = snackColor
    visible.value = true
  }

  return { visible, message, color, show }
}
