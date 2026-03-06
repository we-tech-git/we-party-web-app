# WE PARTY - Auth Kit

Kit completo e portátil com todas as telas de autenticação do WE PARTY.

## Estrutura

```
auth-kit/
├── components/              # Componentes Vue
│   ├── AuthLayout.vue       # Layout base (split screen: form + brand)
│   ├── InputLabel.vue       # Input com floating label
│   ├── Snackbar.vue         # Notificação toast
│   ├── LanguageSwitcher.vue # Seletor de idioma (pt-BR / en-US)
│   ├── Login.vue            # Tela de login
│   ├── Signup.vue           # Tela de cadastro
│   ├── ConfirmEmail.vue     # Confirmação de e-mail com PIN de 6 dígitos
│   ├── VerifyPin.vue        # Verificação de token de senha
│   ├── RequestPassword.vue  # Solicitar recuperação de senha
│   └── ResetPassword.vue    # Definir nova senha
├── api/                     # Camada de API (axios)
│   ├── index.ts             # callApi() - wrapper axios com auth
│   ├── users.ts             # createUser, loginUser, sendPin, resendPin
│   └── password.ts          # requestReset, verifyToken, setNewPassword
├── services/
│   └── auth.ts              # AuthService - gerencia token/user no localStorage
├── common/
│   └── storage.ts           # STORAGE_KEYS enum
├── utils/
│   └── svgSet.ts            # Ícones SVG (back arrow, check, eye, etc.)
├── composables/
│   └── useAuth.ts           # useAuth() - estado reativo de autenticação
├── locales/
│   ├── pt-BR.json           # Traduções português
│   └── en-US.json           # Traduções inglês
├── plugins/
│   └── i18n.ts              # Configuração vue-i18n
└── styles/
    └── shared-styles.css    # Estilos compartilhados (.btn-primary, .auth-title)
```

## Dependências npm

```json
{
  "vue": "^3.x",
  "vue-router": "^4.x",
  "vue-i18n": "^9.x",
  "axios": "^1.x",
  "canvas-confetti": "^1.x",
  "vuetify": "^3.x"
}
```

## Variável de ambiente

```env
VITE__BASE_URL=https://sua-api.com/api
```

## Como integrar no outro projeto

1. Copie a pasta `auth-kit/` para `src/` do novo projeto
2. Instale as dependências: `npm install vue-i18n axios canvas-confetti vuetify`
3. Configure o plugin i18n no `main.ts`:
   ```ts
   import i18n from './auth-kit/plugins/i18n'
   app.use(i18n)
   ```
4. Importe `shared-styles.css` no `main.ts`:
   ```ts
   import './auth-kit/styles/shared-styles.css'
   ```
5. Ajuste os imports `@/` nos componentes para apontar para `auth-kit/`:
   - `@/components/UI/AuthLayout/AuthLayout.vue` → `../AuthLayout.vue`
   - `@/components/UI/inputLabel/InputLabel.vue` → `../InputLabel.vue`
   - `@/components/UI/Snackbar/Snackbar.vue` → `../Snackbar.vue`
   - `@/api/users` → `../api/users`
   - `@/api/password` → `../api/password`
   - `@/services/auth` → `../services/auth`
   - `@/common/storage` → `../common/storage`
   - `@/utils/svgSet` → `../utils/svgSet`
   - `@/composables/useAuth` → `../composables/useAuth`
   - `@/router` → ajuste para o router do novo projeto
6. Configure as rotas apontando para os componentes
7. Defina `VITE__BASE_URL` no `.env`

## Rotas sugeridas

```ts
const routes = [
  { path: '/login', component: () => import('./auth-kit/components/Login.vue') },
  { path: '/signup', component: () => import('./auth-kit/components/Signup.vue') },
  { path: '/confirm-email', component: () => import('./auth-kit/components/ConfirmEmail.vue') },
  { path: '/request-password', component: () => import('./auth-kit/components/RequestPassword.vue') },
  { path: '/verify-pin', component: () => import('./auth-kit/components/VerifyPin.vue') },
  { path: '/reset-password', component: () => import('./auth-kit/components/ResetPassword.vue') },
]
```

## Fluxos de autenticação

### Login
`Login.vue` → API `/users/login` → salva token no localStorage → redireciona para feed

### Cadastro
`Signup.vue` → API `/users` → `ConfirmEmail.vue` (PIN 6 dígitos) → API `/users/verify-email` → redireciona para interesses

### Recuperação de senha
`RequestPassword.vue` → API `/password/request-password-reset` → `VerifyPin.vue` (link por email) → `ResetPassword.vue` → API `/password/set-new-password` → redireciona para login

## Observações

- Os componentes usam `@/` como alias do Vite/TS. Se o novo projeto usar alias diferente, ajuste os imports.
- O `AuthLayout.vue` importa `LanguageSwitcher.vue` — verifique o caminho.
- `canvas-confetti` é usado no Signup e ConfirmEmail (efeito visual no sucesso).
- O Vuetify é usado apenas no LanguageSwitcher (`v-menu`, `v-btn`, `v-list`). Pode substituir por menu HTML puro se não quiser Vuetify.
