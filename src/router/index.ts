/**
 * router/index.ts
 *
 * Automatic routes for `./src/pages/*.vue`
 * Com lazy loading implementado para melhor performance
 */

// Composables
import type { RouteRecordRaw } from 'vue-router'
import { setupLayouts } from 'virtual:generated-layouts'
import { createRouter, createWebHistory } from 'vue-router'
import { routes as autoRoutes } from 'vue-router/auto-routes'
import { privateRouteGuard, publicRouteGuard } from '@/composables/useAuth'
import { logger } from '@/utils/logger'

/**
 * Route groups `(private)` / `(public)` viram nós-pai com `path: '/'` e
 * **sem** `component`. O `setupLayouts` trata o grupo `(private)` (que não
 * tem child `path: ''`) como se fosse a própria home: envolve em layout
 * default em `/` e a landing (`(public)/index.vue`) nunca renderiza —
 * `#app` fica vazio em produção.
 *
 * Achata esses wrappers pathless promovendo os filhos a rotas de 1º nível
 * com path absoluto, antes do `setupLayouts`.
 */
function joinRoutePath (parentPath: string, childPath: string): string {
  if (!childPath || childPath === '') {
    return parentPath === '' ? '/' : parentPath
  }
  if (childPath.startsWith('/')) {
    return childPath
  }
  const base = parentPath === '/' ? '' : parentPath.replace(/\/$/, '')
  const joined = `${base}/${childPath}`.replace(/\/+/g, '/')
  return joined.startsWith('/') ? joined : `/${joined}`
}

function flattenGroupRoutes (routes: RouteRecordRaw[], parentPath = ''): RouteRecordRaw[] {
  const result: RouteRecordRaw[] = []

  for (const route of routes) {
    const isGroupWrapper
      = !route.component
        && Array.isArray(route.children)
        && route.children.length > 0

    if (isGroupWrapper) {
      const groupPath = joinRoutePath(parentPath, route.path || '')
      result.push(...flattenGroupRoutes(route.children!, groupPath))
      continue
    }

    const absolutePath = joinRoutePath(parentPath, route.path || '')

    if (route.children?.length) {
      result.push({
        ...route,
        path: absolutePath,
        children: route.children,
      })
      continue
    }

    result.push({
      ...route,
      path: absolutePath,
    })
  }

  return result
}

// Lazy loading aplicado automaticamente pelas auto-routes do unplugin-vue-router
// As rotas são carregadas sob demanda, reduzindo o bundle inicial

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  // `src/pages/(public)/index.vue` serve a landing em `/`. Grupos de rota
  // são achatados (ver `flattenGroupRoutes`) pra o layout do grupo private
  // não engolir a raiz.
  routes: [
    ...setupLayouts(flattenGroupRoutes(autoRoutes as RouteRecordRaw[])),
  ],
})

// ===============================
// GUARDS DE AUTENTICAÇÃO
// ===============================

router.beforeEach((to, from, next) => {
  // Verifica se é uma rota privada — marcada via `extendRoute` em
  // `vite.config.mts` pra toda rota nascida em `src/pages/(private)/`.
  // As URLs não têm mais o prefixo `/private`, então o sinal não pode mais
  // vir do path; vem do meta da rota.
  if (to.meta.requiresAuth) {
    const canAccess = privateRouteGuard(to.path)
    if (typeof canAccess === 'string') {
      next(canAccess)
      return
    }
  }

  // Verifica se é uma rota pública de autenticação e usuário já está logado
  const path = to.path.toLowerCase()
  if (path.includes('login') || path.includes('signup')) {
    const forceAccess = to.query.force === 'true'
    const shouldRedirect = publicRouteGuard(forceAccess)
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
      logger.error('Dynamic import error, reloading page did not fix it', err)
    } else {
      logger.log('Reloading page to fix dynamic import error')
      localStorage.setItem('vuetify:dynamic-reload', 'true')
      location.assign(to.fullPath)
    }
  } else {
    logger.error(err)
  }
})

router.isReady().then(() => {
  localStorage.removeItem('vuetify:dynamic-reload')
})

export default router
