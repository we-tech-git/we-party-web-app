# 🎯 Guia Rápido - Como Testar a Autenticação Social

## ✅ O que foi implementado

Sistema completo de autenticação social com:

- 🔵 **Google OAuth 2.0** - Login com conta Google
- 🔵 **Facebook Login** - Login com conta Facebook
- 📧 **Email** - Login tradicional com email e senha

## 📍 Onde encontrar

### 1. **Página Explore** (`/public/explore`)

Quando o usuário clicar em qualquer funcionalidade que requer autenticação:

- Modal aparece com mensagem "Acesso Restrito"
- Botões sociais: Google, Facebook e Email
- Ao clicar, faz autenticação e redireciona para `/private/feed`

### 2. **Página de Login** (`/public/login`)

- Formulário tradicional de email/senha
- Abaixo do botão de login: botões do Google e Facebook
- Separador visual com "Ou entre com"

### 3. **Página de Cadastro** (`/public/signup`)

- Formulário completo de cadastro
- Abaixo do botão de cadastro: botões do Google e Facebook
- Separador visual com "Ou cadastre-se com"

## 🚀 Como Testar (Modo Desenvolvimento)

### Teste Rápido (Sem Configuração)

O sistema está configurado com **modo de simulação** para desenvolvimento:

1. **Inicie o servidor:**

   ```bash
   yarn dev
   ```

2. **Acesse a página explore:**

   ```
   http://localhost:5173/public/explore
   ```

3. **Clique em qualquer card de evento** (tente curtir, comentar, etc.)

4. **Modal aparece com opções:**
   - Clique em "Google" → Simulação de login bem-sucedido
   - Clique em "Facebook" → Simulação de login bem-sucedido
   - Clique em "Email" → Vai para página de login

5. **Veja o console do navegador:**
   ```
   🔐 Iniciando autenticação com Google...
   ⚠️ MODO DEV: Simulando autenticação social bem-sucedida
   ✅ Login com Google realizado com sucesso!
   ```

### Teste com Credenciais Reais

1. **Configure o arquivo `.env`:**

   ```bash
   cp .env.example .env
   ```

2. **Edite o `.env` e adicione suas credenciais:**

   ```env
   VITE_GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
   VITE_FACEBOOK_APP_ID=seu-app-id
   VITE_API_BASE_URL=http://localhost:3000
   ```

3. **Reinicie o servidor:**

   ```bash
   yarn dev
   ```

4. **Teste novamente** - Agora usará as credenciais reais!

## 🔍 Como Verificar se Está Funcionando

### Checklist de Testes:

- [ ] **Modal aparece** quando tentar interagir na página explore
- [ ] **Botões do Google e Facebook** aparecem no modal
- [ ] **Botões sociais** aparecem na página de login
- [ ] **Botões sociais** aparecem na página de cadastro
- [ ] **Clique no Google** → Mensagem de "Autenticando..."
- [ ] **Simulação funciona** → Mensagem de sucesso + redirecionamento
- [ ] **Console mostra logs** de desenvolvimento
- [ ] **Sem erros** no console do navegador

### Possíveis Problemas:

❌ **Botões não aparecem:**

- Verifique se o componente `SocialAuthButtons` foi importado
- Abra o console e procure por erros de importação

❌ **Erro ao clicar:**

- Verifique o console para mensagens de erro
- Em modo DEV, deve funcionar mesmo sem credenciais

❌ **Popup não abre:**

- Normal no modo de simulação
- Com credenciais reais, permita popups no navegador

## 📱 Teste Responsivo

### Desktop (> 1024px)

- Botões lado a lado com textos completos
- Layout horizontal

### Tablet (768px - 1024px)

- Botões com textos, pode empilhar dependendo do espaço

### Mobile (< 768px)

- Botões empilhados verticalmente
- Textos completos visíveis

**Para testar:** Use o DevTools do navegador (F12) e ative o modo responsivo

## 🎨 Customização Visual

Os botões seguem o design system do projeto:

- **Google:** Azul #4285F4 + logo oficial
- **Facebook:** Azul #1877F2 + logo oficial
- **Animações:** Hover effects e loading states
- **Tema:** Integrado com cores da We Party (rosa/laranja)

## 📊 Logs de Desenvolvimento

Abra o console do navegador para ver:

```javascript
// Login iniciado
🔐 Iniciando autenticação com Google...

// Simulação (modo DEV)
⚠️ MODO DEV: Simulando autenticação social bem-sucedida
📤 Enviando token para o backend: http://localhost:3000/auth/social/google
❌ Erro ao enviar token para o backend: [erro]

// Sucesso
✅ Login com Google realizado (SIMULADO)
✅ Token recebido
✅ Redirecionando para /private/feed
```

## 🔧 Próximos Passos

1. ✅ **Testado localmente?** → Configure as credenciais reais
2. ✅ **Credenciais configuradas?** → Implemente os endpoints no backend
3. ✅ **Backend pronto?** → Faça deploy em produção

## 📞 Problemas?

Se encontrar algum problema:

1. Verifique o console do navegador
2. Confira se o servidor está rodando
3. Veja os logs no terminal
4. Revise a documentação em `docs/SOCIAL_AUTH_GUIDE.md`

---

**Desenvolvido com ❤️ para We Party**
