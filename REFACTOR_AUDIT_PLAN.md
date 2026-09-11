# Auditoria Técnica e Plano de Padronização/Refatoração — we-party-web-app

> Documento de referência único para o esforço de redução de débito técnico do frontend.
> Todas as afirmações abaixo foram verificadas no código em `main`/`feat/WEPARTY-103` (2026-09-11), não são suposições.
> **Este documento é um plano. Nenhum código de produto foi alterado ao produzi-lo.**

## Como ler este documento

1. **Diagnóstico** — o que está errado, com evidência (arquivo:linha) e prioridade.
2. **Arquitetura e padrões recomendados** — o alvo.
3. **Plano de refatoração** — como sair de (1) para (2), em fases incrementais.
4. **Design System + Storybook** — a base de componentes que sustenta tudo.
5. **Documentação e AGENTS.md** — como o conhecimento fica vivo depois que este documento envelhecer.

Convenção de prioridade usada em todo o documento:

| Prioridade | Critério |
|---|---|
| **P0** | Causa raiz — bloqueia ou multiplica outros problemas. Atacar primeiro. |
| **P1** | Alto impacto no dia a dia (velocidade, bugs, consistência visual). |
| **P2** | Relevante, mas não bloqueia nada; pode esperar as fases estruturais. |
| **P3** | Nice-to-have / polimento. |

---

## 0. Sumário executivo

- **51.527 linhas** em `.vue`/`.ts` (134 arquivos), 2 devs ativos, ~220 commits.
- **Zero testes** (`0` arquivos `.spec`/`.test`; `tsconfig.app.json` já exclui um diretório `__tests__` que **não existe**).
- 4 arquivos concentravam **35%** de todo o código do projeto: `Profile.vue` (5.782 linhas), `EventDetails.vue` (5.491), `LandingPage.vue` (4.250), `Feed.vue` (2.740). **Atualizado na Fase 1:** `EventDetails.vue` era código morto (não decompor, ver B1b) — arquivado; `LandingPage.vue` já caiu pra 3.947 linhas (footer/modal migraram pro `AppFooter`); o mega-arquivo real que entra no lugar dele é `NewEventDetails.vue` (2.234 linhas, já reduzido de 2.520).
- Nesses arquivos, **entre 45% e 72% das linhas são `<style>`** (CSS manual, escopado por componente), não lógica. O problema não é só "componente grande fazendo coisa demais" — é CSS duplicado e não reutilizado, arquivo por arquivo.
- **3 paletas de cor "primary" diferentes e incompatíveis** coexistem: Vuetify (`#ff5f8f`), Tailwind (`#6366f1`), CSS vars (`#ffb74d`). Não há um único design token.
- `v-card` do Vuetify é usado em **1 arquivo**; **16 arquivos** reimplementam seu próprio `.card` em CSS puro.
- **Cabeçalho e rodapé duplicados** 3-4x cada, com markup, classes e comportamento diferentes entre si, incluindo um componente (`FeedCardStandalone.vue`) que é uma cópia quase literal de outro (`FeedCard.vue`) mantida em paralelo.
- O sistema de **layouts já existe** (`vite-plugin-vue-layouts-next`) mas está vazio (`src/layouts/default.vue` é só `<v-main><router-view /></v-main>`) — por isso cada página reimplementa sua própria "casca".
- A camada `src/api/` é **respeitada na prática** (só 2 arquivos fazem `axios` fora dela) — isso é uma base sólida a preservar, não a jogar fora.
- `AGENTS.md` já existe e já tem boas regras, mas **está desatualizado em pontos verificáveis** (lista `stores: app, events, share` — `app.ts` não existe; menciona `package-lock.json` que não existe mais no repo).

---

## 1. Diagnóstico

### 1.1 Arquitetura

| # | Problema | Evidência | Prioridade | Impacto | Esforço | Risco de corrigir |
|---|---|---|---|---|---|---|
| A1 | Sistema de layouts existe mas não é usado para centralizar chrome (header/footer/nav) | `src/layouts/default.vue` (10 linhas, sem header/footer) | **P0** | Alto — é a causa raiz da duplicação de header/footer | Médio | Baixo (aditivo, não quebra rotas) |
| A2 | Duas pastas "UI" concorrentes | `src/components/UI/` (16 componentes) vs `src/components/modules/UI/` (`ShareSheet`) | P1 | Médio — confunde onde procurar/criar componente | Baixo | Baixo |
| A3 | Nomes de módulo colidindo por causing (case) | `src/components/modules/interest/` (minúsculo) vs `src/components/modules/InterestPage/` (maiúsculo) — duas features distintas sobre "interest" | P2 | Médio — risco de confusão em import e em file-system case-insensitive (macOS) | Baixo | Baixo |
| A4 | `openspec/` + `.opencode/` + comandos `opsx-*` (`.claude/commands/opsx/`, `.claude/skills/openspec-*`) | `openspec/specs/.gitkeep`, `openspec/changes/.gitkeep`, `.opencode/commands/opsx-*.md`, `.opencode/skills/openspec-*/SKILL.md` | — | — | — | **Fora de escopo.** Não é débito técnico — é a base de um fluxo futuro de agentes autônomos de desenvolvimento (OpenSpec). Nenhuma fase deste plano toca nesses diretórios/comandos. |
| A5 | Convenção de pacote parcialmente decidida na prática, não documentada | Só `yarn.lock` existe; `package-lock.json` citado no `AGENTS.md:21` não existe mais; CI já usa `yarn install --frozen-lockfile` | P2 | Baixo | Trivial | Nenhum |

**Leitura:** a arquitetura de alto nível (pages file-based, api/, stores/, composables/, components/UI vs modules) é **razoável e não precisa ser reinventada**. O problema é que uma peça central (layouts) nunca foi usada, o que empurrou toda página a reconstruir sua própria estrutura — daí nascem os headers/footers divergentes.

### 1.2 Páginas e componentes

