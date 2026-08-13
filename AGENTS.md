# we-party-web-app — Agent Context

Este arquivo é lido por agents ANTES de qualquer alteração neste repo. É o **frontend web** (app do usuário) da rede social de eventos We Party; consome a API do `we-party-social-backend`.

## Stack (FATO, não alterar sem confirmar)
- **Vue 3** (`<script setup>`, Composition API) + **TypeScript**
- **Vuetify 3** (UI) + **Tailwind CSS 4** (utilitários)
- **Vite 7** (build/dev)
- **Pinia 3** (state)
- **Vue Router 4** com **rotas file-based** (`unplugin-vue-router` — as rotas nascem de `src/pages/`)
- **vue-i18n** (i18n) + layouts via `vite-plugin-vue-layouts-next`
- **axios** (HTTP)
- Auto-import de componentes (`unplugin-vue-components`)

## Comandos
- `dev` — dev server (`vite`)
- `build` — type-check (`vue-tsc`) + `vite build`
- `preview` — serve o build (`vite preview`)
- `type-check` — `vue-tsc --build`
- `lint` — ESLint (`eslint . --fix`, config `eslint-config-vuetify`)
> **Package manager:** não fixado — existem **`yarn.lock`** e **`package-lock.json`** no repo. Padronizar em um só (confirmar com o time antes).

## Arquitetura
```
src/
├── main.ts / App.vue
├── pages/                # rotas file-based (unplugin-vue-router)
│   ├── public/           # não autenticadas: Login, Signup, VerifyPin, ConfirmEmail,
│   │                     #   ResetPassword/RequestPassword, Interest, AddFriends, Landingpage
│   ├── home/             # área logada
│   ├── private/          # rotas privadas
│   └── landing.vue, [...all].vue (catch-all)
├── layouts/              # layouts (vue-layouts-next)
├── api/                  # chamadas HTTP ao backend (por recurso)
├── services/             # ex.: socialAuth (Google/Facebook)
├── stores/               # Pinia: app, events, share
├── composables/          # lógica reutilizável (Composition API)
├── components/           # UI/ e modules/
├── plugins/              # i18n, vuetify (registrados no bootstrap)
├── locales/              # traduções (vue-i18n)
├── router/               # config de rotas/guards
├── types/ · utils/ · styles/ · common/ · legal/
```

## Integração com o backend
- Camada `src/api/` (axios). Arquivos por recurso: `users.ts`, `event.ts`, `comments.ts`, `follows.ts`, `interest.ts`, `password.ts`, `index.ts` (cliente base).
- **Base URL** vem de `import.meta.env.VITE__BASE_URL` (atenção: **dois underscores**). Ex.: `` `${VITE__BASE_URL}/users/profile` ``.
- Os recursos espelham o `we-party-social-backend` (users, events, follow, interest, comments).

## Variáveis de ambiente (Vite — prefixo `VITE`)
- `VITE__BASE_URL` — URL base da API
- `VITE__GOOGLE_CLIENT_ID` — OAuth Google (fallback `VITE_GOOGLE_CLIENT_ID`)
- `VITE__FACEBOOK_APP_ID` — login Facebook (fallback `VITE_FACEBOOK_APP_ID`)

## Documentação (no repo)
- `docs/` — specs e guias (ex.: `GOOGLE_OAUTH_FRONTEND_INTEGRATION.md`, `QUICK_START_SOCIAL_AUTH.md`, guias de otimização/correções)
- `README.md` — scaffolding Vuetify

## Safety
- NUNCA commitar `.env` com credenciais reais (usar `.env` local / secrets)
- NUNCA push direto em `main` — sempre via branch + PR
- Rodar `type-check` e `lint` antes de commitar
- Branch de trabalho de agent: `<agent>/<feature>`; docs: `docs/<slug>`

## Regras de implementação (frontend) — OBRIGATÓRIAS

### 1. Reuso antes de criar
Antes de escrever botão, input, modal, chip, loader, snackbar ou qualquer bloco de UI:
1. Procure em `src/components/UI/` (AppLoader, AuthLayout, ErrorBoundary, SearchInput, SelectableChip, Snackbar, SocialAuthButtons, LoginRequiredDialog, WePartyLoader, inputLabel) e em `src/components/modules/UI/`.
2. Considere também o Vuetify: `v-btn`, `v-dialog`, `v-text-field` etc. já cobrem muito caso — não reimplemente.
3. Se existe algo **parecido mas não igual**, estenda via prop/slot em vez de duplicar o template.
4. Lógica compartilhada vira **composable** em `src/composables/` (o projeto já tem useAuth, useValidation, useRateLimit, useEventImages...), não bloco copiado.
5. Só crie componente novo quando nada acima serve.

> ⚠️ `src/components/modules/Profile/Profile.vue` tem ~167KB num arquivo só, com cropper
> de imagem escrito à mão. Ao mexer nele, **extraia** o que tocar em vez de aumentar o monolito.

