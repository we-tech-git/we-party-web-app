import type { Meta, StoryObj } from '@storybook/vue3-vite'
import ShareButton from './ShareButton.vue'

/**
 * Botão redondo de compartilhar (só ícone). Usado no perfil próprio e no
 * perfil de terceiro — o clique abre o ShareSheet na tela.
 */
const meta: Meta<typeof ShareButton> = {
  title: 'Components/ShareButton',
  component: ShareButton,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof ShareButton>

export const Padrao: Story = {
  args: { label: 'Compartilhar perfil' },
}
