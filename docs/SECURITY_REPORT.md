# Relatório de Análise de Segurança - We Party Web App

**Data:** 19 de abril de 2026  
**Versão do Projeto:** 0.0.0  
**Tipo:** Aplicação Vue.js/Vite (Frontend SPA)

---

## Resumo Executivo

| Severidade        | Quantidade |
| ----------------- | ---------- |
| 🔴 Alta (High)    | 6          |
| 🟠 Média (Medium) | 5          |
| 🟡 Baixa (Low)    | 4          |
| ℹ️ Informativo    | 3          |

---

## 🔴 Vulnerabilidades de Alta Severidade

### 1. Dependências com Vulnerabilidades Conhecidas

**Arquivo:** `package.json`  
**CVE/Risco:** Múltiplas vulnerabilidades conhecidas

| Pacote        | Severidade | Versão Afetada        |
| ------------- | ---------- | --------------------- |
| **axios**     | HIGH       | 1.0.0 - 1.14.0        |
| **vite**      | HIGH       | 7.0.0 - 7.3.1         |
| **rollup**    | HIGH       | 4.0.0 - 4.58.0        |
| **minimatch** | HIGH       | <=3.1.3 / 9.0.0-9.0.6 |
| **picomatch** | HIGH       | <=2.3.1 / 4.0.0-4.0.3 |
| **defu**      | HIGH       | <=6.1.4               |
| **flatted**   | HIGH       | <=3.4.1               |
| **immutable** | HIGH       | 5.0.0 - 5.1.4         |

**Recomendação:**

```bash
npm audit fix
# ou forçar atualização
npm audit fix --force
```

### 2. Tokens JWT Armazenados em localStorage

