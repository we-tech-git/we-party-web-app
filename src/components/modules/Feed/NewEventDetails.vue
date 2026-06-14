<template>
  <!-- ===== TOP NAV ===== -->
  <header
    :class="[
      'fixed top-0 inset-x-0 z-50 flex items-center gap-3 sm:gap-4 px-4 sm:px-6 lg:px-14 transition-all duration-300',
      navSolid
        ? 'bg-white/90 backdrop-blur-lg border-b border-black/5 text-ink py-3'
        : 'text-white py-4'
    ]"
  >
    <!-- Left: logo + nav -->
    <div class="flex items-center gap-1 lg:gap-2 shrink-0">
      <div
        class="brand-logo-wrapper flex items-center gap-2.5 cursor-pointer"
        @click="goHome"
      >
        <img
          alt="We Party Logo"
          class="brand-logo-img"
          src="/logoweparty.png"
        >
        <span class="brand-title notranslate" translate="no">WE PARTY</span>
      </div>

      <nav class="hidden md:flex gap-1 lg:gap-2 ml-1 lg:ml-2">
        <a
          v-for="item in navLinks"
          :key="item.label"
          :class="[
            'flex items-center gap-2 px-3 lg:px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all duration-150',
            item.active
              ? navSolid ? 'bg-grad-main text-white' : 'bg-white/20'
              : navSolid ? 'hover:bg-pink-50 hover:text-weparty-pink' : 'hover:bg-white/25 hover:text-white'
          ]"
          :href="item.href"
          @click.prevent="handleNav(item)"
        >{{ item.label }}</a>
      </nav>
    </div>

    <!-- Center: search (flex-1 fills all available space like FeedTopHeader) -->
    <div class="nav-search hidden lg:flex flex-1 min-w-0 mx-4 lg:mx-6">
      <EventSearchAutocomplete
        v-model="searchQuery"
        placeholder="Buscar eventos, artistas..."
        @search="handleSearch"
      />
    </div>

    <!-- Right: user menu -->
    <v-menu location="bottom end" transition="slide-y-transition">
      <template #activator="{ props: menuProps }">
        <div
          v-bind="menuProps"
          :class="[
            'hidden md:flex items-center gap-2 border rounded-2xl px-3 py-1.5 font-bold cursor-pointer transition-all ml-auto lg:ml-0',
            navSolid ? 'bg-white border-black/8 shadow-pink-sm text-ink' : 'bg-white/16 border-white/25 text-white'
          ]"
        >
          <img
            v-if="userAvatar"
            :alt="userName"
            class="w-8 h-8 rounded-xl object-cover"
            loading="lazy"
            :src="userAvatar"
          >
          <span
            v-else
            class="w-8 h-8 rounded-xl text-white grid place-items-center font-extrabold text-sm"
            :style="{ background: userAvatarColor }"
          >{{ userInitial }}</span>
          <span>{{ userName }}</span>
        </div>
      </template>

      <v-list class="user-dropdown-list" density="compact" :lines="false">
        <div class="user-dropdown-header">
          <div class="dropdown-avatar" :style="{ background: userAvatarColor }">
            <img
              v-if="userAvatar"
              :alt="userName"
              :src="userAvatar"
              style="width:100%;height:100%;border-radius:50%;object-fit:cover;"
            >
            <span v-else>{{ userInitial }}</span>
          </div>
          <div class="dropdown-user-info">
            <p class="dropdown-user-name">{{ userName }}</p>
            <p v-if="loggedUser?.email" class="dropdown-user-email">{{ loggedUser.email }}</p>
          </div>
        </div>

        <v-divider class="my-1" />

        <v-list-item class="dropdown-action-item" rounded="lg" @click="router.push('/private/profile')">
          <template #prepend>
            <svg
              fill="none"
              height="18"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              viewBox="0 0 24 24"
              width="18"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </template>
          <v-list-item-title>Perfil</v-list-item-title>
        </v-list-item>

        <v-divider class="my-1" />

        <v-list-item class="dropdown-action-item dropdown-logout" rounded="lg" @click="logout">
          <template #prepend>
            <svg
              fill="none"
              height="18"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              viewBox="0 0 24 24"
              width="18"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" x2="9" y1="12" y2="12" />
            </svg>
          </template>
          <v-list-item-title>Sair</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </header>

  <!-- ===== HERO ===== -->
  <section
    class="hero-section relative w-full flex flex-col justify-end overflow-hidden"
    style="min-height: 84vh; min-height: max(84vh, 600px);"
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
      class="btn-back absolute top-20 sm:top-24 left-4 md:left-14 z-10 flex items-center gap-2 bg-white/16 backdrop-blur-sm border border-white/28 text-white font-extrabold px-4 py-2.5 rounded-2xl transition-all cursor-pointer hover:-translate-y-0.5"
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
        'btn-like-hero absolute top-20 sm:top-24 right-4 md:right-14 z-10 flex items-center gap-2 backdrop-blur-sm border font-extrabold px-4 py-2.5 rounded-2xl transition-all cursor-pointer hover:-translate-y-0.5',
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
        <span
          v-for="tag in event.tags"
          :key="tag"
          class="bg-white/16 backdrop-blur-sm border border-white/28 text-white text-[11px] font-extrabold tracking-wide px-3.5 py-1.5 rounded-full uppercase"
        >{{
          tag }}</span>
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

      <!-- Floating social bar -->
      <div
        class="relative z-10 -mt-10 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-4 sm:gap-6 bg-white border border-black/5 rounded-3xl px-5 py-5 sm:px-6 shadow-card"
      >
        <div class="flex items-center gap-3 sm:gap-4">
          <div class="flex items-center">
            <div
              v-for="(av, i) in attendeeAvatars"
              :key="i"
              class="w-10 h-10 sm:w-11 sm:h-11 rounded-full grid place-items-center text-white font-extrabold text-sm shadow-sm overflow-hidden"
              :style="{ background: av.color, border: '2.5px solid white', marginLeft: i > 0 ? '-12px' : '0', zIndex: attendeeAvatars.length - i }"
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

          <div class="leading-tight">
            <span class="font-bold"><b class="text-weparty-pink">{{ goingCount }}</b> pessoas vão</span>
            <small class="block text-gray-400 font-semibold text-sm">Confirme e chame a galera 🎉</small>
          </div>
        </div>

        <div class="hidden sm:block w-px self-stretch bg-black/8 my-1" />

        <div class="flex items-center gap-5 sm:gap-6">
          <div class="flex items-center gap-3">
            <span class="w-11 h-11 rounded-[13px] bg-pink-50 text-weparty-pink grid place-items-center flex-none">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M12 21s-7.5-4.6-10-9C.6 9 2 5 5.5 5 8 5 9.4 6.6 12 9c2.6-2.4 4-4 6.5-4C22 5 23.4 9 22 12c-2.5 4.4-10 9-10 9z"
                />
              </svg>
            </span>
            <div>
              <b class="text-[19px] font-display">{{ likeCount }}</b>
              <small class="block text-gray-400 font-semibold text-xs -mt-0.5">curtidas</small>
            </div>
          </div>

          <div class="w-px self-stretch bg-black/8 my-1" />

          <div class="flex items-center gap-3">
            <span class="w-11 h-11 rounded-[13px] bg-emerald-50 text-emerald-600 grid place-items-center flex-none">
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                stroke-width="2.4"
                viewBox="0 0 24 24"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </span>
            <div>
              <b class="text-[19px] font-display">{{ goingCount }}</b>
              <small class="block text-gray-400 font-semibold text-xs -mt-0.5">confirmados</small>
            </div>
          </div>
        </div>
      </div>

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
                  <div
                    v-for="info in eventInfoGrid"
                    :key="info.label"
                    class="flex items-center gap-3 rounded-2xl px-3 py-3 min-w-0"
                    style="background:#FBF7FB; border: 1px solid rgba(34,26,61,.05)"
                  >
                    <span
                      class="w-9 h-9 rounded-xl bg-white border border-black/5 grid place-items-center text-lg flex-none"
                    >{{
                      info.emoji }}</span>
                    <div class="min-w-0">
                      <small class="block text-gray-400 font-semibold text-xs leading-tight">{{ info.label
                      }}</small>
                      <b class="text-sm leading-tight line-clamp-2 block" :title="info.value">{{ info.value }}</b>
                    </div>
                  </div>
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
                <p class="text-gray-500 font-medium leading-relaxed">{{ event.description }}</p>
                <a
                  class="inline-flex items-center gap-1.5 mt-3 text-weparty-pink font-extrabold"
                  href="#"
                >
                  Ler mais
                  <svg
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.6"
                    viewBox="0 0 24 24"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </a>
              </div>

              <div class="card">
                <div class="flex flex-wrap items-center gap-4">
                  <div
                    class="w-14 h-14 rounded-2xl bg-linear-to-br from-yellow-300 to-orange-400 grid place-items-center text-white font-display font-extrabold text-2xl flex-none"
                  >
                    T</div>
                  <div class="min-w-0">
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

              <!-- FAQs (collapsible) — só aparece se houver FAQs da API -->
              <div v-if="hasFaqs" class="faqs-section-inline">
                <button class="faqs-toggle-btn" :class="{ open: showFaqs }" @click="showFaqs = !showFaqs">
                  <div class="faqs-toggle-left">
                    <div class="faqs-icon-wrapper-sm">
                      <i class="mdi mdi-help-circle" />
                    </div>
                    <div class="faqs-toggle-text">
                      <span class="faqs-toggle-title">Perguntas Frequentes</span>
                      <span class="faqs-toggle-sub">Tire suas dúvidas sobre o evento</span>
                    </div>
                  </div>
                  <div class="faqs-chevron" :class="{ rotated: showFaqs }">
                    <i class="mdi mdi-chevron-down" />
                  </div>
                </button>

                <Transition name="faq-expand">
                  <div v-if="showFaqs" class="faqs-content">
                    <div class="faqs-list">
                      <div
                        v-for="(faq, index) in normalizedFaqs"
                        :key="index"
                        class="faq-item"
                        :class="{ open: openFaqIndex === index }"
                        :style="{ animationDelay: `${index * 0.05}s` }"
                      >
                        <button class="faq-question" :style="{ background: faq.gradient }" @click="toggleFaq(index)">
                          <div class="faq-q-content">
                            <div class="faq-icon">
                              <i :class="faq.icon" />
                            </div>
                            <span class="faq-q-text">{{ faq.question }}</span>
                          </div>
                          <div class="faq-toggle-icon" :class="{ rotated: openFaqIndex === index }">
                            <i class="mdi mdi-chevron-down" />
                          </div>
                        </button>
                        <Transition name="faq-expand">
                          <div v-if="openFaqIndex === index" class="faq-answer">
                            <div class="faq-answer-content">
                              <i class="mdi mdi-chat-question-outline faq-answer-icon" />
                              <p>{{ faq.answer }}</p>
                            </div>
                          </div>
                        </Transition>
                      </div>
                    </div>
                  </div>
                </Transition>
              </div>
            </div>
          </Transition>

          <!-- PANEL: Atrações -->
          <Transition name="fade">
            <div v-show="activeTab === 'lineup'" class="card">
              <div class="card-header">
                <span class="card-icon bg-violet-50 text-violet-600">
                  <svg
                    class="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M9 18V5l12-2v13" />
                    <circle cx="6" cy="18" r="3" />
                    <circle cx="18" cy="16" r="3" />
                  </svg>
                </span>
                <h3>Atrações <span class="text-gray-400 font-semibold text-sm">· {{ event.lineup.length
                }} confirmadas</span></h3>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-1">
                <div
                  v-for="artist in event.lineup"
                  :key="artist.name"
                  class="bg-white border border-black/5 rounded-[18px] overflow-hidden shadow-sm hover:-translate-y-1 transition-all cursor-pointer"
                >
                  <div
                    class="h-28 grid place-items-center text-white/85 text-4xl"
                    style="background: linear-gradient(135deg,#3a1430,#5b2167)"
                  >{{ artist.emoji }}
                  </div>
                  <div class="p-4 min-w-0">
                    <b class="text-[15px] block truncate">{{ artist.name }}</b>
                    <small class="block text-gray-400 font-semibold truncate">{{ artist.role }}</small>
                  </div>
                </div>
              </div>
            </div>
          </Transition>

          <!-- PANEL: Local -->
          <Transition name="fade">
            <div v-show="activeTab === 'local'" class="card">
              <div class="card-header">
                <span class="card-icon bg-pink-50 text-weparty-pink">
                  <svg
                    class="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 21s-7-5.5-7-11a7 7 0 0114 0c0 5.5-7 11-7 11z" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>
                </span>
                <h3>Onde acontece</h3>
              </div>
              <!-- Mapa real (Google Maps), igual à tela de detalhes antiga -->
              <div class="relative h-56 rounded-2xl overflow-hidden border border-black/5 bg-[#f1f3f9]">
                <iframe
                  v-if="mapEmbedUrl"
                  allowfullscreen
                  class="w-full h-full"
                  loading="lazy"
                  referrerpolicy="no-referrer-when-downgrade"
                  :src="mapEmbedUrl"
                  style="border:0"
                  title="Mapa do local do evento"
                />
                <div v-else class="absolute inset-0 grid place-items-center text-gray-400 font-semibold text-sm">
                  Localização não disponível
                </div>
              </div>
              <div class="flex flex-wrap items-center gap-4 mt-4">
                <span
                  class="w-11 h-11 rounded-[13px] bg-pink-50 text-weparty-pink grid place-items-center flex-none"
                >
                  <svg
                    class="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 21s-7-5.5-7-11a7 7 0 0114 0c0 5.5-7 11-7 11z" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>
                </span>
                <div class="min-w-0">
                  <b class="text-[15px]">{{ event.venue }}</b>
                  <small class="block text-gray-400 font-semibold">{{ event.city }}, PR ·
                    Brasil</small>
                </div>
                <button
                  class="btn-soft ml-auto flex-none flex items-center gap-2 rounded-2xl px-4 py-2.5 font-extrabold text-sm transition-all hover:-translate-y-0.5"
                  @click="openMap"
                >
                  Como chegar →
                </button>
              </div>
            </div>
          </Transition>

          <!-- PANEL: Comentários -->
          <Transition name="fade">
            <div v-show="activeTab === 'cmt'" class="card">
              <div class="card-header">
                <span class="card-icon bg-blue-50 text-blue-500">
                  <svg
                    class="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M21 15a4 4 0 01-4 4H8l-5 4V7a4 4 0 014-4h10a4 4 0 014 4z" />
                  </svg>
                </span>
                <h3>Comentários <span class="text-gray-400 font-semibold text-sm">· {{ comments.length
                }}</span></h3>
              </div>

              <!-- Loading dos comentários -->
              <div
                v-if="commentsLoading"
                class="flex flex-col items-center justify-center gap-3 py-10"
              >
                <AppLoader size="sm" text="Carregando comentários..." />
              </div>

              <template v-else>
                <div
                  v-for="cmt in comments"
                  :key="cmt.id"
                  class="flex gap-3 py-3.5 border-b border-black/5"
                >
                  <span
                    class="w-10 h-10 rounded-xl grid place-items-center text-white font-extrabold flex-none overflow-hidden"
                    :style="{ background: cmt.color }"
                  >
                    <img
                      v-if="cmt.image"
                      alt=""
                      class="w-full h-full object-cover"
                      loading="lazy"
                      :src="cmt.image"
                    >
                    <template v-else>{{ cmt.initial }}</template>
                  </span>
                  <div class="flex-1 min-w-0">
                    <b class="text-sm">{{ cmt.name }}</b>
                    <span class="ml-2 text-xs text-gray-400 font-semibold">{{ cmt.time }}</span>
                    <p class="text-gray-500 font-medium mt-0.5 text-sm">{{ cmt.text }}</p>
                    <!-- Ações do comentário -->
                    <div class="flex items-center gap-3 mt-1.5">
                      <!-- Excluir (apenas o próprio comentário) -->
                      <button
                        v-if="cmt.userId && cmt.userId === loggedUser?.id"
                        :class="[
                          'flex items-center gap-1 text-xs font-extrabold transition-colors',
                          deletingCommentId === cmt.id ? 'text-gray-300' : 'text-gray-400 hover:text-red-500'
                        ]"
                        :disabled="deletingCommentId === cmt.id"
                        @click="deleteComment(cmt.id)"
                      >
                        <svg
                          class="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2.2"
                          viewBox="0 0 24 24"
                        >
                          <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                        </svg>
                        {{ deletingCommentId === cmt.id ? '...' : 'Excluir' }}
                      </button>
                    </div>
                  </div>
                </div>

                <div v-if="comments.length === 0" class="text-center text-gray-400 font-semibold text-sm py-6">
                  Seja o primeiro a comentar neste evento! 🎉
                </div>
              </template>

              <div class="flex gap-2 sm:gap-3 mt-4">
                <input
                  v-model="newComment"
                  class="flex-1 min-w-0 border border-black/10 rounded-2xl px-4 py-3 font-medium outline-none text-sm transition-colors focus:border-weparty-pink"
                  :disabled="sendingComment"
                  maxlength="500"
                  placeholder="Escreva um comentário..."
                  @keyup.enter="postComment"
                >
                <button
                  class="flex-none bg-grad-main text-white font-extrabold rounded-2xl px-4 sm:px-5 py-3 text-sm disabled:opacity-60"
                  :disabled="!newComment.trim() || sendingComment"
                  @click="postComment"
                >{{ sendingComment ? 'Enviando...' : 'Enviar' }}</button>
              </div>
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
              <div class="mb-5">
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

              <button
                v-if="event.sourceUrl"
                class="btn-external relative z-10 w-full mt-2.5 flex items-center justify-center gap-2 rounded-2xl py-3.5 font-extrabold text-white transition-all"
                @click="openSourceUrl"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.2"
                  viewBox="0 0 24 24"
                >
                  <path d="M14 3h7v7M21 3l-9 9M19 14v5a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h5" />
                </svg>
                Saiba mais
              </button>

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

              <div class="flex items-center gap-3 mt-5 pt-4 border-t border-black/5">
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
                <div class="text-sm font-bold">{{ userName }} e <b class="text-weparty-pink">{{ goingCount - 1
                }}</b> outros vão</div>
              </div>
            </div>
          </div>

          <!-- Trending card -->
          <div class="bg-white border border-black/5 rounded-3xl p-5 shadow-sm">
            <h3 class="font-display font-bold text-[19px]">O que tá rolando?</h3>
            <p class="text-gray-400 font-semibold text-sm mb-2">Tendência na sua cidade</p>

            <a
              v-for="trend in visibleTrending"
              :key="trend.id"
              class="trend-card flex items-center gap-3 p-3 mb-2.5 rounded-2xl transition-all cursor-pointer hover:-translate-y-0.5"
              href="#"
              @click.prevent="goToTrend(trend)"
            >
              <img
                v-if="trend.image"
                :alt="trend.title"
                class="w-12 h-12 rounded-2xl flex-none object-cover"
                loading="lazy"
                :src="trend.image"
              >
              <span
                v-else
                class="w-12 h-12 rounded-2xl flex-none grid place-items-center text-white font-display font-extrabold text-xl"
                :style="{ background: trend.color }"
              >{{ trend.initial }}</span>
              <div class="min-w-0">
                <span
                  class="block text-[10px] font-extrabold tracking-widest uppercase text-weparty-pink truncate"
                >{{
                  trend.venue }}</span>
                <b class="text-sm block leading-tight my-0.5 truncate">{{ trend.title }}</b>
                <small class="text-gray-400 font-semibold text-xs">🤍 {{ trend.likes }} curtidas</small>
              </div>
            </a>

            <button
              v-if="trendHasMore"
              class="w-full mt-3.5 bg-pink-50 text-weparty-pink font-extrabold rounded-2xl py-3 flex items-center justify-center gap-2 hover:bg-pink-100 transition-all disabled:opacity-60"
              :disabled="trendLoading"
              @click="showMoreTrending"
            >
              {{ trendLoading ? 'Carregando...' : 'Mostrar mais' }}
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                stroke-width="2.6"
                viewBox="0 0 24 24"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            <button
              v-else-if="trendIsExpanded"
              class="w-full mt-3.5 bg-pink-50 text-weparty-pink font-extrabold rounded-2xl py-3 flex items-center justify-center gap-2 hover:bg-pink-100 transition-all"
              @click="showLessTrending"
            >
              Mostrar menos
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                stroke-width="2.6"
                viewBox="0 0 24 24"
              >
                <path d="M18 15l-6-6-6 6" />
              </svg>
            </button>
          </div>
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
      <small class="block text-gray-400 font-semibold text-xs">{{ userName }} e +{{ goingCount - 1 }} vão</small>
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
</template>

