import type { Meta, StoryObj } from '@storybook/vue3-vite'
import AppLoader from './AppLoader.vue'

/**
 * Loader padrão do app — usado em toda ação assíncrona (ver AGENTS.md,
 * regra "Ação assíncrona = loading no gatilho + toast no fim"). Antes de
 * criar um novo indicador de carregamento, veja se uma das variantes daqui
 * já serve (regra de reuso — REFACTOR_AUDIT_PLAN.md, seção 2.7).
 */
const meta: Meta<typeof AppLoader> = {
  title: 'Components/AppLoader',
  component: AppLoader,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    variant: { control: 'select', options: ['spinner', 'text', 'overlay'] },
  },
}

export default meta
type Story = StoryObj<typeof AppLoader>

export const Spinner: Story = {
  args: { variant: 'spinner', size: 'md' },
}

export const ComTexto: Story = {
  args: { variant: 'text', size: 'md', text: 'Carregando...' },
}

export const Overlay: Story = {
  args: { variant: 'overlay', text: 'Carregando eventos...' },
  decorators: [() => ({ template: '<div style="position:relative;height:160px;border:1px dashed #ccc"><story /></div>' })],
}
