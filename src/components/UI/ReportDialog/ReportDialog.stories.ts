import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref } from 'vue'
import ReportDialog from './ReportDialog.vue'

/**
 * Diálogo de denúncia genérico — usado hoje para reportar evento e
 * comentário (de evento ou de interesse). Quem abre o diálogo escolhe o
 * `title`/`subtitle` e escuta `submit` para chamar `createReport` com o
 * `ReportType` certo; o componente só coleta o motivo em texto livre.
 */
const meta: Meta<typeof ReportDialog> = {
  title: 'Components/ReportDialog',
  component: ReportDialog,
  tags: ['autodocs'],
  render: args => ({
    components: { ReportDialog },
    setup () {
      const open = ref(true)
      return { args, open }
    },
    template: `
      <div>
        <button type="button" @click="open = true">Abrir diálogo</button>
        <ReportDialog v-bind="args" v-model="open" @submit="open = false" />
      </div>
    `,
  }),
}

export default meta
type Story = StoryObj<typeof ReportDialog>

export const Evento: Story = {
  args: {
    title: 'Reportar evento',
    subtitle: 'Conte o que há de errado com este evento (opcional) — a equipe vai revisar.',
  },
}

export const Comentario: Story = {
  args: {
    title: 'Reportar comentário',
    subtitle: 'Conte o que há de errado (opcional) — a equipe vai revisar.',
  },
}

export const Enviando: Story = {
  args: {
    ...Evento.args,
    submitting: true,
  },
}