| # | Problema | Evidência | Prioridade | Impacto | Esforço | Risco |
|---|---|---|---|---|---|---|
| B1 | Mega-arquivos concentrando template + lógica + estilo | `Profile.vue` 5.782 linhas / `LandingPage.vue` 4.250 / `Feed.vue` 2.740 / `NewEventDetails.vue` 2.520 | **P0** | Alto — inviabiliza revisão de PR e teste | Alto | Médio (exige cobertura antes) |
| B1b | **Correção (achada na Fase 1):** `EventDetails.vue` (5.491 linhas) + `EventView.vue` (843) citados originalmente em B1 não são mega-arquivo pra decompor — são **código morto confirmado**, sem nenhuma rota/componente ativo importando (`[id].vue` já usa `NewEventDetails.vue`, com comentário próprio dizendo isso). Arquivados em `src/components/_revisar_/` na Fase 1, não entram mais no B1/Fase 5 | `src/pages/private/event/[id].vue`, `src/components.d.ts` (única referência restante, autogerada) | — | — | — | Resolvido na Fase 1 |
| B2 | O CSS domina o tamanho dos mega-arquivos, não a lógica | `Profile.vue`: 3.316/5.782 linhas (57%) são `<style>`; `LandingPage.vue`: 2.485/3.947 (63%, após a Fase 1 remover footer/modal); `Feed.vue`: 1.243/2.740 (45%); `NewEventDetails.vue`: 506/2.234 (23%, após a Fase 1 remover o header hand-copiado — o exemplo original aqui, `EventDetails.vue` 72%, era código morto, ver B1b) | **P0** | Alto — indica ausência de componentes de UI reutilizáveis, não só "componente grande" | Alto | Médio |
| B3 | Componente duplicado por cópia (fork), não por composição | `src/components/FeedCardStandalone.vue` é near-cópia de `src/components/modules/Feed/FeedCard.vue` — mesmo footer, mesma estrutura, pequenas divergências já introduzidas (`aria-label` vs `title` no botão de like, comparar `FeedCard.vue:346-360` com `FeedCardStandalone.vue:412-425`) | **P1** | Alto — bug corrigido em um não é corrigido no outro | Médio | Baixo |
| B4 | `Profile.vue` concentra cropper de imagem escrito à mão | já sinalizado no próprio `AGENTS.md:75-76` | P1 | Médio | Alto | Médio |
| B5 | Uso de `: any` / `as any` espalhado | 197 ocorrências em `src/**/*.{ts,vue}` | P2 | Médio — reduz a proteção real do TypeScript | Médio (progressivo) | Baixo |
| B6 | `v-html` presente (risco XSS se a origem for conteúdo de usuário) | `src/components/modules/Feed/NewEventDetails.vue:312` (`v-html="tab.icon"`) | P1 (segurança) | Alto se o valor puder vir de fora | Baixo | Baixo — validar origem do dado e substituir por componente de ícone |

### 1.3 Estilos

| # | Problema | Evidência | Prioridade | Impacto | Esforço | Risco |
|---|---|---|---|---|---|---|
| C1 | 3 fontes de verdade para cor, incompatíveis entre si | Vuetify (`src/plugins/vuetify.ts:16-17`): `primary #ff5f8f`, `secondary #ff9a4d` · Tailwind (`tailwind.config.ts:10-13`): `brand.500 #6366f1` (indigo, nem usado no resto do produto) · CSS vars (`src/styles/css-variables.css:31-33`): `--color-primary #ffb74d`, `--color-secondary #ff9ab5`. **Contagem de uso real no código** (`grep` por hex/var em `.vue`/`.css`/`.scss`): `#ff5f8f` aparece **192x**, `#ff9a4d` **155x** (hardcoded, replicando o valor do Vuetify) vs. `var(--color-primary)` **16x** vs. `#ffb74d`/`#ff9ab5` **14x** vs. classe Tailwind `brand-*` **2x** — a paleta do Vuetify já é, de longe, a mais usada na prática, só que copiada como hex solto em vez de referenciada | **P0** | Alto — inconsistência visual literal, cores "primary" diferentes dependendo de qual sistema o componente usa | Médio | Baixo (é definição de token, não reescrita de tela) |
| C2 | Vuetify subutilizado; CSS artesanal reimplementa o que o framework já resolve | `v-card` usado em 1 arquivo; 16 arquivos têm classe `.card`-like própria em `<style>`; 21 arquivos têm `.btn-`/`.button-` própria em vez de `v-btn` parametrizado | **P0** | Alto — é a causa direta do inchaço de CSS (item B2) | Alto | Médio |
| C3 | Comentário do `tailwind.config.ts` contradiz a configuração | `tailwind.config.ts:9` diz "prefixa todas as utilities pra evitar colisão: tw-mx-4" mas `prefix: ''` (linha 8) — nenhum prefixo é aplicado de fato | P2 | Baixo (risco de colisão de classe Tailwind vs Vuetify não documentado corretamente) | Trivial | Nenhum |
| C4 | Sem estratégia declarada de "quando Tailwind, quando Vuetify, quando CSS custom" | Ausente em `AGENTS.md` e em `src/styles/README.md` (3 linhas) | **P0** | Alto — cada dev resolve do jeito que preferir | — | — (resolvido pela seção 2.5 deste doc) |

### 1.4 Gerenciamento de estado

| # | Problema | Evidência | Prioridade | Impacto | Esforço | Risco |
|---|---|---|---|---|---|---|
| D1 | Acesso direto a `localStorage` espalhado em vez de centralizado | 17 arquivos, incluindo componentes de página: `Profile.vue`, `Login.vue`, `Signup.vue`, `Interest.vue`, `RequestPassword.vue`, `VerifyPin.vue`, além de `useAuth.ts`, `stores/events.ts`, `router/index.ts` | P1 | Médio-alto — múltiplas fontes de verdade para sessão/estado persistido, risco de dessincronia | Médio | Baixo (encapsular, não mudar comportamento) |
| D2 | `AGENTS.md` documenta uma store (`app`) que não existe | `AGENTS.md:41` cita `stores/: app, events, share`; `src/stores/` real tem `events.ts`, `interestPage.ts`, `share.ts` (sem `app.ts`) | P2 | Baixo (documentação, mas gera confusão para quem segue a doc) | Trivial | Nenhum |
| D3 | Lógica utilitária duplicada em vez de importada | `formatDate` implementada duas vezes com o mesmo propósito: `src/components/modules/Feed/commentDisplay.ts:13` e inline em `src/components/modules/Feed/CommentsDrawer.vue:63` | P2 | Baixo-médio — sintoma do mesmo padrão em outros utilitários de data (20 arquivos usam `new Date`/`toLocaleDateString` sem util central) | Baixo | Baixo |

### 1.5 APIs / Serviços

| # | Observação | Evidência | Prioridade |
|---|---|---|---|
| E1 | **Ponto forte, preservar:** chamada HTTP centralizada em `src/api/*.ts`, quase sem exceção | Só `SocialAuthButtons.vue` e `services/socialAuth.ts` usam `axios` fora de `src/api/` (justificável — SDK de OAuth) | — (não é problema) |
| E2 | Módulos de API espelham bem os recursos do backend | `api/users.ts`, `event.ts`, `comments.ts`, `follows.ts`, `interest.ts`, `interestPage.ts`, `password.ts`, `reports.ts`, `updates.ts` | — |
| E3 | Falta de tipagem forte pode estar relacionada aos 197 `any` (B5) — não verificado exaustivamente, mas os DTOs de resposta merecem auditoria pontual quando cada `api/*.ts` for tocado | — | P2 |

### 1.6 Reutilização

| # | Problema | Evidência | Prioridade |
|---|---|---|---|
| F1 | Cabeçalho: 3 implementações divergentes na área autenticada — **Resolvido na Fase 1** | Componente dedicado `FeedTopHeader.vue`, já reaproveitado em `Feed.vue`/`Profile.vue`/`PublicProfile.vue`/`InterestPage.vue` **vs** header hand-copiado ("padronizado com o FeedTopHeader", ver comentários do próprio arquivo) em `NewEventDetails.vue:3-123` **vs** o de `EventDetails.vue` (código morto, ver B1b). Decisão do time: `FeedTopHeader` migra pra `src/components/UI/AppHeader/AppHeader.vue` e vira único **só na área autenticada**; a Landingpage pública mantém seu próprio header de marketing (não é duplicação no mesmo sentido — ver seção 3, Fase 1) | **P0** | Alto | Médio | Baixo |
| F2 | Rodapé: 3 implementações divergentes de rodapé de página — **Resolvido na Fase 1** | Componente dedicado `AppFooter.vue`, usado em só 2 lugares (`NotFound.vue`, `Profile.vue`) **vs** footer inline próprio em `LandingPage.vue:1411` (`footer-v2`). **Correção:** o `<footer>` de `FeedCard.vue`/`FeedCardStandalone.vue`, citado originalmente aqui, na inspeção da Fase 1 se confirmou ser a barra de curtir/comentar do *card de evento*, não um rodapé de página — é duplicação real (B3), mas não desta consolidação; fica pra Fase 6. Decisão do time: footer da Landingpage vira o único, migrado pra `src/components/UI/AppFooter/AppFooter.vue`, usado também fora dela (`NotFound.vue`, `Profile.vue`, e a própria Landingpage) | **P0** | Alto | Médio | Baixo |
| F3 | Regra de reuso existe no `AGENTS.md` mas aponta para 2 pastas diferentes, formalizando a fragmentação (A2) em vez de resolvê-la | `AGENTS.md:69` | P1 | Médio | Baixo |

