<script setup lang="ts">
// Imports principais
// - vue: reatividade e computeds
// - vue-i18n: traduções (t)
// - AuthLayout: layout base com seção de marca (direita) e slot de formulário (esquerda)
// - svgIcons: set de ícones (ver src/utils/svgSet.ts)
  import { computed, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { getUserRecomendations } from '@/api/users'
  import AuthLayout from '@/components/UI/AuthLayout/AuthLayout.vue'
  import { svgIcons } from '@/utils/svgSet'

  // i18n
  const { t } = useI18n()

  // Modelo de dados do usuário listado para convite
  interface User {
    id: number
    name: string
    profileImage: string
    isFollowing: boolean
    currentStatus: string
  }

  // Estado reativo
  const searchQuery = ref('')

  // Fonte de dados mockada (apenas para UI)
  const users = ref<User[]>([])
  const selectedUsers = ref<User[]>([])

  async function requestUserRecomendations () {
    const userToFollowRecomendations = await getUserRecomendations()
    selectedUsers.value = userToFollowRecomendations.data.data.users.map((user: User) => {
      if (user.isFollowing) {
        return {
          ...user,
          currentStatus: 'sent',
        }
      }

      return {
        ...user,
        currentStatus: 'pending',
      }
    })

    users.value = userToFollowRecomendations.data.data.users
  }

  // Filtro de usuários por nome (case-insensitive)
  const filteredUsers = computed(() => {
    if (!searchQuery.value) return users.value
    return users.value.filter(user =>
      user.name.toLowerCase().includes(searchQuery.value.toLowerCase()),
    )
  })

  // Alterna status do convite (pending <-> sent)
  function toggleInvite (user: User) {
    selectedUsers.value = selectedUsers.value.map(u => {
      if (u.id === user.id) {
        return {
          ...u,
          isFollowing: !u.isFollowing,
          currentStatus: u.currentStatus === 'pending' ? 'sent' : 'pending',
        }
      }
      return u
    })
    user.isFollowing = !user.isFollowing
  }

  onMounted(() => {
    requestUserRecomendations()
  })

  watch(selectedUsers, (newSelectedUsers: User[]) => {
    console.log('Selected users updated:', newSelectedUsers)
  })

  // watch(users, (newSelectedUsers: User[]) => {
  //   console.log('users ====>', newSelectedUsers)
  // })

</script>

<template>
  <AuthLayout>
    <template #form-content>
      <!-- Título e subtítulo -->
      <h1 class="auth-title">
        {{ t('addFriends.title') }}
      </h1>
      <p class="auth-subtitle">
        {{ t('addFriends.subtitle') }}
      </p>
      <div class="search-input-wrapper il-theme--pink">
        <!-- searchIcon
             Origem: ícone de busca (ver svgSet.ts -> searchIcon)
             Uso: campo de busca desta tela
        -->
        <svg
          v-if="svgIcons.searchIcon"
          class="search-input-icon"
          fill="currentColor"
          :viewBox="svgIcons.searchIcon.viewBox"
        >
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
          <img :alt="user.name" class="avatar" :src="user.profileImage">
          <span class="name">{{ user.name }}</span>
          <button
            :class="['invite-btn', user.isFollowing ? 'sent' : 'send']"
            type="button"
            @click="toggleInvite(user)"
          >
            <svg v-if="svgIcons.planeIcon" class="plane-icon" fill="currentColor" :viewBox="svgIcons.planeIcon.viewBox">
              <path v-for="(path, index) in svgIcons.planeIcon.paths" :key="index" :d="path.d" />
            </svg>
            {{ user.isFollowing ? t('addFriends.sent') : t('addFriends.send') }}
          </button>
        </li>
      </ul>

      <button class="btn-primary">
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

/* Tema rosa para InputLabel dentro desta página */
.il-theme--pink {
  --il-border-neutral: #F0F0F0;
  /* neutra */
  --il-border-filled: #FBC0D6;
  /* preenchido rosa claro */
  --il-border-focus: #F978A3;
  /* foco rosa */
  --il-label-active: #F7A4C0;
  /* label ativo rosa suave */
  --il-text: #072961;
  /* texto */
  --il-focus-halo: rgba(249, 120, 163, 0.20);
  /* halo rosa */
}

.auth-title {
  font-size: 2.25rem;
  margin-bottom: 0.5rem;
  text-align: left;
  margin-left: 0;
}

.auth-subtitle {
  margin-bottom: 2rem;
  text-align: left;
  margin-left: 0;
}

.search-input-wrapper {
  position: relative;
  margin-bottom: 2rem;
}

.search-input-icon {
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
  border-color: #F978A3;
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.5rem 1.2rem;
  min-width: 120px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.plane-icon {
  width: 0.95rem;
  height: 0.95rem;
  color: inherit;
}

.invite-btn.send {
  color: #F978A3;
  border: 1.5px solid transparent;
  background:
    linear-gradient(#fff, #fff) padding-box,
    linear-gradient(90deg, #FFC947 0%, #F978A3 100%) border-box;
}

.invite-btn.send:hover {
  box-shadow: none;
}

.invite-btn.sent {
  border: none;
  background: linear-gradient(90deg, #FFC947 0%, #F978A3 100%);
  background-size: 100% 100%;
  color: #fff;
  box-shadow: 0 10px 18px rgba(249, 120, 163, 0.25);
}

.invite-btn.sent:hover {
  box-shadow: 0 12px 22px rgba(249, 120, 163, 0.3);
}

.btn-primary {
  width: 100%;
  padding: 1rem;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.btn-primary:hover {
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

@media (max-width: 960px) {
  .info-section {
    padding: 2rem;
    text-align: center;
  }

  .info-title {
    font-size: 2.5rem;
    margin-bottom: 2rem;
  }

  .info-content ul {
    gap: 1rem;
    align-items: center;
  }

  .info-content li {
    font-size: 1.1rem;
    justify-content: center;
  }

  .info-content li::before {
    margin-right: 1rem;
  }
}

@media (max-width: 768px) {
  .title {
    font-size: 1.75rem;
    text-align: center;
  }

  .subtitle {
    text-align: center;
    margin-bottom: 1.5rem;
  }

  .search-wrapper {
    margin-bottom: 1.5rem;
  }

  .search-input {
    border-radius: 16px;
    border: 1px solid #E2E8F0;
    box-shadow: 0 10px 22px rgba(15, 23, 42, 0.08);
    padding: 0.85rem 3.1rem;
    font-size: 0.9rem;
  }

  .search-icon {
    left: 1.1rem;
    width: 1.1rem;
    height: 1.1rem;
    color: #94A3B8;
  }

  .filter-btn {
    border-radius: 12px;
    border: 1px solid #E2E8F0;
    background: #fff;
    box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
  }

  .user-list {
    gap: 0.85rem;
  }

  .user-item {
    background: #fff;
    border-radius: 18px;
    padding: 0.85rem 1rem;
    box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
  }

  .avatar {
    width: 52px;
    height: 52px;
  }

  .name {
    font-size: 0.95rem;
    font-weight: 600;
    color: #111827;
  }

  .invite-btn {
    min-width: 140px;
    padding: 0.55rem 1.25rem;
  }
}

@media (max-width: 480px) {
  .info-title {
    font-size: 2rem;
  }

  .question-mark {
    width: 40px;
    height: 40px;
    font-size: 2rem;
  }

  .info-content li {
    font-size: 1rem;
  }

  .user-item {
    padding: 0.75rem 0.9rem;
  }

  .avatar {
    width: 48px;
    height: 48px;
  }

  .invite-btn {
    min-width: 120px;
    padding: 0.5rem 1.1rem;
    font-size: 0.82rem;
  }
}
</style>