<script setup lang="ts">
  import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import { addEventComment, deleteEventComment, getEventComments } from '@/api/comments'
  import { getEventById, getMyAttendance, getTrendingEvents } from '@/api/event'
  import { checkIsFollowing, followUserById, unfollowUserById } from '@/api/follows'
  import EventSearchAutocomplete from '@/components/modules/Feed/EventSearchAutocomplete.vue'
  import AppLoader from '@/components/UI/AppLoader/AppLoader.vue'
  import Snackbar from '@/components/UI/Snackbar/Snackbar.vue'
  import WePartyLoader from '@/components/UI/WePartyLoader/WePartyLoader.vue'
  import { useAuth } from '@/composables/useAuth'
  import { useGeolocation } from '@/composables/useGeolocation'
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
  const { userDisplayName, loggedUser, logout: authLogout } = useAuth()

  const currentId = computed(() =>
    (Array.isArray(props.eventId) ? props.eventId[0] : props.eventId) || '',
  )

  // Usuário logado (substitui o mock "Igor")
  const userName = computed(() => userDisplayName.value)
  const userInitial = computed(() => (userDisplayName.value || 'U').charAt(0).toUpperCase())
  const userAvatar = computed(() => loggedUser.value?.profileImage || '')

  // Cor de fallback do avatar — mesma paleta do FeedTopHeader
  const AVATAR_COLORS = [
    '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
    '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50',
  ]
  const userAvatarColor = computed(() => {
    const name = userDisplayName.value || 'U'
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = (name.codePointAt(i) || 0) + ((hash << 5) - hash)
    }
    return AVATAR_COLORS[Math.abs(hash % AVATAR_COLORS.length)] ?? '#F44336'
  })

  function logout () {
    authLogout()
    router.push('/public/Login')
  }

  // ── Nav scroll ───────────────────────────────────────────────
  const navSolid = ref(false)
  function onScroll () {
    navSolid.value = window.scrollY > 40
  }

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
    tags: string[]
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
      tags: categories,
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

  // ── FAQs (mesma dinâmica da tela de detalhes antiga) ─────────
  const openFaqIndex = ref<number | null>(null)
  const showFaqs = ref(false)

  // Gradientes padrão para FAQs (usados quando a API não envia gradient)
  const defaultGradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  ]

  // Normaliza as FAQs vindas da API com fallbacks seguros
  const normalizedFaqs = computed(() => {
    if (!Array.isArray(event.value.faq) || event.value.faq.length === 0) {
      return []
    }
    return event.value.faq.map((faq, index) => ({
      question: faq.question || 'Pergunta não informada',
      answer: faq.answer || 'Resposta não disponível',
      icon: faq.icon || 'mdi-help-circle-outline',
      gradient: faq.gradient || defaultGradients[index % defaultGradients.length],
    }))
  })

  const hasFaqs = computed(() => normalizedFaqs.value.length > 0)

  function toggleFaq (index: number) {
    openFaqIndex.value = openFaqIndex.value === index ? null : index
  }

  // Avatares da barra "pessoas vão" — conectados a dados reais.
  // Prioriza a lista de presenças vinda no payload do evento; quando indisponível,
  // recai sobre os autores dos comentários (usuários reais já carregados na página).
  interface AvatarVM { initial: string, color: string, image: string }
  const payloadAvatars = ref<AvatarVM[]>([])

  function extractAttendees (data: any): any[] {
    const sources = [
      data?.attendances, data?.attendees, data?.confirmedUsers,
      data?.guests, data?.participants, data?.goingUsers, data?.users,
    ]
    for (const s of sources) {
      if (Array.isArray(s) && s.length > 0) return s
    }
    return []
  }

  function buildAvatar (user: any): AvatarVM {
    const name = user?.name || user?.username || user?.displayName || 'Usuário'
    return {
      initial: name.charAt(0).toUpperCase(),
      color: colorForName(name),
      image: resolveAsset(user?.profileImage || user?.avatar || user?.photo || ''),
    }
  }

  function buildAttendeeAvatars (data: any) {
    const raw = extractAttendees(data)
    payloadAvatars.value = raw
      .map((a: any) => a?.user || a)
      .filter(Boolean)
      .slice(0, 5)
      .map((u: any) => buildAvatar(u))
  }

  // Avatares exibidos: presenças reais ou, na ausência, autores de comentários.
  const attendeeAvatars = computed<AvatarVM[]>(() => {
    if (payloadAvatars.value.length > 0) return payloadAvatars.value
    return comments.value
      .slice(0, 5)
      .map(c => ({ initial: c.initial, color: c.color, image: c.image }))
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
  const likeCount = computed(() => baseLikes.value + (liked.value ? 1 : 0))
  const goingCount = computed(() => baseGoing.value + (rsvped.value ? 1 : 0))

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

  // Grade de informações — gênero real (categoria), localização e distância calculadas
  const eventInfoGrid = computed(() => [
    { emoji: '🎟️', label: 'Classificação', value: 'Livre' },
    { emoji: '🗺️', label: 'Localização', value: venueLabel.value },
    { emoji: '🎼', label: 'Gênero', value: event.value.tags[0] || 'Diversos' },
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

  // ── Link externo "Saiba mais" (mesma dinâmica da tela antiga) ──
  // Abre o site oficial do evento em nova aba; só é exibido quando há sourceUrl.
  function openSourceUrl () {
    if (event.value.sourceUrl) {
      window.open(event.value.sourceUrl, '_blank', 'noopener,noreferrer')
    }
  }

  // ── Mapa (mesma lógica da tela de detalhes antiga) ───────────
  const mapLocation = computed(() => event.value.location || event.value.venue || '')

  // URL do iframe de mapa: usa o Embed API quando há chave; senão, fallback público.
  const mapEmbedUrl = computed(() => {
    const loc = mapLocation.value
    if (!loc) return ''
    const encoded = encodeURIComponent(loc)
    const apiKey = import.meta.env.VITE__GOOGLE_MAPS_API_KEY
    if (apiKey) {
      return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encoded}&zoom=15`
    }
    return `https://maps.google.com/maps?q=${encoded}&t=&z=15&ie=UTF8&iwloc=&output=embed`
  })

  function openMap () {
    const loc = mapLocation.value
    if (!loc) return
    const query = encodeURIComponent(loc)
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank', 'noopener,noreferrer')
  }

  const confirming = ref(false)
  async function toggleRsvp () {
    if (!event.value.id || confirming.value) return
    confirming.value = true
    try {
      await eventsStore.toggleConfirm(event.value.id)
      const nowConfirmed = eventsStore.isConfirmed(event.value.id)
      showSnackbar(
        nowConfirmed ? 'Presença confirmada com sucesso!' : 'Presença cancelada com sucesso!',
        SNACKBAR_COLORS.success,
      )
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
      url: `${window.location.origin}/private/event/${currentId.value}`,
    })
  }

  // ── Navegação ────────────────────────────────────────────────
  function goBack () {
    router.back()
  }
  function goHome () {
    router.push('/private/feed')
  }
  const navLinks = [
    { label: 'Home', href: '/private/feed', active: false, action: 'home' },
    { label: 'Top eventos', href: '/private/feed?tab=top-events', active: false, action: 'top-events' },
    { label: 'Eventos favoritos', href: '/private/feed?tab=favorites', active: false, action: 'favorites' },
    { label: 'Perfil', href: '/private/profile', active: false, action: 'profile' },
  ]
  function handleNav (item: { action: string }) {
    switch (item.action) {
      case 'profile': {
        router.push('/private/profile')
        break
      }
      case 'top-events': {
        router.push({ path: '/private/feed', query: { tab: 'top-events' } })
        break
      }
      case 'favorites': {
        router.push({ path: '/private/feed', query: { tab: 'favorites' } })
        break
      }
      default: {
        router.push('/private/feed')
      }
    }
  }

  // ── Busca no header (mesmo comportamento do FeedTopHeader) ────
  const searchQuery = ref('')
  function handleSearch (query: string) {
    if (query.trim()) {
      router.push({ path: '/private/feed', query: { search: query.trim() } })
    }
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
      id: 'cmt', label: 'Comentários', badge: comments.value.length > 0 ? comments.value.length : undefined,
      icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M21 15a4 4 0 01-4 4H8l-5 4V7a4 4 0 014-4h10a4 4 0 014 4z"/></svg>',
    },
  ])

  // ── Comentários (endpoint real /events/:id/comments) ─────────
  interface CommentVM {
    id: string
    userId: string
    name: string
    initial: string
    color: string
    image: string
    time: string
    text: string
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
  function relativeTime (dateStr: string): string {
    const d = new Date(dateStr)
    if (Number.isNaN(d.getTime())) return ''
    const diffMin = Math.floor((Date.now() - d.getTime()) / 60_000)
    if (diffMin < 1) return 'agora mesmo'
    if (diffMin < 60) return `há ${diffMin}min`
    const diffH = Math.floor(diffMin / 60)
    if (diffH < 24) return `há ${diffH}h`
    const diffD = Math.floor(diffH / 24)
    if (diffD < 7) return `há ${diffD}d`
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }

  const comments = ref<CommentVM[]>([])
  const newComment = ref('')
  const sendingComment = ref(false)
  const commentsLoading = ref(false)
  const deletingCommentId = ref<string | null>(null)

  async function fetchComments () {
    if (!currentId.value) return
    commentsLoading.value = true
    try {
      const res: any = await getEventComments(currentId.value)
      const raw = res?.data?.data || res?.data?.comments || res?.data?.content || res?.data || []
      const arr: any[] = Array.isArray(raw) ? raw : []
      comments.value = arr.map((c: any) => ({
        id: c.id,
        userId: c.user?.id || '',
        name: c.user?.name || 'Usuário',
        initial: (c.user?.name || 'U').charAt(0).toUpperCase(),
        color: colorForName(c.user?.name || ''),
        image: resolveAsset(c.user?.profileImage || c.user?.avatar || ''),
        time: relativeTime(c.createdAt),
        text: c.content,
      }))
    } catch (error) {
      console.error('Erro ao buscar comentários:', error)
      comments.value = []
    } finally {
      commentsLoading.value = false
    }
  }

  async function postComment () {
    const text = newComment.value.trim()
    if (!text || sendingComment.value || !currentId.value) return
    sendingComment.value = true
    try {
      await addEventComment(currentId.value, text)
      newComment.value = ''
      await fetchComments()
    } catch (error) {
      console.error('Erro ao enviar comentário:', error)
      showSnackbar('Não foi possível enviar o comentário. Tente novamente.', SNACKBAR_COLORS.error)
    } finally {
      sendingComment.value = false
    }
  }

  async function deleteComment (commentId: string) {
    if (deletingCommentId.value || !currentId.value) return
    deletingCommentId.value = commentId
    try {
      await deleteEventComment(currentId.value, commentId)
      comments.value = comments.value.filter(c => c.id !== commentId)
    } catch {
      showSnackbar('Não foi possível excluir o comentário.', SNACKBAR_COLORS.error)
    } finally {
      deletingCommentId.value = null
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
  // Quantidade de tendências buscadas e exibidas inicialmente (comportamento da tela antiga:
  // o botão "Mostrar mais" expande de uma vez e vira "Mostrar menos" para recolher).
  const TREND_FETCH_SIZE = 20
  const TREND_INITIAL_COUNT = 5
  const visibleCount = ref(TREND_INITIAL_COUNT)
  const trendLoading = ref(false)

  const visibleTrending = computed(() => trending.value.slice(0, visibleCount.value))
  const trendHasMore = computed(() => trending.value.length > visibleCount.value)
  const trendIsExpanded = computed(() => visibleCount.value > TREND_INITIAL_COUNT)

  function mapTrend (e: any, i: number): TrendVM {
    return {
      id: e.id,
      initial: (e.name || e.title || 'E').charAt(0).toUpperCase(),
      color: TREND_COLORS[i % TREND_COLORS.length]!,
      image: resolveAsset(
        e.organizer?.avatar || e.hostAvatar || e.creator?.profileImage || e.host?.profileImage || '',
      ),
      venue: e.location || e.city || 'Em alta',
      title: e.name || e.title || 'Evento',
      likes: e.likesCount || e.likes || e._count?.likes || 0,
    }
  }

  // Busca uma leva única de tendências; a exibição é controlada localmente
  // por "Mostrar mais"/"Mostrar menos" (sem novas requisições).
  async function fetchTrending () {
    if (trendLoading.value) return
    trendLoading.value = true
    try {
      const res: any = await getTrendingEvents(1, TREND_FETCH_SIZE)
      const data = res?.data?.events || res?.data || []
      const arr: any[] = Array.isArray(data) ? data : []
      trending.value = arr
        .filter((e: any) => String(e.id) !== String(currentId.value))
        .map((e: any, i: number) => mapTrend(e, i))
    } catch (error) {
      console.warn('Não foi possível carregar tendências:', error)
    } finally {
      trendLoading.value = false
    }
  }

  // Expande de uma vez todas as tendências carregadas.
  function showMoreTrending () {
    visibleCount.value = trending.value.length
  }

  // Recolhe de volta à quantidade inicial.
  function showLessTrending () {
    visibleCount.value = TREND_INITIAL_COUNT
  }

  // Abre o evento em destaque — mesmo destino usado no Feed/EventView
  function goToTrend (trend: TrendVM) {
    if (!trend.id) return
    router.push(`/private/event/${trend.id}`)
  }

  // ── Carregamento do evento ───────────────────────────────────
  function applyCounters (data: any) {
    baseLikes.value = data?.likesCount || data?._count?.likes || data?.likes || 0
    baseGoing.value = data?.confirmedCount || data?._count?.attendances || data?.confirmed || 0
  }

  async function syncAttendance () {
    if (!event.value.id) return
    try {
      const res: any = await getMyAttendance(event.value.id)
      const data = res?.data || res
      const attending = data?.status === 'CONFIRMED' || data?.status === 'INTERESTED' || data?.isAttending || false
      eventsStore.setConfirmed(event.value.id, attending)
    } catch (error) {
      console.warn('Não foi possível sincronizar presença:', error)
    }
  }

  async function loadEvent () {
    // Se o pai já forneceu os dados, usa-os e evita nova requisição
    if (props.eventData) {
      event.value = mapEvent(props.eventData)
      applyCounters(props.eventData)
      buildAttendeeAvatars(props.eventData)
      tick()
      await syncAttendance()
      syncFollow()
      return
    }
    if (!currentId.value) return
    loading.value = true
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
      console.error('Erro ao carregar evento:', error)
      errorMessage.value = 'Não foi possível carregar os detalhes do evento.'
      showSnackbar('Não foi possível carregar os detalhes do evento.', SNACKBAR_COLORS.error)
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
    window.addEventListener('scroll', onScroll)
    onScroll()
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
    window.removeEventListener('scroll', onScroll)
    if (timer) clearInterval(timer)
  })

  watch(() => props.eventId, () => {
    loadEvent()
    fetchComments()
  })
  watch(() => props.eventData, d => {
    if (d) {
      event.value = mapEvent(d)
      applyCounters(d)
      buildAttendeeAvatars(d)
      tick()
    }
  })
</script>

<style scoped>
/* ── Gradients ───────────────────────────────────────────────
   Padronizado com a identidade We Party (css-variables.css):
   primário sunset → secundário rosa → rosa de destaque do Feed. */
.bg-grad-main {
    background: linear-gradient(120deg, #ffb74d 0%, #ff9ab5 55%, #ff5fa6 100%);
}

.bg-grad-green {
    background: linear-gradient(120deg, #10A87D, #0c9c8c);
}

/* Botão "Saiba mais" — mesma cor/efeito do botão da tela de detalhes antiga */
.btn-external {
    background: linear-gradient(135deg, #ff5fa6, #ff7eb3);
}

.btn-external:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(255, 95, 166, 0.35);
}

/* Botão "Voltar" do hero — muda para o gradiente da marca ao passar o mouse,
   padronizando o feedback com os demais botões do app */
.btn-back:hover {
    background: linear-gradient(120deg, #ffb74d 0%, #ff9ab5 55%, #ff5fa6 100%);
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
    background: linear-gradient(120deg, #ffb74d, #ff9ab5, #ff5fa6);
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

/* ── Brand (padronizado com o FeedTopHeader) ─────────────────── */
.brand-logo-wrapper {
    transition: opacity 0.2s ease;
}

.brand-logo-wrapper:hover {
    opacity: 0.8;
}

.brand-logo-img {
    width: 40px;
    height: 40px;
    object-fit: contain;
}

.brand-title {
    font-family: "Baloo Thambi 2", serif;
    font-weight: 800;
    font-size: 2rem;
    line-height: 1;
    background: linear-gradient(90deg, #ffba4b 0%, #ff5fa6 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    white-space: nowrap;
}

/* ── Busca no header (mesmo visual do FeedTopHeader) ──────────── */
.nav-search :deep(.search-input-field) {
    padding-top: 0.7rem;
    padding-bottom: 0.7rem;
    border-radius: 20px;
    background: #ffffff;
    border-color: transparent;
    box-shadow: 0 12px 30px rgba(14, 23, 58, 0.12);
}

.nav-search :deep(.search-input-field:focus) {
    border-color: #ff5fa6;
}

.nav-search :deep(.autocomplete-wrapper.is-open .search-input-field) {
    border-bottom-left-radius: 0 !important;
    border-bottom-right-radius: 0 !important;
}

/* ── Dropdown do usuário (mesmo do FeedTopHeader) ─────────────── */
:deep(.user-dropdown-list) {
    min-width: 230px;
    padding: 8px !important;
    border-radius: 16px !important;
    box-shadow: 0 8px 32px rgba(14, 23, 58, 0.12) !important;
}

.user-dropdown-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 10px 10px;
}

.dropdown-avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-weight: 700;
    font-size: 1.1rem;
    flex-shrink: 0;
    box-shadow: 0 4px 10px rgba(14, 23, 58, 0.12);
}

.dropdown-user-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
}

.dropdown-user-name {
    font-weight: 700;
    font-size: 0.9rem;
    color: #1a1a2e;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.dropdown-user-email {
    font-size: 0.75rem;
    color: #888;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

:deep(.dropdown-action-item) {
    border-radius: 10px !important;
    gap: 10px;
    font-size: 0.875rem;
    color: #333;
    transition: background 0.15s ease;
}

:deep(.dropdown-action-item .v-list-item__prepend) {
    width: 28px;
    min-width: 28px;
}

:deep(.dropdown-action-item:hover) {
    background: rgba(255, 95, 166, 0.07) !important;
}

:deep(.dropdown-logout) {
    color: #ff4757 !important;
}

:deep(.dropdown-logout:hover) {
    background: rgba(255, 71, 87, 0.07) !important;
}

.eyebrow {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: .14em;
    text-transform: uppercase;
    color: #ff5fa6;
}

/* ── Termômetro do evento ──────────────────────────────────── */
.heat-badge {
    font-size: 11px;
    font-weight: 800;
    color: #ff5fa6;
    background: #fff0f6;
    border: 1px solid #ffd9e6;
    border-radius: 999px;
    padding: 3px 10px;
    white-space: nowrap;
}

.heat-track {
    height: 10px;
    border-radius: 999px;
    background: #fbe9f1;
    overflow: hidden;
}

.heat-fill {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, #ffb74d 0%, #ff9ab5 55%, #ff5fa6 100%);
    transition: width .6s cubic-bezier(.2, .7, .3, 1);
}

/* ── Cards de tendência ("O que tá rolando?") ──────────────────
   Fundo rosa-pêssego suave da marca, no lugar do branco apagado. */
.trend-card {
    background: linear-gradient(135deg, #fff6f9 0%, #fff1e8 100%);
    border: 1px solid rgba(255, 95, 166, .12);
}

.trend-card:hover {
    border-color: rgba(255, 95, 166, .30);
    box-shadow: 0 12px 26px -16px rgba(123, 38, 96, .55);
}

/* ── Cards ─────────────────────────────────────────────────── */
.card {
    background: #fff;
    border: 1px solid rgba(34, 26, 61, .06);
    border-radius: 22px;
    padding: 22px 24px;
    box-shadow: 0 6px 20px -12px rgba(123, 38, 96, .3);
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
    background: linear-gradient(135deg, rgba(255, 186, 75, 0.6), rgba(255, 95, 166, 0.6));
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

/* ── FAQs (mesma dinâmica/estilo da tela de detalhes antiga) ─── */
.faqs-section-inline {
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid #f0f0f0;
    background: #fafafa;
    transition: all 0.3s ease;
}

.faqs-section-inline:hover {
    border-color: rgba(255, 95, 166, 0.2);
}

.faqs-toggle-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem;
    border: none;
    background: transparent;
    cursor: pointer;
    transition: background 0.2s;
}

.faqs-toggle-btn:hover {
    background: rgba(255, 95, 166, 0.04);
}

.faqs-toggle-left {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.faqs-icon-wrapper-sm {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: linear-gradient(135deg, #ff5fa6 0%, #ffba4b 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.4rem;
    color: white;
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(255, 95, 166, 0.25);
}

.faqs-toggle-text {
    display: flex;
    flex-direction: column;
    text-align: left;
}

.faqs-toggle-title {
    font-size: 1rem;
    font-weight: 700;
    color: #333;
    background: linear-gradient(135deg, #ff5fa6, #ffba4b);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.faqs-toggle-sub {
    font-size: 0.8rem;
    color: #888;
    margin-top: 0.1rem;
}

.faqs-chevron {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(255, 95, 166, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.4rem;
    color: #ff5fa6;
    transition: all 0.3s ease;
    flex-shrink: 0;
}

.faqs-chevron.rotated {
    transform: rotate(180deg);
    background: rgba(255, 95, 166, 0.2);
}

.faqs-content {
    border-top: 1px solid rgba(255, 95, 166, 0.1);
    padding: 1.25rem;
}

.faqs-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.faq-item {
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;
    animation: fadeInUp 0.5s ease backwards;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.faq-item:hover {
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);
}

.faq-item.open {
    box-shadow: 0 10px 35px rgba(255, 95, 166, 0.15);
}

.faq-question {
    width: 100%;
    padding: 1.25rem 1.5rem;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    color: white;
    font-weight: 600;
    font-size: 1rem;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    /* Gradiente padrão caso não venha da API */
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.faq-question::before {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.1);
    opacity: 0;
    transition: opacity 0.3s ease;
}

.faq-question:hover::before {
    opacity: 1;
}

.faq-q-content {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex: 1;
    text-align: left;
}

.faq-icon {
    width: 42px;
    height: 42px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.3rem;
    flex-shrink: 0;
}

.faq-q-text {
    line-height: 1.4;
}

.faq-toggle-icon {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    transition: all 0.3s ease;
    flex-shrink: 0;
}

.faq-toggle-icon.rotated {
    transform: rotate(180deg);
    background: rgba(255, 255, 255, 0.35);
}

.faq-answer {
    background: white;
    overflow: hidden;
}

.faq-answer-content {
    padding: 1.5rem;
    display: flex;
    gap: 1rem;
    align-items: flex-start;
}

.faq-answer-icon {
    font-size: 1.5rem;
    color: #ff5fa6;
    flex-shrink: 0;
    margin-top: 0.25rem;
}

.faq-answer-content p {
    margin: 0;
    color: #555;
    line-height: 1.7;
    font-size: 0.95rem;
}

/* FAQ Expand Transition */
.faq-expand-enter-active,
.faq-expand-leave-active {
    transition: all 0.3s ease;
}

.faq-expand-enter-from,
.faq-expand-leave-to {
    max-height: 0;
    opacity: 0;
}

.faq-expand-enter-to,
.faq-expand-leave-from {
    max-height: 500px;
    opacity: 1;
}

/* ── Text selection ────────────────────────────────────────── */
::selection {
    background: #ff5fa6;
    color: #fff;
}
</style>
