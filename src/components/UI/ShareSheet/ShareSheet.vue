<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import { computed, ref } from 'vue'
  import { useShareStore } from '@/stores/share'

  const store = useShareStore()
  const { isOpen, shareData } = storeToRefs(store)

  const close = () => store.close()

  const canNativeShare = computed(() => !!navigator.share)
  const copied = ref(false)

  function shareTo (platform: 'whatsapp' | 'facebook' | 'instagram' | 'copy') {
    const { url, title: _title, text } = shareData.value
    const encodedUrl = encodeURIComponent(url)
    const encodedText = encodeURIComponent(`${text}\n${url}`)

    switch (platform) {
      case 'whatsapp': {
        window.open(`https://wa.me/?text=${encodedText}`, '_blank')
        break
      }
      case 'facebook': {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank')
        break
      }
      case 'instagram': {
        // Instagram direct sharing via web is limited. We copy link and notify, then open Instagram.
        copyToClipboard()
        window.open('https://www.instagram.com/', '_blank')
        break
      }
      case 'copy': {
        copyToClipboard()
        break
      }
    }
  }

  async function copyToClipboard () {
    try {
      await navigator.clipboard.writeText(shareData.value.url)
      copied.value = true
      setTimeout(() => copied.value = false, 2000)
    } catch (error) {
      console.error('Failed to copy', error)
    }
  }

  async function nativeShare () {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareData.value.title,
          text: shareData.value.text,
          url: shareData.value.url,
        })
        close()
      } catch (error) {
        console.log('Share dismissed', error)
      }
    }
  }
</script>

<template>
  <v-dialog v-model="isOpen" max-width="360" :scrim="true" transition="dialog-bottom-transition">
    <div class="share-sheet">
      <header class="share-header">
        <h3>Compartilhar Evento</h3>
        <button aria-label="Fechar" class="close-btn" @click="close">✕</button>
      </header>

      <div class="event-preview">
        <p class="event-title">{{ shareData.title }}</p>
      </div>

      <div class="share-options">
        <button class="share-option whatsapp" @click="shareTo('whatsapp')">
          <div class="icon-circle whatsapp-bg">
            <i class="mdi mdi-whatsapp" />
          </div>
          <span>WhatsApp</span>
        </button>

        <button class="share-option instagram" @click="shareTo('instagram')">
          <div class="icon-circle instagram-bg">
            <i class="mdi mdi-instagram" />
          </div>
          <span>Instagram</span>
        </button>

        <button class="share-option facebook" @click="shareTo('facebook')">
          <div class="icon-circle facebook-bg">
            <i class="mdi mdi-facebook" />
          </div>
          <span>Facebook</span>
        </button>

        <button class="share-option copy" @click="shareTo('copy')">
          <div class="icon-circle copy-bg">
            <i :class="copied ? 'mdi mdi-check' : 'mdi mdi-link-variant'" />
          </div>
          <span>{{ copied ? 'Copiado!' : 'Copiar Link' }}</span>
        </button>
      </div>

      <button v-if="canNativeShare" class="native-share-btn" @click="nativeShare">
        Mais opções...
      </button>
    </div>
  </v-dialog>
</template>

<style scoped>
.share-sheet {
    background: #ffffff;
    border-radius: 24px;
    padding: 1.5rem;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    font-family: 'Baloo Thambi 2', sans-serif;
}

.share-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.share-header h3 {
    margin: 0;
    font-size: 1.25rem;
    color: #2d2f55;
}

.close-btn {
    background: transparent;
    border: none;
    font-size: 1.2rem;
    color: #a4aac6;
    cursor: pointer;
}

.event-preview {
    background: #f8f9fc;
    padding: 0.75rem 1rem;
    border-radius: 12px;
}

.event-title {
    margin: 0;
    color: #555b77;
    font-weight: 500;
    font-size: 0.95rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.share-options {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
}

.share-option {
    background: transparent;
    border: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    transition: transform 0.2s ease;
}

.share-option:hover {
    transform: translateY(-2px);
}

.share-option span {
    font-size: 0.75rem;
    color: #555b77;
    font-weight: 600;
}

.icon-circle {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.5rem;
}

.whatsapp-bg {
    background: linear-gradient(135deg, #25D366, #128C7E);
}

.facebook-bg {
    background: linear-gradient(135deg, #1877F2, #0E52AB);
}

.instagram-bg {
    background: linear-gradient(45deg, #405DE6, #5851DB, #833AB4, #C13584, #E1306C, #FD1D1D);
}

.copy-bg {
    background: #e0e2ed;
    color: #555b77;
}

.native-share-btn {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #e0e2ed;
    border-radius: 12px;
    background: transparent;
    color: #555b77;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
}

.native-share-btn:hover {
    background: #f8f9fc;
}
</style>