### 1.7 Testes

| # | Problema | Evidência | Prioridade |
|---|---|---|---|
| G1 | Zero testes automatizados no projeto | `find . -name "*.spec.*" -o -name "*.test.*"` → 0 resultados | **P0** | Alto | — |
| G2 | `tsconfig.app.json` já prevê um diretório de testes que nunca foi criado | `tsconfig.app.json:5` — `"exclude": ["src/**/__tests__/*"]` | P2 | Baixo (mas mostra que a intenção já existia) | — |
| G3 | CI roda lint + type-check + build, sem etapa de teste | `.github/workflows/ci.yml` (job `ci`) | **P0** | Alto — nada impede regressão funcional | Médio (depende de G1 existir primeiro) |
| G4 | Nenhuma dependência de teste instalada | `package.json` sem Vitest/Vue Test Utils/Playwright | **P0** | — | Baixo para instalar | Nenhum |

**Leitura crítica:** com **zero testes** e 4 arquivos de mais de 2.700 linhas, qualquer refatoração de comportamento hoje é feita "no escuro". Por isso o plano da seção 3 coloca teste de regressão **antes** de mexer na lógica dos mega-arquivos, não depois.

### 1.8 Documentação

| # | Problema | Evidência | Prioridade |
|---|---|---|---|
| H1 | `docs/` com 16 arquivos soltos, sem hierarquia clara, nomes sobrepostos | `docs/CORRECTIONS_SUMMARY.md`, `docs/CSS_CORRECTIONS_REPORT.md`, `docs/IMPROVEMENTS_GUIDE.md`, `docs/OPTIMIZATION_GUIDE.md` — não fica claro qual é atual e qual é histórico | P2 | Médio | Baixo |
| H2 | `AGENTS.md` desatualizado em pontos verificáveis | ver D2 e A5 | P1 | Médio (mina a confiança no documento que agentes de IA leem primeiro) | Trivial |
| H3 | Não existe documento de padrão visual/design tokens | ausente | **P0** (pré-requisito da seção 4) | Alto | — |

### 1.9 Design System

| # | Problema | Evidência | Prioridade |
|---|---|---|---|
| I1 | Não existe Design System nem Storybook | `package.json` sem `@storybook/*`; nenhum diretório `.storybook/` | **P0** | Alto | — |
| I2 | Não existe regra objetiva de "componente existe? reuso ou crio?" além de uma lista fixa no `AGENTS.md` | `AGENTS.md:65-76` é boa intenção, mas sem catálogo navegável (Storybook) a checagem depende de o dev/agente ler código-fonte manualmente | P1 | Alto | — |
| I3 | Tokens visuais fragmentados (repete C1) | — | **P0** | — | — |

---

## 2. Arquitetura e padrões recomendados

Princípio geral: **evoluir o que já existe, não substituir.** A estrutura de diretórios do `AGENTS.md` está correta; o que falta é (a) fazer o `layouts/` ser usado de verdade, (b) ter uma única fonte de componentes de UI com tokens únicos, e (c) dar às páginas grandes um caminho de saída incremental.

### 2.1 Organização de diretórios (ajustes, não reescrita)

```
src/
├── pages/                 # inalterado — rotas file-based
├── layouts/                # PASSA A SER USADO: default.vue ganha AppHeader/AppFooter/AppNav
│   ├── default.vue         # layout autenticado/padrão
│   ├── landing.vue         # layout público (landing/marketing), se o header/footer divergir de fato por motivo de produto
│   └── blank.vue           # inalterado (telas sem chrome: onboarding em tela cheia, etc.)
├── components/
│   ├── UI/                 # ÚNICA pasta de Design System (ver 4). components/modules/UI/ deixa de existir
│   │   ├── AppHeader/       # cabeçalho único do app, baseado no header da página do Feed (decisão do time)
│   │   ├── AppFooter/       # rodapé único do app, baseado no footer da Landingpage (decisão do time)
│   │   ├── Button/, Card/, Modal/, Chip/, Avatar/, ... (catálogo em 4.2)
│   ├── _revisar_/           # NOVO — código dos headers/footers descartados (LandingPage, NewEventDetails,
│   │                        #   FeedCard/FeedCardStandalone, AppFooter antigo) preservado aqui, fora do fluxo
│   │                        #   ativo, para consulta futura. Nada daqui é importado por página nenhuma.
│   ├── modules/             # feature components — passam a ser "finos": orquestram, não estilizam do zero
├── stores/                  # Pinia — só estado verdadeiramente compartilhado entre páginas/componentes distantes
├── composables/             # lógica reaproveitável sem UI própria
├── api/                     # inalterado — já é o padrão correto, manter disciplina
├── services/                # integrações externas (OAuth etc.) — inalterado
├── styles/
│   ├── tokens.css           # NOVO — única fonte de cor/espaçamento/tipografia/radius/sombra/z-index
│   ├── ...                  # demais arquivos revisados para referenciar tokens.css, não redefinir valores
```

### 2.2 Responsabilidade de páginas e componentes

- **Página (`src/pages/**`)**: só roteamento + composição de componentes de módulo. Não deve ter `<style>` de mais de ~30-40 linhas nem lógica de negócio inline.
- **Componente de módulo (`components/modules/**`)**: orquestra composables/stores e delega apresentação a componentes de UI (design system). Meta prática: **nenhum arquivo novo ou tocado deveria passar de ~400-500 linhas**; acima disso é sinal de extrair subcomponente, composable ou estilo.
- **Componente de UI (`components/UI/**`)**: sem chamada de API, sem store, só props/emits/slots. É o único lugar onde `<style>` "grande" é aceitável, porque ali o CSS é pago uma vez e reaproveitado em todo o app.

### 2.3 Composables

Manter o padrão já existente (`useAuth`, `useValidation`, `useRateLimit`, `useEventImages`, ...). Regra objetiva para extrair um composable: **se a mesma lógica de estado/efeito aparece em 2+ componentes, ou se um componente de mais de ~150 linhas de `<script>` tem um bloco de lógica isolável**, vira composable. Não criar composable para uma lógica usada uma única vez "por padronização" — isso é abstração prematura.

Novo composable recomendado: `useAuthStorage` (ou expandir `useAuth`) para ser o **único** ponto de leitura/escrita de sessão em `localStorage`, eliminando D1. Componentes de página passam a chamar `useAuth()`, nunca `localStorage` direto.

### 2.4 Serviços / API

