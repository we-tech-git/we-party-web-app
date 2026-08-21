<script setup lang="ts">
  import { useRouter } from 'vue-router'

  const router = useRouter()
  const currentYear = new Date().getFullYear()

  function goToHome () {
    router.push('/')
  }

  function goToExplore () {
    router.push('/public/explore')
  }

  function goToSignup () {
    router.push('/public/Signup')
  }
</script>

<template>
  <footer class="updates-footer">
    <div class="footer-container">
      <div class="footer-grid">
        <!-- Brand Col -->
        <div class="footer-brand-col">
          <div class="footer-logo" @click="goToHome">
            <img alt="We Party Logo" class="footer-logo-img" src="/logoweparty.png">
            <span class="footer-logo-text">We Party</span>
          </div>
          <p class="footer-brand-desc">
            A rede social criada para conectar pessoas reais às melhores festas, eventos e momentos da vida social.
          </p>
          <div class="footer-social-links">
            <a
              aria-label="Instagram da We Party"
              class="social-link-btn"
              href="https://www.instagram.com/weparty.br"
              rel="noopener noreferrer"
              target="_blank"
            >
              <v-icon icon="mdi-instagram" size="20" />
            </a>
            <a
              aria-label="LinkedIn da We Party"
              class="social-link-btn"
              href="https://www.linkedin.com/company/we-tech-hub"
              rel="noopener noreferrer"
              target="_blank"
            >
              <v-icon icon="mdi-linkedin" size="20" />
            </a>
          </div>
        </div>

        <!-- Navigation Col -->
        <div class="footer-nav-col">
          <h4 class="footer-column-title">Navegação</h4>
          <ul class="footer-links-list">
            <li><button class="footer-link-btn" type="button" @click="goToHome">Página Inicial</button></li>
            <li><button class="footer-link-btn" type="button" @click="goToExplore">Feed de Eventos</button></li>
            <li><button class="footer-link-btn" type="button" @click="goToSignup">Criar Conta</button></li>
          </ul>
        </div>

        <!-- Updates Col -->
        <div class="footer-nav-col">
          <h4 class="footer-column-title">Plataforma</h4>
          <ul class="footer-links-list">
            <li><router-link class="footer-link" to="/public/updates">O que há de novo</router-link></li>
            <li><router-link class="footer-link" to="/public/explore">Modo Visitante</router-link></li>
            <li><span class="footer-version-tag">Versão 2026</span></li>
          </ul>
        </div>

        <!-- Legal Col -->
        <div class="footer-nav-col">
          <h4 class="footer-column-title">Institucional</h4>
          <ul class="footer-links-list">
            <li>
              <a
                class="footer-link"
                href="/termos-de-uso.pdf"
                rel="noopener noreferrer"
                target="_blank"
              >
                Termos de Uso
              </a>
            </li>
            <li>
              <a
                class="footer-link"
                href="/politica-de-privacidade.pdf"
                rel="noopener noreferrer"
                target="_blank"
              >
                Privacidade
              </a>
            </li>
            <li>
              <a
                class="footer-link"
                href="https://www.wetechhub.com.br"
                rel="noopener noreferrer"
                target="_blank"
              >
                We TechHub
              </a>
            </li>
          </ul>
        </div>
      </div>

      <!-- Bottom Bar -->
      <div class="footer-bottom-bar">
        <p class="footer-copy-text">
          © {{ currentYear }} We Party. Todos os direitos reservados. Feito com paixão pela vida social.
        </p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.updates-footer {
  background: #0f172a;
  color: #94a3b8;
  padding: 4.5rem 0 2rem;
  font-family: 'Inter', sans-serif;
  border-top: 1px solid rgba(255, 154, 77, 0.15);
}

.footer-container {
  max-width: 1240px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.footer-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 3rem;
  margin-bottom: 3.5rem;
}

/* Brand */
.footer-brand-col {
  display: flex;
  flex-direction: column;
}

.footer-logo {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  cursor: pointer;
  margin-bottom: 1rem;
}

.footer-logo-img {
  width: 34px;
  height: 34px;
  object-fit: contain;
}

.footer-logo-text {
  font-size: 1.4rem;
  font-weight: 800;
  font-family: 'Baloo Thambi 2', cursive;
  background: linear-gradient(135deg, #ff9a4d 0%, #ff5f8f 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.footer-brand-desc {
  font-size: 0.9rem;
  line-height: 1.6;
  color: #94a3b8;
  max-width: 320px;
  margin-bottom: 1.5rem;
}

.footer-social-links {
  display: flex;
  gap: 0.75rem;
}

.social-link-btn {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  color: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  text-decoration: none;
}

.social-link-btn:hover {
  background: linear-gradient(135deg, #ff9a4d, #ff5f8f);
  color: white;
  transform: translateY(-2px);
}

/* Links */
.footer-column-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #f8fafc;
  margin-bottom: 1.25rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.footer-links-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.footer-link,
.footer-link-btn {
  color: #94a3b8;
  text-decoration: none;
  font-size: 0.88rem;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  text-align: left;
  transition: color 0.2s ease;
}

.footer-link:hover,
.footer-link-btn:hover {
  color: #ff5f8f;
}

.footer-version-tag {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 700;
  color: #ff9a4d;
  background: rgba(255, 154, 77, 0.12);
  padding: 0.2rem 0.55rem;
  border-radius: 6px;
}

/* Bottom Bar */
.footer-bottom-bar {
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.footer-copy-text {
  font-size: 0.82rem;
  color: #64748b;
  margin: 0;
}

@media (max-width: 960px) {
  .footer-grid {
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }
}

@media (max-width: 540px) {
  .footer-grid {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
}
</style>
