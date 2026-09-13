<script setup lang="ts">
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'

  // Footer único do app (REFACTOR_AUDIT_PLAN.md, Fase 1) — conteúdo migrado
  // do footer da Landingpage pública (decisão do time), usado agora também
  // fora dela. Os links de seção ("Como funciona"/"Recursos") por isso não
  // fazem scroll direto num elemento local (só existiria na Landingpage) —
  // navegam pra lá com hash, e a Landingpage escuta o hash pra rolar até a
  // seção certa, esteja ela montada ou navegando de outra página.
  const router = useRouter()

  const currentYear = new Date().getFullYear()
  const instagramUrl = 'https://instagram.com/weparty'

  function goToLandingSection (sectionId: string) {
    router.push({ path: '/Landingpage', hash: `#${sectionId}` })
  }

  const showTermsModal = ref(false)
  const termsModalPdf = ref<'terms' | 'privacy'>('terms')
  function openTermsModal (type: 'terms' | 'privacy') {
    termsModalPdf.value = type
    showTermsModal.value = true
  }
</script>

<template>
  <footer class="app-footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-col-brand">
          <div class="footer-brand">
            <img alt="We Party Logo" class="logo-img" src="/logoweparty.png">
            <span class="logo-text">We Party</span>
          </div>
          <p class="footer-brand-desc">O jeito mais fácil de descobrir, criar e viver os melhores eventos perto de você.</p>
          <div class="footer-social">
            <a
              aria-label="Instagram"
              class="social-link"
              :href="instagramUrl"
              rel="noopener noreferrer"
              target="_blank"
            >
              <v-icon icon="mdi-instagram" />
            </a>
          </div>
        </div>

        <div class="footer-col">
          <div class="footer-col-title">PRODUTO</div>
          <button class="footer-link-btn" type="button" @click="goToLandingSection('como-funciona')">Como funciona</button>
          <button class="footer-link-btn" type="button" @click="goToLandingSection('features')">Recursos</button>
          <router-link v-slot="{ href, navigate }" custom to="/Signup">
            <a class="footer-link-btn" :href="href" @click="navigate">Criar evento</a>
          </router-link>
        </div>

        <div class="footer-col">
          <div class="footer-col-title">EMPRESA</div>
          <router-link v-slot="{ href, navigate }" custom to="/updates">
            <a class="footer-link-btn" :href="href" @click="navigate">Novidades</a>
          </router-link>
          <a
            class="footer-link-a"
            href="https://www.wetechhub.com.br/"
            rel="noopener noreferrer"
            target="_blank"
          >We TechHub</a>
        </div>
      </div>

      <div class="footer-bottom">
        <span>© {{ currentYear }} We Party. Todos os direitos reservados.</span>
        <div class="footer-legal-links">
          <button class="footer-link-btn" type="button" @click="openTermsModal('privacy')">Privacidade</button>
          <button class="footer-link-btn" type="button" @click="openTermsModal('terms')">Termos de uso</button>
        </div>
      </div>
    </div>
  </footer>

  <!-- Modal de Termos / Política — autocontido, funciona em qualquer página -->
  <Teleport to="body">
    <Transition name="app-footer-modal-fade">
      <div v-if="showTermsModal" class="terms-modal-overlay" @click.self="showTermsModal = false">
        <div class="terms-modal">
          <div class="terms-modal-header">
            <h3 class="terms-modal-title">
              {{ termsModalPdf === 'terms' ? 'Termos de Uso' : 'Política de Privacidade' }}
            </h3>
            <button class="terms-modal-close" type="button" @click="showTermsModal = false">
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
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="terms-modal-body">
            <iframe
              class="terms-pdf-viewer"
              :src="termsModalPdf === 'terms' ? '/termos-de-uso.pdf' : '/politica-de-privacidade.pdf'"
              title="Documento legal"
            />
          </div>
          <div class="terms-modal-footer">
            <button class="terms-close-btn" type="button" @click="showTermsModal = false">
              Fechar
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Valores abaixo resolvidos a partir do que a Landingpage já renderizava
   (var(--dark)/var(--primary)/var(--gradient) locais dela). Migram pra
   src/styles/tokens.css na Fase 2 — não introduzido aqui pra não misturar
   a consolidação de header/footer com a de tokens visuais. */