Sem mudanças estruturais — a disciplina atual (E1/E2) é boa. Ação pontual: ao tocar em cada `api/*.ts` por outro motivo, revisar tipos de retorno para reduzir os `any` relacionados (B5), sem abrir uma tarefa dedicada só para isso.

### 2.5 Gerenciamento de estado — critério de decisão

| Tipo de estado | Onde vive | Exemplo |
|---|---|---|
| Sessão do usuário, dado usado por 3+ páginas distantes | Pinia store | usuário logado, contagem de notificações |
| Estado de uma feature usada em várias telas (eventos, feed) | Pinia store (como já é `stores/events.ts`) | lista de eventos, filtros de feed |
| Estado de UI local (aberto/fechado, aba ativa, form em edição) | `ref`/`reactive` no próprio componente | modal aberto, tab selecionada |
| Lógica reaproveitável sem necessidade de ser "global" | composable | validação de form, geolocalização |
| Persistido entre sessões (token, preferência de tema) | composable dedicado que encapsula `localStorage`, nunca acesso direto na página | `useAuth`, `useThemeMode` |

**Regra:** não promover estado para Pinia "por garantia". Se só um componente e seus filhos diretos usam, fica local ou em composable passado por props/provide-inject.

### 2.6 Estilos — a decisão que faltava

Ordem de preferência, nessa sequência, ao estilizar qualquer coisa nova:

1. **Componente Vuetify** (`v-btn`, `v-card`, `v-dialog`, `v-text-field`, `v-chip`...) configurado via props/tema — cobre a maior parte dos casos e já está instalado e pago.
2. **Componente do Design System** (`src/components/UI/`) quando existir um padrão visual próprio do produto que Vuetify não cobre (ex.: `AppHeader`, `FeedCard`, badges de evento).
3. **Utilitário Tailwind** para layout/espaçamento pontual (`flex`, `gap-4`, `grid-cols-2`) dentro de um componente que já usa Vuetify/DS — Tailwind não substitui componente, só ajusta layout ao redor dele.
4. **CSS `scoped` no próprio `.vue`** só para o que é genuinamente único daquela tela e não será reaproveitado — e mesmo assim, sempre lendo valores de `tokens.css`/tema Vuetify, nunca hex-code novo.

Tokens: **uma única fonte**. Critério de escolha do valor canônico: **o que já é mais usado no código hoje**, não uma preferência nova — para cor, isso significa adotar `#ff5f8f` (primary) / `#ff9a4d` (secondary), que já é a paleta do Vuetify e já aparece hardcoded 192x/155x no projeto (ver C1). `tokens.css` formaliza esse valor já dominante como única fonte; `tailwind.config.ts` referencia os mesmos valores (via `theme.extend` apontando pros tokens, não a paleta indigo paralela que hoje só é usada 2x); `css-variables.css` deixa de ter cor própria divergente (`#ffb74d`/`#ff9ab5`, hoje só 14x). Isso resolve C1 sem mudar a cor que o usuário majoritariamente já vê — as 192+155 ocorrências hardcoded migram para referenciar o token ao longo da Fase 5 (à medida que cada arquivo é tocado), não de uma vez.

### 2.7 Componentes reutilizáveis — critério de criação

Antes de criar um componente novo (mantendo e reforçando `AGENTS.md:65-76`, agora com um único lugar para checar — `components/UI/`, ver 2.1):

1. Existe no Vuetify? Usar, configurado via tema/props.
2. Existe algo parecido no Storybook (catálogo do DS, seção 4)? Estender via prop/slot.
3. Aparece pela 2ª vez um padrão visual que não existe em nenhum dos dois? Criar no DS, documentar no Storybook, **então** usar nas duas ocorrências (eliminando a duplicação, não deixando as duas cópias vivas).
4. É genuinamente único de uma tela e não se repete? Fica local ao componente de módulo — não precisa virar DS.

Este critério vale para componente novo a partir de agora. Para o que **já existe hoje**, a montagem do DS não começa criando componentes — começa por uma **auditoria** (detalhada na Fase 3a, seção 3): mapear o que se repete de verdade entre páginas, e só então decidir o que migra. Regra de decisão da auditoria:

- **Migra para o DS** quando o mesmo padrão visual/funcional aparece em várias páginas/módulos com a mesma intenção (é "o card de evento", "o botão de CTA", não "um card"). Nesse caso, cria-se **um único componente**, parametrizado (props/slots) para cobrir as pequenas diferenças reais entre os lugares onde é usado — e todos os usos passam a apontar para ele.
- **Não migra** quando dois componentes só *parecem* iguais visualmente mas resolvem problemas diferentes (dado diferente, comportamento diferente, contexto diferente) — forçar a fusão nesse caso cria acoplamento artificial e um componente com `v-if` demais. Fica registrado no `_revisar_`/no PR o porquê de não ter sido unificado, para não ser "redescoberto" e forçado depois sem necessidade.
- Em caso de dúvida, o critério de desempate é frequência real de uso (quantos arquivos/páginas) — o mesmo raciocínio usado em C1/C2 do diagnóstico, não uma decisão estética isolada.

### 2.8 Testes — estratégia mínima viável

Sem teste nenhum hoje, o objetivo não é "cobertura alta rápido", é **destravar refatoração segura**:

1. **Vitest + Vue Test Utils** para composables e stores primeiro (lógica pura, mais fácil de testar, maior ROI: `useValidation`, `useRateLimit`, `useAuth`, `stores/events.ts`).
2. **Testes de componente** para os componentes de UI do Design System (são pequenos, estáveis e usados em todo lugar — testar um valida N telas).
3. **Testes de regressão "de aprovação"** (snapshot leve de comportamento, não visual) especificamente para `Profile.vue`, `LandingPage.vue`, `Feed.vue`, `NewEventDetails.vue` **antes** de cada um ser refatorado — não depois. (`EventDetails.vue` saiu da lista na Fase 1: era código morto, ver B1b.)
4. **E2E não é deste repositório.** Já existe um projeto dedicado, `weparty-automation` (Cypress, roda contra produção, Page Objects em `cypress/support/pages/`, seletor padrão `data-testid` via `cy.getBySel`, dados de fixture, `cy.intercept` obrigatório em toda chamada que altera estado). Ver a regra transversal na seção 3 — o trabalho deste repo é **expor `data-testid`** nos componentes; escrever/manter o teste E2E em si é responsabilidade do `weparty-automation`, seguindo o `AGENTS.md` de lá.

### 2.9 Quando usar (ou não) Design Patterns e estado global

- Não introduzir padrão de projeto (Strategy, Factory, Observer formal etc.) para resolver um problema que uma função ou composable simples já resolve. O código atual não sofre de falta de padrões formais — sofre de duplicação e arquivos grandes. Resolver isso primeiro.
- Estado global (Pinia) só quando 2.5 indicar. Não criar store para estado de uma tela.
- Abstração (interface genérica, plugin, camada extra) só depois da 3ª repetição real do mesmo problema (regra prática "rule of three"), nunca antecipada "porque pode precisar no futuro".

---

## 3. Plano de refatoração

Fases **sequenciais por dependência**, não paralelas. Cada fase deve ser um ou mais PRs pequenos, nunca uma refatoração única. Nenhuma fase muda comportamento visível ao usuário, exceto quando dito explicitamente.

### 3.0 Regra transversal — `data-testid` + testes E2E no `weparty-automation`

