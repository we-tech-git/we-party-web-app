<template>
  <!-- ===== TOP NAV =====
       Header único do app (REFACTOR_AUDIT_PLAN.md, Fase 1) — antes esta
       página reimplementava à mão um header "padronizado com o
       FeedTopHeader" (ver histórico do arquivo). Substituído pelo
       componente de verdade: menos CSS duplicado e um só lugar pra
       corrigir bug de header daqui pra frente. -->
  <AppHeader transparent :user="headerUser" />

  <!-- ===== HERO ===== -->
  <!-- Quase tela cheia (85%): o header é transparente e fica sobreposto à
       imagem, e a próxima seção aparece um pouco embaixo. -->
  <section
    class="hero-section relative w-full flex flex-col justify-end overflow-hidden"
    style="min-height: 85vh; min-height: max(85svh, 560px);"
  >
    <div
      class="absolute inset-0 bg-cover bg-center"
      :style="{ backgroundImage: heroBackground }"
    />
    <div
      class="absolute inset-0"
      style="background: linear-gradient(to bottom, rgba(18,8,28,.45) 0%, rgba(18,8,28,.1) 40%, rgba(18,8,28,.92) 100%)"
    />

    <!-- Back -->
    <a
      class="btn-back absolute top-28 sm:top-32 left-4 md:left-14 z-10 flex items-center gap-2 bg-white/16 backdrop-blur-sm border border-white/28 text-white font-extrabold px-4 py-2.5 rounded-2xl transition-all cursor-pointer hover:-translate-y-0.5"
      href="#"
      @click.prevent="goBack"
    >
      <svg
        class="w-4 h-4"
        fill="none"
        stroke="currentColor"
        stroke-width="2.6"
        viewBox="0 0 24 24"
      >
        <path d="M19 12H5M11 6l-6 6 6 6" />
      </svg>
      Voltar
    </a>

    <!-- Like (hero) -->
    <button
      :class="[
        'btn-like-hero absolute top-28 sm:top-32 right-4 md:right-14 z-10 flex items-center gap-2 backdrop-blur-sm border font-extrabold px-4 py-2.5 rounded-2xl transition-all cursor-pointer hover:-translate-y-0.5',
        liked
          ? 'bg-grad-main border-transparent text-white shadow-pink-glow'
          : 'bg-white/16 border-white/28 text-white'
      ]"
      @click="toggleLike"
    >
      <svg
        class="w-4 h-4"
        :fill="liked ? 'currentColor' : 'none'"
        stroke="currentColor"
        stroke-width="2.6"
        viewBox="0 0 24 24"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      {{ likeCount }}
    </button>

    <!-- Hero inner -->
    <div class="relative z-10 w-full max-w-295 mx-auto px-4 md:px-10 pb-20 md:pb-28 animate-rise">
      <div class="flex flex-wrap gap-2 mb-5">
        <span
          class="bg-grad-main text-white text-[11px] font-extrabold tracking-wide px-3.5 py-1.5 rounded-full uppercase"
        >🔥
          Em alta</span>
        <button
          v-for="tag in event.tags"
          :key="tag.id || tag.name"
          class="bg-white/16 backdrop-blur-sm border border-white/28 text-white text-[11px] font-extrabold tracking-wide px-3.5 py-1.5 rounded-full uppercase"
          :class="{ 'cursor-pointer hover:bg-white/28': !!tag.id, 'cursor-default': !tag.id }"
          data-testid="event-details-interest-tag"
          type="button"
          @click="tag.id && goToInterest(tag.id)"
        >{{ tag.name }}</button>
      </div>

      <h1
        class="font-display font-extrabold text-white leading-none tracking-tight drop-shadow-xl"
        style="font-size: clamp(40px,7vw,86px);"
      >
        {{ event.title }}
      </h1>

    </div>
  </section>

  <!-- ===== PAGE BODY ===== -->
  <div
    class="relative pt-14 pb-20"
    style="background: radial-gradient(900px 600px at 88% 30%, #FFE3CB 0%, transparent 55%), radial-gradient(900px 700px at 4% 40%, #FFD7E7 0%, transparent 50%), #FFF4F7;"
  >
    <!-- Partículas animadas (bolhas subindo), mesma vibe da tela antiga -->
    <div class="particles">
      <div
        v-for="i in 20"
        :key="i"
        class="particle"
        :style="{
          '--delay': `${Math.random() * 5}s`,
          '--duration': `${3 + Math.random() * 4}s`,
          '--x': `${Math.random() * 100}%`,
          '--size': `${4 + Math.random() * 8}px`,
        }"
      />
    </div>

    <div class="relative z-10 max-w-295 mx-auto px-4 md:px-10">

      <!-- Floating social bar — extraído pra EventSocialBar.vue na Fase 5 do
           REFACTOR_AUDIT_PLAN.md (5ª fatia da decomposição). Puramente de
           exibição — attendeeAvatars/goingCount/likeCount continuam aqui,
           compartilhados com hero/card de ação/barra inferior mobile. -->
      <EventSocialBar :attendee-avatars="attendeeAvatars" :going-count="goingCount" :like-count="likeCount" />

      <!-- Content grid -->
      <div class="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-7 items-start mt-6">

        <!-- LEFT COLUMN -->
        <div class="flex flex-col gap-5">

          <!-- Tab bar -->
          <div
            class="flex gap-2 bg-white border border-black/5 rounded-[18px] p-1.5 shadow-sm overflow-x-auto"
          >
            <button
              v-for="tab in tabs"
              :key="tab.id"
              :class="[
                'flex items-center gap-2 px-5 py-3 rounded-[13px] font-extrabold whitespace-nowrap transition-all duration-150',
                activeTab === tab.id
                  ? 'bg-grad-main text-white shadow-pink-glow'
                  : 'text-gray-500 hover:text-ink'
              ]"
              @click="activeTab = tab.id"
            >
              <span class="w-5 h-5 flex items-center" v-html="tab.icon" />
              {{ tab.label }}
              <span
                v-if="tab.badge"
                :class="[
                  'text-[11px] font-extrabold rounded-lg px-1.5 py-0.5',
                  activeTab === tab.id ? 'bg-white/28 text-white' : 'bg-pink-500 text-white'
                ]"
              >{{ tab.badge }}</span>
            </button>
          </div>

          <!-- PANEL: Informações -->
          <Transition name="fade">
            <div v-show="activeTab === 'info'" class="flex flex-col gap-5">

              <div class="card">
                <div class="flex flex-wrap items-center justify-between gap-4">
                  <div class="flex items-center gap-4">
                    <div class="date-pill">
                      <div class="date-month">{{ eventMonth }}</div>
                      <div class="date-day">{{ eventDay }}</div>
                    </div>
                    <div>
                      <b class="text-base">{{ event.dateLabel }}</b>
                      <span class="block text-gray-500 font-semibold text-sm">Início às {{
                        event.time }} · horário de Brasília</span>
                    </div>
                  </div>

                  <!-- Countdown ao lado da data -->
                  <div
                    class="flex items-center gap-2 rounded-2xl px-4 py-2.5 flex-none"
                    style="background:#FBF7FB; border:1px solid rgba(255,95,166,.14)"
                  >
                    <span
                      class="flex items-center gap-1 text-[10px] font-extrabold tracking-widest uppercase text-weparty-pink"
                    >
                      <svg
                        class="w-3.5 h-3.5 flex-none"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2.2"
                        viewBox="0 0 24 24"
                      >
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 7v5l3 2" />
                      </svg>
                      Faltam
                    </span>
                    <div class="flex gap-2">
                      <div v-for="unit in countdown" :key="unit.label" class="text-center min-w-6">
                        <b class="font-display text-[15px] leading-none block text-ink">{{ unit.value }}</b>
                        <small class="text-[8px] font-extrabold tracking-wider text-gray-400 uppercase">{{ unit.label }}</small>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
                  <component
                    :is="info.tab ? 'button' : 'div'"
                    v-for="info in eventInfoGrid"
                    :key="info.label"
                    class="flex items-start gap-3 rounded-2xl px-3 py-3 min-w-0 text-left w-full"
                    :class="info.tab ? 'cursor-pointer transition-all hover:-translate-y-0.5 hover:border-weparty-pink/30' : ''"
                    style="background:#FBF7FB; border: 1px solid rgba(34,26,61,.05)"
                    :title="info.tab ? `${info.value} — ver endereço completo` : undefined"
                    :type="info.tab ? 'button' : undefined"
                    @click="info.tab ? (activeTab = info.tab) : null"
                  >
                    <span
                      class="w-9 h-9 rounded-xl bg-white border border-black/5 grid place-items-center text-lg flex-none"
                    >{{
                      info.emoji }}</span>
                    <div class="min-w-0 flex-1">
                      <small class="block text-gray-400 font-semibold text-xs leading-tight">{{ info.label
                      }}</small>
                      <b class="text-sm leading-tight line-clamp-2 wrap-break-word">{{ info.value }}</b>
                      <span v-if="info.tab" class="mt-0.5 inline-flex items-center gap-0.5 text-[11px] font-bold text-weparty-pink">
                        Ver endereço
                        <svg
                          class="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2.5"
                          viewBox="0 0 24 24"
                        ><path d="m9 18 6-6-6-6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                      </span>
                    </div>
                  </component>
                </div>
              </div>

              <div class="card">
                <div class="card-header">
                  <span class="card-icon bg-pink-50 text-weparty-pink">
                    <svg
                      class="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.2"
                      viewBox="0 0 24 24"
                    >
                      <rect
                        height="18"
                        rx="2"
                        width="16"
                        x="4"
                        y="3"
                      />
                      <path d="M8 8h8M8 12h8M8 16h5" />
                    </svg>
                  </span>
                  <h3>Sobre o evento</h3>
                </div>
                <p
                  ref="aboutEl"
                  :class="[
                    'text-gray-500 font-medium leading-relaxed whitespace-pre-line',
                    descriptionExpanded ? '' : 'about-clamp',
                  ]"
                >{{ event.description }}</p>
                <button
                  v-if="descriptionOverflowing || descriptionExpanded"
                  class="inline-flex items-center gap-1.5 mt-3 text-weparty-pink font-extrabold"
                  type="button"
                  @click="descriptionExpanded = !descriptionExpanded"
                >
                  {{ descriptionExpanded ? 'Ler menos' : 'Ler mais' }}
                  <svg
                    class="w-4 h-4 transition-transform"
                    :class="{ 'rotate-180': descriptionExpanded }"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.6"
                    viewBox="0 0 24 24"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
              </div>

              <div class="card">
                <div class="flex flex-wrap items-center gap-4">
                  <div
                    class="w-14 h-14 rounded-2xl bg-linear-to-br from-yellow-300 to-orange-400 grid place-items-center text-white font-display font-extrabold text-2xl flex-none"
                    :style="event.organizerId ? { cursor: 'pointer' } : {}"
                    @click="goToProfile(event.organizerId)"
                  >
                    T</div>
                  <div class="min-w-0" :style="event.organizerId ? { cursor: 'pointer' } : {}" @click="goToProfile(event.organizerId)">
                    <span class="eyebrow">Organizado por</span>
                    <b class="block font-display text-[17px] truncate">{{ event.organizer }}</b>
                  </div>
                  <button
                    :class="[
                      'ml-auto flex-none font-extrabold px-5 py-3 rounded-2xl transition-all hover:-translate-y-0.5 disabled:opacity-60',
                      following ? 'btn-soft' : 'bg-grad-main text-white shadow-pink-glow'
                    ]"
                    :disabled="followLoading || !event.organizerId"
                    @click="toggleFollow"
                  >{{ following ? 'Seguindo ✓' : 'Seguir' }}</button>
                </div>
              </div>

              <!-- FAQs — extraído pra EventFaqAccordion.vue na Fase 5 do
                   REFACTOR_AUDIT_PLAN.md (1ª fatia da decomposição de
                   NewEventDetails.vue). Autocontido: recebe o array cru de
                   FAQs e cuida da própria normalização/estado. -->
              <EventFaqAccordion :faqs="event.faq" />
            </div>
          </Transition>

          <!-- PANEL: Atrações — extraído pra EventLineupPanel.vue na Fase 5
               do REFACTOR_AUDIT_PLAN.md (4ª fatia da decomposição). -->
          <Transition name="fade">
            <EventLineupPanel v-show="activeTab === 'lineup'" :lineup="event.lineup" />
          </Transition>

          <!-- PANEL: Local — extraído pra EventLocationPanel.vue na Fase 5
               do REFACTOR_AUDIT_PLAN.md (3ª fatia da decomposição). -->
          <Transition name="fade">
            <EventLocationPanel
              v-show="activeTab === 'local'"
              :city="event.city"
              :location="event.location"
              :venue="event.venue"
            />
          </Transition>

          <!-- PANEL: Comentários -->
          <Transition name="fade">
            <div v-show="activeTab === 'cmt'" class="card card--comments">
              <InlineComments
                :key="currentId"
                :subject-id="currentId"
                :visible="activeTab === 'cmt'"
                @update:count="commentsCount = $event"
              />
            </div>
          </Transition>
        </div>

        <!-- RIGHT RAIL -->
        <aside class="flex flex-col gap-5 lg:sticky lg:top-24">

          <!-- Action card -->
          <div class="bg-white border border-black/5 rounded-3xl overflow-hidden shadow-card">
            <div class="h-1.5 bg-grad-main" />
            <div class="p-6">
              <!-- Termômetro do evento: "calor"/lotação derivado de confirmações + curtidas -->
              <div v-if="false" class="mb-5">
                <div class="flex items-center justify-between gap-2 mb-2.5">
                  <span class="font-extrabold text-[15px]">Termômetro</span>
                  <span class="heat-badge flex-none">{{ eventHeat.emoji }} {{ eventHeat.label }}</span>
                </div>
                <div class="heat-track">
                  <div class="heat-fill" :style="{ width: eventHeat.pct + '%' }" />
                </div>
                <span class="block text-gray-400 font-semibold text-xs mt-2">{{ eventHeat.going }} confirmados · {{ eventHeat.likes }} curtidas</span>
              </div>

              <button
                :class="[
                  'w-full flex items-center justify-center gap-2.5 font-display font-extrabold text-[19px] py-4 rounded-[17px] text-white transition-all hover:-translate-y-0.5',
                  rsvped ? 'bg-grad-green shadow-green-glow' : 'bg-grad-main shadow-pink-glow'
                ]"
                @click="toggleRsvp"
              >
                <svg v-if="!rsvped" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 3l14 9-14 9z" />
                </svg>
                <svg
                  v-else
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.6"
                  viewBox="0 0 24 24"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                {{ rsvped ? 'Tô confirmado!' : 'Eu vou!' }}
              </button>

              <div v-if="event.sourceUrl" class="mt-2.5">
                <button
                  class="btn-ticket relative z-10 w-full block"
                  type="button"
                  @click="openSourceUrl"
                >
                  <span class="btn-ticket-label">TICKET</span>
                </button>
                <p class="text-center text-gray-400 font-semibold text-xs mt-1.5">
                  Saiba como comprar o ingresso
                </p>
              </div>

              <div class="relative z-10 flex gap-2.5 mt-2.5">
                <button
                  :class="[
                    'flex-1 flex items-center justify-center gap-2 rounded-2xl py-3 font-extrabold transition-all hover:-translate-y-0.5',
                    saved ? 'bg-grad-main text-white shadow-pink-glow' : 'btn-soft'
                  ]"
                  @click="toggleSave"
                >
                  <svg
                    class="w-4 h-4"
                    :fill="saved ? 'currentColor' : 'none'"
                    stroke="currentColor"
                    stroke-width="2.2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M6 3h12v18l-6-4-6 4z" />
                  </svg>
                  {{ saved ? 'Favoritado' : 'Favoritar' }}
                </button>
                <button
                  class="btn-soft flex-1 flex items-center justify-center gap-2 rounded-2xl py-3 font-extrabold transition-all hover:-translate-y-0.5"
                  @click="handleShare"
                >
                  <svg
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.2"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
                  </svg>
                  Enviar
                </button>
              </div>

              <button
                class="w-full text-center text-gray-400 font-semibold text-xs mt-3 hover:text-gray-600 transition-colors"
                data-testid="event-details-report"
                type="button"
                @click="handleReportEvent"
              >
                Denunciar evento
              </button>

              <div v-if="false" class="flex items-center gap-3 mt-5 pt-4 border-t border-black/5">
                <div class="flex items-center">
                  <div
                    v-for="(av, i) in attendeeAvatars.slice(0, 3)"
                    :key="i"
                    class="w-8 h-8 rounded-full grid place-items-center text-white font-extrabold text-xs overflow-hidden"
                    :style="{ background: av.color, border: '2px solid white', marginLeft: i > 0 ? '-8px' : '0' }"
                  >
                    <img
                      v-if="av.image"
                      alt=""
                      class="w-full h-full object-cover"
                      loading="lazy"
                      :src="av.image"
                    >
                    <template v-else>{{ av.initial }}</template>
                  </div>
                </div>
                <div v-if="leadGoingName" class="text-sm font-bold">{{ leadGoingName }} e <b class="text-weparty-pink">{{ Math.max(goingCount - 1, 0)
                }}</b> outros vão</div>
                <div v-else class="text-sm font-bold"><b class="text-weparty-pink">{{ goingCount }}</b> pessoas vão</div>
              </div>
            </div>
          </div>

          <!-- Trending card — extraído pra EventTrendingCard.vue na Fase 5
               do REFACTOR_AUDIT_PLAN.md (2ª fatia da decomposição). Busca
               continua aqui (usa resolveAsset/eventsStore, compartilhados
               com outras partes do arquivo). -->
          <EventTrendingCard :loading="trendLoading" :trending="trending" />
        </aside>
      </div>
    </div>
  </div>

  <!-- ===== MOBILE BOTTOM BAR ===== -->
  <div
    class="md:hidden fixed bottom-0 inset-x-0 z-50 flex items-center gap-3 border-t border-black/5 px-4 py-3"
    style="background: rgba(255,244,247,0.92); backdrop-filter: blur(16px)"
  >
    <div>
      <b class="text-[15px]">Eu vou?</b>
      <small class="block text-gray-400 font-semibold text-xs">{{ goingCount }} pessoas vão</small>
    </div>
    <button
      :class="[
        'ml-auto flex items-center gap-2 font-display font-extrabold text-[17px] px-6 py-3.5 rounded-2xl text-white transition-all',
        rsvped ? 'bg-grad-green' : 'bg-grad-main shadow-pink-glow'
      ]"
      @click="toggleRsvp"
    >
      <svg v-if="!rsvped" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M5 3l14 9-14 9z" />
      </svg>
      <svg
        v-else
        class="w-5 h-5"
        fill="none"
        stroke="currentColor"
        stroke-width="2.6"
        viewBox="0 0 24 24"
      >
        <path d="M20 6L9 17l-5-5" />
      </svg>
      {{ rsvped ? 'Confirmado!' : 'Eu vou!' }}
    </button>
  </div>

  <WePartyLoader
    v-if="loading"
    :messages="[
      'Carregando evento...',
      'Buscando os detalhes...',
      'Quase lá...',
    ]"
  />

  <!-- ===== ESTADO DE ERRO (com retry, mesma dinâmica da tela antiga) ===== -->
  <div
    v-if="errorMessage && !loading"
    class="fixed inset-0 z-60 grid place-items-center bg-white/90 backdrop-blur-sm px-6"
  >
    <div class="text-center max-w-sm">
      <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-pink-50 text-weparty-pink grid place-items-center">
        <svg
          class="w-8 h-8"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5M12 16h.01" />
        </svg>
      </div>
      <p class="text-gray-600 font-semibold mb-5">{{ errorMessage }}</p>
      <button
        class="inline-flex items-center gap-2 bg-grad-main text-white font-extrabold px-6 py-3 rounded-2xl shadow-pink-glow transition-all hover:-translate-y-0.5"
        @click="loadEvent"
      >
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          stroke-width="2.4"
          viewBox="0 0 24 24"
        >
          <path d="M23 4v6h-6M1 20v-6h6" />
          <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
        </svg>
        Tentar novamente
      </button>
    </div>
  </div>

  <!-- ===== SNACKBAR (feedback de presença/ações) ===== -->
  <Snackbar
    v-model="snackbarVisible"
    :color="snackbarColor"
    :message="snackbarMessage"
    :timeout="1800"
  />

  <ReportDialog
    v-model="showReportDialog"
    :submitting="sendingReport"
    subtitle="Conte o que há de errado com este evento (opcional) — a equipe vai revisar."
    title="Reportar evento"
    @submit="submitReportEvent"
  />
