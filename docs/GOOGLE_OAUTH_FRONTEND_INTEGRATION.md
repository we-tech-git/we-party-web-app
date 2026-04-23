# 🔐 Google OAuth Frontend Integration - Resumo de Implementação

## ✅ Mudanças Realizadas

### 1. **Google SDK Script** (`index.html`)
```html
<!-- Adicionado no <head> -->
<script async defer src="https://accounts.google.com/gsi/client"></script>
```
- Carrega a biblioteca oficial do Google Sign-In
- Necessário para renderizar o botão de login e processar ID Tokens

### 2. **Variável de Ambiente** (`.env`)
```env
# Adicionado:
VITE__GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
```
- Substitua `YOUR_GOOGLE_CLIENT_ID_HERE` com seu Web Client ID do GCP
- Exemplo: `1234567890-abcdefghijklmnopqrst.apps.googleusercontent.com`

### 3. **SocialAuthService** (`src/services/socialAuth.ts`)

#### ✨ Novo Método: `getGoogleSignInCallback()`
```typescript
// Retorna um callback para ser usado pelo Google SDK
// Processa o ID Token e envia para o backend
getGoogleSignInCallback()
```

**Fluxo:**
1. Google SDK retorna `{ credential: idToken }`
2. Callback valida e envia para `POST /users/google-auth`
3. Backend valida o token e retorna `{ success, data: { token, user, isNewUser }, message }`
4. Salva JWT no localStorage

#### ✨ Novo Método: `sendIdTokenToBackend()`
```typescript
// Envia ID Token para /users/google-auth
// Retorna: { success, token, user, message }
private async sendIdTokenToBackend('google', idToken)
```

#### ✅ Método Existente: `loginWithGoogle()` (Atualizado)
- Mantém compatibilidade
- Usa novo callback internamente
- Abre Google Sign-In prompt/popup

### 4. **SocialAuthButtons Component** (`src/components/UI/SocialAuthButtons/SocialAuthButtons.vue`)

#### 🔄 Mudanças Principais:
1. **Inicializa Google SDK na montagem** (`onMounted`)
   - Aguarda o SDK ser carregado
   - Initializa cliente Google com Client ID

2. **Callback Handler**: `handleGoogleCredential()`
   - Recebe resposta do Google Sign-In
   - Extrai ID Token
   - Processa via `socialAuthService.getGoogleSignInCallback()`
   - Emite `@google-success` ou `@google-error`

3. **Novos Eventos Emitidos:**
   ```typescript
   emit('google-success', data)  // { token, user, isNewUser, message }
   emit('google-error', error)   // { message }
   emit('google-auth')           // Compatibilidade
   ```

### 5. **Login Component** (`src/components/modules/Login/Login.vue`)

#### ✨ Novo Handler: `handleGoogleSuccess()`
```typescript
// Chamado quando Google OAuth sucede
async function handleGoogleSuccess(data: any) {
  // Salva token e user no localStorage
  // Mostra sucesso Snackbar
  // Redireciona para /private/feed
}
```

#### ✨ Novo Handler: `handleGoogleError()`
```typescript
// Chamado quando Google OAuth falha
async function handleGoogleError(error: any) {
  // Mostra mensagem de erro no Snackbar
}
```

#### ✅ Handler Existente: `handleGoogleAuth()` (Mantido para compatibilidade)
- Chamado pelo evento `@google-auth`
- Delega para `handleGoogleSuccess()` em caso de sucesso

#### 📡 Template Atualizado:
```vue
<SocialAuthButtons
  mode="login"
  :show-email="false"
  @google-success="handleGoogleSuccess"
  @google-error="handleGoogleError"
  @google-auth="handleGoogleAuth"
  @facebook-auth="handleFacebookAuth"
/>
```

## 🔄 Fluxo Completo

```
1. User clica "Login com Google"
   ↓
2. SocialAuthButtons.handleGoogleAuth()
   ↓
3. Google SDK abre prompt
   ↓
4. User seleciona conta Google
   ↓
5. Google retorna { credential: idToken }
   ↓
6. SocialAuthButtons.handleGoogleCredential()
   ↓
7. socialAuthService.getGoogleSignInCallback()(response)
   ↓
8. POST /users/google-auth { idToken }
   ↓
9. Backend valida token com google-auth-library
   ↓
10. Backend retorna { success, data: { token, user, isNewUser }, message }
    ↓
11. SocialAuthButtons salva token e emite @google-success
    ↓
12. Login.handleGoogleSuccess() recebe dados
    ↓
13. Salva no localStorage
    ↓
14. Mostra sucesso e redireciona para /private/feed
```

## 📋 Checklist de Implementação

- [x] Google SDK script adicionado ao `index.html`
- [x] VITE__GOOGLE_CLIENT_ID configurado no `.env`
- [x] `SocialAuthService` atualizado com fluxo de ID Token
- [x] `SocialAuthButtons` inicializa SDK e emite eventos
- [x] `Login.vue` handlers para sucesso e erro
- [x] localStorage salva corretamente
- [x] Redirecionamento após sucesso

## 🚀 Próximos Passos

### 1. **Configurar Client ID do GCP**
```bash
# No seu arquivo .env local ou deploy:
VITE__GOOGLE_CLIENT_ID=1234567890-abcdefghijklmnopqrst.apps.googleusercontent.com
```

### 2. **Testar Localmente** (localhost:3000)
```bash
npm run dev
# Ir para /public/login
# Clicar em "Login com Google"
# Logs no console devem mostrar: [GOOGLE AUTH] messages
```

### 3. **Verificar Logs do Backend**
```
[GOOGLE AUTH] ID Token recebido do Google SDK
[GOOGLE AUTH] Enviando token para o backend...
POST /users/google-auth { idToken: "..." }
[GOOGLE AUTH] Backend validou token com sucesso
[GOOGLE AUTH] ✅ Login bem-sucedido!
```

## 🔒 Segurança

- ✅ ID Token validado no backend (não no frontend)
- ✅ JWT armazenado no localStorage (HTTPS em produção)
- ✅ CORS configurado apenas para domínios autorizados
- ✅ Google verifica email automaticamente
- ✅ Senha opcional para usuários OAuth

## ⚠️ Troubleshooting

### "Google SDK não carregou"
- Verifique se `index.html` tem a tag script
- Verifique console para erros de rede
- Desabilite adblockers

### "Client ID not configured"
- Verifique VITE__GOOGLE_CLIENT_ID no `.env`
- Restart do servidor dev (npm run dev)
- Verifique se é o Web Client ID correto

### "Erro ao validar token"
- Verifique logs backend
- Confirme que backend tem google-auth-library instalado
- Certifique-se de que CLIENT_SECRET está correto no backend

## 📚 Referências

- [Google Sign-In Documentation](https://developers.google.com/identity/gsi/web)
- [Backend Implementation](../backend/GOOGLE_OAUTH_IMPLEMENTATION.md)
- [GCP Setup Guide](GOOGLE_OAUTH_GCP_FINAL_SETUP.md)
