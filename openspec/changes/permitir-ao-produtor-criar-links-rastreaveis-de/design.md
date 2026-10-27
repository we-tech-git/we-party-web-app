## Context

`/event/:id` é a rota `src/pages/(private)/event/[id].vue` (arquivo no grupo `(private)`, que recebe `meta.requiresAuth` em `vite.config.mts`). O componente `NewEventDetails.vue` carrega o evento em `loadEvent()` (linha 1374): pinta o preview vindo do feed, se houver, e busca o evento completo com `getEventById`. `getEventById` usa `callApi('GET', url, {}, true)` (`src/api/event.ts:218-229`); `callApi` (`src/api/index.ts:102`) concatena `VITE__BASE_URL` com a URL recebida, então a query string pode ir na própria URL.

## Goals / Non-Goals

**Goals:** repassar `?ref=` da URL da página para `GET /events/:id`, sem alterar nada quando não há `ref`.

**Non-Goals:** ver proposta.

## Decisions

1. **`ref` como segundo parâmetro opcional de `getEventById(id, ref?)`**, não como objeto de opções: é o único parâmetro novo e os outros chamadores (`_revisar_/EventDetails.vue`, `_revisar_/EventView.vue`) continuam válidos sem mudança. Alternativa descartada: `params` do axios (`callApi` não expõe esse campo).
2. **Ler `route.query.ref` dentro de `NewEventDetails.vue`** com `useRoute()`, não na página `[id].vue`: é o componente que chama a API, e ele já é montado também com `eventData` de preview. Se vier `ref=a&ref=b`, usar o primeiro. Valor vazio é tratado como ausente.
3. **`encodeURIComponent` e nenhuma validação de formato.** O backend é a fonte da verdade sobre o que é um código válido; validar aqui duplicaria a regra e quebraria se o formato mudar.
4. **Sem flag no web-app.** Mandar `?ref=` é inofensivo; quem liga/desliga é o backend. Alternativa descartada: `VITE__FF_TRACKING_LINKS` (mais uma variável sem efeito prático).
5. **Só a primeira carga conta.** `loadEvent()` também roda no botão "tentar de novo" (linha 554) e quando o `id` muda (linhas 1439-1464). O `ref` é repassado em todas, porque é a mesma URL aberta; o backend decide. Aceitável: uma nova tentativa depois de falha não duplica contagem, pois a falha não chegou ao backend; recarga manual conta como nova visita, igual ao `viewCount`.

## Risks / Trade-offs

- **`ref` perdido no login** (principal): visitante deslogado cai em `/login` e o `ref` some. Mitigação futura: guardar o `ref` antes do redirecionamento. Não está nesta spec.
- **`loadEvent` roda mais de uma vez** na montagem (linhas 1439, 1453, 1464) em alguns fluxos; se a tela chamar duas vezes seguidas com `ref`, o backend conta duas visitas. Conferir na implementação quantas chamadas acontecem numa abertura normal e, se forem duas, deduplicar no front (uma tarefa em `tasks.md` cobre isso).

## Migration Plan

Merge depois do backend. Sem flag; o efeito só existe quando `FEATURE_TRACKING_LINKS=true` no backend. Reverter: reverter o PR.
