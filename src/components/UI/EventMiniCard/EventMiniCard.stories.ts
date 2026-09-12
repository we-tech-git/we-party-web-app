import type { Meta, StoryObj } from '@storybook/vue3-vite'
import EventMiniCard from './EventMiniCard.vue'

/**
 * Card compacto de evento — consolidado na Fase 3 do REFACTOR_AUDIT_PLAN.md
 * a partir de 3 cópias quase idênticas (`Profile.vue` 2x, `PublicProfile.vue`
 * 1x) que já tinham divergido em CSS. O rodapé de estatísticas é o slot
 * `#stats`, porque varia de verdade entre quem usa o card (interativo com
 * botão de descurtir vs. só texto read-only) — não force um novo `.mini-card`
 * do zero numa tela nova: use este componente e passe o `#stats` que fizer
 * sentido (regra de reuso — REFACTOR_AUDIT_PLAN.md, seção 2.7).
 */
const meta: Meta<typeof EventMiniCard> = {
  title: 'Components/EventMiniCard',
  component: EventMiniCard,
  tags: ['autodocs'],
  render: args => ({
    components: { EventMiniCard },
    setup () {
      return { args }
    },
    template: '<div style="max-width:280px"><EventMiniCard v-bind="args" /></div>',
  }),
}

export default meta
type Story = StoryObj<typeof EventMiniCard>

const bannerUrl = 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400'

export const Padrao: Story = {
  args: {
    title: 'Festa de Réveillon na Praia',
    bannerUrl,
    dateLabel: '31 dez',
    location: 'Copacabana, Rio de Janeiro',
  },
}

export const Confirmado: Story = {
  args: {
    ...Padrao.args,
    confirmed: true,
  },
}

export const ComStatsInterativas: Story = {
  render: args => ({
    components: { EventMiniCard },
    setup () {
      return { args }
    },
    template: `
      <div style="max-width:280px">
        <EventMiniCard v-bind="args">
          <template #stats>
            <span class="mini-stat" style="display:inline-flex;align-items:center;gap:.4rem;font-size:.85rem;color:#555b77;font-weight:600">
              <i class="mdi mdi-account-multiple" /> 42
            </span>
            <button class="mini-stat" style="display:inline-flex;align-items:center;gap:.4rem;font-size:.85rem;color:#555b77;font-weight:600;background:none;border:none;cursor:pointer">
              ♥ 128
            </button>
          </template>
        </EventMiniCard>
      </div>
    `,
  }),
  args: Padrao.args,
}
