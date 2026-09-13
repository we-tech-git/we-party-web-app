<script setup lang="ts">
  // Extraído de LandingPage.vue na Fase 5 (REFACTOR_AUDIT_PLAN.md) — 2ª fatia
  // da decomposição. Seção estática (sem estado próprio), escolhida por ser
  // simples e de baixo risco.
  //
  // Antes de mover, mapeada TODA classe usada no template (não só as
  // exclusivas da seção) contra o CSS restante do arquivo — lição da Fase 5
  // parte 1, que esqueceu `.container` e quebrou a centralização em
  // produção. `.container` e `.btn-cta-primary`/`.btn-glow` abaixo são
  // duplicados de propósito: ainda usados por outras seções não extraídas
  // (`.container` por quase todas; `.btn-cta-primary` também pela seção
  // "discover"). Reavaliar extrair pra um componente/DS compartilhado
  // quando essas seções também saírem.
</script>

<template>
  <section id="novidades" class="updates-teaser">
    <div class="container">
      <div class="updates-banner">
        <span class="updates-banner-deco updates-banner-deco-1">🚀</span>
        <span class="updates-banner-deco updates-banner-deco-2">✨</span>
        <div class="updates-banner-info">
          <div class="updates-banner-icon">🚀</div>
          <div>
            <div class="updates-banner-title">Fique por dentro das novidades da We Party</div>
            <div class="updates-banner-desc">Novos recursos, melhorias e o que vem por aí — acompanhe tudo na nossa página de atualizações.</div>
          </div>
        </div>
        <router-link v-slot="{ href, navigate }" custom to="/updates">
          <a class="btn-cta-primary" :href="href" @click="navigate">
            <span>Ver novidades</span>
            <div class="btn-glow" />
          </a>
        </router-link>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Duplicado de LandingPage.vue — ver comentário no <script>. */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  position: relative;
  z-index: 2;
  width: 100%;
}

@media (max-width: 768px) {
  .container {
    padding: 0 1.25rem;
  }
}

@media (max-width: 480px) {
  .container {
    padding: 0 1rem;
  }
}

.btn-cta-primary {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.1rem 2.25rem;
  background: linear-gradient(90deg, #ff9a4d, #ff5f8f);
  border: none;
  border-radius: 14px;
  color: white;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 10px 30px rgba(255, 95, 143, 0.35);
  position: relative;
  overflow: hidden;
  transform: translateZ(0);
  will-change: transform;
}

.btn-cta-primary .btn-glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transform: translateX(-100%);
  transition: transform 0.6s ease;
}

.btn-cta-primary:hover .btn-glow {
  transform: translateX(100%);
}

.btn-cta-primary:hover {
  transform: translateY(-3px) translateZ(0);
  box-shadow: 0 16px 40px rgba(255, 95, 143, 0.45);
}

/* ═══════════════════════════════════════════════════════════════════════════
   NOVIDADES — BANNER DE CONVITE PRA PÁGINA DE UPDATES
   ═══════════════════════════════════════════════════════════════════════════ */
.updates-teaser {
  padding: 0 0 6rem;
  position: relative;
}

.updates-banner {
  background: linear-gradient(120deg, var(--dark) 0%, #33244d 60%, #4a2650 100%);
  border-radius: 28px;
  padding: 2.75rem 3rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2.5rem;
  position: relative;
  overflow: hidden;
  will-change: transform;
}

.updates-banner-deco {
  position: absolute;
  opacity: 0.08;
  pointer-events: none;
}

.updates-banner-deco-1 {
  left: -20px;
  top: -30px;
  font-size: 130px;
}

.updates-banner-deco-2 {
  right: 10%;
  bottom: -20px;
  font-size: 90px;
}

.updates-banner-info {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  text-align: left;
  position: relative;
  z-index: 1;
}

.updates-banner-icon {
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  border-radius: 20px;
  background: var(--gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  box-shadow: 0 12px 30px rgba(249, 120, 163, 0.35);
}

.updates-banner-title {
  font-size: 1.3rem;
  font-weight: 800;
  color: #fff;
  margin-bottom: 0.4rem;
}

.updates-banner-desc {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.65);
  line-height: 1.6;
}

.updates-banner .btn-cta-primary {
  white-space: nowrap;
  position: relative;
  z-index: 1;
}

/* Responsivo — movido de LandingPage.vue junto com o resto da seção. */
@media (max-width: 1024px) {
  .updates-banner {
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
  }

  .updates-banner .btn-cta-primary {
    align-self: stretch;
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .updates-teaser {
    padding-bottom: 4rem;
  }
}

@media (max-width: 480px) {
  .updates-banner-info {
    flex-direction: column;
    text-align: center;
  }
}
</style>
