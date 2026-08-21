<script setup lang="ts">
  defineProps<{
    updateId: string
    category?: string
  }>()
</script>

<template>
  <div class="update-visual-wrapper">
    <!-- 1. Inline Comments -->
    <div v-if="updateId === 'inline-comments'" class="mockup-comments">
      <div class="mockup-header">
        <div class="mockup-event-info">
          <span class="event-pill">Festa no Feed</span>
          <span class="event-title-small">Sunset Rooftop Party 🌅</span>
        </div>
        <span class="live-dot"><span class="ping" />Ao vivo</span>
      </div>

      <div class="comments-thread">
        <div class="comment-item">
          <div class="comment-avatar avatar-1">CV</div>
          <div class="comment-content">
            <div class="comment-author-row">
              <span class="comment-author">Carol Vasconcelos</span>
              <span class="comment-time">agora</span>
            </div>
            <p class="comment-text">A playlist tá surreal! Quem já tá na pista? 🔥🎶</p>
            <div class="comment-actions">
              <button class="reaction-badge active" type="button">❤️ 12</button>
              <button class="reply-badge" type="button">Responder</button>
            </div>
          </div>
        </div>

        <div class="comment-item reply">
          <div class="comment-avatar avatar-2">LM</div>
          <div class="comment-content">
            <div class="comment-author-row">
              <span class="comment-author">Lucas Mendes</span>
              <span class="comment-time">1m atrás</span>
            </div>
            <p class="comment-text">Entrando agora com a galera! 🚗💨</p>
          </div>
        </div>
      </div>

      <div class="comment-input-fake">
        <span class="input-placeholder">Escreva um comentário...</span>
        <button class="send-btn" type="button" aria-label="Enviar">
          <v-icon icon="mdi-send" size="14" />
        </button>
      </div>
    </div>

    <!-- 2. Event Details Revamp -->
    <div v-else-if="updateId === 'event-details-revamp'" class="mockup-event-details">
      <div class="event-banner">
        <div class="banner-gradient" />
        <span class="banner-tag">Música & Balada</span>
        <h4 class="banner-title">Neon Night Festival 🪩</h4>
      </div>
      <div class="event-details-body">
        <div class="detail-row">
          <div class="detail-icon"><v-icon icon="mdi-map-marker-radius" size="16" /></div>
          <div>
            <div class="detail-label">Localização</div>
            <div class="detail-val">Vila Madalena, São Paulo</div>
          </div>
        </div>
        <div class="detail-row">
          <div class="detail-icon"><v-icon icon="mdi-calendar-clock" size="16" /></div>
          <div>
            <div class="detail-label">Data e Hora</div>
            <div class="detail-val">Sábado, a partir das 22h</div>
          </div>
        </div>
        <div class="participants-strip">
          <div class="avatar-stack">
            <span class="stack-avatar a1">A</span>
            <span class="stack-avatar a2">B</span>
            <span class="stack-avatar a3">C</span>
            <span class="stack-avatar a4">D</span>
          </div>
          <span class="participants-count">+48 amigos confirmados</span>
        </div>
        <div class="event-action-badge">
          <v-icon icon="mdi-check-circle" size="16" />
          <span>Presença Confirmada</span>
        </div>
      </div>
    </div>

    <!-- 3. Auth Hardening -->
    <div v-else-if="updateId === 'auth-hardening'" class="mockup-auth">
      <div class="auth-card">
        <div class="shield-badge">
          <v-icon icon="mdi-shield-lock-open-outline" size="28" />
        </div>
        <div class="auth-status-title">Autenticação Instantânea</div>
        <p class="auth-status-desc">Acesso seguro com 1 clique e sessão persistente sem fricção.</p>
        <div class="auth-metrics">
          <div class="metric-pill">
            <span class="metric-val">42ms</span>
            <span class="metric-lbl">Tempo de resposta</span>
          </div>
          <div class="metric-pill verified">
            <v-icon icon="mdi-check-decagram" size="14" />
            <span class="metric-lbl">API Blindada</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 4. Performance Rate Limiting -->
    <div v-else-if="updateId === 'performance-rate-limiting'" class="mockup-perf">
      <div class="perf-card">
        <div class="perf-top">
          <div class="perf-badge">
            <v-icon icon="mdi-lightning-bolt" size="16" />
            <span>Ultra Performance</span>
          </div>
          <span class="perf-ping">99.9% Uptime</span>
        </div>
        <div class="speed-meter">
          <div class="speed-bar">
            <div class="speed-fill" />
          </div>
          <div class="speed-labels">
            <span>Carregamento</span>
            <strong class="speed-val">&lt; 80ms</strong>
          </div>
        </div>
        <div class="perf-features">
          <div class="perf-feature-item">
            <v-icon icon="mdi-check" size="14" />
            <span>Cancelamento inteligente de requests</span>
          </div>
          <div class="perf-feature-item">
            <v-icon icon="mdi-check" size="14" />
            <span>Fluxo suave mesmo em 4G/3G</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 5. Mobile Menu -->
    <div v-else-if="updateId === 'mobile-menu'" class="mockup-mobile-menu">
      <div class="phone-frame">
        <div class="drawer-preview">
          <div class="drawer-user">
            <div class="user-avatar-demo">WP</div>
            <div>
              <div class="user-name-demo">Seu Perfil</div>
              <div class="user-handle-demo">@weparty.user</div>
            </div>
          </div>
          <div class="drawer-links">
            <div class="drawer-link active">
              <v-icon icon="mdi-compass" size="16" />
              <span>Explorar Festas</span>
              <span class="badge-mini">Live</span>
            </div>
            <div class="drawer-link">
              <v-icon icon="mdi-heart-multiple-outline" size="16" />
              <span>Meus Eventos</span>
            </div>
            <div class="drawer-link">
              <v-icon icon="mdi-account-group-outline" size="16" />
              <span>Amigos</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 6. PWA Install -->
    <div v-else-if="updateId === 'pwa-install'" class="mockup-pwa">
      <div class="pwa-card">
        <div class="app-icon-display">
          <img src="/logoweparty.png" alt="We Party App Icon" class="pwa-app-icon">
          <span class="app-glow" />
        </div>
        <div class="pwa-info">
          <div class="pwa-title">We Party App</div>
          <div class="pwa-desc">Instale no celular ou PC com 1 toque</div>
        </div>
        <div class="pwa-actions-fake">
          <div class="pwa-btn-fake">
            <v-icon icon="mdi-download" size="16" />
            <span>Adicionar à Tela de Início</span>
          </div>
          <div class="pwa-features-row">
            <span>⚡ Modo Fullscreen</span>
            <span>📱 iOS & Android</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 7. Geolocation -->
    <div v-else-if="updateId === 'geolocation'" class="mockup-geo">
      <div class="radar-container">
        <div class="radar-circle c1" />
        <div class="radar-circle c2" />
        <div class="radar-circle c3" />
        <div class="user-pin">
          <v-icon icon="mdi-navigation-variant" size="16" />
        </div>
        <div class="event-pin pin-1">
          <span class="pin-badge">Sunset Rooftop • 350m</span>
        </div>
        <div class="event-pin pin-2">
          <span class="pin-badge">Samba do Beco • 800m</span>
        </div>
        <div class="geo-footer-pill">
          <v-icon icon="mdi-crosshairs-gps" size="14" />
          <span>Eventos a menos de 1km</span>
        </div>
      </div>
    </div>

    <!-- 8. Guest Mode -->
    <div v-else-if="updateId === 'guest-mode'" class="mockup-guest">
      <div class="guest-card">
        <div class="guest-header">
          <span class="guest-tag">
            <v-icon icon="mdi-door-open" size="14" />
            Modo Visitante
          </span>
          <span class="guest-badge-free">100% Aberto</span>
        </div>
        <div class="guest-feed-preview">
          <div class="mini-event-snippet">
            <div class="snippet-thumb" />
            <div class="snippet-info">
              <div class="snippet-title">Balada Eletrônica Open Bar</div>
              <div class="snippet-meta">Hoje • Pinheiros, SP</div>
            </div>
          </div>
        </div>
        <p class="guest-note">Navegue livremente sem precisar de cadastro imediato.</p>
      </div>
    </div>

    <!-- 9. Push Notifications (Upcoming) -->
    <div v-else-if="updateId === 'push-notifications'" class="mockup-push">
      <div class="push-notification-bubble">
        <div class="push-top">
          <div class="push-app">
            <img src="/logoweparty.png" alt="WeParty" class="push-logo">
            <span>We Party • Agora</span>
          </div>
          <span class="push-close"><v-icon icon="mdi-bell-ring-outline" size="14" /></span>
        </div>
        <div class="push-body">
          <strong>Lucas & Carol confirmaram presença!</strong>
          <p>Eles vão na "Sunset Rooftop Party" este sábado.</p>
        </div>
      </div>
    </div>

    <!-- 10. Event Chat (Upcoming) -->
    <div v-else-if="updateId === 'event-chat'" class="mockup-chat">
      <div class="chat-teaser-box">
        <div class="chat-header-small">
          <div class="chat-status-dot" />
          <span>Chat da Festa • Neon Night (32 online)</span>
        </div>
        <div class="chat-bubbles-mini">
          <div class="chat-msg left">Alguém saindo da Zona Sul com vaga de carona? 🚗</div>
          <div class="chat-msg right">Opa! Eu passo por lá às 21h30 🙌</div>
        </div>
      </div>
    </div>

    <!-- Default Fallback Visual -->
    <div v-else class="mockup-generic">
      <div class="generic-icon-box">
        <v-icon icon="mdi-creation" size="32" />
      </div>
      <span class="generic-label">Novidade We Party</span>
    </div>
  </div>
