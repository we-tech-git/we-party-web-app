import type { Meta, StoryObj } from '@storybook/vue3-vite'
import AvatarStack from './AvatarStack.vue'

/**
 * Avatares sobrepostos, decorativos (`aria-hidden`) — o texto ao lado é quem
 * informa. Usado no hero de Interesse ("quem já segue") e no perfil de
 * terceiro ("seguido por quem você segue"). O anel acompanha o fundo pela
 * variável CSS `--avatar-stack-ring`.
 */
const meta: Meta<typeof AvatarStack> = {
  title: 'Components/AvatarStack',
  component: AvatarStack,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof AvatarStack>

const people = [
  { id: '1', name: 'Ana Souza' },
  { id: '2', name: 'Bruno Lima' },
  { id: '3', name: 'Carla Dias' },
  { id: '4', name: 'Diego Alves' },
]

export const Padrao: Story = {
  args: { people },
}

export const LimiteMenor: Story = {
  args: { people, max: 2 },
}

export const SobreFundoEscuro: Story = {
  render: args => ({
    components: { AvatarStack },
    setup () {
      return { args }
    },
    template: '<div style="padding:1rem;background:var(--color-dark);--avatar-stack-ring:var(--color-dark)"><AvatarStack v-bind="args" /></div>',
  }),
  args: { people },
}
