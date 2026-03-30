<script setup lang="ts">
  import { useGuestMode } from '@/composables/useGuestMode'

  const {
    showLoginRequiredDialog,
    lastBlockedAction,
    closeDialog,
    goToLogin,
    goToSignup,
  } = useGuestMode()
</script>

<template>
  <Teleport to="body">
    <Transition name="dialog-fade">
      <div v-if="showLoginRequiredDialog" class="login-required-overlay" @click.self="closeDialog">
        <div class="login-required-dialog">
          <!-- Ícone decorativo -->
          <div class="dialog-icon">
            <svg
              fill="none"
              height="48"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              viewBox="0 0 24 24"
              width="48"
            >
              <rect
                height="11"
                rx="2"
                ry="2"
                width="18"
                x="3"
                y="11"
              />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          <!-- Conteúdo -->
          <h2 class="dialog-title">Acesso Restrito</h2>
          <p class="dialog-message">
            Para <strong>{{ lastBlockedAction || 'acessar esta funcionalidade' }}</strong>,
            é necessário ter uma conta na We Party.
          </p>
          <p class="dialog-submessage">
            Crie sua conta gratuitamente e aproveite todos os recursos da plataforma!
          </p>

          <!-- Botões de ação -->
          <div class="dialog-actions">
            <button class="btn-primary" type="button" @click="goToSignup">
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
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" x2="20" y1="8" y2="14" />
                <line x1="23" x2="17" y1="11" y2="11" />
              </svg>
              <span>Criar Conta Grátis</span>
            </button>
            <button class="btn-secondary" type="button" @click="goToLogin">
              <span>Já tenho conta</span>
            </button>
          </div>

          <!-- Botão fechar -->
          <button aria-label="Fechar" class="dialog-close" type="button" @click="closeDialog">
            <svg
              fill="none"
              height="20"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              viewBox="0 0 24 24"
              width="20"
            >
              <line x1="18" x2="6" y1="6" y2="18" />
              <line x1="6" x2="18" y1="6" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.login-required-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  padding: 1rem;
}

.login-required-dialog {
  position: relative;
  width: 100%;
  max-width: 420px;
  background: linear-gradient(145deg, #1a1d2e 0%, #0d0f1a 100%);
  border: 1px solid rgba(255, 154, 181, 0.2);
  border-radius: 24px;
  padding: 2.5rem 2rem 2rem;
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 154, 181, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  text-align: center;
  animation: dialogEnter 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes dialogEnter {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.dialog-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(255, 154, 181, 0.15), rgba(255, 183, 77, 0.15));
  border-radius: 50%;
  border: 2px solid rgba(255, 154, 181, 0.3);
}

.dialog-icon svg {
  color: #ff9ab5;
}

.dialog-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
  margin: 0 0 0.75rem;
  letter-spacing: -0.02em;
}

.dialog-message {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.85);
  margin: 0 0 0.5rem;
  line-height: 1.5;
}

.dialog-message strong {
  color: #ffb74d;
}

.dialog-submessage {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 1.75rem;
  line-height: 1.4;
}

.dialog-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.btn-primary,
.btn-secondary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.875rem 1.5rem;
  border-radius: 14px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn-primary {
  background: linear-gradient(135deg, #ff9ab5 0%, #ffb74d 100%);
  color: #0d0f1a;
  box-shadow: 0 4px 15px rgba(255, 154, 181, 0.4);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 154, 181, 0.5);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.25);
}

.dialog-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.2s ease;
}

.dialog-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

/* Transições */
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.25s ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

.dialog-fade-enter-from .login-required-dialog,
.dialog-fade-leave-to .login-required-dialog {
  transform: scale(0.9) translateY(20px);
}

/* Responsivo */
@media (max-width: 480px) {
  .login-required-dialog {
    padding: 2rem 1.5rem 1.5rem;
    border-radius: 20px;
  }

  .dialog-icon {
    width: 70px;
    height: 70px;
  }

  .dialog-icon svg {
    width: 40px;
    height: 40px;
  }

  .dialog-title {
    font-size: 1.25rem;
  }

  .dialog-message {
    font-size: 0.9rem;
  }
}
</style>
