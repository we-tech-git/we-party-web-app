# Styles

Documento vivo, expandido na Fase 7 do `REFACTOR_AUDIT_PLAN.md`. Explica de
onde vem cor/espaçamento/radius/sombra no projeto e em que ordem decidir
onde declarar um valor novo.

## Arquivos desta pasta

| Arquivo | Status | Conteúdo |
|---|---|---|
| `main.css` | ativo | Entry point de CSS global: importa `tokens.css`, as camadas do Tailwind (`preflight`/`theme`/`utilities`) e `shared-styles.css`, nessa ordem. |
| `tokens.css` | ativo | Fonte única de **cor** do produto (`--color-*`), carregada de fato pelo app. Ver comentário no topo do arquivo para o histórico (Fase 2 do plano). |
| `shared-styles.css` | ativo | Classes utilitárias e estilos globais compartilhados entre páginas. |
| `settings.scss` | ativo | Overrides de configuração do Vuetify (SCSS). |
| `css-variables.css` | **não usado** | Nunca é importado por `main.css` nem por nenhum outro arquivo — achado da Fase 2. Define `--z-*`, `--breakpoint-*`, `--gradient-*`, `--shadow-*`, `--blur-*`, `--transition-*`, `--radius-*`, `--space-*`, `--text-*`, mas nenhuma dessas variáveis está ativa hoje; qualquer `var(--radius-md)` etc. espalhado pelo código cai no fallback escrito à mão (quando existe) ou não faz nada. Ativar essas categorias (uma de cada vez, com QA visual dedicado) é trabalho de uma fase futura — não confundir com "documentação incompleta": o arquivo existe, só não está plugado. |

## Onde vem cada coisa hoje

- **Cor**: `--color-primary` (`#ff5f8f`) / `--color-secondary` (`#ff9a4d`) em
  `tokens.css`, e as mesmas duas cores hardcoded de novo no tema do Vuetify
  (`src/plugins/vuetify.ts`) porque a API de tema do Vuetify não lê
  CSS custom properties. Se mudar a cor da marca, mudar **nos dois lugares**
  — não há hoje um jeito de derivar um dos dois automaticamente do outro.
- **Radius/sombra/espaçamento/transição/z-index**: sem token ativo (ver
  tabela acima) — cada arquivo `.vue` declara o próprio valor em
  `<style scoped>`. Não inventar um novo padrão isolado ao escrever
  componente novo; olhar o que os componentes vizinhos já usam (ex.:
  `border-radius: 16px` é o valor mais comum pra card no código atual).
- **Design System (Vuetify)**: componentes de interação complexa (`v-btn`,
  `v-dialog`, `v-menu`, `v-select`, etc.) e o wrapper de tema
  (`src/plugins/vuetify.ts`).
- **Utilitário (Tailwind)**: classes de layout/spacing/typography pontuais
  direto no template (`flex`, `gap-2`, `text-sm`, `rounded-xl`...).
- **CSS scoped**: qualquer coisa específica de um componente que não é nem
  "componente de interação Vuetify" nem "utilitário Tailwind genérico"
  (animação própria, seletor composto, estado visual específico da tela).

## Ordem de decisão ao estilizar algo novo

1. **Existe componente do Design System (`src/components/UI/`) ou do
   Vuetify pra isso?** Usar esse, não recriar. Ver `docs/DESIGN_SYSTEM.md`
   para o catálogo e o critério de quando estender vs. criar novo.
2. **É layout/spacing/typography genérico, sem estado nem lógica visual
   condicional complexa?** Classe utilitária do Tailwind, direto no
   template.
3. **É visual específico deste componente (animação, seletor composto,
   pseudo-elemento, media query própria)?** `<style scoped>` no próprio
   `.vue`.
4. **É cor?** Sempre `var(--color-*)` de `tokens.css` — nunca hex
   hardcoded novo. Se a cor que você precisa não existe em `tokens.css`,
   isso é sinal de discutir se ela devia existir ali antes de hardcodar.
5. **Layout das telas com sidebar (Feed, Perfil, Perfil público)**:
   usar `--layout-max-width`, `--layout-column-gap`,
   `--layout-sidebar-width` e `--layout-side-padding` de `tokens.css`, e
   **não** somar `margin-top` no shell — o respiro abaixo do header vem do
   próprio `AppHeader` (`margin-bottom: 1rem`). Assim o conteúdo não "pula"
   ao navegar entre essas telas.
6. **Radius/sombra/espaçamento/transição/z-index**: como esses tokens não
   estão ativos ainda (ver tabela acima), usar o valor mais comum já
   presente nos componentes vizinhos em vez de inventar um número novo —
   não usar `css-variables.css`, que não tem efeito.

Esta ordem existe para não repetir os problemas que motivaram a Fase 2 do
`REFACTOR_AUDIT_PLAN.md` (3 paletas de cor incompatíveis coexistindo).
