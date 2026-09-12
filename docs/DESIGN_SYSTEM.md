# Design System — We Party Web App

Documento vivo criado na Fase 7 do `REFACTOR_AUDIT_PLAN.md`. Ponto de
entrada rápido para o catálogo, o critério de reuso/criação e o resultado
da auditoria de duplicação feita na Fase 3. Os tokens (cor/radius/etc.) têm
documento próprio: [`../src/styles/README.md`](../src/styles/README.md).

## Onde fica

`src/components/UI/` é a **única** pasta de Design System do projeto —
`components/modules/UI/` foi absorvida aqui na Fase 3 e não existe mais.
Cada componente tem sua própria subpasta (`AppLoader/AppLoader.vue`,
`AppLoader/AppLoader.stories.ts`).

Catálogo hoje:

| Componente | Story no Storybook? |
|---|---|
| `AppHeader`, `AppFooter` | não |
| `AppLoader` | ✅ |
| `EventMiniCard` | ✅ |
| `AuthLayout`, `ConfirmDialog`, `ErrorBoundary`, `FollowButton`, `GradientText`, `ImageCropper`, `InlinePanel`, `LoginRequiredDialog`, `SearchInput`, `SelectableChip`, `ShareSheet`, `Snackbar`, `SocialAuthButtons`, `UserAvatar`, `WePartyLoader`, `inputLabel` | não |

Adicionar story pros componentes sem story ainda é backlog incremental
(1-2 por PR pequeno, ver Fase 4 do plano) — não é bloqueante pra usá-los.

## Como rodar o Storybook

```bash
yarn storybook          # dev, porta 6006
yarn build-storybook    # build estático
```

## Regra de criação/reuso de componente

Antes de criar um componente novo, nessa ordem:

1. **Existe no Vuetify** (`v-btn`, `v-card`, `v-dialog`, `v-text-field`,
   `v-chip`...)? Usar, configurado via tema/props (`src/plugins/vuetify.ts`).
2. **Existe algo parecido no catálogo acima**? Estender via prop/slot —
   nunca copiar o componente pra customizar numa tela. Se uma tela precisa
   de algo diferente, isso é uma prop/variant nova no componente do DS, não
   uma cópia local.
3. **Aparece pela 2ª vez um padrão visual que não existe em nenhum dos
   dois?** Criar em `src/components/UI/`, com story, e migrar as
   ocorrências existentes pra ele — não deixar as cópias antigas vivas.
4. **É genuinamente único de uma tela e não se repete?** Fica local ao
   componente de módulo (`src/components/modules/...`) — não precisa virar
   DS.

Ver `src/styles/README.md` para a ordem de decisão equivalente do lado de
CSS/estilo (Vuetify → DS → Tailwind → CSS scoped).

## Resultado da auditoria de duplicação (Fase 3)

O que **foi** unificado:

- **AppHeader** / **AppFooter** — cada um tinha várias implementações
  divergentes pelo app (Feed, LandingPage, NewEventDetails...); decidiu-se
  qual versão vira a canônica (header do Feed, footer da Landingpage) e as
  demais foram movidas para `src/components/_revisar_/` (ver o `README.md`
  de lá para o motivo de cada uma).
- **EventMiniCard** — 3 instâncias do mesmo card compacto de evento
  (`Profile.vue` 2x + `PublicProfile.vue` 1x), já divergindo em CSS entre
  si. Unificado num único componente parametrizado; os 3 pontos de uso
  migrados.
- **FeedCard** — `FeedCardStandalone.vue` foi originalmente diagnosticado
  como "variação real precisando de prop de variante", mas a investigação
  na Fase 6 confirmou (via `grep -rln "FeedCardStandalone" src/`) que era
  **código morto** — zero consumidor no app, só o próprio arquivo e o
  `components.d.ts` gerado. Arquivado em `_revisar_/`, não migrado.

O que **foi auditado e decidiu-se não unificar** (parecidos visualmente,
mas resolvendo problemas diferentes — forçar a fusão criaria acoplamento
artificial e `v-if` demais):

- Cards de conteúdo/marketing/atalho em `NewEventDetails.vue`,
  `LandingPage.vue` e `NotFound.vue` — cada um tem dado e comportamento
  próprio do contexto onde vive.

O que **ficou como backlog incremental**, por ter escopo grande demais pra
caber junto da infra inicial do Storybook, mas com o padrão já mapeado:

- **Button** — já existe `.btn-primary` global em `shared-styles.css`, mas
  redeclarado por cima (sobrescrita silenciosa) em pelo menos
  `Interest.vue`/`AddFriends.vue`. Criar componente + migrar os ~24 pontos
  de uso, começando pelos 2 casos de sobrescrita.
- **Modal/ModalShell** — 7 arquivos reimplementam o mesmo esqueleto
  overlay + teleport + transição; `v-dialog` do Vuetify é usado só 1x.
  Criar componente + migrar os 7 pontos de uso.
- **Chip/Badge** — já existe `SelectableChip`; formalizar variantes de
  status (evento, convite etc.) quando/se aparecer repetição real — não
  auditado a fundo ainda.

Ao puxar qualquer um desses itens de backlog, seguir a regra de criação
acima (criar com story, migrar todos os pontos de uso, não deixar cópia
antiga viva) e registrar o resultado num PR próprio, pequeno — não é
necessário reabrir o `REFACTOR_AUDIT_PLAN.md` pra isso.
