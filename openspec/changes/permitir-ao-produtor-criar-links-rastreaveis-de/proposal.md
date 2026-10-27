## Why

O produtor vai divulgar o evento com links do tipo `https://wepartyapp.com/event/<id>?ref=<code>` (criados no CMS, ver a mudança de mesmo nome no `we-party-cms`). Para o backend contar a visita por canal, o web-app precisa repassar o `ref` da URL da página do evento para a chamada `GET /events/:id`. Hoje isso não acontece: `NewEventDetails.vue` chama `getEventById(currentId.value)` (`src/components/modules/Feed/NewEventDetails.vue:1392`), e `getEventById` (`src/api/event.ts:218`) monta `/events/${id}` sem nenhum parâmetro. Tarefa no Plane: WEPARTY-239.

Correções em relação ao card original, depois de ler o código:

- A página do evento é `src/pages/(private)/event/[id].vue`, que só monta `<NewEventDetails :event-id="eventId" />`; quem chama a API é `NewEventDetails.vue`, então é lá (e em `src/api/event.ts`) que a mudança entra.
- O web-app é Vue 3 + Vite (variáveis `VITE__*`), não Nuxt. A proposta citava `NEXT_PUBLIC_FF_TRACKING_LINKS`, que é do CMS (Next). **O web-app não precisa de flag própria:** a flag que decide se `ref` conta é `FEATURE_TRACKING_LINKS` no backend; com ela desligada o backend ignora o parâmetro.
- `stores/share.ts` usa `window.location.href` só como valor padrão (`share.ts:15`). A tela do evento passa a URL explicitamente (`NewEventDetails.vue:1157`, `${window.location.origin}/event/${id}`), sem `ref`. **Fica assim de propósito:** quem compartilha pelo botão do app não deve carregar o `ref` do produtor para o link de outra pessoa.
- **Lacuna que a proposta já listava como fora de escopo, mas com consequência grande:** a rota `/event/:id` fica em `(private)`, e `router/index.ts:95` manda quem não está logado para `/login` (`useAuth.ts:283-293`). O `ref` se perde nesse redirecionamento. Resultado: só conta quem já estava logado ao abrir o link. Ver pergunta aberta no card.

## What Changes

- `getEventById(id, ref?)` em `src/api/event.ts`: quando `ref` é uma string não vazia, a URL vira `/events/${id}?ref=${encodeURIComponent(ref)}`; sem `ref`, continua `/events/${id}` (chamada idêntica à atual).
- `NewEventDetails.vue`: ler `route.query.ref` (primeiro valor, se vier lista) e passar a `getEventById` em `loadEvent()`.
- Nada mais muda: nenhuma tela, texto ou componente novo.

## Fora de escopo

- Preservar o `ref` através do login/cadastro (guardar em `sessionStorage` e reaplicar depois do login seria a solução; decisão do Pedro).
- Tornar a página do evento pública.
- Acrescentar `ref` aos links compartilhados pelo `ShareSheet`.
- Flag no web-app.
- Validar o formato do `ref` no front (o backend valida; o front só repassa, com `encodeURIComponent`).

## Capabilities

### New Capabilities
- `event-ref-forwarding`: a tela do evento repassa o `ref` da URL ao carregar o evento.

## Impact

- **Arquivos (web-app):** `src/api/event.ts`, `src/components/modules/Feed/NewEventDetails.vue`, `src/components/modules/Feed/NewEventDetails.spec.ts` (e, se existir, teste de `src/api/event`).
- **Contrato:** consome o query opcional `ref` de `GET /events/:id` (backend desta mesma tarefa). Backend antigo ignora query desconhecida; backend novo com flag desligada também.
- **Compatibilidade:** sem `ref`, a requisição é byte a byte a de hoje.
- **Como reverter:** reverter o PR, ou simplesmente desligar `FEATURE_TRACKING_LINKS` no backend (o `ref` passa a ser ignorado). Sem migration.
- **Regra do repositório:** o `AGENTS.md` do web-app diz para não tocar em `openspec/`; esta spec existe porque o fluxo de spec da tarefa exige.
