# Documentação — We Party Web App

Reorganizado na Fase 7 do `REFACTOR_AUDIT_PLAN.md` (na raiz do projeto) —
esta pasta guarda só o que é **referência viva**; relatórios/resumos de
trabalho já concluído ficam em [`archive/`](./archive/README.md).

## Índice

### Como o projeto funciona hoje

| Documento | Conteúdo |
|---|---|
| [`../AGENTS.md`](../AGENTS.md) | Ponto de entrada curto para quem (humano ou agente de IA) for mexer no código — convenções, stack, comandos, checklist de PR. |
| [`../REFACTOR_AUDIT_PLAN.md`](../REFACTOR_AUDIT_PLAN.md) | Diagnóstico técnico completo e histórico do plano de padronização/refatoração (Fases 0-7). Registro histórico de decisão — não editar como se fosse documentação viva, é a ata do que foi decidido e por quê. |
| [`../src/styles/README.md`](../src/styles/README.md) | De onde vem cor/espaçamento/radius (tokens), e a ordem de decisão Vuetify → Design System → Tailwind → CSS scoped. |
| [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) | Catálogo de componentes do Design System (`src/components/UI/`), critério de quando criar um componente novo vs. reutilizar/estender um existente, e o resultado da auditoria de duplicação feita na Fase 3. |
| [`TESTING.md`](./TESTING.md) | Onde/como escrever teste unitário e de componente neste repositório (Vitest + Vue Test Utils), e a divisão de responsabilidade com o `weparty-automation` (E2E). |
| [`RATE_LIMITING_GUIDE.md`](./RATE_LIMITING_GUIDE.md) | Padrões de debounce, throttle, cancelamento de requisição (`AbortController`) e rate limiting usados no projeto — critério de escolha e tabela de tempos. |
| [`SOCIAL_AUTH_GUIDE.md`](./SOCIAL_AUTH_GUIDE.md) | Visão geral de como o login social (Google/Facebook) funciona hoje. |

### Contratos de API (backend)

| Documento | Conteúdo |
|---|---|
| [`BACKEND_COMMENT_THREADS_SPEC.md`](./BACKEND_COMMENT_THREADS_SPEC.md) | Comentários em árvore (até 5 níveis) + likes por comentário. |
| [`BACKEND_NEW_INTERESTS_SPEC.md`](./BACKEND_NEW_INTERESTS_SPEC.md) | Endpoint de solicitação de novos interesses. |
| [`BACKEND_USER_SEARCH_SPEC.md`](./BACKEND_USER_SEARCH_SPEC.md) | Endpoint de busca de usuários. |

### Histórico

- [`archive/`](./archive/README.md) — relatórios/resumos de mudanças já concluídas, escritos no momento em que aconteceram. Consulta para entender "por que isso foi feito assim na época", não para saber como o projeto funciona hoje.

### Testes end-to-end (E2E)

Ficam em um repositório separado, [`weparty-automation`](../../weparty-automation) —
ver `weparty-automation/AGENTS.md`. Não é criado nenhum teste E2E dentro
deste repositório (regra transversal 3.0 do `REFACTOR_AUDIT_PLAN.md`).
