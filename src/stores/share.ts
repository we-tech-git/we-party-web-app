import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useShareStore = defineStore('share', () => {
  const isOpen = ref(false)
  const shareData = ref<{ title: string, text: string, url: string, heading: string }>({
    title: '',
    text: '',
    url: '',
    heading: '',
  })

  /** `heading`: título do sheet (ex.: "Compartilhar interesse"); vazio → o padrão ("Compartilhar Evento"). */
  function open (data: { title: string, text?: string, url?: string, heading?: string }) {
    shareData.value = {
      title: data.title,
      text: data.text || '',
      url: data.url || window.location.href,
      heading: data.heading || '',
    }
    isOpen.value = true
  }

  function close () {
    isOpen.value = false
  }

  return {
    isOpen,
    shareData,
    open,
    close,
  }
})