.app-footer {
  padding: 5rem 0 2rem;
  background: linear-gradient(160deg, #1a1a2e, #100f1a);
  position: relative;
  isolation: isolate;
}

.container {
  max-width: 1320px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.footer-grid {
  display: grid;
  grid-template-columns: 1.6fr 1fr 1fr;
  gap: 3rem;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.1rem;
}

.footer-brand .logo-img {
  width: 36px;
  height: 36px;
  object-fit: contain;
}

.footer-brand .logo-text {
  font-family: 'Baloo Thambi 2', serif;
  font-weight: 800;
  font-size: 1.3rem;
  color: #fff;
}

.footer-brand-desc {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.7;
  max-width: 300px;
  margin: 0 0 1.4rem;
}

.footer-social {
  display: flex;
  gap: 0.75rem;
}

.social-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.social-link:hover {
  background: linear-gradient(90deg, #ff9a4d 0%, #ff5f8f 100%);
  transform: translateY(-4px) rotate(10deg);
  box-shadow: 0 8px 20px rgba(255, 95, 143, 0.3);
}

.footer-col-title {
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 1.25rem;
}

.footer-col {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.footer-link-btn,
.footer-link-a {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.92rem;
  cursor: pointer;
  padding: 0;
  font-family: inherit;
  text-align: left;
  transition: color 0.25s ease;
}

.footer-link-btn:hover,
.footer-link-a:hover {
  color: #ff9a4d;
}

.footer-bottom {
  max-width: 1320px;
  margin: 3.5rem auto 0;
  padding-top: 1.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.4);
}

.footer-legal-links {
  display: flex;
  gap: 1.6rem;
}

.footer-legal-links .footer-link-btn {
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.82rem;
}

.footer-legal-links .footer-link-btn:hover {
  color: #ff9a4d;
}

.terms-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  z-index: 3000;
}

.terms-modal {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.terms-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  background: linear-gradient(135deg, #FFF8FA 0%, #FFFDFE 100%);
}

.terms-modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
  margin: 0;
  background: linear-gradient(90deg, #ff9a4d, #ff5f8f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.terms-modal-close {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.05);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #666;
}

.terms-modal-close:hover {
  background: rgba(249, 120, 163, 0.15);
  color: #F978A3;
  transform: rotate(90deg);
}

.terms-modal-body {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.terms-pdf-viewer {
  width: 100%;
  height: 100%;
  min-height: 500px;
  border: none;
}

.terms-modal-footer {
  display: flex;
  gap: 1rem;
  padding: 1.5rem 2rem;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  background: #FAFAFA;
  justify-content: flex-end;
}

.terms-close-btn {
  padding: 0.85rem 2rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid rgba(0, 0, 0, 0.1);
  background: white;
  color: #666;
}

.terms-close-btn:hover {
  border-color: #F978A3;
  color: #F978A3;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(249, 120, 163, 0.2);
}

.app-footer-modal-fade-enter-active,
.app-footer-modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.app-footer-modal-fade-enter-active .terms-modal,
.app-footer-modal-fade-leave-active .terms-modal {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.app-footer-modal-fade-enter-from,
.app-footer-modal-fade-leave-to {
  opacity: 0;
}

.app-footer-modal-fade-enter-from .terms-modal,
.app-footer-modal-fade-leave-to .terms-modal {
  transform: scale(0.9) translateY(30px);
}

@media (max-width: 768px) {
  .footer-grid {
    grid-template-columns: 1fr;
    gap: 2.5rem;
  }

  .footer-bottom {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