</template>

<script setup lang="ts">
  import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import { unwrapItem, unwrapList } from '@/api'
  import { getEventComments } from '@/api/comments'
  import { getEventById, getMyAttendance, getTrendingEvents } from '@/api/event'
  import { checkIsFollowing, followUserById, unfollowUserById } from '@/api/follows'
  import { createReport } from '@/api/reports'
  import EventFaqAccordion from '@/components/modules/Feed/EventFaqAccordion.vue'
  import EventLineupPanel from '@/components/modules/Feed/EventLineupPanel.vue'
  import EventLocationPanel from '@/components/modules/Feed/EventLocationPanel.vue'
  import EventSocialBar from '@/components/modules/Feed/EventSocialBar.vue'
  import EventTrendingCard from '@/components/modules/Feed/EventTrendingCard.vue'
  import InlineComments from '@/components/modules/Feed/InlineComments.vue'
  import AppHeader from '@/components/UI/AppHeader/AppHeader.vue'
  import ReportDialog from '@/components/UI/ReportDialog/ReportDialog.vue'
  import Snackbar from '@/components/UI/Snackbar/Snackbar.vue'
  import WePartyLoader from '@/components/UI/WePartyLoader/WePartyLoader.vue'
  import { useAuth } from '@/composables/useAuth'
  import { useGeolocation } from '@/composables/useGeolocation'
  import { useInterestNavigation } from '@/composables/useInterestNavigation'
  import { useUserNavigation } from '@/composables/useUserNavigation'
  import { useEventsStore } from '@/stores/events'
  import { useShareStore } from '@/stores/share'

  // Mesmo contrato do EventDetails.vue: recebe o id da rota e, opcionalmente,
  // o payload já carregado por um componente pai (evita refetch).
  const props = defineProps<{
    eventId: string | string[]
    eventData?: any | null
  }>()

  const router = useRouter()
  const eventsStore = useEventsStore()
  const shareStore = useShareStore()
  const { userDisplayName, loggedUser } = useAuth()
  const { goToProfile } = useUserNavigation()
  const { goToInterest } = useInterestNavigation()

  const currentId = computed(() =>
    (Array.isArray(props.eventId) ? props.eventId[0] : props.eventId) || '',
  )

  // Usuário logado (substitui o mock "Igor")
  const userName = computed(() => userDisplayName.value)
  const userAvatar = computed(() => loggedUser.value?.profileImage || '')
  // Shape esperado pelo AppHeader único (Fase 1 do REFACTOR_AUDIT_PLAN.md)
  // — login/logout do menu do usuário agora são resolvidos dentro do
  // próprio AppHeader, não mais copiados aqui.
  const headerUser = computed(() => ({ name: userName.value, avatar: userAvatar.value }))

  // ── Snackbar ─────────────────────────────────────────────────
  const SNACKBAR_COLORS = { success: '#22c55e', error: '#ef4444' } as const
  const snackbarVisible = ref(false)
  const snackbarMessage = ref('')
  const snackbarColor = ref<string>(SNACKBAR_COLORS.success)
  function showSnackbar (message: string, color: string = SNACKBAR_COLORS.success) {
    snackbarMessage.value = message
    snackbarColor.value = color
    snackbarVisible.value = false
    requestAnimationFrame(() => {
      snackbarVisible.value = true
    })
  }

  // ── Estado de carregamento ───────────────────────────────────
  const loading = ref(false)
  const errorMessage = ref('')

  // ── Modelo de exibição do evento ─────────────────────────────
  interface LineupItem { name: string, role: string, emoji: string }
  interface FaqItem {
    icon: string
    question: string
    answer: string
    gradient: string
  }
  interface InterestTag {
    id?: string
    name: string
  }
  interface EventVM {
    id: string | number
    title: string
    coverImage: string
    dateLabel: string
    dateShort: string
    time: string
    venue: string
    city: string
    location: string
    tags: InterestTag[]
    organizer: string
    organizerId: string | number
    description: string
    lineup: LineupItem[]
    faq: FaqItem[]
    sourceUrl?: string
    lat: number | null
    lng: number | null
  }

  const rawDate = ref<Date | null>(null)
  const event = ref<EventVM>({
    id: '',
    title: 'Carregando evento...',
    coverImage: '',
    dateLabel: '',
    dateShort: '',
    time: '',
    venue: '',
    city: '',
    location: '',
    tags: [],
    organizer: '',
    organizerId: '',
    description: '',
    lineup: [],
    faq: [],
    sourceUrl: undefined,
    lat: null,
    lng: null,
  })

  // Fundo do hero: imagem do evento ou gradiente de fallback enquanto carrega/sem capa.
  // backgroundImage aceita tanto url() quanto linear-gradient(), evitando conflito com o shorthand.
  const heroBackground = computed(() =>
    event.value.coverImage
      ? `url(${event.value.coverImage})`
      : 'linear-gradient(135deg,#1a0832 0%,#3d1260 100%)',
  )

  // Resolve assets relativos usando a base configurada no .env
  function resolveAsset (val?: string) {
    if (!val) return ''
    if (/^https?:\/\//i.test(val)) return val
    const base = (import.meta.env.VITE__BASE_URL || '').replace(/\/$/, '')
    const path = val.startsWith('/') ? val : `/${val}`
    return `${base}${path}`
  }

  function resolveEventDate (data: any): Date | null {
    const candidates = [
      data?.date, data?.startDate, data?.dateTime,
      data?.startAt, data?.eventDate, data?.start_date, data?.schedule,
    ]
    for (const val of candidates) {
      if (!val) continue
      const parsed = new Date(val)
      if (!Number.isNaN(parsed.getTime())) return parsed
    }
    return null
  }

  // Mesma lógica de seleção de imagem do EventDetails/FeedCard (prioriza 16_9),
  // com fallbacks para os demais formatos de payload (photos, banner, image...).
  function pickImage (data: any): string {
    let finalImage = ''

    // 1) Array de imagens com ratio (formato novo da API)
    if (Array.isArray(data?.images) && data.images.length > 0) {
      const landscape = data.images
        .filter((i: any) => i?.ratio === '16_9')
        .toSorted((a: any, b: any) => (b?.width || 0) - (a?.width || 0))
      finalImage = landscape[0]?.url
        || data.images.find((i: any) => i?.ratio === '3_2')?.url
        || data.images[0]?.url
        || (typeof data.images[0] === 'string' ? data.images[0] : '')
        || ''
    }

    // 2) Array/objeto "photos" (formato antigo)
    if (!finalImage && Array.isArray(data?.photos) && data.photos.length > 0) {
      const p = data.photos[0]
      finalImage = typeof p === 'string' ? p : (p?.original || p?.large || p?.url || p?.src || '')
    }

    // 3) Campos diretos de imagem
    if (!finalImage) {
      finalImage = data?.coverImage || data?.image || data?.bannerUrl || data?.banner || ''
    }

    return resolveAsset(finalImage)
  }

  const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const eventDay = computed(() => (rawDate.value ? String(rawDate.value.getDate()).padStart(2, '0') : '--'))
  const eventMonth = computed(() => (rawDate.value ? (MONTHS_PT[rawDate.value.getMonth()] ?? '--') : '--'))

  function formatLong (d: Date | null): string {
    if (!d) return 'Data a definir'
    return d.toLocaleString('pt-BR', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  }
  function formatShort (d: Date | null): string {
    if (!d) return 'Data a definir'
    return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })
  }
  function formatTime (d: Date | null): string {
    if (!d) return '--:--'
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  function mapEvent (data: any): EventVM {
    const d = resolveEventDate(data)
    rawDate.value = d

    const categories: string[] = data?.categories
      || data?.tags
      || (data?.eventInterests || []).map((i: any) => i?.interest?.name).filter(Boolean)
      || []
    const location: string = data?.location || data?.address || data?.place || 'Local a definir'
    const venue: string = data?.venueName || data?.venue || location
    const city: string = data?.city
      || (location.includes(',') ? (location.split(',').pop() || '').trim() : '')

    const attractionsRaw = data?.attractions || data?.lineup || []
    const lineup: LineupItem[] = (Array.isArray(attractionsRaw) ? attractionsRaw : []).map((a: any) => ({
      name: typeof a === 'string' ? a : (a?.name || 'Atração'),
      role: typeof a === 'string' ? 'Atração' : (a?.role || 'Atração'),
      emoji: '🎵',
    }))

    const coords = resolveCoords(data)

    const rawInterests = data?.eventInterests || data?.interests || []
    const interestTagsFromRefs: InterestTag[] = (Array.isArray(rawInterests) ? rawInterests : [])
      .map((i: any) => {
        const source = typeof i === 'string' ? null : (i?.interest ?? i)
        if (!source && typeof i === 'string') return { name: i }
        const name = source?.name
        if (!name) return null
        const id = source?.id ?? source?.interestId
        return { name: String(name), id: id ? String(id) : undefined }
      })
      .filter(Boolean) as InterestTag[]

    const tags: InterestTag[] = interestTagsFromRefs.length > 0
      ? interestTagsFromRefs
      : (Array.isArray(categories) ? categories : []).map((name: string) => ({ name: String(name) }))

    return {
      id: data?.id ?? '',
      title: data?.name || data?.title || 'Evento sem título',
      coverImage: pickImage(data),
      dateLabel: formatLong(d),
      dateShort: formatShort(d),
      time: formatTime(d),
      venue,
      city,
      location,
      tags,
      organizer: data?.organizer?.name || data?.hostName || data?.creator?.name || 'Organizador',
      organizerId: data?.organizer?.id || data?.creator?.id || data?.hostId || data?.userId || data?.ownerId || '',
      description: data?.description || 'Sem descrição disponível.',
      lineup,
      faq: Array.isArray(data?.faq) ? data.faq : (Array.isArray(data?.faqs) ? data.faqs : []),
      sourceUrl: data?.sourceUrl || data?.source_url || data?.externalUrl || data?.external_url || undefined,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
    }
  }

  // Extrai coordenadas do local a partir dos vários formatos possíveis do payload
  function resolveCoords (data: any): { lat: number, lng: number } | null {
    const latRaw = data?.latitude ?? data?.lat ?? data?.location?.latitude ?? data?.location?.lat
      ?? data?.venue?.latitude ?? data?.coordinates?.lat ?? data?.coordinates?.latitude ?? data?.geo?.lat
    const lngRaw = data?.longitude ?? data?.lng ?? data?.lon ?? data?.location?.longitude ?? data?.location?.lng
      ?? data?.venue?.longitude ?? data?.coordinates?.lng ?? data?.coordinates?.longitude ?? data?.geo?.lng
    const lat = Number(latRaw)
    const lng = Number(lngRaw)
    if (Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0)) {
      return { lat, lng }
    }
    return null
  }

  // FAQs: migraram pra EventFaqAccordion.vue (Fase 5, parte 1) — normalização
  // e estado de abrir/fechar ficaram autocontidos lá.

  // Avatares da barra "pessoas vão" — conectados a dados reais.
  // Prioriza a lista de presenças vinda no payload do evento; quando indisponível,
  // recai sobre os autores dos comentários (usuários reais já carregados na página).
  interface AvatarVM { initial: string, color: string, image: string, name: string, rawUser?: any }
  const payloadAvatars = ref<AvatarVM[]>([])
  const payloadAttendeeUsers = ref<any[]>([])

  function isGoingAttendance (entry: any): boolean {
    const status = String(entry?.status || entry?.attendanceStatus || entry?.type || '').toUpperCase()
    return !status || status === 'GOING' || status === 'CONFIRMED'
  }

  function extractAttendees (data: any): any[] {
    const sources = [
      data?.attendances, data?.attendees, data?.confirmedUsers,
      data?.confirmedAttendees, data?.confirmed_attendees,
      data?.attendanceUsers, data?.attendance_users, data?.eventAttendances,
      data?.event_attendances, data?.guests, data?.participants,
      data?.goingUsers, data?.going_users, data?.rsvps, data?.users,
    ]
    for (const s of sources) {
      if (Array.isArray(s) && s.length > 0) return s.filter((a: any) => isGoingAttendance(a))
    }
    return []
  }

  function buildAvatar (user: any): AvatarVM {
    const name = user?.name || user?.username || user?.displayName || 'Usuário'
    return {
      initial: name.charAt(0).toUpperCase(),
      color: colorForName(name),
      image: resolveAsset(user?.profileImage || user?.avatar || user?.photo || ''),
      name,
      rawUser: user,
    }
  }

  function buildAttendeeAvatars (data: any) {
    const raw = extractAttendees(data)
    payloadAttendeeUsers.value = raw
      .map((a: any) => a?.user || a)
      .filter(Boolean)
    payloadAvatars.value = payloadAttendeeUsers.value
      .slice(0, 5)
      .map((u: any) => buildAvatar(u))
  }

  // Avatares exibidos: presenças reais ou, na ausência, autores de comentários.
  const attendeeAvatars = computed<AvatarVM[]>(() => {
    const avatars = [...payloadAvatars.value]
    if (rsvped.value && !viewerIsInPayload.value) {
      avatars.unshift(buildAvatar({
        id: (loggedUser.value as any)?.id,
        userId: (loggedUser.value as any)?.userId,
        email: loggedUser.value?.email,
        username: (loggedUser.value as any)?.username,
        name: userName.value,
        profileImage: userAvatar.value,
      }))
    }
    return avatars.slice(0, 5)
  })

  // Nome exibido em "X e N outros vão": só usa o nome do usuário logado quando
  // ele de fato confirmou presença; caso contrário, usa um participante real.
  const leadGoingName = computed(() => {
    if (rsvped.value) return userName.value
    return attendeeAvatars.value[0]?.name || ''
  })

  // ── Estado social (via store de eventos, com optimistic update) ──
  const liked = computed(() => eventsStore.isLiked(event.value.id))
  const saved = computed(() => eventsStore.isSaved(event.value.id))
  const rsvped = computed(() => eventsStore.isConfirmed(event.value.id))

  function toggleLike () {
    if (!event.value.id) return
    eventsStore.toggleLike(event.value.id)
  }
  // ── Seguir organizador (mesmo endpoint da página de perfil) ──
  const following = ref(false)
  const followLoading = ref(false)

  // "Sobre o evento": a descrição vem recortada por CSS (about-clamp). Só
  // exibimos "Ler mais" quando o texto realmente transborda o trecho visível.
  const aboutEl = ref<HTMLElement | null>(null)
  const descriptionExpanded = ref(false)
  const descriptionOverflowing = ref(false)

  function measureDescription () {
    const el = aboutEl.value
    if (!el) {
      descriptionOverflowing.value = false
      return
    }
    descriptionOverflowing.value = el.scrollHeight > el.clientHeight + 1
  }

  // Recalcula sempre que a descrição muda (carregamento do evento) ou a janela
  // é redimensionada, mantendo o botão coerente com o conteúdo visível.
  watch(
    () => event.value.description,
    () => {
      descriptionExpanded.value = false
      nextTick(measureDescription)
    },
  )

  async function syncFollow () {
    following.value = false
    if (!event.value.organizerId) return
    try {
      const res: any = await checkIsFollowing(event.value.organizerId)
      const data = res?.data ?? res
      following.value = Boolean(
        data?.isFollowing ?? data?.following ?? data?.data?.isFollowing ?? data,
      )
    } catch {
      following.value = false
    }
  }

  async function toggleFollow () {
    if (!event.value.organizerId || followLoading.value) return
    followLoading.value = true
    const wasFollowing = following.value
    following.value = !wasFollowing // optimistic
    try {
      await (wasFollowing
        ? unfollowUserById(event.value.organizerId)
        : followUserById(event.value.organizerId))
    } catch {
      following.value = wasFollowing // revert
      showSnackbar('Não foi possível atualizar. Tente novamente.', SNACKBAR_COLORS.error)
    } finally {
      followLoading.value = false
    }
  }

  const baseLikes = ref(0)
  const baseGoing = ref(0)
  // Contagem canônica compartilhada com o Feed via store — evita somar
  // "+1 se curtido" sobre um valor que a API pode já incluir a própria curtida.
  const likeCount = computed(() => eventsStore.getLikeCount(event.value.id, baseLikes.value))
  const viewerIsInPayload = computed(() => {
    const currentUser = loggedUser.value as any
    const currentKeys = [
      currentUser?.id,
      currentUser?.userId,
      currentUser?.email,
      currentUser?.username,
    ].filter(Boolean).map(String)

    if (currentKeys.length === 0) return false

    return payloadAttendeeUsers.value.some(source => {
      const sourceKeys = [
        source?.id,
        source?.userId,
        source?.email,
        source?.username,
      ].filter(Boolean).map(String)

      return sourceKeys.some(key => currentKeys.includes(key))
    })
  })
  const goingCount = computed(() => baseGoing.value + (rsvped.value && !viewerIsInPayload.value ? 1 : 0))

  // ── Localização do usuário (mesmo composable do Feed) ────────
  const { getCoords } = useGeolocation()
  const userCoords = ref<{ lat: number, lng: number } | null>(null)

  // Distância em km entre dois pontos (fórmula de Haversine)
  function haversineKm (a: { lat: number, lng: number }, b: { lat: number, lng: number }): number {
    const R = 6371
    const dLat = (b.lat - a.lat) * Math.PI / 180
    const dLng = (b.lng - a.lng) * Math.PI / 180
    const lat1 = a.lat * Math.PI / 180
    const lat2 = b.lat * Math.PI / 180
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
    return 2 * R * Math.asin(Math.sqrt(h))
  }

  // "Distância de você": só calcula quando há coordenadas do evento e do usuário
  const distanceLabel = computed(() => {
    const e = event.value
    if (!userCoords.value || e.lat == null || e.lng == null) return '—'
    const km = haversineKm(userCoords.value, { lat: e.lat, lng: e.lng })
    if (km < 1) return `${Math.round(km * 1000)} m`
    if (km < 10) return `${km.toFixed(1)} km`
    return `${Math.round(km)} km`
  })

  // Rótulos qualitativos do termômetro — atribuídos pela % calculada
  const HEAT_LABELS = [
    { minPct: 80, label: 'Bombando', emoji: '🔥' },
    { minPct: 55, label: 'Enchendo rápido', emoji: '🔥' },
    { minPct: 30, label: 'Esquentando', emoji: '✨' },
    { minPct: 8, label: 'Começando a rolar', emoji: '🌱' },
    { minPct: 0, label: 'Seja o primeiro', emoji: '🎉' },
  ]

  // Termômetro do evento: cresce 5% a cada 10 pontos de engajamento (confirmados + curtidas).
  // Começa em 8% mesmo zerado (nunca mostra barra vazia). Máximo: 100%.
  const eventHeat = computed(() => {
    const going = goingCount.value
    const likes = likeCount.value
    const score = going + likes
    const pct = score === 0 ? 8 : Math.min(100, 8 + Math.floor(score / 10) * 5)
    const levelLabel = HEAT_LABELS.find(l => pct >= l.minPct) ?? HEAT_LABELS.at(-1)!
    return { pct, label: levelLabel.label, emoji: levelLabel.emoji, going, likes }
  })

  // Local exibido no card (antes ficava na hero): "Local · Cidade"
  const venueLabel = computed(() => {
    const parts = [event.value.venue, event.value.city].filter(Boolean)
    return parts.join(' · ') || 'Local a definir'
  })

  // Grade de informações — gênero real (categoria), localização e distância calculadas.
  // `tab`: quando presente, o card vira atalho para a aba correspondente (ex.: endereço
  // completo + mapa na aba "Local"), já que o texto aqui é resumido para 2 linhas.
  interface InfoGridItem {
    emoji: string
    label: string
    value: string
    tab?: string
  }
  const eventInfoGrid = computed<InfoGridItem[]>(() => [
    { emoji: '🎟️', label: 'Classificação', value: 'Livre' },
    { emoji: '🗺️', label: 'Localização', value: venueLabel.value, tab: 'local' },
    { emoji: '🎼', label: 'Gênero', value: event.value.tags[0]?.name || 'Diversos' },
    { emoji: '🧭', label: 'Distância de você', value: distanceLabel.value },
  ])

  function toggleSave () {
    if (!event.value.id) return
    const wasSaved = saved.value
    // toggleSave já persiste no servidor (POST /events/:id/favorite),
    // então o evento passa a aparecer em "Eventos favoritos".
    eventsStore.toggleSave({
      id: event.value.id,
      banner: event.value.coverImage,
      creator: { name: event.value.organizer },
      hostAvatar: '',
      schedule: event.value.dateLabel,
      location: event.value.venue,
      title: event.value.title,
      description: event.value.description,
      confirmed: baseGoing.value,
      interested: 0,
      likes: baseLikes.value,
    })
    showSnackbar(
      wasSaved ? 'Removido dos favoritos.' : 'Evento adicionado aos favoritos!',
      SNACKBAR_COLORS.success,
    )
  }

  // ── Link externo "Comprar ingressos" (mesma dinâmica da tela antiga) ──
  // Abre o site oficial do evento em nova aba; só é exibido quando há sourceUrl.
  function openSourceUrl () {
    if (event.value.sourceUrl) {
      window.open(event.value.sourceUrl, '_blank', 'noopener,noreferrer')
    }
  }

  // Mapa: migrou pra EventLocationPanel.vue (Fase 5, parte 3) — cálculo da
  // URL do embed e "Como chegar" ficaram autocontidos lá.

  const confirming = ref(false)
  async function toggleRsvp () {
    if (!event.value.id || confirming.value) return
    confirming.value = true
    try {
      await eventsStore.toggleConfirm(event.value.id)
    } catch {
      showSnackbar('Não foi possível atualizar sua presença. Tente novamente.', SNACKBAR_COLORS.error)
    } finally {
      confirming.value = false
    }
  }

  // ── Compartilhamento (abre o ShareSheet global) ──────────────
  function handleShare () {
    shareStore.open({
      title: event.value.title,
      text: 'Veja esse evento que encontrei que você também pode gostar',
      url: `${window.location.origin}/event/${currentId.value}`,
    })
  }

  // ── Denúncia de evento — mesmo diálogo/API do FeedCard.vue e da denúncia
  // de comentário em InlineComments.vue, com ReportType 'EVENT' ──────────
  const showReportDialog = ref(false)
  const sendingReport = ref(false)

  function handleReportEvent () {
    showReportDialog.value = true
  }

  async function submitReportEvent (reason: string) {
    if (sendingReport.value || !event.value.id) return
    sendingReport.value = true
    try {
      await createReport('EVENT', String(event.value.id), reason || undefined)
      showReportDialog.value = false
      showSnackbar('Denúncia enviada. Nossa equipe vai revisar.', SNACKBAR_COLORS.success)
    } catch (error: any) {
      // O backend recusa denúncia duplicada com 400 — mensagem específica
      // em vez do erro genérico, pra quem já denunciou entender por quê.
      showReportDialog.value = false
      showSnackbar(
        error?.response?.status === 400
          ? (error?.response?.data?.message || 'Você já denunciou este evento.')
          : 'Não foi possível enviar a denúncia. Tente novamente.',
        SNACKBAR_COLORS.error,
      )
    } finally {
      sendingReport.value = false
    }
  }

  // ── Navegação ────────────────────────────────────────────────
  function goBack () {
    router.back()
  }

  // ── Tabs (o badge de comentários reflete a contagem real) ─────
  const activeTab = ref('info')
  const tabs = computed(() => [
    {
      id: 'info', label: 'Informações', badge: undefined as number | undefined,
      icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
    },
    {
      id: 'lineup', label: 'Atrações', badge: undefined as number | undefined,
      icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
    },
    {
      id: 'local', label: 'Local', badge: undefined as number | undefined,
      icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M12 21s-7-5.5-7-11a7 7 0 0114 0c0 5.5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    },
    {
      id: 'cmt', label: 'Comentários', badge: commentsCount.value > 0 ? commentsCount.value : undefined,
      icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M21 15a4 4 0 01-4 4H8l-5 4V7a4 4 0 014-4h10a4 4 0 014 4z"/></svg>',
    },
  ])

  // ── Comentários (endpoint real /events/:id/comments) ─────────
  // A dinâmica completa (threads, curtidas, respostas) fica a cargo do
  // InlineComments; aqui só mantemos uma lista achatada leve, usada como
  // fallback de avatares em "attendeeAvatars" e para o contador do badge.
  interface CommentVM {
    name: string
    initial: string
    color: string
    image: string
  }
  const COMMENT_COLORS = [
    'linear-gradient(135deg,#7b5cff,#c54bff)',
    'linear-gradient(135deg,#ff7a59,#ff4d8d)',
    'linear-gradient(135deg,#34c8a8,#1f9d7e)',
    'linear-gradient(135deg,#3e7bfb,#6d3bff)',
    'linear-gradient(135deg,#ff9d3d,#ff5f8d)',
  ]
  function colorForName (name: string): string {
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = (name.codePointAt(i) || 0) + ((hash << 5) - hash)
    }
    return COMMENT_COLORS[Math.abs(hash) % COMMENT_COLORS.length] ?? COMMENT_COLORS[0]!
  }

  const comments = ref<CommentVM[]>([])
  const commentsCount = ref(0)

  async function fetchComments () {
    if (!currentId.value) return
    try {
      const res: any = await getEventComments(currentId.value)
      // unwrapList aceita os envelopes conhecidos e retorna sempre um array
      const arr: any[] = unwrapList(res, 'comments', 'content')
      comments.value = arr.map((c: any) => ({
        name: c.user?.name || 'Usuário',
        initial: (c.user?.name || 'U').charAt(0).toUpperCase(),
        color: colorForName(c.user?.name || ''),
        image: resolveAsset(c.user?.profileImage || c.user?.avatar || ''),
      }))
    } catch (error) {
      console.error('Erro ao buscar comentários:', error)
      comments.value = []
    }
  }

  // ── Trending (endpoint real /events/top) ─────────────────────
  const TREND_COLORS = [
    'linear-gradient(135deg,#ff9d3d,#ff5f8d)',
    'linear-gradient(135deg,#3e7bfb,#6d3bff)',
    'linear-gradient(135deg,#10a87d,#0c9c8c)',
    'linear-gradient(135deg,#7b5cff,#c54bff)',
  ]
  interface TrendVM {
    id: string | number
    initial: string
    color: string
    image: string
    venue: string
    title: string
    likes: number
  }
  const trending = ref<TrendVM[]>([])
  const TREND_FETCH_SIZE = 20
  const trendLoading = ref(false)

  function mapTrend (e: any, i: number): TrendVM {
    const likes = e.likesCount || e.likes || e._count?.likes || 0
    eventsStore.registerLikeCount(e.id, likes)
    return {
      id: e.id,
      initial: (e.name || e.title || 'E').charAt(0).toUpperCase(),
      color: TREND_COLORS[i % TREND_COLORS.length]!,
      image: resolveAsset(
        e.organizer?.avatar || e.hostAvatar || e.creator?.profileImage || e.host?.profileImage || '',
      ),
      venue: e.location || e.city || 'Em alta',
      title: e.name || e.title || 'Evento',
      likes: eventsStore.getLikeCount(e.id, likes),
    }
  }

  // Busca uma leva única de tendências; a exibição é controlada localmente
  // por "Mostrar mais"/"Mostrar menos" (sem novas requisições).
  async function fetchTrending () {
    if (trendLoading.value) return
    trendLoading.value = true
    try {
      const res: any = await getTrendingEvents(1, TREND_FETCH_SIZE)
      // unwrapList aceita os envelopes conhecidos e retorna sempre um array
      const arr: any[] = unwrapList(res, 'events')
      trending.value = arr
        .filter((e: any) => String(e.id) !== String(currentId.value))
        .map((e: any, i: number) => mapTrend(e, i))
    } catch (error) {
      console.warn('Não foi possível carregar tendências:', error)
    } finally {
      trendLoading.value = false
    }
  }

  // "Mostrar mais/menos"/goToTrend: migraram pra EventTrendingCard.vue
  // (Fase 5, parte 2) — exibição e navegação ficaram autocontidas lá.

  // ── Carregamento do evento ───────────────────────────────────
  function toCount (value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return Math.max(0, value)
    }
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value)
      if (Number.isFinite(parsed)) return Math.max(0, parsed)
    }
    return null
  }

  function isConfirmedAttendancePayload (data: any): boolean {
    const status = String(data?.status || data?.attendanceStatus || data?.type || '').toUpperCase()
    if (status) return status === 'GOING' || status === 'CONFIRMED'
    return data?.isGoing === true || data?.isConfirmed === true || data?.confirmed === true
  }

  function applyCounters (data: any) {
    baseLikes.value = toCount(data?.likesCount)
      ?? toCount(data?._count?.likes)
      ?? toCount(data?.likes)
      ?? (Array.isArray(data?.likes) ? data.likes.length : 0)
    const id = data?.id ?? event.value.id
    // Registra contagem e estado de curtida juntos: entrando direto nesta URL
    // (F5 ou link compartilhado) o `likedEvents` do store está vazio, e sem o
    // estado vindo daqui o coração aparecia apagado num evento já curtido —
    // o clique seguinte virava um toggle que **descurtia**.
    if (id) eventsStore.registerEventLikeState({ ...data, id })
    // Se não temos contagem direta, usa o comprimento do array de attendees
    const attendeeArray = extractAttendees(data)
    const directGoingCount = toCount(data?.confirmedCount)
      ?? toCount(data?.confirmed)
      ?? toCount(data?.goingCount)
      ?? toCount(data?.totalGoing)
      ?? 0
    baseGoing.value = Math.max(directGoingCount, attendeeArray.length)
  }

  async function syncAttendance () {
    if (!event.value.id) return
    try {
      const res: any = await getMyAttendance(event.value.id)
      const data = unwrapItem(res) || res
      // Somente GOING/CONFIRMED contam como presenca confirmada.
      const attending = isConfirmedAttendancePayload(data)
      eventsStore.setConfirmed(event.value.id, attending)
    } catch (error) {
      console.warn('Não foi possível sincronizar presença:', error)
    }
  }

  async function loadEvent () {
    // Se o pai já forneceu os dados (vindos do feed), pintamos a tela na hora
    // para resposta imediata — mas NÃO paramos por aqui: o payload do feed traz
    // a descrição recortada, então seguimos buscando o evento completo por ID
    // para preencher o texto inteiro do "Sobre o evento".
    const hasPreview = !!props.eventData
    if (hasPreview) {
      event.value = mapEvent(props.eventData)
      applyCounters(props.eventData)
      buildAttendeeAvatars(props.eventData)
      tick()
      syncAttendance()
      syncFollow()
    }
    if (!currentId.value) return
    if (!hasPreview) loading.value = true
    errorMessage.value = ''
    try {
      const res: any = await getEventById(currentId.value)
      const payload = res?.data?.event || res?.data || res
      event.value = mapEvent(payload)
      applyCounters(payload)
      buildAttendeeAvatars(payload)
      tick()
      await syncAttendance()
      syncFollow()
    } catch (error) {
      // Se já temos o preview do feed, mantemos a tela e não interrompemos o usuário.
      if (hasPreview) {
        console.error('Erro ao carregar detalhes completos do evento:', error)
      } else {
        console.error('Erro ao carregar evento:', error)
        errorMessage.value = 'Não foi possível carregar os detalhes do evento.'
        showSnackbar('Não foi possível carregar os detalhes do evento.', SNACKBAR_COLORS.error)
      }
    } finally {
      loading.value = false
    }
  }

  // ── Countdown (dirigido pela data real do evento) ────────────
  const countdown = ref([
    { label: 'dias', value: '--' as string | number },
    { label: 'hrs', value: '--' as string | number },
    { label: 'min', value: '--' as string | number },
    { label: 'seg', value: '--' as string | number },
  ])
  function tick () {
    if (!rawDate.value) return
    const diff = Math.max(0, rawDate.value.getTime() - Date.now())
    countdown.value = [
      { label: 'dias', value: Math.floor(diff / 86_400_000) },
      { label: 'hrs', value: String(Math.floor(diff % 86_400_000 / 3_600_000)).padStart(2, '0') },
      { label: 'min', value: String(Math.floor(diff % 3_600_000 / 60_000)).padStart(2, '0') },
      { label: 'seg', value: String(Math.floor(diff % 60_000 / 1000)).padStart(2, '0') },
    ]
  }

  let timer: ReturnType<typeof setInterval> | undefined
  onMounted(() => {
    window.addEventListener('resize', measureDescription)
    // Captura a localização (cacheada por sessão) para a "Distância de você"
    getCoords().then(c => {
      userCoords.value = c
    })
    loadEvent()
    fetchComments()
    fetchTrending()
    tick()
    timer = setInterval(tick, 1000)
    if (!eventsStore.isInitialized.liked) eventsStore.syncLikedEventsWithServer()
    if (!eventsStore.isInitialized.favorites) eventsStore.syncFavoritesWithServer()
  })
  onUnmounted(() => {
    window.removeEventListener('resize', measureDescription)
    if (timer) clearInterval(timer)
  })

  watch(() => props.eventId, () => {
    loadEvent()
    fetchComments()
  })
  watch(() => props.eventData, d => {
    // Repinta com o preview do feed para resposta imediata e dispara a busca
    // do evento completo (descrição inteira) via loadEvent.
    if (d) {
      event.value = mapEvent(d)
      applyCounters(d)
      buildAttendeeAvatars(d)
      tick()
      loadEvent()
    }
  })
