<!--
  Página de teste para verificar autenticação
-->
<script setup lang="ts">
  import { onMounted } from 'vue'
  import { useAuth } from '@/composables/useAuth'

  const {
    isAuthenticated,
    isFullyAuthenticated,
    loggedUser,
    accessToken,
    logout,
    debugAuth,
  } = useAuth()

  function handleLogout () {
    logout()
    console.log('🚪 Fazendo logout...')
  }

  onMounted(() => {
    console.log('🔍 Página de teste carregada')
    debugAuth()
  })
</script>

<template>
  <div class="test-auth-page">
    <div class="container">
      <h1>🧪 Teste de Autenticação</h1>

      <div class="status-section">
        <h2>📊 Status da Autenticação</h2>

        <div class="status-grid">
          <div class="status-item">
            <span class="label">Autenticado:</span>
            <span :class="isAuthenticated ? 'status-yes' : 'status-no'">
              {{ isAuthenticated ? '✅ Sim' : '❌ Não' }}
            </span>
          </div>

          <div class="status-item">
            <span class="label">Completamente Autenticado:</span>
            <span :class="isFullyAuthenticated ? 'status-yes' : 'status-no'">
              {{ isFullyAuthenticated ? '✅ Sim' : '❌ Não' }}
            </span>
          </div>

          <div class="status-item">
            <span class="label">Token Presente:</span>
            <span :class="accessToken ? 'status-yes' : 'status-no'">
              {{ accessToken ? '✅ Sim' : '❌ Não' }}
            </span>
          </div>

          <div class="status-item">
            <span class="label">Usuário Presente:</span>
            <span :class="loggedUser ? 'status-yes' : 'status-no'">
              {{ loggedUser ? '✅ Sim' : '❌ Não' }}
            </span>
          </div>
        </div>
      </div>

      <div v-if="loggedUser" class="user-section">
        <h2>👤 Dados do Usuário</h2>
        <div class="user-info">
          <p><strong>Nome:</strong> {{ loggedUser.name }}</p>
          <p><strong>Username:</strong> {{ loggedUser.username }}</p>
          <p><strong>Email:</strong> {{ loggedUser.email }}</p>
          <p><strong>ID:</strong> {{ loggedUser.id }}</p>
          <p><strong>Roles:</strong> {{ loggedUser.roles?.join(', ') || 'Nenhuma' }}</p>
        </div>
      </div>

      <div v-if="accessToken" class="token-section">
        <h2>🔑 Token</h2>
        <p class="token-display">
          {{ accessToken.slice(0, 50) }}...
        </p>
      </div>

      <div class="actions">
        <button class="btn-debug" @click="debugAuth">
          🔍 Debug no Console
        </button>

        <button v-if="isAuthenticated" class="btn-logout" @click="handleLogout">
          🚪 Fazer Logout
        </button>

        <router-link class="btn-link" to="/public/Login">
          🔗 Ir para Login
        </router-link>
      </div>

      <div class="info-section">
        <h3>ℹ️ Informações</h3>
        <ul>
          <li>Esta página está em uma rota privada (<code>/private/test-auth</code>)</li>
          <li>Se você chegou aqui, significa que a autenticação está funcionando</li>
          <li>Tente fazer logout e acessar esta página novamente</li>
          <li>Você deve ser redirecionado automaticamente para o login</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.test-auth-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 32px;
  font-size: 2.5rem;
}

h2 {
  color: #555;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 8px;
  margin-bottom: 16px;
}

.status-section {
  margin-bottom: 32px;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #dee2e6;
}

.label {
  font-weight: 600;
  color: #495057;
}

.status-yes {
  color: #28a745;
  font-weight: bold;
}

.status-no {
  color: #dc3545;
  font-weight: bold;
}

.user-section, .token-section {
  margin-bottom: 32px;
}

.user-info {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid #28a745;
}

.user-info p {
  margin: 8px 0;
}

.token-display {
  background: #f1f3f4;
  padding: 12px;
  border-radius: 4px;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 0.9rem;
  color: #495057;
  word-break: break-all;
}

.actions {
  display: flex;
  gap: 16px;
  margin-bottom: 32px;
  flex-wrap: wrap;
}

.btn-debug, .btn-logout, .btn-link {
  padding: 12px 24px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-debug {
  background: #17a2b8;
  color: white;
}

.btn-debug:hover {
  background: #138496;
}

.btn-logout {
  background: #dc3545;
  color: white;
}

.btn-logout:hover {
  background: #c82333;
}

.btn-link {
  background: #6f42c1;
  color: white;
}

.btn-link:hover {
  background: #5a32a3;
}

.info-section {
  background: #e7f3ff;
  padding: 20px;
  border-radius: 8px;
  border-left: 4px solid #0066cc;
}

.info-section ul {
  margin: 0;
  padding-left: 20px;
}

.info-section li {
  margin-bottom: 8px;
}

code {
  background: #f1f3f4;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Monaco', 'Courier New', monospace;
}

@media (max-width: 768px) {
  .container {
    margin: 10px;
    padding: 20px;
  }

  .status-grid {
    grid-template-columns: 1fr;
  }

  .actions {
    flex-direction: column;
  }

  h1 {
    font-size: 2rem;
  }
}
</style>
