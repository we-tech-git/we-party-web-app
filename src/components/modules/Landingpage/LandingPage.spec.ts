import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createI18n } from 'vue-i18n'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createTestVuetify } from '@/test/vuetify'
import LandingPage from './LandingPage.vue'

// Teste de regressão da Fase 4 (REFACTOR_AUDIT_PLAN.md) — comportamento
// visível, escrito ANTES de decompor LandingPage.vue na Fase 5.

vi.mock('@/api/event', () => ({
  getAllPublicEvents: vi.fn().mockResolvedValue({ data: [] }),
  getPublicTrendingEvents: vi.fn().mockResolvedValue({ data: [] }),
}))

function mountLandingPage () {
  const vuetify = createTestVuetify()
  const i18n = createI18n({ legacy: false, locale: 'pt-BR', messages: { 'pt-BR': {} } })
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/public/Login', component: { template: '<div />' } },
      { path: '/public/Signup', component: { template: '<div />' } },
      { path: '/public/Landingpage', component: { template: '<div />' } },
      { path: '/public/updates', component: { template: '<div />' } },
      { path: '/public/explore', component: { template: '<div />' } },
    ],
  })

  return mount(LandingPage, {
    global: {
      plugins: [vuetify, i18n, router],
    },
  })
}

describe('LandingPage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('monta sem lançar erro', () => {
    expect(() => mountLandingPage()).not.toThrow()
  })

  it('mostra o CTA de cadastro e o link de login', () => {
    const wrapper = mountLandingPage()
    expect(wrapper.text()).toContain('CADASTRO')
    expect(wrapper.text()).toContain('Entrar')
  })

  it('renderiza o footer único do app (AppFooter)', () => {
    const wrapper = mountLandingPage()
    expect(wrapper.find('footer.app-footer').exists()).toBe(true)
  })

  it('abre e fecha o menu mobile', async () => {
    const wrapper = mountLandingPage()
    const menuBtn = wrapper.find('.mobile-menu-btn')
    expect(wrapper.find('#mobile-menu').exists()).toBe(false)

    await menuBtn.trigger('click')
    expect(wrapper.find('#mobile-menu').exists()).toBe(true)

    await menuBtn.trigger('click')
    expect(wrapper.find('#mobile-menu').exists()).toBe(false)
  })
})