Isto não é uma fase isolada: é uma prática aplicada **dentro** das Fases 1, 3, 5 e 6, toda vez que um componente que vale a pena testar (header, footer, formulários de auth, fluxo de feed/evento/comentário, ações com API) é criado ou consolidado. Segue a decisão já registrada no `weparty-automation` (`docs/dados-e-integracao.md`): *"a cobertura cresce junto com os testes: ao tocar em um componente para dar suporte a um teste novo, adiciona-se o `data-testid` correspondente naquele momento"* — ou seja, o próprio `weparty-automation` já espera que a adição de `data-testid` aconteça de forma incremental, junto do trabalho de refatoração, não como migração separada depois.

**Mecânica, a cada checkpoint (fim de cada consolidação de componente relevante):**
1. Adicionar `data-testid="<nome-estável>"` nos elementos interativos/relevantes do componente recém consolidado ou extraído (seletor sempre estável — não depende de classe visual, conforme a mesma regra já vale no frontend: nunca amarrar comportamento a classe de estilo).
2. Subir um **sub-agente em paralelo** (via `Agent`, atuando no diretório `/Users/pedrolopeshls/Documents/we-tech-hub/we-party/weparty-automation`, lendo o `AGENTS.md` de lá **e os 5 docs abaixo** antes de qualquer alteração — não é opcional, cada um fixa uma regra que o teste novo precisa seguir).
3. O sub-agente do `weparty-automation` roda **em paralelo** ao trabalho de refatoração deste repo — não bloqueia a fase aqui, mas cada PR de fase relevante referencia o PR correspondente aberto lá.

**Docs do `weparty-automation` que o sub-agente segue (fonte de verdade — não repetir/resumir errado aqui):**

| Doc | O que rege no trabalho do sub-agente |
|---|---|
| `docs/arquitetura-e-organizacao.md` | Onde cada arquivo novo vai (`cypress/e2e/<public\|private>/`, espelhando a rota do front tocada nesta fase), Page Object em `support/pages/`, fluxo reaproveitado entre specs em `support/commands/`, nomenclatura de spec/`describe`/`it` (`<CT-XXX>-<slug>`), regra de higiene (nada de Page Object/command sem teste que o use). |
| `docs/escrita-de-testes.md` | Estrutura AAA no `it`, independência entre testes (reset de storage/cookies/sessão em `beforeEach`), proibição de `cy.wait(<ms fixo>)` — esperar por alias de rede ou asserção, timeout customizado só via `support/constants/timeouts.js`. |
| `docs/dados-e-integracao.md` | Seletor: `data-testid` via `cy.getBySel` (padrão-alvo que este checkpoint está alimentando) > `id` semântico > ARIA/texto; massa de dado só via fixture (`cypress/fixtures/`), nunca literal no spec; toda chamada que altera estado mockada com `cy.intercept` (a suíte roda contra produção — `baseUrl` é `wepartyapp.com`), alias nomeado pelo recurso (`@loginRequest`, não `@req1`). |
| `docs/processo.md` | Branch `<tipo>/WEPARTY-<n>` (mesma convenção deste repo) e Conventional Commits no PR aberto lá; lint/Prettier ainda em aberto nesse repo — não travar o PR por isso. |
| `docs/ci-cd.md` | Ainda é plano futuro, sem pipeline configurado — o sub-agente **não** precisa configurar CI para o teste novo passar; só registrar o cenário como candidato a "smoke" se for um fluxo crítico (login, ação principal do componente), para quando o CI de lá existir. |

O próximo `CT-XXX` livre e a massa de dado legível vêm de `docs/massa-de-teste.md` de lá (não versionado — consultar no momento, não fixar número aqui).

**Pontos de checkpoint neste plano:** ao final da Fase 1 (AppHeader/AppFooter), ao final de cada componente prioritário da Fase 3 (seção 4.2), a cada extração significativa da Fase 5, e ao consolidar `FeedCard`/`FeedCardStandalone` na Fase 6.

### Fase 0 — Fundação (sem risco, sem depender de nada)
- **Objetivo:** instalar só as ferramentas que as fases seguintes exigem. Documentação (`AGENTS.md`, `docs/`) fica **de fora** desta fase — é feita de uma vez, consolidada, na Fase 7, para não picotar a doc em vários commits parciais como aconteceu com `docs/` hoje (H1).
- **O que muda:** instalar Vitest + Vue Test Utils; criar `src/styles/tokens.css` vazio/inicial (será populado na Fase 2); criar a pasta `src/components/_revisar_/` (vazia, com um `README.md` de uma linha explicando o propósito, para a Fase 1 já ter onde mover código).
- **Dependências:** nenhuma.
- **Risco:** nenhum (não toca em código de produto nem em doc).
- **Validação:** `yarn lint && yarn build` continuam verdes; `yarn vitest run` roda (mesmo com 0 testes ainda).
- **Resultado esperado:** base pronta para todo o resto.

### Fase 1 — Header e footer: escolher um de cada, arquivar o resto ✅ (implementado — PR em validação)
- **Objetivo:** eliminar F1/F2, resolvendo também A1 (causa raiz). **Decisão do time** (ver pergunta respondida durante a execução): o header do Feed vira único **só na área autenticada** (a Landingpage pública mantém seu próprio header de marketing, por ser um header legítimo e distinto, não uma cópia); o footer vira o da Landingpage, usado em todo o app (público e autenticado).
- **O que foi feito:**
  - `FeedTopHeader.vue` migrou para `src/components/UI/AppHeader/AppHeader.vue` — usado em `Feed.vue`, `Profile.vue`, `PublicProfile.vue`, `InterestPage.vue` (já usavam) e agora também `NewEventDetails.vue` (que reimplementava à mão um header "padronizado com o FeedTopHeader" — ~140 linhas de template/CSS/lógica removidas, inclusive um scroll-listener próprio que só existia pra esse header).
  - Footer da Landingpage (com modal de Termos/Privacidade, que morava junto) migrou para `src/components/UI/AppFooter/AppFooter.vue`, **autocontido**: os links de seção ("Como funciona"/"Recursos"), que antes só funcionavam por já estar na Landingpage, agora navegam pra lá com `#hash` — a Landingpage ganhou um `watch(route.hash)` + scroll-on-mount pra isso funcionar vindo de qualquer página. Usado agora em `LandingPage.vue`, `NotFound.vue` e `Profile.vue` (que já usava o `AppFooter.vue` antigo).
  - **Achado durante a execução, fora do escopo original:** `EventDetails.vue`/`EventView.vue` (citados no diagnóstico original como mega-arquivo/header duplicado) são **código morto confirmado** — nenhuma rota os usa (`[id].vue` já roteia pra `NewEventDetails.vue`). Corrigido no diagnóstico (B1b) e arquivados em `_revisar_` junto com o resto.
  - `src/components/_revisar_/` recebeu: `AppFooter.vue` antigo, `EventDetails.vue`, `EventView.vue`. **Não foram pra lá** (decisão explícita, ver F1/F2 corrigidos): o header da Landingpage (fora de escopo) e o `<footer>` de `FeedCard`/`FeedCardStandalone` (não é rodapé de página — é B3, Fase 6).
  - `_revisar_/` precisou ser excluída do auto-import (`vite.config.mts`, `Components({ globsExclude: ['**/_revisar_/**'] })`) — sem isso, o `unplugin-vue-components` colidia por nome de arquivo entre o `AppFooter.vue` novo e o arquivado.
  - **Não foi feito** (ajuste de escopo em relação ao plano original): wiring via `src/layouts/default.vue`. Investigando o código, cada página já importa e renderiza `FeedTopHeader`/`AppFooter` diretamente, inclusive com slots por página (ex. o `#center-content` de busca/filtros do `Feed.vue`, ~140 linhas) — forçar isso por um layout compartilhado exigiria replicar esses slots por fora, sem ganho real. O padrão de reuso explícito por página, já estabelecido, foi mantido.
