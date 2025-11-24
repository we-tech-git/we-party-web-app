<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'

  const props = defineProps<{
    eventId: string | string[]
  }>()
  // Dados mocados com base no design do Figma
  const event = ref({
    title: 'MANDELÃO DOS CRIA',
    date: 'DIA 27/06 ÀS 2PM',
    location: 'Av. Salgado Filho, Centro, 123 - Guarulhos, SP',
    image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1400&q=80',
    description: 'Evento para aproveitar com todos os amigos, familiares e parentes, vem aproveitar no melhor espaço de festas da américa latina e aproveitar um dia insano com diversas musicas, bebidas e comidas exoticas.',
    attractions: [
      'Aniversariantes pagam meia',
      'Ano novo com surpresa',
      'Atrações surpresas para todos',
      'O brilho vai chegar para todos',
      'Festa garantida para familia',
      'DJ Vintage',
      'DJ Deolanches',
      'MC Ryan de SP',
      'MC Cris',
      'WC',
      'Borges',
      'MC Drika',
      'DJ PH black',
      'Revoada',
    ],
    contactInfo: 'Entrar em contato com o SAC através do telefone (71) 3957-7161 das 10h às 18h ou através do e-mail contato@bienaldolivrobahia.com.br',
    categories: ['MANDELÃO', 'COMUNITÁRIO', 'TABACARIA', 'FUNK'],
  })

  const infoExpanded = ref(true)
  const selectedCategories = ref<Set<string>>(new Set())

  function toggleCategory (category: string) {
    if (selectedCategories.value.has(category)) {
      selectedCategories.value.delete(category)
    } else {
      selectedCategories.value.add(category)
    }
    // Força atualização da reatividade
    selectedCategories.value = new Set(selectedCategories.value)
  }

  onMounted(() => {
    // Aqui você pode buscar os dados do evento usando o eventId
    console.log('Buscando detalhes para o evento ID:', props.eventId)
  })
</script>

<template>
  <div class="event-details">
    <img alt="Banner do Evento" class="event-banner" :src="event.image">

    <div class="event-content">
      <h1 class="event-title">{{ event.title }}</h1>
      <p class="event-info">{{ event.date }}</p>
      <p class="event-info">{{ event.location }}</p>

      <div class="info-section">
        <button class="info-header" @click="infoExpanded = !infoExpanded">
          <span>Informações do Evento</span>
          <span :class="['chevron', { 'expanded': infoExpanded }]">^</span>
        </button>
        <div v-if="infoExpanded" class="info-body">
          <p>{{ event.description }}</p>
          <ul>
            <li v-for="attraction in event.attractions" :key="attraction">{{ attraction }}</li>
          </ul>
        </div>
      </div>

      <div class="doubts-section">
        <h2>Dúvidas relacionadas ao evento:</h2>
        <p>{{ event.contactInfo }}</p>
      </div>

      <div class="location-section">
        <h2>Local e Data</h2>
        <p>{{ event.date }}</p>
        <p>{{ event.location }}</p>
        <button class="map-button">VER NO MAPA</button>
      </div>

      <div class="categories-section">
        <h2>Categorias do evento</h2>
        <div class="tags">
          <button
            v-for="category in event.categories"
            :key="category"
            :class="['category-chip', { 'selected': selectedCategories.has(category) }]"
            type="button"
            @click="toggleCategory(category)"
          >
            {{ category }}
          </button>
        </div>
      </div>

      <div class="footer-links">
        <a>Termos de uso</a>
        <a>Política e privacidade</a>
      </div>

      <button class="main-action-button">EU VOU!</button>
    </div>
  </div>
</template>

<style scoped>
.event-details {
  background-color: #FFF;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  max-width: 800px;
  margin: 2rem auto;
}

.event-banner {
  width: 100%;
  height: 300px;
  object-fit: cover;
}

.event-content {
  padding: 2rem;
}

.event-title {
  font-size: 2rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 0.5rem;
}

.event-info {
  color: #666;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.info-section,
.doubts-section,
.location-section,
.categories-section {
  margin-bottom: 2rem;
}

.info-header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #f9f9f9;
  border: 1px solid #eee;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
}

.chevron {
  transition: transform 0.3s;
  font-weight: bold;
}

.chevron.expanded {
  transform: rotate(180deg);
}

.info-body {
  padding: 1.5rem 1rem;
  border: 1px solid #eee;
  border-top: none;
  border-radius: 0 0 8px 8px;
}

.info-body ul {
  list-style: none;
  padding: 0;
  margin-top: 1rem;
  columns: 2;
  gap: 1rem;
}

.info-body li {
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

h2 {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 1rem;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 0.5rem;
}

.map-button {
  background: none;
  border: 1px solid #ddd;
  border-radius: 20px;
  padding: 0.5rem 1.5rem;
  cursor: pointer;
  margin-top: 1rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.map-button:hover {
  background-color: #f5f5f5;
  border-color: #ccc;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.category-chip {
  height: 40px;
  padding: 0 16px;
  border-radius: 10px;
  border: 1.5px solid #FF8CB5;
  color: #1F2937;
  background: #fff;
  font-weight: 700;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 0 rgba(0, 0, 0, .05);
}

.category-chip:hover {
  transform: translateY(-1px);
}

.category-chip.selected {
  background: linear-gradient(90deg, #FFC25B, #FF5FA6);
  background-size: 100% 100%;
  color: #fff;
  border: 1.5px solid transparent;
  /* Mantém o tamanho consistente */
  box-shadow: 0 10px 20px rgba(255, 95, 166, .2);
}

.footer-links {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  margin: 2rem 0;
}

.footer-links a {
  color: #666;
  text-decoration: none;
  cursor: pointer;
}

.footer-links a:hover {
  text-decoration: underline;
}

.main-action-button {
  width: 100%;
  padding: 1.2rem;
  background: linear-gradient(to right, #FFC25B, #FF5FA6);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.main-action-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}
</style>
