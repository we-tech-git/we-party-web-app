# Arquivo

Documentos históricos — relatórios/resumos de trabalho já concluído, escritos
no momento em que a mudança aconteceu. Mantidos aqui por rastreabilidade
(explicam decisões e o estado do projeto naquela época), mas **não são
referência viva**: várias das afirmações que fazem sobre "o estado atual do
projeto" já não são verdade hoje (o próprio motivo de arquivá-los — ver item
H1 do diagnóstico em `REFACTOR_AUDIT_PLAN.md`, seção 1).

Reorganizado na Fase 7 do `REFACTOR_AUDIT_PLAN.md`. Antes deste arquivo
existir, `docs/` misturava esses relatórios com a documentação viva sem
nenhuma distinção — dificultando saber qual documento ainda vale a pena
seguir.

## O que está aqui

- `CONSOLE_ERRORS_FIX.md`, `CORRECTIONS_SUMMARY.md`, `CSS_CORRECTIONS_REPORT.md`,
  `OPTIMIZATION_GUIDE.md`, `IMPROVEMENTS_GUIDE.md`, `SECURITY_REPORT.md` —
  relatórios pontuais de correções/melhorias, escritos logo depois da
  mudança correspondente ser feita.
- `GOOGLE_OAUTH_FRONTEND_INTEGRATION.md`, `QUICK_START_SOCIAL_AUTH.md` —
  resumos de implementação/checklist de teste de quando o login social foi
  adicionado. A visão geral de como o login social funciona **hoje**
  continua em `docs/SOCIAL_AUTH_GUIDE.md` (não arquivado).
- `SEARCH_INPUT_MAPPING.md` — mapeamento de onde `SearchInput` era usado e
  com qual estilo, num momento específico do projeto. Depois da Fase 5
  (decomposição de `LandingPage.vue`/`Profile.vue`/`Feed.vue`) vários desses
  pontos de uso mudaram de arquivo — o mapeamento ficaria desatualizado no
  mesmo dia em que fosse escrito de novo; se precisar de novo, gerar via
  `grep -rn "SearchInput" src/` é mais confiável do que manter um documento
  estático sincronizado à mão.
- `UPLOAD_TEST_GUIDE.md` — checklist de teste manual de upload de imagem,
  escrito quando a funcionalidade foi implementada.

## O que NÃO foi movido pra cá, apesar de ter estilo parecido

- `docs/BACKEND_COMMENT_THREADS_SPEC.md`, `docs/BACKEND_NEW_INTERESTS_SPEC.md`,
  `docs/BACKEND_USER_SEARCH_SPEC.md` — são **contratos de API** (o que o
  frontend espera do backend), não relatórios de trabalho concluído; esses
  endpoints continuam em uso e a especificação continua sendo a referência
  de contrato, independente de quando foi escrita.
- `docs/RATE_LIMITING_GUIDE.md` — guia técnico de referência para os padrões
  (debounce/throttle/rate-limit/cancelamento de requisição) usados no
  projeto **hoje**, não um relatório de uma mudança pontual.
- `docs/SOCIAL_AUTH_GUIDE.md` — visão geral de como o login social funciona
  atualmente; mantido como referência viva no lugar de
  `QUICK_START_SOCIAL_AUTH.md`/`GOOGLE_OAUTH_FRONTEND_INTEGRATION.md`.