- **Dependências:** Fase 0.
- **Risco:** médio-alto — mudança visível (header some do `NewEventDetails.vue`, perde o efeito "transparente sobre o hero" e os atalhos de nav próprios; footer aparece em páginas que não tinham). Validado visualmente via browser (Landingpage: header inalterado, footer novo renderiza e funciona, modal de Termos abre, link com `#hash` rola corretamente ao navegar de fora) e via `yarn lint`/`yarn test`/`yarn build`, todos verdes.
- **Validação:** ver acima — checklist visual feito na própria execução, não só planejado.
- **Checkpoint 3.0:** ainda não acionado nesta fase — fica para quando o time confirmar o PR; a expectativa é cobrir "header/footer presentes e funcionais" como teste de fumaça no `weparty-automation`.
- **Resultado esperado → obtido:** 1 header ativo na área autenticada, 1 footer ativo no app inteiro; ~650 linhas de CSS/lógica duplicada removidas (`NewEventDetails.vue` -318 linhas, `LandingPage.vue` -349 linhas); +6.334 linhas de código morto (`EventDetails.vue`+`EventView.vue`) tiradas do caminho ativo.

### Fase 2 — Tokens visuais únicos
- **Objetivo:** resolver C1/I3 (3 paletas "primary" incompatíveis), adotando o valor **já mais usado no código** (critério de decisão da seção 2.6), não uma escolha nova.
- **O que muda:** `tokens.css` formaliza `#ff5f8f` (primary) / `#ff9a4d` (secondary) — a paleta do Vuetify, hoje hardcoded 192x/155x no projeto — como único valor; `tailwind.config.ts` passa a estender esses mesmos valores em vez da paleta indigo (`brand.500 #6366f1`) hoje usada só 2x; `css-variables.css` para de redefinir cor própria (`#ffb74d`/`#ff9ab5`, hoje só 14x) e referencia os tokens.
- **Dependências:** nenhuma código-wise, mas deve vir antes da Fase 3 (Design System) para o DS nascer já com token correto.
- **Risco:** baixo — o valor escolhido é o que já domina visualmente o app; o risco fica concentrado nos poucos lugares que hoje usam a CSS var ou o Tailwind `brand-*` divergentes (14x + 2x, mapeáveis individualmente).
- **Validação:** varredura visual dos ~16 arquivos que usam `var(--color-primary)`/`brand-*`.
- **Resultado esperado:** uma cor "primary" no app inteiro, de uma fonte só, sem alterar o tom que a maior parte do app já mostra.

### Fase 3 — Auditoria de componentes + Design System inicial + Storybook (ver seção 4 para detalhe)

**3a. Auditoria (acontece antes de montar qualquer coisa nova):**
- Levantar, por padrão visual/funcional (card, botão, badge, modal, avatar, input...), em quantos arquivos/páginas ele se repete hoje (o mesmo tipo de contagem já usada em C2 do diagnóstico: `v-card` em 1 arquivo vs. 16 arquivos com `.card` própria; 21 arquivos com `.btn-`/`.button-` própria).
- Para cada padrão com repetição real (referência: 3+ ocorrências), aplicar o critério da seção 2.7: é o mesmo componente com pequenas variações (migra, com props para as diferenças) ou são componentes diferentes que só parecem iguais (não migra, fica registrado o porquê)?
- Resultado da auditoria vira a lista de entrada da Fase 3b — não se cria componente de DS "porque o catálogo pede um Button", só os que a auditoria confirmou como repetição real.

**3b. Montagem do DS:**
- **O que muda:** instalar Storybook; migrar/consolidar `components/modules/UI/ShareSheet` para dentro de `components/UI/` (resolve A2); documentar no Storybook os componentes de UI já existentes (`AppLoader`, `Snackbar`, `UserAvatar`, etc.); para cada item confirmado pela auditoria 3a, criar o componente único no DS e **adaptar todos os pontos de uso** para consumi-lo (não deixar a versão antiga viva em paralelo) — ver ordem sugerida em 4.2.
- **Dependências:** Fase 2 (tokens) + auditoria 3a.
- **Risco:** baixo-médio — aditivo na criação, médio na adaptação dos pontos de uso (mitigar 1 componente por vez, PR pequeno).
- **Validação:** `yarn storybook` builda; cada componente documentado tem pelo menos 1 story; nenhum ponto de uso antigo sobra sem migrar (buscar por classes/markup equivalentes ao componente recém criado).
- **Checkpoint 3.0:** a cada componente do DS que cobre um fluxo testável (ex. `Modal` de confirmação, `Button` de ação crítica), `data-testid` + sub-agente no `weparty-automation`.
- **Resultado esperado:** catálogo consultável antes de criar componente novo, cumprindo a regra 2.7 — e só com o que realmente se repete, não um catálogo especulativo.

### Fase 4 — Testes de regressão nos mega-arquivos, ANTES de refatorá-los
- **Objetivo:** destravar a Fase 5 com segurança.
- **O que muda:** escrever testes de comportamento (não de implementação) para os fluxos principais de `Profile.vue`, `LandingPage.vue`, `Feed.vue`, `NewEventDetails.vue` — o que o usuário consegue fazer, não como o componente é escrito por dentro. (Lista corrigida na Fase 1: `EventDetails.vue` era código morto, ver B1b — não entra mais aqui.)
- **Dependências:** Fase 0 (Vitest instalado).
- **Risco:** nenhum (só adiciona testes).
- **Validação:** testes passam contra o código atual, antes de qualquer refatoração.
- **Resultado esperado:** rede de segurança para a Fase 5.

### Fase 5 — Decompor os mega-arquivos (CSS primeiro, depois lógica)
- **Objetivo:** atacar B1/B2, o maior item de débito técnico do projeto.
- **Ordem dentro da fase, por arquivo (repetir para `LandingPage.vue` → `Profile.vue` → `Feed.vue` → `NewEventDetails.vue`, do maior % de CSS para o menor, medido após a Fase 1 — ver B2):**
  1. Extrair blocos de `<style>` repetíveis para componentes do Design System (Fase 3) — isso sozinho deve reduzir a maioria das linhas, dado que B2 mostrou que CSS é 45-72% do arquivo.
  2. Extrair subcomponentes de template puramente apresentacionais (ex.: cards internos, seções da landing) para `components/modules/<Feature>/`.
  3. Extrair lógica de estado/efeito isolável para composables (2.3).
  4. Página final vira orquestração fina.
