import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useShareStore = defineStore('share', () => {
  const isOpen = ref(false)
  const shareData = ref<{ title: string; text: string; url: string }>({
    title: '',
    text: '',
    url: ''
  })

  function open(data: { title: string; text?: string; url?: string }) {
    shareData.value = {
      title: data.title,
      text: data.text || '',
      url: data.url || window.location.href
    }
    isOpen.value = true
  }

  function close() {
    isOpen.value = false
  }

  return {
    isOpen,
    shareData,
    open,
    close
  }
})
