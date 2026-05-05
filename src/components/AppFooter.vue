<script setup lang="ts">
  const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="app-footer">
    <div class="footer-content">
      <div class="footer-links-grid">
        <div class="footer-column">
          <h4>Encontre Eventos</h4>
          <ul>
            <li><router-link to="/private/feed?dateFilter=today">Hoje</router-link></li>
            <li><router-link to="/private/feed?dateFilter=tomorrow">Amanhã</router-link></li>
            <li><router-link to="/private/feed?dateFilter=week">Esta semana</router-link></li>
            <li><router-link to="/private/feed?dateFilter=month">Este mês</router-link></li>
          </ul>
        </div>

        <div class="footer-column">
          <h4>Sobre a Empresa</h4>
          <ul>
            <li><a
              class="notranslate"
              href="https://www.wetechhub.com.br"
              rel="noopener noreferrer"
              target="_blank"
              translate="no"
            >We TechHub</a></li>
          </ul>
        </div>
      </div>

      <hr class="footer-divider">

      <div class="footer-bottom">
        <span class="copyright"><span class="notranslate" translate="no">we party</span> © Copyright {{ currentYear
        }}</span>
        <div class="social-icons">
          <a aria-label="Facebook" href="#">
            <svg fill="currentColor" height="24" viewBox="0 0 24 24" width="24">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
            </svg>
          </a>
          <a aria-label="Instagram" href="#">
            <svg
              fill="none"
              height="24"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              viewBox="0 0 24 24"
              width="24"
            >
              <rect
                height="20"
                rx="5"
                ry="5"
                width="20"
                x="2"
                y="2"
              />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
            </svg>
          </a>
          <a aria-label="X (Twitter)" href="#">
            <svg fill="currentColor" height="24" viewBox="0 0 24 24" width="24">
              <path
                d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"
              />
            </svg>
          </a>
          <a aria-label="LinkedIn" href="#">
            <svg fill="currentColor" height="24" viewBox="0 0 24 24" width="24">
              <path
                d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zM4 2a2 2 0 1 1-2 2 2 2 0 0 1 2-2z"
              />
            </svg>
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  background-color: #FBAF42;
  /* Aprox orange from screenshot */
  color: #fff;
  padding: 2rem 0;
  font-family: 'Inter', sans-serif;
}

.footer-content {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 2rem;
}

.footer-top {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 2rem 1rem;
  display: flex;
  justify-content: flex-end;
}

.app-cta a {
  color: #fff;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.95rem;
}

.app-cta a:hover {
  text-decoration: underline;
}

.footer-links-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 2rem;
  margin-bottom: 2rem;
}

.footer-column h4 {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: #fff;
}

.footer-column ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-column li {
  margin-bottom: 0.5rem;
}

.footer-column a {
  color: #fff;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 400;
  opacity: 0.9;
  transition: opacity 0.2s;
}

.footer-column a:hover {
  opacity: 1;
  text-decoration: underline;
}

.footer-divider {
  border: 0;
  height: 1px;
  background: rgba(255, 255, 255, 0.4);
  margin: 2rem 0;
}

.footer-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.copyright {
  font-size: 0.9rem;
  font-weight: 500;
}

.social-icons {
  display: flex;
  gap: 1.5rem;
}

.social-icons a {
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
}

.social-icons a:hover {
  transform: translateY(-2px);
}

@media (max-width: 960px) {
  .footer-links-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 600px) {
  .footer-links-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .footer-bottom {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
}
</style>