</template>

<style scoped>
.update-visual-wrapper {
  width: 100%;
  height: 100%;
  min-height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: radial-gradient(120% 120% at 50% 10%, rgba(255, 255, 255, 0.95) 0%, rgba(255, 245, 248, 0.75) 100%);
  border-radius: 20px;
  padding: 1.25rem;
  overflow: hidden;
  box-shadow: inset 0 0 0 1px rgba(255, 154, 77, 0.12);
}

/* ═══════════════════════════════════════════════════════════════
   1. MOCKUP COMMENTS
   ═══════════════════════════════════════════════════════════════ */
.mockup-comments {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.mockup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
}

.event-pill {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #ff5f8f;
  background: rgba(255, 95, 143, 0.1);
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  margin-right: 0.35rem;
}

.event-title-small {
  font-size: 0.8rem;
  font-weight: 700;
  color: #1e293b;
}

.live-dot {
  font-size: 0.7rem;
  color: #10b981;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.live-dot .ping {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 8px #10b981;
  animation: pulse-dot 1.5s infinite;
}

@keyframes pulse-dot {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.5); opacity: 0.5; }
}

.comments-thread {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.comment-item {
  display: flex;
  gap: 0.6rem;
  align-items: flex-start;
}

.comment-item.reply {
  margin-left: 1.5rem;
}

.comment-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 800;
  color: white;
  flex-shrink: 0;
}