- **Dependências:** Fases 3 e 4.
- **Risco:** médio-alto por arquivo — mitigado por ter teste de regressão (Fase 4) rodando a cada extração.
- **Validação:** testes da Fase 4 continuam verdes a cada extração; revisão visual.
- **Checkpoint 3.0:** a cada subcomponente/fluxo extraído que vira testável de forma isolada (ex. formulário de edição de perfil, ação de curtir/comentar), `data-testid` + sub-agente no `weparty-automation`.
- **Resultado esperado:** nenhum arquivo de página/módulo acima de ~500-800 linhas ao final (meta 2.2).

### Fase 6 — Eliminar duplicação restante e consolidar estado
- **Objetivo:** B3 (`FeedCardStandalone` vs `FeedCard`), D1 (localStorage espalhado), D3 (`formatDate` duplicado) e casos semelhantes encontrados no caminho.
- **O que muda:** `FeedCardStandalone.vue` passa a ser `FeedCard` com uma prop de variante (ou é removido, se a variação não for real; a versão descartada, se houver, também vai para `_revisar_`); todo acesso a `localStorage` de sessão migra para `useAuth`; utilitários de data duplicados consolidam em `src/utils/`.
- **Dependências:** Fase 5 (mais fácil depois que `FeedCard` já foi revisado nela).
- **Risco:** baixo-médio.
- **Validação:** testes + revisão manual dos pontos que liam `localStorage` diretamente.
- **Checkpoint 3.0:** `data-testid` no `FeedCard` consolidado + sub-agente no `weparty-automation` cobrindo curtir/comentar/compartilhar a partir do card único.
- **Resultado esperado:** uma implementação por conceito.

### Fase 7 — Documentação consolidada + gates contínuos
- **Objetivo:** registrar, de uma vez e de forma organizada, tudo que foi decidido/construído nas Fases 0-6 — e impedir que o débito técnico volte a crescer. Documentação deliberadamente fica para o final: escrever regra antes de ela existir de verdade no código gera doc que já nasce errada (o mesmo problema que gerou H1/H2 no diagnóstico).
- **O que muda:**
  - Reorganizar `docs/` (H1): arquivar o que é histórico (`CORRECTIONS_SUMMARY.md`, `CSS_CORRECTIONS_REPORT.md`, etc. — mover para `docs/archive/` ou equivalente), manter/criar só o que é referência viva.
  - Criar os documentos vivos definidos na seção 5 (`styles/README.md` expandido, `docs/TESTING.md`, docs do Storybook) já refletindo o que realmente foi construído nas fases anteriores, não uma intenção.
  - Atualizar `AGENTS.md` com todas as regras consolidadas de uma vez (lista completa na seção 5) — inclusive as correções factuais simples (D2, A5) que hoje estão erradas.
  - CI passa a rodar `yarn vitest run` como gate obrigatório (G3); regra de lint/CI opcional para novo `any` (B5, progressivo, não retroativo).
- **Dependências:** Fases anteriores.
- **Risco:** baixo.
- **Validação:** CI verde com o novo gate; `AGENTS.md` e `docs/` revisados por outra pessoa do time antes de merge (é o documento que outro dev/agente vai seguir depois).
- **Resultado esperado:** os problemas do diagnóstico (seção 1) deixam de poder reaparecer sem serem notados, e a documentação reflete o projeto real, não um plano.

---

## 4. Design System + Storybook

### 4.1 Estrutura

- **Local:** `src/components/UI/` continua sendo a pasta única (após Fase 3 absorver `components/modules/UI/`). Cada componente em sua própria subpasta (`Button/Button.vue`, `Button/Button.stories.ts`), como já é o padrão existente (`AuthLayout/`, `SearchInput/`, etc.) — não é preciso criar `src/design-system/` separado, o projeto já tem o lugar certo.
- **Storybook:** `.storybook/` na raiz, apontando para `src/components/UI/**/*.stories.ts`. Vue 3 + Vite builder (compatível direto com o `vite.config.mts` existente — mesmos plugins de Vuetify/Tailwind podem ser reaproveitados na config do Storybook).

### 4.2 Componentes prioritários (ordem de criação/consolidação)

Ordenados pelo que já está causando duplicação hoje (maior evidência primeiro). Os itens 3 e 4 (Card, Button) entram na lista final conforme a auditoria 3a confirmar a repetição — a ordem abaixo é o ponto de partida, não um catálogo fechado:

1. **AppHeader** — migração direta do header da página do Feed (`FeedTopHeader.vue`), decisão já tomada (Fase 1, resolve F1); os demais headers vão para `_revisar_`.
2. **AppFooter** — migração direta do footer da Landingpage (decisão já tomada, Fase 1, resolve F2); os demais footers vão para `_revisar_`.
3. **Card** — candidato da auditoria 3a: hoje `v-card` é usado em 1 arquivo e 16 arquivos têm `.card` própria (C2); confirmar quantos desses 16 são realmente o mesmo card antes de unificar.
4. **Button** — candidato da auditoria 3a: 21 arquivos têm `.btn-`/`.button-` própria em vez de `v-btn` parametrizado; mesma checagem antes de unificar.
5. **FeedCard** — consolidar `FeedCard`/`FeedCardStandalone` num único componente com variante `standalone` (resolve B3) — aqui a duplicação já está confirmada por comparação direta de código (ver B3 no diagnóstico), não depende da auditoria.
6. **Modal/Dialog** — wrapper sobre `v-dialog` padronizando header/actions, se a auditoria confirmar repetição.
7. **Chip/Badge** — já existe `SelectableChip`; formalizar variantes de status (evento, convite etc.) no mesmo padrão, se repetido.
8. Componentes já existentes só precisam de **story**, não recriação: `AppLoader`, `WePartyLoader`, `Snackbar`, `UserAvatar`, `SearchInput`, `LoginRequiredDialog`, `ErrorBoundary`, `ConfirmDialog`, `SocialAuthButtons`, `FollowButton`, `InlinePanel`, `GradientText`, `inputLabel`.

### 4.3 Tokens (dependem da Fase 2 da seção 3)

Documentar no Storybook (addon de "Docs"/página estática) a partir de `tokens.css`: cor (primary/secondary/surface/background/status), espaçamento, tipografia (`Poppins` + fallback já configurado em `tailwind.config.ts`), radius, sombra, z-index (`css-variables.css` já tem uma hierarquia de z-index sensata — `--z-header: 1000`, `--z-modal: 3000` etc. — só falta ser a única fonte, ver 2.6).

### 4.4 Organização do Storybook

```
Foundations/          # Cores, Tipografia, Espaçamento, Z-index — gerado a partir de tokens.css
Components/
  Button, Card, Modal, Chip, Avatar, Loader, Snackbar, Input, ...
Layout/
  AppHeader, AppFooter, AuthLayout
Patterns/              # composições recorrentes que não são "um componente" isolado, ex.: FeedCard
```

### 4.5 Regras de criação, reuso e evolução

- Regra de criação: seção 2.7 deste documento (não repetir no Storybook — linkar).
- Toda mudança visual em um componente do DS é feita **no componente**, nunca copiando o componente para customizar uma tela — se uma tela precisa de algo diferente, isso é uma prop/variant nova no DS.
- Todo componente novo em `components/UI/` **precisa** de pelo menos 1 story antes do PR ser aprovável (gate a formalizar na Fase 7).

---

## 5. Documentação e AGENTS.md

Tudo nesta seção é **escrito na Fase 7**, de uma vez, depois que as decisões já estão implementadas — não antes. Escrever a regra antes de o código refletir a regra é exatamente como `docs/` chegou ao estado picotado descrito em H1; não repetir o padrão aqui.