### 2. Ação assíncrona = loading no gatilho + toast no fim
Toda ação que dispara requisição (salvar perfil, upload, seguir, enviar comentário) deve:
- Usar `:loading` / `:disabled` **no próprio `v-btn` acionado**, já no clique.
- Terminar com **Snackbar/toast** de sucesso ou erro, com mensagem acionável.
- Impedir duplo disparo enquanto pendente.

**Exceção:** interações com retorno visual imediato — like, comentário, "eu vou", favoritar. Use atualização otimista e reverta em caso de erro; sem toast de sucesso (o de erro continua valendo).

### 3. Boas práticas de arquitetura
- Chamada HTTP mora em `src/api/*.ts` (via `callApi`); componente não chama axios direto.
- Estado compartilhado em Pinia (`src/stores/`); estado local fica no componente.
- Tipos em `src/types/`, espelhando o DTO do backend.
- Textos sempre via `vue-i18n` (`src/locales/`), nunca hardcoded.
- Componente de página fino: orquestra composables e delega render.

## Checklist de segurança (verificar a CADA nova implementação)

Não é burocracia: a lista existe porque estes erros já apareceram neste código.
Antes de abrir PR, percorra a coluna que se aplica ao que você mexeu.

### Sempre (qualquer camada)
- **Exposição excessiva de dados** — nunca devolver o model do ORM inteiro. Selecione campos explicitamente. *(Já aconteceu aqui: `GET /users/:id` vazava `passwordResetToken` e `apiKey`.)*
- **IDOR / BOLA** (Broken Object Level Authorization) — receber um `id` do cliente e confiar nele. Sempre validar que o solicitante pode acessar **aquele objeto**, não só que está autenticado.
- **Autorização por função ≠ autenticação** — `UserInfoGuard` só prova quem é; falta `RoleGuard` para provar que pode.
- **Segredo em log / mensagem de erro** — tokens, senhas, e-mails completos e stack traces não vão para log nem para a resposta.
- **Falha aberta** — em caso de erro, o padrão é negar. Nunca `catch` que devolve "autorizado".

### Backend / API
- **Mass assignment** — não repassar `req.body` direto para `update()`. Use DTO com allowlist (`whitelist: true` no ValidationPipe). Campos como `role`, `isBlocked`, `type` jamais vêm do cliente.
- **Injeção de SQL** — em `$queryRaw`/`$queryRawUnsafe`, todo valor do cliente entra como **parâmetro vinculado** (`$1`), nunca concatenado na string.
- **SSRF** — ao buscar URL fornecida pelo usuário (imagem, webhook, ViaCEP), validar esquema e bloquear IPs internos (169.254.169.254, 10/8, 127/8, ::1).
- **Path traversal / Zip slip** — nome de arquivo vindo do usuário nunca compõe caminho de disco sem normalizar e confinar ao diretório-alvo.
- **JWT** — validar `exp`, algoritmo fixado (rejeitar `alg: none`), segredo forte e fora do código.
- **Enumeração de contas** — login, "esqueci a senha" e cadastro devem responder igual para e-mail existente e inexistente, e ter rate limit.
- **Comparação de segredo em tempo constante** — API key/token com `crypto.timingSafeEqual`, não `===`.
- **ReDoS** — regex com quantificador aninhado (`(a+)+`) sobre entrada do usuário trava o event loop.
- **Race condition / TOCTOU** — "verifica depois grava" precisa de transação ou constraint única no banco.
- **CORS** — allowlist explícita. Nunca refletir `Origin` com `credentials: true`.

### Frontend
- **XSS** — evitar `v-html` (Vue) e `dangerouslySetInnerHTML` (React). Se for inevitável, sanitizar antes. Conteúdo de usuário (comentário, bio, nome de evento) é sempre hostil.
- **Upload de SVG** — SVG executa script. Trate como imagem só depois de sanitizar, ou sirva de outro domínio/com `Content-Disposition: attachment`.
- **Tabnabbing** — `target="_blank"` sempre com `rel="noopener noreferrer"`.
- **Open redirect** — parâmetro de retorno (`?next=`) só pode apontar para caminho relativo da própria app.
- **Token em storage** — não logar, não colocar em URL/query string, limpar no logout (inclusive cookie).
- **Dado sensível em query string** — vai para histórico, log de proxy e `Referer`. Use corpo da requisição.
- **Confiar em validação de cliente** — validação no front é UX; a regra tem que existir no backend também.
- **Prototype pollution** — merge recursivo de objeto vindo da API sem bloquear `__proto__`/`constructor`.

### Dependências
- **Dependency confusion / typosquatting** — conferir o nome exato do pacote e se ele existe no registro público antes de instalar.
- **Lockfile** — mudança de dependência sempre com lockfile versionado junto.
- Rodar `yarn npm audit` (ou equivalente) quando adicionar dependência nova.
