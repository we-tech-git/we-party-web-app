# Preservação do ref no redirect de login

Quando um visitante deslogado abre uma rota privada (ex.: `/event/<id>?ref=<code>`), o guard de rotas redireciona para `/login?next=<caminho completo>`, guardando o caminho com a query. Depois do login, o visitante volta ao caminho original, com o `ref` intacto, e a visualização por link de divulgação é contada.

- `next` só vale se for caminho relativo da própria app: valores com `//`, `\\` ou apontando para `/login` são ignorados (sem open redirect) e o destino padrão é `/feed`.
- Código: `src/utils/safeNextPath.ts`, `privateRouteGuard` em `src/composables/useAuth.ts` e o login em `Login.vue`.

_Origem: WEPARTY-239, decisão do Pedro no refinamento (2026-11-10). Registrado pelo hub; revisado antes do merge._