### Documentos a manter/criar (mínimo necessário — sem duplicar)

| Documento | Propósito |
|---|---|
| **Este arquivo** (`REFACTOR_AUDIT_PLAN.md`) | Registro histórico do diagnóstico e do plano de fases. Marcado como histórico ao final da Fase 7 (não apagar — é rastreabilidade de decisão). |
| `src/styles/README.md` (expandir o existente, hoje com 3 linhas) | A regra de decisão da seção 2.6 (Vuetify → DS → Tailwind → CSS scoped) e onde ficam os tokens. |
| `docs/DESIGN_SYSTEM.md` **ou** Storybook "Docs" page | Como usar o catálogo, regra de criação/reuso (seção 2.7/4.5), incluindo o resultado da auditoria 3a (o que foi unificado e o que ficou separado, e por quê). Preferir viver dentro do próprio Storybook para não duplicar com este arquivo. |
| `docs/TESTING.md` (curto) | Onde e como escrever teste unitário/componente neste repo (seção 2.8), comando para rodar, **e** a divisão de responsabilidade com o `weparty-automation` (E2E fica lá — ver 3.0). |
| Reorganização de `docs/` (H1) | Arquivar guias obsoletos/sobrepostos (`CORRECTIONS_SUMMARY.md`, `CSS_CORRECTIONS_REPORT.md` etc.) num `docs/archive/`; manter só o que é referência viva. |

Não criar documento novo além destes a menos que uma fase revele necessidade real — evitar o mesmo problema de `docs/` (H1) se repetir.

### Atualizações necessárias no `AGENTS.md` (todas aplicadas juntas na Fase 7)

Não duplicar conteúdo — o `AGENTS.md` deve **referenciar** este documento, o Storybook e o `weparty-automation`, não copiar as tabelas. Conteúdo a incluir, todo de uma vez:

- Corrigir a lista de stores (`AGENTS.md:41`) para refletir a realidade (`events`, `interestPage`, `share` — sem `app`).
- Remover a menção a `package-lock.json` (`AGENTS.md:21`) — o padrão já é `yarn` na prática (CI usa `--frozen-lockfile`).
- Regra: "Header/Footer só via `AppHeader`/`AppFooter` (`src/components/UI/`); nunca criar `<header>`/`<footer>` inline numa página. Implementações antigas ficam arquivadas em `src/components/_revisar_/`, não são reaproveitadas."
- Regra: "Cor/espaçamento/radius vêm de `src/styles/tokens.css`; nunca hex-code novo em `<style>` ou `tailwind.config.ts`."
- Substituir a seção "1. Reuso antes de criar" (`AGENTS.md:65-76`) para apontar **só** para `src/components/UI/` + Storybook (removendo a referência a `components/modules/UI/`, que deixa de existir), incluindo o critério de migração/não-migração da seção 2.7.
- Nova seção curta: "Toda funcionalidade nova com interação relevante ganha `data-testid` no momento em que é escrita; o teste E2E correspondente é responsabilidade do `weparty-automation` (`../weparty-automation/AGENTS.md`), acionado em paralelo." (regra 3.0 deste plano).
- Adicionar seção "Antes de abrir PR" com o comando de teste (`yarn vitest run`), ao lado do já existente `type-check`/`lint`.
- Manter a seção "Checklist de segurança" como está — não é afetada por este plano e já é referência útil.
- Reforçar explicitamente: **não tocar** em `openspec/`, `.opencode/`, `.claude/commands/opsx/*`, `.claude/skills/openspec-*` — infraestrutura de um esforço futuro separado (item A4).

O `AGENTS.md` continua sendo o **ponto de entrada curto**; este documento e o Storybook carregam o detalhe. Essa divisão evita que o `AGENTS.md` volte a crescer de forma desorganizada como aconteceu com `docs/`.

---

## Princípios que guiam a execução (repetidos aqui como checklist do plano)

- Preservar comportamento atual em cada fase — nenhuma fase muda o que o usuário vê, exceto a Fase 1 (unificação visual de header/footer), que é feita com revisão visual explícita.
- Nenhuma tecnologia nova sem justificativa registrada (a única adição proposta é Vitest/Vue Test Utils/Storybook — todas resolvendo um "zero" diagnosticado, não uma preferência).
- Nenhuma abstração antes da 3ª repetição real (seção 2.9).
- Toda duplicação encontrada durante a execução das fases (não só as listadas aqui) segue o mesmo critério da seção 2.7 antes de virar componente novo.
- Código descartado (headers/footers antigos, versões de componente não escolhidas) é **arquivado em `src/components/_revisar_/`, nunca apagado** neste plano — decisão de remoção definitiva fica para depois, fora deste esforço.
- `openspec/`, `.opencode/` e os comandos `opsx-*` não são tocados por nenhuma fase (item A4) — são infraestrutura de um esforço futuro separado.
- `data-testid` e os testes E2E correspondentes seguem a regra transversal 3.0, acionando um sub-agente no `weparty-automation` a cada checkpoint — E2E não é escrito neste repositório.
- Cada fase é validável e reversível isoladamente — não faremos uma refatoração única "big bang".

---

## Progresso das fases

Cada fase avança em um branch próprio e abre PR para validação — só passa
para a fase seguinte depois do PR anterior mergeado.

| Fase | Status | PR | Observação |
|---|---|---|---|
| 0 — Fundação | 🟢 Concluída | [#40](https://github.com/we-tech-git/we-party-web-app/pull/40) (mergeado) | Vitest + Vue Test Utils instalados; teste de fumaça verde; `tokens.css` esqueleto; `_revisar_/` criado; regra de template de PR adicionada ao `AGENTS.md` (pedido à parte do time). |
| 1 — Header/Footer únicos | 🟡 Em revisão | _(abrindo)_ | `AppHeader`/`AppFooter` únicos criados e em uso (área autenticada + app inteiro, respectivamente); `EventDetails.vue`/`EventView.vue` descobertos como código morto e arquivados (correção registrada em B1b); `NewEventDetails.vue` -318 linhas, `LandingPage.vue` -349 linhas. `yarn lint`/`yarn test`/`yarn build` verdes; validação visual feita via browser (Landingpage). |
| 2 — Tokens visuais únicos | ⬜ Não iniciada | — | Aguardando Fase 1. |
| 3 — Auditoria de componentes + DS/Storybook | ⬜ Não iniciada | — | Aguardando Fase 2. |
| 4 — Testes de regressão nos mega-arquivos | ⬜ Não iniciada | — | Aguardando Fase 3 (pode em paralelo com 3, mas depende de 0). |
| 5 — Decompor mega-arquivos | ⬜ Não iniciada | — | Aguardando Fases 3 e 4. |
| 6 — Eliminar duplicação restante | ⬜ Não iniciada | — | Aguardando Fase 5. |
| 7 — Documentação consolidada + gates | ⬜ Não iniciada | — | Aguardando Fase 6. |

Legenda: ⬜ não iniciada · 🟡 em andamento/em revisão · 🟢 concluída (PR mergeado) · 🔴 bloqueada.

---

🤖 Gerado com [Claude Code](https://claude.com/claude-code)

Claude-Session: https://claude.ai/code/session_01K3PJYk2t9Nu3GUYbFzdH8r
