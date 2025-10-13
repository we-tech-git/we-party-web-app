<script setup lang="ts">

// Imports principais
// - vue: reatividade e computeds
// - vue-i18n: traduções (t)
// - AuthLayout: layout base com seção de marca (direita) e slot de formulário (esquerda)
// - svgIcons: set de ícones (ver src/utils/svgSet.ts)
  import { computed, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import AuthLayout from '@/components/UI/AuthLayout/AuthLayout.vue'
  import { svgIcons } from '@/utils/svgSet'

  // i18n
  const { t } = useI18n()

  // Modelo de dados do usuário listado para convite
  interface User {
    id: number
    name: string
    avatar: string
    status: 'pending' | 'sent'
  }

  // Estado reativo
  const searchQuery = ref('')

  // Fonte de dados mockada (apenas para UI)
  const users = ref<User[]>([
    { id: 1, name: 'Usuário novo', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d', status: 'pending' },
    { id: 2, name: 'Pedro Santos', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026705d', status: 'sent' },
    { id: 3, name: 'Pedro Lopes', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026706d', status: 'pending' },
    { id: 4, name: 'Paulo Farias', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026707d', status: 'sent' },
    { id: 5, name: 'Alisson Silva', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026708d', status: 'sent' },
  ])

  // Filtro de usuários por nome (case-insensitive)
  const filteredUsers = computed(() => {
    if (!searchQuery.value) return users.value
    return users.value.filter(user =>
      user.name.toLowerCase().includes(searchQuery.value.toLowerCase()),
    )
  })

  // Alterna status do convite (pending <-> sent)
  function toggleInvite (user: User) {
    user.status = user.status === 'pending' ? 'sent' : 'pending'
  }

</script>

<template>
  <AuthLayout>
    <template #form-content>
      <!-- Título e subtítulo -->
      <h1 class="title">
        {{ t('addFriends.title') }}
      </h1>
      <p class="subtitle">
        {{ t('addFriends.subtitle') }}
      </p>
      <div class="search-wrapper">
        <!-- searchIcon
             Origem: ícone de busca (ver svgSet.ts -> searchIcon)
             Uso: campo de busca desta tela
        -->
        <svg v-if="svgIcons.searchIcon" class="search-icon" fill="currentColor" :viewBox="svgIcons.searchIcon.viewBox">
          <path
            v-for="(path, index) in svgIcons.searchIcon.paths"
            :key="index"
            :clip-rule="path.clipRule"
            :d="path.d"
            :fill-rule="path.fillRule"
          />
        </svg>
        <input v-model="searchQuery" class="search-input" :placeholder="t('addFriends.searchPlaceholder')" type="text">
      </div>

      <ul class="user-list">
        <li v-for="user in filteredUsers" :key="user.id" class="user-item">
          <img :alt="user.name" class="avatar" :src="user.avatar">
          <span class="name">{{ user.name }}</span>
          <button :class="['invite-btn', user.status === 'sent' ? 'sent' : 'send']" @click="toggleInvite(user)">
            <svg v-if="svgIcons.planeIcon" class="plane-icon" fill="currentColor" :viewBox="svgIcons.planeIcon.viewBox">
              <path v-for="(path, index) in svgIcons.planeIcon.paths" :key="index" :d="path.d" />
            </svg>
            {{ user.status === 'pending' ? t('addFriends.send') : t('addFriends.sent') }}
          </button>
        </li>
      </ul>

      <button class="finish-btn">
        {{ t('addFriends.finishButton') }}
      </button>
    </template>

    <template #brand-content>
      <!-- Seção de informações (direita) -->
      <div class="info-section">
        <div class="info-content">
          <h2 class="info-title">
            {{ t('addFriends.infoTitle').replace('?', '') }}<span class="question-mark">?</span>
          </h2>
          <ul>
            <li>{{ t('addFriends.infoPoint1') }}</li>
            <li>{{ t('addFriends.infoPoint2') }}</li>
            <li>{{ t('addFriends.infoPoint3') }}</li>
          </ul>
        </div>
      </div>
    </template>
  </AuthLayout>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Baloo+Thambi+2:wght@800&family=Poppins:wght@400;500;600;700&display=swap');

.title {
  font-weight: 700;
  font-size: 2.25rem;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #6B7280;
  margin-bottom: 2rem;
}

.search-wrapper {
  position: relative;
  margin-bottom: 2rem;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1.25rem;
  height: 1.25rem;
  color: #9CA3AF;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 3rem;
  border: 1px solid #E5E7EB;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: #1F2937;
  outline: none;
  transition: border-color 0.2s;
  font-family: 'Poppins', sans-serif;
}

.search-input:focus {
  border-color: #FFB37B;
}

.user-list {
  list-style: none;
  padding: 0;
  margin: 0;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.name {
  flex-grow: 1;
  font-weight: 500;
  color: #374151;
}

.invite-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.plane-icon {
  width: 1rem;
  height: 1rem;
}

.invite-btn.send {
  background-color: #fff;
  color: #FC9559;
  border: 1px solid #FC9559;
}

.invite-btn.send:hover {
  background-color: #FC9559;
  color: #fff;
}

.invite-btn.sent {
  background-color: #F978A3;
  color: #fff;
  cursor: default;
}

.finish-btn {
  width: 100%;
  padding: 1rem;
  border-radius: 0.5rem;
  border: none;
  font-size: 1rem;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(to right, #FFC947, #F978A3);
  cursor: pointer;
  transition: all 0.3s ease;
}

.finish-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(252, 149, 89, 0.4);
}

/* SEÇÃO DE INFORMAÇÕES (DIREITA) -  */
.info-section {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  background: none;
  overflow: hidden;
}

.info-content {
  position: relative;
  z-index: 10;
  max-width: 500px;
}

.info-title {
  font-family: 'Baloo Thambi 2', cursive;
  font-weight: 800;
  font-size: 3.5rem;
  line-height: 1.2;
  color: #4F4F4F;
  margin-bottom: 2.5rem;
}

.question-mark {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  background-color: #F978A3;
  color: #fff;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  font-size: 2.5rem;
  margin-left: 0.5rem;
  transform: translateY(-5px);
}

.info-content ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.info-content li {
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 1.25rem;
  line-height: 1.6;
  color: #4F4F4F;
  display: flex;
  align-items: center;
}

.info-content li::before {
  content: '•';
  color: #F978A3;
  font-size: 2rem;
  margin-right: 1.5rem;
  line-height: 0;
}
</style>
