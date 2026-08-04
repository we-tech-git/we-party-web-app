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
