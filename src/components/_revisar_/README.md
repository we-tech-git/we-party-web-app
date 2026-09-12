# _revisar_

Código descartado durante a padronização/refatoração descrita em
`REFACTOR_AUDIT_PLAN.md`, preservado aqui para consulta futura — não é
importado por nenhuma página/componente ativo.

## O que está aqui

- **`EventDetails.vue` + `EventView.vue`** (Fase 1) — não são "descarte" por
  escolha de um entre vários; são **código morto confirmado**: nenhuma rota
  ou componente ativo os importa (`src/pages/private/event/[id].vue` já usa
  `NewEventDetails.vue` há um tempo, com o comentário "A tela antiga
  (EventView/EventDetails) permanece no projeto, mas fora de uso"). Movidos
  pra cá em vez de apagados, seguindo o mesmo princípio deste diretório —
  ver correção no diagnóstico do `REFACTOR_AUDIT_PLAN.md` (item B1).
- **`FeedCardStandalone.vue`** (Fase 6) — mesma situação: **código morto
  confirmado**, não `FeedCard` "com uma variação real" como o item B3 do
  diagnóstico supunha. `grep -rn "FeedCardStandalone" src/` (fora deste
  arquivo e deste README) não retorna nenhuma página, rota ou componente
  ativo importando-o. A duplicação de fato (barra de curtir/comentar/ver
  interesses) só existia entre um componente vivo (`FeedCard.vue`) e um
  morto — não havia "2 implementações do mesmo conceito" pra consolidar,
  só uma implementação viva e um arquivo órfão. Ver Fase 6 no plano.

## O que NÃO foi movido pra cá, apesar de aparecer no diagnóstico original

- **Header da Landingpage** — decisão do time (ver Fase 1 no plano): o
  header do Feed vira único só na área autenticada; a Landingpage pública
  mantém seu próprio header de marketing onde está, por ser um header
  legítimo e distinto, não uma cópia do outro.

Decisão de remoção definitiva do que estiver aqui fica para depois deste
esforço — ver seção "Princípios" do `REFACTOR_AUDIT_PLAN.md`.

## Nota técnica

Esta pasta é **excluída do auto-import** (`vite.config.mts`, plugin
`Components`) — arquivo aqui não colide por nome com o componente ativo que
o substituiu (ex.: havia dois `AppFooter.vue` até isso ser adicionado) nem
vira sugestão de auto-import em componente novo.