.avatar-1 {
  background: linear-gradient(135deg, #ff9a4d, #ff5f8f);
  box-shadow: 0 2px 8px rgba(255, 95, 143, 0.35);
}

.avatar-2 {
  background: linear-gradient(135deg, #8b5cf6, #3b82f6);
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.35);
}

.comment-content {
  background: #ffffff;
  padding: 0.55rem 0.75rem;
  border-radius: 14px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(226, 232, 240, 0.8);
  flex: 1;
}

.comment-author-row {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.2rem;
}

.comment-author {
  font-size: 0.75rem;
  font-weight: 700;
  color: #1e293b;
}

.comment-time {
  font-size: 0.65rem;
  color: #94a3b8;
}

.comment-text {
  font-size: 0.78rem;
  color: #334155;
  margin: 0;
  line-height: 1.35;
}

.comment-actions {
  display: flex;
  gap: 0.4rem;
  margin-top: 0.35rem;
}

.reaction-badge, .reply-badge {
  border: none;
  font-size: 0.68rem;
  padding: 0.15rem 0.45rem;
  border-radius: 6px;
  cursor: pointer;
}

.reaction-badge {
  background: #fff0f3;
  color: #ff5f8f;
  font-weight: 700;
}

.reply-badge {
  background: transparent;
  color: #64748b;
  font-weight: 600;
}

.comment-input-fake {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  border: 1px solid rgba(255, 154, 77, 0.3);
  border-radius: 999px;
  padding: 0.35rem 0.75rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}

.input-placeholder {
  font-size: 0.72rem;
  color: #94a3b8;
}

.send-btn {
  background: linear-gradient(135deg, #ff9a4d, #ff5f8f);
  color: white;
  border: none;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

/* ═══════════════════════════════════════════════════════════════
   2. MOCKUP EVENT DETAILS
   ═══════════════════════════════════════════════════════════════ */
.mockup-event-details {
  width: 100%;
  background: #ffffff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(226, 232, 240, 0.9);
}

.event-banner {
  background: linear-gradient(135deg, #7928CA, #FF0080);
  padding: 0.85rem 1rem;
  color: white;
  position: relative;
}

.banner-tag {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  background: rgba(255, 255, 255, 0.25);
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  display: inline-block;
  margin-bottom: 0.3rem;
}

.banner-title {
  font-size: 0.95rem;
  font-weight: 800;
  margin: 0;
}

.event-details-body {
  padding: 0.75rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.detail-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: #fff5f5;
  color: #ff5f8f;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.detail-label {
  font-size: 0.65rem;
  color: #94a3b8;
  font-weight: 600;
}

.detail-val {
  font-size: 0.78rem;
  font-weight: 700;
  color: #1e293b;
}

.participants-strip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-top: 0.35rem;
}

.avatar-stack {
  display: flex;
}

.stack-avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid white;
  margin-left: -6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  font-weight: 800;
  color: white;
}

.stack-avatar:first-child { margin-left: 0; }
.a1 { background: #ff5f8f; }
.a2 { background: #ff9a4d; }
.a3 { background: #8b5cf6; }
.a4 { background: #3b82f6; }

.participants-count {
  font-size: 0.72rem;
  font-weight: 700;
  color: #64748b;
}

.event-action-badge {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.4rem 0.75rem;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  margin-top: 0.25rem;
}

/* ═══════════════════════════════════════════════════════════════
   3. MOCKUP AUTH
   ═══════════════════════════════════════════════════════════════ */
.mockup-auth {
  width: 100%;
}

.auth-card {
  background: #ffffff;
  border-radius: 18px;
  padding: 1.25rem;
  text-align: center;
  border: 1px solid rgba(59, 130, 246, 0.2);
  box-shadow: 0 8px 30px rgba(59, 130, 246, 0.08);
}

.shield-badge {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.15));
  color: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 0.6rem;
}

.auth-status-title {
  font-size: 0.95rem;
  font-weight: 800;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.auth-status-desc {
  font-size: 0.78rem;
  color: #64748b;
  margin-bottom: 0.75rem;
}

.auth-metrics {
  display: flex;
  justify-content: center;
  gap: 0.6rem;
}

.metric-pill {
  background: #f1f5f9;
  padding: 0.35rem 0.65rem;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.metric-val {
  font-size: 0.85rem;
  font-weight: 800;
  color: #3b82f6;
}

.metric-lbl {
  font-size: 0.65rem;
  color: #64748b;
}

.metric-pill.verified {
  flex-direction: row;
  gap: 0.35rem;
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  font-weight: 700;
}

.metric-pill.verified .metric-lbl {
  color: #059669;
  font-weight: 700;
}

/* ═══════════════════════════════════════════════════════════════
   4. MOCKUP PERF
   ═══════════════════════════════════════════════════════════════ */
.mockup-perf {
  width: 100%;
}

.perf-card {
  background: #ffffff;
  border-radius: 18px;
  padding: 1.15rem;
  border: 1px solid rgba(139, 92, 246, 0.2);
  box-shadow: 0 8px 30px rgba(139, 92, 246, 0.08);
}

.perf-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.perf-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: rgba(139, 92, 246, 0.12);
  color: #7c3aed;
  font-weight: 800;
  font-size: 0.72rem;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
}

.perf-ping {
  font-size: 0.72rem;
  font-weight: 700;
  color: #10b981;
}

.speed-meter {
  background: #f8fafc;
  border-radius: 12px;
  padding: 0.75rem;
  margin-bottom: 0.75rem;
}

.speed-bar {
  height: 8px;
  background: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 0.4rem;
}

.speed-fill {
  width: 95%;
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6, #ec4899);
  border-radius: 999px;
}

.speed-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.72rem;
  color: #64748b;
}

.speed-val {
  color: #7c3aed;
  font-weight: 800;
}

.perf-features {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.perf-feature-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.72rem;
  color: #475569;
}

.perf-feature-item .v-icon {
  color: #10b981;
}

/* ═══════════════════════════════════════════════════════════════
   5. MOCKUP MOBILE MENU
   ═══════════════════════════════════════════════════════════════ */
.mockup-mobile-menu {
  width: 100%;
  display: flex;
  justify-content: center;
}

.phone-frame {
  width: 100%;
  max-width: 260px;
  background: #0f172a;
  border-radius: 20px;
  padding: 0.85rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.drawer-preview {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.drawer-user {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.user-avatar-demo {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff9a4d, #ff5f8f);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 800;
}

.user-name-demo {
  font-size: 0.78rem;
  font-weight: 700;
  color: #f8fafc;
}

.user-handle-demo {
  font-size: 0.65rem;
  color: #94a3b8;
}

.drawer-links {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.drawer-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.6rem;
  border-radius: 8px;
  color: #94a3b8;
  font-size: 0.72rem;
  font-weight: 600;
}

.drawer-link.active {
  background: rgba(255, 95, 143, 0.2);
  color: #ff9ab5;
}

.badge-mini {
  margin-left: auto;
  font-size: 0.6rem;
  background: #ff5f8f;
  color: white;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  font-weight: 800;
}

/* ═══════════════════════════════════════════════════════════════
   6. MOCKUP PWA
   ═══════════════════════════════════════════════════════════════ */
.mockup-pwa {
  width: 100%;
}

.pwa-card {
  background: #ffffff;
  border-radius: 18px;
  padding: 1.15rem;
  text-align: center;
  border: 1px solid rgba(255, 183, 77, 0.25);
  box-shadow: 0 8px 30px rgba(255, 183, 77, 0.1);
}

.app-icon-display {
  position: relative;
  width: 54px;
  height: 54px;
  margin: 0 auto 0.6rem;
}

.pwa-app-icon {
  width: 100%;
  height: 100%;
  border-radius: 14px;
  object-fit: contain;
  box-shadow: 0 4px 15px rgba(255, 95, 143, 0.35);
}

.pwa-title {
  font-size: 0.95rem;
  font-weight: 800;
  color: #1e293b;
}

.pwa-desc {
  font-size: 0.72rem;
  color: #64748b;
  margin-bottom: 0.75rem;
}

.pwa-btn-fake {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  background: linear-gradient(135deg, #ff9a4d, #ff5f8f);
  color: white;
  font-weight: 700;
  font-size: 0.75rem;
  padding: 0.45rem 1rem;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(255, 95, 143, 0.3);
  margin-bottom: 0.5rem;
}

.pwa-features-row {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  font-size: 0.68rem;
  color: #64748b;
  font-weight: 600;
}

/* ═══════════════════════════════════════════════════════════════
   7. MOCKUP GEOLOCATION
   ═══════════════════════════════════════════════════════════════ */
.mockup-geo {
  width: 100%;
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.radar-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.radar-circle {
  position: absolute;
  border-radius: 50%;
  border: 1px dashed rgba(255, 95, 143, 0.3);
  pointer-events: none;
}

.radar-circle.c1 { width: 80px; height: 80px; }
.radar-circle.c2 { width: 140px; height: 140px; }
.radar-circle.c3 { width: 200px; height: 200px; }

.user-pin {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff9a4d, #ff5f8f);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 15px rgba(255, 95, 143, 0.6);
  z-index: 2;
}

.event-pin {
  position: absolute;
  z-index: 3;
}

.pin-1 { top: 18%; right: 10%; }
.pin-2 { bottom: 25%; left: 8%; }

.pin-badge {
  font-size: 0.65rem;
  font-weight: 700;
  background: #ffffff;
  color: #1e293b;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 95, 143, 0.25);
  white-space: nowrap;
}

.geo-footer-pill {
  position: absolute;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 700;
  color: #ff5f8f;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

/* ═══════════════════════════════════════════════════════════════
   8. MOCKUP GUEST MODE
   ═══════════════════════════════════════════════════════════════ */
.mockup-guest {
  width: 100%;
}

.guest-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 1rem;
  border: 1px solid rgba(255, 154, 77, 0.2);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.04);
}

.guest-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.6rem;
}

.guest-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.72rem;
  font-weight: 700;
  color: #ff9a4d;
}

.guest-badge-free {
  font-size: 0.65rem;
  font-weight: 800;
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
  padding: 0.15rem 0.45rem;
  border-radius: 6px;
}

.mini-event-snippet {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: #f8fafc;
  padding: 0.5rem;
  border-radius: 10px;
  margin-bottom: 0.5rem;
}

.snippet-thumb {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, #ff9a4d, #ff5f8f);
  flex-shrink: 0;
}

.snippet-title {
  font-size: 0.75rem;
  font-weight: 700;
  color: #1e293b;
}

.snippet-meta {
  font-size: 0.65rem;
  color: #94a3b8;
}

.guest-note {
  font-size: 0.7rem;
  color: #64748b;
  margin: 0;
  text-align: center;
}

/* ═══════════════════════════════════════════════════════════════
   9. MOCKUP PUSH (UPCOMING)
   ═══════════════════════════════════════════════════════════════ */
.mockup-push {
  width: 100%;
}

.push-notification-bubble {
  background: #ffffff;
  border-radius: 16px;
  padding: 0.85rem;
  border: 1px solid rgba(255, 95, 143, 0.2);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
}

.push-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.4rem;
}

.push-app {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.7rem;
  font-weight: 700;
  color: #64748b;
}

.push-logo {
  width: 16px;
  height: 16px;
}

.push-close {
  color: #ff5f8f;
}

.push-body strong {
  display: block;
  font-size: 0.78rem;
  color: #1e293b;
  margin-bottom: 0.15rem;
}

.push-body p {
  font-size: 0.72rem;
  color: #64748b;
  margin: 0;
}

/* ═══════════════════════════════════════════════════════════════
   10. MOCKUP CHAT (UPCOMING)
   ═══════════════════════════════════════════════════════════════ */
.mockup-chat {
  width: 100%;
}

.chat-teaser-box {
  background: #ffffff;
  border-radius: 16px;
  padding: 0.85rem;
  border: 1px solid rgba(139, 92, 246, 0.2);
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.06);
}

.chat-header-small {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.72rem;
  font-weight: 700;
  color: #7c3aed;
  margin-bottom: 0.6rem;
  padding-bottom: 0.35rem;
  border-bottom: 1px solid #f1f5f9;
}

.chat-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
}

.chat-bubbles-mini {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.chat-msg {
  font-size: 0.72rem;
  padding: 0.35rem 0.6rem;
  border-radius: 10px;
  max-width: 88%;
}

.chat-msg.left {
  background: #f1f5f9;
  color: #334155;
  align-self: flex-start;
  border-bottom-left-radius: 2px;
}

.chat-msg.right {
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  color: white;
  align-self: flex-end;
  border-bottom-right-radius: 2px;
}

/* ═══════════════════════════════════════════════════════════════
   DEFAULT GENERIC
   ═══════════════════════════════════════════════════════════════ */
.mockup-generic {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.generic-icon-box {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: linear-gradient(135deg, #ff9a4d, #ff5f8f);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.generic-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #64748b;
}
</style>
