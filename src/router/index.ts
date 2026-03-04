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

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Redirect da rota raiz para o login
    {
      path: '',
      redirect: '/public/Login',
    },
    {
      path: '/',
      redirect: '/public/Login',
    },
    ...setupLayouts(autoRoutes),
  ],
})

// ===============================
// GUARDS DE AUTENTICAÇÃO
// ===============================

router.beforeEach((to, from, next) => {
  // Verifica se é uma rota privada
  if (to.path.startsWith('/private')) {
    const canAccess = privateRouteGuard()
    if (typeof canAccess === 'string') {
      next(canAccess)
      return
    }
  }

  // Verifica se é uma rota pública de autenticação e usuário já está logado
  const path = to.path.toLowerCase()
  if (path.startsWith('/public') && (path.includes('login') || path.includes('signup'))) {
    const shouldRedirect = publicRouteGuard()
    if (typeof shouldRedirect === 'string') {
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
