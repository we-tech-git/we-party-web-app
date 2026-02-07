/**
 * router/index.ts
 *
 * Automatic routes for `./src/pages/*.vue`
 */

// Composables
import { setupLayouts } from 'virtual:generated-layouts'
import { createRouter, createWebHistory } from 'vue-router'
import { routes as autoRoutes } from 'vue-router/auto-routes'
import { privateRouteGuard, publicRouteGuard } from '@/composables/useAuth'

// Adiciona nomes às rotas de recuperação de senha
const passwordRecoveryRoutes = autoRoutes.map(route => {
  if (route.path === '/public/RequestPassword') {
    route.name = 'RequestPassword'
  }
  if (route.path === '/public/VerifyPin') {
    route.name = 'VerifyPin'
  }
  if (route.path === '/public/ResetPassword') {
    route.name = 'ResetPassword'
  }
  return route
})

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Redirect da rota raiz para a landing page
    {
      path: '',
      redirect: '/public/Landing',
    },
    {
      path: '/',
      redirect: '/public/Landing',
    },
    ...setupLayouts(passwordRecoveryRoutes),
  ],
})

// ===============================
// GUARDS DE AUTENTICAÇÃO
// ===============================

router.beforeEach((to, from, next) => {
  console.log('🚦 Navegando para:', to.path)

  // Verifica se é uma rota privada
  if (to.path.startsWith('/private')) {
    const canAccess = privateRouteGuard()
    if (typeof canAccess === 'string') {
      console.log('🔒 Redirecionando para login:', canAccess)
      next(canAccess)
      return
    }
  }

  // Verifica se é uma rota pública de autenticação e usuário já está logado
  // Landing page não deve redirecionar - é página de apresentação
  const path = to.path.toLowerCase()
  if (path.startsWith('/public') && !path.includes('landing') && (path.includes('login') || path.includes('signup'))) {
    const shouldRedirect = publicRouteGuard()
    if (typeof shouldRedirect === 'string') {
      console.log('✅ Usuário já logado, redirecionando para área privada:', shouldRedirect)
      next(shouldRedirect)
      return
    }
  }

  // Permite a navegação
  next()
})

// Workaround for https://github.com/vitejs/vite/issues/11804
router.onError((err, to) => {
  if (err?.message?.includes?.('Failed to fetch dynamically imported module')) {
    if (localStorage.getItem('vuetify:dynamic-reload')) {
      console.error('Dynamic import error, reloading page did not fix it', err)
    } else {
      console.log('Reloading page to fix dynamic import error')
      localStorage.setItem('vuetify:dynamic-reload', 'true')
      location.assign(to.fullPath)
    }
  } else {
    console.error(err)
  }
})

router.isReady().then(() => {
  localStorage.removeItem('vuetify:dynamic-reload')
})

export default router