</script>

<style scoped>
/* ── Gradients ───────────────────────────────────────────────
   Padronizado com a identidade We Party (mesmo gradiente da landing page). */
.bg-grad-main {
    background: linear-gradient(120deg, #ff9a4d 0%, #ff5f8f 100%);
}

.bg-grad-green {
    background: linear-gradient(120deg, #10A87D, #0c9c8c);
}

/* Botão "Comprar ingressos" — usa a arte do tiquete (public/ticket-button.png)
   como fundo; o texto fica posicionado sobre a área em branco do desenho.
   aspect-ratio trava a proporção da imagem (1536x1024) pra o texto não
   "andar" conforme a largura do card muda. */
.btn-ticket {
    position: relative;
    aspect-ratio: 1431 / 774;
    background-image: url('/ticket-button.png');
    background-position: center;
    background-repeat: no-repeat;
    background-size: 100% 100%;
    border: none;
    cursor: pointer;
    padding: 0;
    transition: transform .2s ease, filter .2s ease;
}

.btn-ticket:hover {
    filter: brightness(1.04);
    transform: translateY(-2px);
}

.btn-ticket-label {
    position: absolute;
    inset: 24% 5% 26% 29%;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    letter-spacing: .04em;
    font-family: 'Poppins', sans-serif;
    font-weight: 800;
    font-size: clamp(18px, 6vw, 26px);
    line-height: 1.15;
    color: #fff;
}

/* Botão "Voltar" do hero — muda para o gradiente da marca ao passar o mouse,
   padronizando o feedback com os demais botões do app */
.btn-back:hover {
    background: linear-gradient(120deg, #ff9a4d 0%, #ff5f8f 100%);
    border-color: transparent;
    box-shadow: 0 10px 26px -12px rgba(240, 48, 154, .85);
}

/* Botões secundários (Favoritar / Enviar) — tom rosa suave da marca,
   mais leve que o "Eu vou!" para criar hierarquia visual */
.btn-soft {
    background: #fff0f6;
    color: #ff5fa6;
    border: 1px solid #ffd9e6;
}

.btn-soft:hover {
    background: #ffe3ef;
    box-shadow: 0 8px 20px -12px rgba(255, 95, 166, 0.6);
}

.text-grad {
    background: linear-gradient(120deg, #ff9a4d, #ff5f8f);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
}

/* ── Shadows ───────────────────────────────────────────────── */
.shadow-card {
    box-shadow: 0 18px 50px -22px rgba(123, 38, 96, .35);
}

.shadow-pink-sm {
    box-shadow: 0 6px 20px -12px rgba(123, 38, 96, .3);
}

.shadow-pink-glow {
    box-shadow: 0 16px 36px -14px rgba(240, 48, 154, .85);
}

.shadow-green-glow {
    box-shadow: 0 16px 36px -14px rgba(16, 168, 125, .6);
}

/* ── Brand colors ──────────────────────────────────────────── */
.text-ink {
    color: #221A3D;
}

/* Rosa de marca padronizado com o restante do app (Feed/EventView usam #ff5fa6) */
.text-weparty-pink {
    color: #ff5fa6;
}

.bg-ink {
    background: #221A3D;
}

.bg-pink-50 {
    background: #fdf2f8;
}

/* ── Typography ──────────────────────────────────────────────
   Fonte de exibição padronizada com o design system (--font-display: Poppins). */
.font-display {
    font-family: 'Poppins', sans-serif;
}

/* Header/dropdown do usuário: estilo agora vive só em
   src/components/UI/AppHeader/AppHeader.vue (Fase 1 do
   REFACTOR_AUDIT_PLAN.md) — nada pra duplicar aqui. */

.eyebrow {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: .14em;
    text-transform: uppercase;
    color: #ff5fa6;
}

/* "Sobre o evento": recorte da descrição até "Ler mais" expandir. */
.about-clamp {
    display: -webkit-box;
    -webkit-line-clamp: 6;
    line-clamp: 6;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* ── Termômetro do evento ──────────────────────────────────── */
.heat-badge {
    font-size: 11px;
    font-weight: 800;
    color: #ff5fa6;
    background: #fff0f6;
    border: 1px solid #ffd9e6;
    border-radius: 14px;
    padding: 3px 10px;
    white-space: nowrap;
}

.heat-track {
    height: 10px;
    border-radius: 14px;
    background: #fbe9f1;
    overflow: hidden;
}

.heat-fill {
    height: 100%;
    border-radius: 14px;
    background: linear-gradient(90deg, #ff9a4d 0%, #ff5f8f 100%);
    transition: width .6s cubic-bezier(.2, .7, .3, 1);
}

/* Cards de tendência: migraram pra EventTrendingCard.vue (Fase 5, parte
   2) — nada pra estilizar aqui. */

/* ── Cards ─────────────────────────────────────────────────── */
.card {
    background: #fff;
    border: 1px solid rgba(34, 26, 61, .06);
    border-radius: 22px;
    padding: 22px 24px;
    box-shadow: 0 6px 20px -12px rgba(123, 38, 96, .3);
}

/* InlineComments já traz seu próprio cartão (borda, sombra, header) —
   aqui viramos só um container transparente para não dobrar a caixa. */
.card--comments {
    padding: 0;
    border: none;
    box-shadow: none;
    background: transparent;
}

.card-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 15px;
}

.card-header h3 {
    font-family: 'Poppins', sans-serif;
    font-size: 18px;
    font-weight: 700;
}

.card-icon {
    width: 40px;
    height: 40px;
    border-radius: 13px;
    display: grid;
    place-items: center;
    flex: none;
}

/* ── Date pill ─────────────────────────────────────────────── */
.date-pill {
    width: 58px;
    text-align: center;
    background: linear-gradient(160deg, #FFF1E8, #FFE3EF);
    border: 1px solid #ffd9e6;
    border-radius: 14px;
    padding: 7px 0;
}

.date-month {
    font-size: 10px;
    font-weight: 800;
    letter-spacing: .08em;
    color: #ff5fa6;
    text-transform: uppercase;
}

.date-day {
    font-family: 'Poppins', sans-serif;
    font-size: 24px;
    font-weight: 800;
    line-height: 1;
}

/* ── Transition ────────────────────────────────────────────── */
.fade-enter-active,
.fade-leave-active {
    transition: opacity .25s ease, transform .25s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
    transform: translateY(8px);
}

/* ── Hero animation ────────────────────────────────────────── */
@keyframes rise {
    from {
        opacity: 0;
        transform: translateY(26px);
    }

    to {
        opacity: 1;
        transform: none;
    }
}

.animate-rise {
    animation: rise .7s cubic-bezier(.2, .7, .3, 1) both;
}

/* ── Partículas animadas (bolhas subindo) ──────────────────────
   Mesmo efeito da tela de detalhes antiga (EventView), adaptado
   ao fundo claro do corpo desta página. */
.particles {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
    z-index: 0;
}

.particle {
    position: absolute;
    bottom: -20px;
    left: var(--x);
    width: var(--size);
    height: var(--size);
    background: linear-gradient(135deg, rgba(255, 154, 77, 0.6), rgba(255, 95, 143, 0.6));
    border-radius: 50%;
    animation: floatUp var(--duration) ease-in-out infinite;
    animation-delay: var(--delay);
    opacity: 0;
}

@keyframes floatUp {
    0% {
        transform: translateY(0) rotate(0deg);
        opacity: 0;
    }

    10% {
        opacity: 0.8;
    }

    90% {
        opacity: 0.8;
    }

    100% {
        transform: translateY(-100vh) rotate(720deg);
        opacity: 0;
    }
}

/* FAQs: migraram pra EventFaqAccordion.vue (Fase 5, parte 1) — nada pra
   estilizar aqui. */

/* ── Text selection ────────────────────────────────────────── */
::selection {
    background: #ff5fa6;
    color: #fff;
}
</style>