**Arquivo:** [src/services/auth.ts](src/services/auth.ts#L29-L32)

```typescript
localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.token);
```

**Risco:** Vulnerável a ataques XSS. Se um atacante conseguir injetar JavaScript malicioso, pode roubar o token de autenticação.

**Recomendação:**

- Usar **httpOnly cookies** para armazenar tokens (requer ajustes no backend)
- Se localStorage for obrigatório, implementar token rotation
- Adicionar Content Security Policy (CSP) rigorosa

### 3. Dados do Usuário Expostos no localStorage

**Arquivo:** [src/services/auth.ts](src/services/auth.ts#L34-L38)

```typescript
localStorage.setItem(STORAGE_KEYS.LOGGED_USER, JSON.stringify(response.user));
```

**Risco:** Informações sensíveis do usuário (email, roles, ID) ficam acessíveis via DevTools ou scripts maliciosos.

**Recomendação:**

- Armazenar apenas dados essenciais (ex: apenas userId)
- Criptografar dados antes de armazenar
- Buscar dados do usuário via API quando necessário

### 4. Credenciais de Teste Hardcoded

**Arquivo:** [src/components/modules/Login/Login.vue](src/components/modules/Login/Login.vue#L37-L43)

```typescript
function generateTestLoginData() {
  const emailGenerated = `jonathan.nwokolo@gmail.com`;
  const passwordGenerated = "Teste12345@";
  return { email: emailGenerated, password: passwordGenerated };
}
```

**Risco:** Credenciais reais expostas no código-fonte que vai para produção.

**Recomendação:**

- Remover completamente em produção
- Usar variáveis de ambiente com `import.meta.env.DEV` guard:

```typescript
if (import.meta.env.DEV) {
  // função de teste
}
```

### 5. Ausência de Proteção CSRF

**Arquivo:** [src/api/index.ts](src/api/index.ts)

**Risco:** Não há token CSRF nas requisições autenticadas, permitindo ataques Cross-Site Request Forgery.

**Recomendação:**

- Implementar token CSRF no backend
- Incluir header `X-CSRF-Token` em todas requisições POST/PUT/DELETE
- Usar `SameSite=Strict` em cookies de sessão

### 6. Ausência de Rate Limiting no Frontend

**Arquivo:** [src/api/users.ts](src/api/users.ts)  
**Status:** ✅ **CORRIGIDO (22/04/2026)**

**Implementação:**

- Criado composable `useRateLimit.ts` para gerenciar limitações de taxa
- Aplicado no [Login.vue](src/components/modules/Login/Login.vue) com:
  - **Máximo 5 tentativas** de login
  - **Janela de 15 minutos**
  - **Bloqueio de 30 minutos** após exceder limite
- Exibe contador de tentativas restantes
- Reseta automaticamente após login bem-sucedido
- Armazena estado no localStorage (persiste entre refreshes)

**Código implementado:**

```typescript
const loginRateLimit = useRateLimit("login", {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,
  blockDurationMs: 30 * 60 * 1000,
});
```

**Recomendação Original:**

- ~~Implementar rate limiting no backend~~
- ~~Adicionar captcha após N tentativas falhas~~
- ~~Implementar exponential backoff no frontend~~

✅ **Proteção implementada no frontend. Backend ainda pode adicionar camada extra.**

---

## 🟠 Vulnerabilidades de Média Severidade

### 7. Uso de v-html com Dados Dinâmicos

**Arquivo:** [src/components/modules/PasswordRecovery/VerifyPin.vue](src/components/modules/PasswordRecovery/VerifyPin.vue#L64)

```html
<p
  class="confirm-subtitle"
  v-html="$t('verifyPin.subtitle', { email: userEmail })"
/>
```

**Risco:** Potencial XSS se `userEmail` contiver código malicioso e não for sanitizado pela i18n.

**Recomendação:**

- Usar interpolação segura: `{{ $t('verifyPin.subtitle', { email: userEmail }) }}`
- Se HTML for necessário, sanitizar com DOMPurify antes de usar v-html

### 8. Dependências de Média Severidade

| Pacote           | Severidade | Descrição                       |
| ---------------- | ---------- | ------------------------------- |
| ajv              | MODERATE   | Prototype pollution             |
| brace-expansion  | MODERATE   | ReDoS vulnerability             |
| follow-redirects | MODERATE   | Information exposure            |
| yaml             | MODERATE   | Code execution via crafted YAML |

### 9. Validação de Token Insuficiente

**Arquivo:** [src/services/auth.ts](src/services/auth.ts#L74-L77)

```typescript
hasValidToken(): boolean {
    const token = this.getToken();
    return !!(token && token.length > 0);
}
```

**Risco:** Não valida estrutura ou expiração do JWT no frontend.

**Recomendação:**

- Decodificar JWT e verificar expiração (`exp` claim)
- Implementar refresh token flow
- Adicionar interceptor axios para renovar token expirado

### 10. Logs de Debug em Produção

**Arquivo:** [src/utils/logger.ts](src/utils/logger.ts)

**Risco:** Logs podem expor informações sensíveis em produção.

**Recomendação:**

```typescript
const logger = {
  log: (...args) => {
    if (import.meta.env.DEV) console.log(...args);
  },
  error: (...args) => {
    // Erros podem ser logados em produção (para Sentry, etc)
    console.error(...args);
  },
};
```

### 11. Ausência de Content Security Policy (CSP)

**Arquivo:** `index.html`

**Risco:** Sem CSP, o navegador permite execução de scripts inline e de qualquer origem.

**Recomendação:** Adicionar headers CSP no `index.html` ou via configuração do servidor:

```html
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'self'; 
               script-src 'self' https://accounts.google.com; 
               style-src 'self' 'unsafe-inline';
               img-src 'self' data: https:;"
/>
```

---

## 🟡 Vulnerabilidades de Baixa Severidade

### 12. Arquivo .env no Repositório

**Arquivo:** `.env`

**Status:** O `.gitignore` inclui `.env`, mas verifique se não foi commitado anteriormente.

**Recomendação:**

```bash
# Verificar histórico do git
git log --all --full-history -- .env

# Se foi commitado, remover do histórico
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch .env' HEAD
```

### 13. Ausência de Sanitização de Input em Busca

**Arquivo:** [src/api/users.ts](src/api/users.ts#L121)

```typescript
`/users/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`;
```

**Status:** `encodeURIComponent` está sendo usado ✓  
**Risco Residual:** Verificar se backend também sanitiza.

### 14. Timeout de Sessão Ausente

**Arquivo:** [src/composables/useAuth.ts](src/composables/useAuth.ts)  
**Status:** ✅ **CORRIGIDO (22/04/2026)**

**Implementação:**

- Sistema de monitoramento de atividade do usuário integrado ao `useAuth.ts`
- **Logout automático após 30 minutos de inatividade**
- Monitora eventos: `mousedown`, `keydown`, `scroll`, `touchstart`
- Timer reseta a cada interação do usuário
- Listeners são anexados no login e removidos no logout
- Previne memory leaks com cleanup adequado

**Código implementado:**

```typescript
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutos
const ACTIVITY_EVENTS = ["mousedown", "keydown", "scroll", "touchstart"];

function resetInactivityTimer() {
  // Timer de 30 min que faz logout automático
  inactivityTimer = setTimeout(() => {
    console.warn("[AUTH] Sessão expirada por inatividade");
    AuthService.logout();
    window.location.href = "/public/Login?reason=inactivity";
  }, INACTIVITY_TIMEOUT_MS);
}
```

**Recomendação Original:**

- ~~Implementar auto-logout após 30 minutos de inatividade~~
- ~~Adicionar evento de mousemove/keypress para resetar timer~~

✅ **Proteção totalmente implementada com monitoramento de múltiplos eventos.**

### 15. Memory Leak Potencial no Auth Watcher

**Arquivo:** [src/composables/useAuth.ts](src/composables/useAuth.ts#L33-L40)

```typescript
setInterval(() => {
  const currentToken = AuthService.getToken();
  // ...
}, 2000);
```

**Risco:** setInterval nunca é limpo em SPA, pode causar memory leak.

**Recomendação:**

- Usar `onUnmounted` para limpar o interval
- Ou usar `watchEffect` com cleanup automático

---

## ℹ️ Observações Informativas

### 16. OAuth Flow Adequado

O fluxo de autenticação Google usa `requestCode()` com popup, que é o método recomendado e mais seguro. ✓

### 17. HTTPS Configurado

As URLs de API usam HTTPS em produção (`https://api.*.wepartyapp.com`). ✓

### 18. Validação de Formulários Implementada

O composable `useValidation.ts` implementa validações robustas para senha, email, telefone, etc. ✓

---

## Plano de Ação Recomendado

### Prioridade Alta (Resolver em 1-2 semanas)

1. ✅ Atualizar dependências com `npm audit fix` - **CORRIGIDO (22/04/2026)**
2. ✅ Remover credenciais hardcoded do Login.vue - **CORRIGIDO (22/04/2026)**
3. ✅ Implementar CSP headers - **CORRIGIDO (22/04/2026)**
4. ⬜ Migrar tokens para httpOnly cookies (requer backend)

### Prioridade Média (Resolver em 1 mês)

5. ✅ Substituir v-html por interpolação segura - **CORRIGIDO (22/04/2026)**
6. ✅ Implementar validação de expiração do JWT - **CORRIGIDO (22/04/2026)**
7. ✅ Adicionar rate limiting no frontend - **CORRIGIDO (22/04/2026)**
8. ✅ Desabilitar logs sensíveis em produção - **JÁ ESTAVA IMPLEMENTADO**

### Prioridade Baixa (Backlog)

9. ✅ Implementar timeout de sessão - **CORRIGIDO (22/04/2026)**
10. ✅ Corrigir memory leak no useAuth - **CORRIGIDO (22/04/2026)**
11. ⬜ Auditar histórico do git para secrets vazados

---

## Comandos Úteis

```bash
# Verificar vulnerabilidades nas dependências
npm audit

# Corrigir automaticamente
npm audit fix

# Verificar secrets no histórico do git
git secrets --scan-history

# Instalar git-secrets para prevenir commits de secrets
git secrets --install
git secrets --register-aws
```

---

**Relatório gerado por:** GitHub Copilot Security Analysis  
**Próxima revisão recomendada:** 90 dias
