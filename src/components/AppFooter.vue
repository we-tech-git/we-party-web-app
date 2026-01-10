<script setup lang="ts">
  const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="app-footer">
    <div class="footer-top">
      <div class="app-cta">
        <a href="#">Baixe nosso app</a>
      </div>
    </div>

    <div class="footer-content">
      <div class="footer-links-grid">
        <div class="footer-column">
          <h4>Encontre Eventos</h4>
          <ul>
            <li><a href="#">Hoje</a></li>
            <li><a href="#">Amanhã</a></li>
            <li><a href="#">Esta semana</a></li>
            <li><a href="#">Este fim de semana</a></li>
            <li><a href="#">Próxima semana</a></li>
            <li><a href="#">Este mês</a></li>
          </ul>
        </div>

        <div class="footer-column">
          <h4>Cidades</h4>
          <ul>
            <li><a href="#">São Paulo</a></li>
            <li><a href="#">Belo Horizonte</a></li>
            <li><a href="#">Rio de Janeiro</a></li>
            <li><a href="#">Porto Alegre</a></li>
            <li><a href="#">Brasília</a></li>
            <li><a href="#">Salvador</a></li>
            <li><a href="#">Curitiba</a></li>
            <li><a href="#">Recife</a></li>
            <li><a href="#">Florianópolis</a></li>
            <li><a href="#">Campinas</a></li>
            <li><a href="#">Fortaleza</a></li>
            <li><a href="#">Goiânia</a></li>
          </ul>
        </div>

        <div class="footer-column">
          <h4>Categorias</h4>
          <ul>
            <li><a href="#">We Party Play</a></li>
            <li><a href="#">Festas e shows</a></li>
            <li><a href="#">Teatros e espetáculos</a></li>
            <li><a href="#">Cursos e workshops</a></li>
            <li><a href="#">Congressos e palestras</a></li>
            <li><a href="#">Esporte</a></li>
            <li><a href="#">Passeios e tours</a></li>
            <li><a href="#">Gastronomia</a></li>
          </ul>
        </div>

        <div class="footer-column">
          <h4>Para Produtores</h4>
          <ul>
            <li><a href="#">Soluções</a></li>
            <li><a href="#">Transmissão online</a></li>
            <li><a href="#">Cursos online</a></li>
            <li><a href="#">Preço</a></li>
            <li><a href="#">Integrações</a></li>
            <li><a href="#">Cases de sucesso</a></li>
            <li><a href="#">Consultor de vendas</a></li>
            <li><a href="#">Homologados</a></li>
            <li><a href="#">API</a></li>
          </ul>
        </div>

        <div class="footer-column">
          <h4>Ajuda</h4>
          <ul>
            <li><a href="#">Entre em contato</a></li>
            <li><a href="#">Tickets</a></li>
          </ul>
        </div>
      </div>

      <hr class="footer-divider">

      <div class="footer-bottom">
        <span class="copyright">we party © Copyright {{ currentYear }}</span>
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
