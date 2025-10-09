<template>
  <div class="add-friends-container">
    <div class="friends-list-section">
      <div class="content-wrapper">
        <h1 class="title">{{ t('addFriends.title') }}</h1>
        <p class="subtitle">{{ t('addFriends.subtitle') }}</p>

        <div class="search-wrapper">
          <svg class="search-icon" fill="currentColor" viewBox="0 0 20 20">
            <path
              clip-rule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              fill-rule="evenodd"
            />
          </svg>
          <input v-model="searchQuery" :placeholder="t('addFriends.searchPlaceholder')" type="text">
          <button class="filter-btn">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path
                d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z"
              />
            </svg>
          </button>
        </div>

        <ul class="user-list">
          <li v-for="user in filteredUsers" :key="user.id" class="user-item">
            <img :alt="user.name" class="avatar" :src="user.avatar">
            <span class="name">{{ user.name }}</span>
            <button :class="['invite-btn', user.status === 'sent' ? 'sent' : 'send']" @click="toggleInvite(user)">
              <svg class="plane-icon" fill="currentColor" viewBox="0 0 20 20">
                <path
                  d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"
                />
              </svg>
              <span>{{ user.status === 'sent' ? t('addFriends.sent') : t('addFriends.send') }}</span>
            </button>
          </li>
        </ul>

        <button class="finish-btn">{{ t('addFriends.finishButton') }}</button>
      </div>
    </div>

    <div class="info-section">
      <div class="graphics-container">
        <span class="shape dot-grid dg-1" />
        <span class="shape dot-grid dg-2" />
        <span class="shape circle c-1" />
        <span class="shape circle c-2" />
        <span class="shape circle c-3" />
        <span class="shape circle c-4" />
        <span class="shape cross cr-1" />
        <span class="shape cross cr-2" />
        <span class="shape plus p-1" />
        <span class="shape plus p-2" />
        <span class="shape triangle t-1" />
        <span class="shape triangle t-2" />
        <span class="shape triangle t-3" />
        <span class="shape star star-1" />
        <span class="shape star star-2" />
        <span class="shape star star-3" />
        <span class="shape confetti confetti-1" />
        <span class="shape confetti confetti-2" />
        <span class="shape confetti confetti-3" />
        <span class="shape confetti confetti-4" />
      </div>
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
  </div>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { useI18n } from 'vue-i18n'

  const { t } = useI18n()

  interface User {
    id: number
    name: string
    avatar: string
    status: 'pending' | 'sent'
  }

  const searchQuery = ref('')
  const users = ref<User[]>([
    { id: 1, name: 'Usuário novo', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d', status: 'pending' },
    { id: 2, name: 'Pedro Santos', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026705d', status: 'sent' },
    { id: 3, name: 'Pedro Lopes', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026706d', status: 'pending' },
    { id: 4, name: 'Paulo Farias', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026707d', status: 'sent' },
    { id: 5, name: 'Alisson Silva', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026708d', status: 'sent' },
  ])

  const filteredUsers = computed(() => {
    if (!searchQuery.value) {
      return users.value
    }
    return users.value.filter(user =>
      user.name.toLowerCase().includes(searchQuery.value.toLowerCase()),
    )
  })

  function toggleInvite (user: User) {
    user.status = user.status === 'pending' ? 'sent' : 'pending'
  }
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Baloo+Thambi+2:wght@800&family=Poppins:wght@400;500;600;700&display=swap');

.add-friends-container {
  display: flex;
  width: 100vw;
  height: 100vh;
  background-color: #fff;
  font-family: 'Poppins', sans-serif;
}

/* Seção da Esquerda (sem alterações) */
.friends-list-section {
  width: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  background-color: #fff;
}

.content-wrapper {
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
}

.title {
  font-size: 1.875rem;
  font-weight: 700;
  color: #1f2937;
}

.subtitle {
  font-size: 1rem;
  color: #6b7280;
  margin-bottom: 2rem;
}

.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 2rem;
}

.search-wrapper input {
  width: 100%;
  padding: 0.75rem 2.5rem;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  background-color: #f9fafb;
  font-size: 1rem;
  outline: none;
  transition: all 0.2s ease;
}

.search-wrapper input:focus {
  border-color: #F978A3;
  box-shadow: 0 0 0 2px rgba(249, 120, 163, 0.2);
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  width: 1.25rem;
  height: 1.25rem;
  color: #9ca3af;
}

.filter-btn {
  position: absolute;
  right: 0.75rem;
  color: #6b7280;
  background: none;
  border: none;
  cursor: pointer;
}

.filter-btn svg {
  width: 1.25rem;
  height: 1.25rem;
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

/* SEÇÃO DE INFORMAÇÕES (DIREITA) - ESTILOS CORRIGIDOS */
.info-section {
  width: 50%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  background: linear-gradient(142.35deg, rgba(252, 149, 89, 0.15) -1.66%, rgba(255, 98, 216, 0.15) 100.44%);
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
  /* Tamanho ajustado */
  height: 50px;
  /* Tamanho ajustado */
  border-radius: 50%;
  font-size: 2.5rem;
  /* Tamanho ajustado */
  margin-left: 0.5rem;
  transform: translateY(-5px);
  /* Alinhamento ajustado */
}

.info-content ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  /* Espaço entre os itens */
}

.info-content li {
  /* Ajustado para o visual do Figma */
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 1.25rem;
  /* 20px - Mais próximo do visual */
  line-height: 1.6;
  /* Espaçamento de linha normal */
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

/* ELEMENTOS GRÁFICOS DE FUNDO */
.graphics-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1
}

.shape {
  position: absolute;
  color: rgba(255, 98, 159, .5);
  opacity: .8
}

.dot-grid {
  width: 40px;
  height: 40px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 5px
}

.dot-grid::before {
  content: '';
  grid-column: 1/-1;
  grid-row: 1/-1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 5px;
  background-image: radial-gradient(circle, currentColor 3px, transparent 3px);
  background-size: 100% 100%
}

.dg-1 {
  top: 15%;
  left: 15%
}

.dg-2 {
  bottom: 15%;
  right: 15%
}

.circle {
  background-color: currentColor;
  border-radius: 50%
}

.c-1 {
  width: 15px;
  height: 15px;
  top: 50%;
  left: 80%
}

.c-2 {
  width: 20px;
  height: 20px;
  top: 20%;
  right: 35%
}

.c-3 {
  width: 12px;
  height: 12px;
  top: 80%;
  left: 30%
}

.c-4 {
  width: 25px;
  height: 25px;
  top: 10%;
  left: 40%;
  opacity: .5
}

.cross::before,
.plus::before {
  content: '+';
  font-weight: 300;
  display: inline-block
}

.cross::before {
  transform: rotate(45deg)
}

.cr-1 {
  font-size: 1.8rem;
  top: 12%;
  right: 12%
}

.cr-2 {
  font-size: 1.5rem;
  bottom: 12%;
  left: 10%
}

.p-1 {
  font-size: 2.2rem;
  top: 30%;
  left: 10%;
  opacity: .6
}

.p-2 {
  font-size: 1.6rem;
  bottom: 20%;
  right: 40%;
  transform: rotate(15deg)
}

.triangle {
  width: 0;
  height: 0;
  background-color: transparent
}

.t-1 {
  border-left: 12px solid transparent;
  border-right: 12px solid transparent;
  border-bottom: 20px solid currentColor;
  bottom: 25%;
  left: 30%;
  transform: rotate(-25deg)
}

.t-2 {
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 14px solid currentColor;
  top: 15%;
  left: 60%;
  transform: rotate(15deg)
}

.t-3 {
  border-left: 15px solid transparent;
  border-right: 15px solid transparent;
  border-bottom: 25px solid currentColor;
  bottom: 40%;
  right: 10%;
  transform: rotate(35deg);
  opacity: .4
}

.star::before {
  content: '★';
  font-weight: 400
}

.star-1 {
  font-size: 80px;
  top: 45%;
  left: 10%;
  transform: rotate(15deg);
  color: rgba(255, 201, 71, .6)
}

.star-2 {
  font-size: 45px;
  top: 10%;
  right: 30%;
  transform: rotate(-10deg);
  color: rgba(255, 98, 159, .6)
}

.star-3 {
  font-size: 30px;
  bottom: 15%;
  left: 45%;
  color: rgba(255, 201, 71, .5)
}

.confetti {
  background-color: currentColor
}

.confetti-1 {
  width: 15px;
  height: 35px;
  top: 25%;
  left: 25%;
  transform: rotate(45deg);
  color: rgba(249, 120, 163, .7)
}

.confetti-2 {
  width: 12px;
  height: 30px;
  bottom: 10%;
  right: 8%;
  transform: rotate(-35deg);
  color: rgba(255, 201, 71, .8)
}

.confetti-3 {
  width: 20px;
  height: 45px;
  top: 70%;
  right: 35%;
  transform: rotate(25deg);
  color: rgba(249, 120, 163, .5)
}

.confetti-4 {
  width: 10px;
  height: 25px;
  top: 85%;
  left: 10%;
  transform: rotate(55deg);
  color: rgba(255, 201, 71, .7)
}

@media (max-width: 960px) {
  .info-section {
    display: none;
  }

  .friends-list-section {
    width: 100%;
  }
}
</style>
