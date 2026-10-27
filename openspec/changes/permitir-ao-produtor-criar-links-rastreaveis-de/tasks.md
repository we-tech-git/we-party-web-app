## 1. Implementação

- [ ] 1.1 `src/api/event.ts:218`: mudar para `getEventById (id: string | number, ref?: string)`; montar `const query = ref ? `?ref=${encodeURIComponent(ref)}` : ''` e chamar `callApi('GET', `/events/${id}${query}`, {}, true)`
- [ ] 1.2 `src/components/modules/Feed/NewEventDetails.vue`: importar `useRoute` (já importa `useRouter` na linha 590) e criar `const refParam = computed(...)` que lê `route.query.ref`, pega o primeiro valor se for lista e devolve `undefined` se vazio
- [ ] 1.3 Mesmo arquivo, `loadEvent()` (linha ~1392): trocar por `getEventById(currentId.value, refParam.value)`
- [ ] 1.4 Mesmo arquivo: contar quantas vezes `loadEvent()` roda numa abertura normal (chamadas nas linhas ~1439, 1453, 1464); se mais de uma, evitar a repetição com o mesmo `id`+`ref` (flag local), sem mudar o botão "tentar de novo" (linha 554)
- [ ] 1.5 Conferir com `grep -n "window.location.href" src/stores/share.ts` e na tela que `handleShare` (linha ~1154) continua sem `ref`; não alterar

## 2. Testes (Vitest, `yarn test`)

- [ ] 2.1 `src/components/modules/Feed/NewEventDetails.spec.ts`: com o router de teste em `/event/ev1?ref=k3m9x2ab`, `getEventById` é chamado com `('ev1', 'k3m9x2ab')` uma única vez
- [ ] 2.2 Mesmo arquivo: sem `ref` o segundo argumento é `undefined`; `ref=` vazio também; `ref` repetido usa o primeiro; o teste existente "monta sem lançar erro" (que espera `toHaveBeenCalledWith('ev1')`) ajustado para `('ev1', undefined)`
- [ ] 2.3 `src/api/event.spec.ts` (novo): com `callApi` mockado, `getEventById('ev1', 'a&b=1')` chama `/events/ev1?ref=a%26b%3D1`; sem `ref` chama `/events/ev1`
- [ ] 2.4 Teste de que o `shareStore.open` da tela continua com a URL sem `ref`
- [ ] 2.5 Pedir ao `weparty-automation` (fora deste repo) o fluxo: abrir `/event/<id>?ref=<code>` logado e ver a chamada com `ref` via `cy.intercept`; `data-testid` não é necessário (não há UI nova)

## 3. Verificação

- [ ] 3.1 `yarn lint`, `yarn type-check`, `yarn test` e `yarn build` passam
- [ ] 3.2 Com backend local e `FEATURE_TRACKING_LINKS=true`: logado, abrir `/event/<id>?ref=<code>` e conferir na aba Network `GET /events/<id>?ref=<code>`, e `totalViews` +1 no CMS
- [ ] 3.3 Abrir sem `ref` e conferir que a requisição não mudou

## 4. Encerramento

- [ ] 4.1 Rodar `openspec archive permitir-ao-produtor-criar-links-rastreaveis-de` como último commit, para a capability entrar em `openspec/specs/`
