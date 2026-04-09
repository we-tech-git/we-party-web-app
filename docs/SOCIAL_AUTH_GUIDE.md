# 🎉 Sistema de Autenticação Social - We Party

## 📋 Visão Geral

Implementação completa de autenticação social (Google, Facebook e Email) para a aplicação We Party. O sistema permite que usuários façam login ou cadastro usando suas contas sociais, melhorando significativamente a experiência do usuário.

## ✨ Funcionalidades Implementadas

### 1. **Componente de Botões Sociais** (`SocialAuthButtons.vue`)

- Botões visuais para Google, Facebook e Email
- Estados de carregamento com animações
- Design responsivo (versão normal e compacta)
- Totalmente customizável via props

### 2. **Serviço de Autenticação Social** (`socialAuth.ts`)

- Integração com Google OAuth 2.0
- Integração com Facebook Login SDK
- Suporte a múltiplos métodos de autenticação
- Modo de desenvolvimento com simulação
- Gerenciamento de tokens e sessões

### 3. **Integração em Componentes**

- ✅ **LoginRequiredDialog** - Modal que aparece na página explore
- ✅ **Login.vue** - Página de login com opções sociais
- ✅ **Signup.vue** - Página de cadastro com opções sociais

## 🚀 Como Usar

### Configuração Inicial

1. **Copie o arquivo de variáveis de ambiente:**

   ```bash
   cp .env.example .env
   ```

2. **Configure as credenciais de autenticação social no arquivo `.env`:**
   ```env
   VITE_GOOGLE_CLIENT_ID=seu-google-client-id.apps.googleusercontent.com
   VITE_FACEBOOK_APP_ID=seu-facebook-app-id
   VITE_API_BASE_URL=http://localhost:3000
   ```

### Obter Credenciais do Google

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Vá em **"APIs e Serviços" > "Credenciais"**
4. Clique em **"Criar credenciais" > "ID do cliente OAuth 2.0"**
5. Configure:
   - Tipo: **Aplicativo da Web**
   - Origens JavaScript autorizadas: `http://localhost:5173` (dev) e seu domínio de produção
   - URIs de redirecionamento: suas URLs de callback
6. Copie o **Client ID** gerado

### Obter Credenciais do Facebook

1. Acesse [Facebook Developers](https://developers.facebook.com/)
2. Crie um novo app ou selecione um existente
3. Vá em **"Configurações" > "Básico"**
4. Copie o **"ID do Aplicativo"**
5. Em **"Produtos"**, adicione **"Login do Facebook"**
6. Configure:
   - URIs de redirecionamento válidos
   - Domínios do aplicativo

## 📦 Backend - Endpoint Necessário

Você precisa implementar os seguintes endpoints no seu backend:

### 1. Autenticação Social (Token)

```typescript
POST /auth/social/:provider
Content-Type: application/json

Body:
{
  "token": "google-or-facebook-token",
  "userInfo": {
    "name": "Nome do Usuário",
    "email": "email@example.com",
    "picture": "url-da-foto"
  }
}

Response (200):
{
  "success": true,
  "message": "Login com Google realizado com sucesso",
  "token": "jwt-token-here",
  "data": {
    "id": "user-id",
    "name": "Nome do Usuário",
    "email": "email@example.com",
    ...
  }
}
```

### 2. Autenticação Social (Code Flow)

```typescript
POST /auth/social/:provider/callback
Content-Type: application/json

Body:
{
  "code": "authorization-code"
}

Response (200):
{
  "success": true,
  "message": "Autenticação realizada com sucesso",
  "token": "jwt-token-here",
  "data": { ... }
}
```

### Exemplo de Implementação Backend (Node.js/Express)

```typescript
import { Router } from "express";
import { OAuth2Client } from "google-auth-library";
import axios from "axios";

const router = Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Google OAuth
router.post("/auth/social/google", async (req, res) => {
  try {
    const { token } = req.body;

    // Verificar token do Google
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    // Buscar ou criar usuário no banco de dados
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        picture,
        googleId,
        emailVerified: true, // Google já verifica o email
        provider: "google",
      });
    }

    // Gerar JWT token
    const jwtToken = generateJWT(user);

    res.json({
      success: true,
      message: "Login com Google realizado com sucesso",
      token: jwtToken,
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Erro ao autenticar com Google",
    });
  }
});

// Facebook OAuth
router.post("/auth/social/facebook", async (req, res) => {
  try {
    const { token, userInfo } = req.body;

    // Verificar token do Facebook
    const fbResponse = await axios.get(
      `https://graph.facebook.com/me?access_token=${token}&fields=id,name,email,picture`,
    );

    const { email, name, picture, id: facebookId } = fbResponse.data;

    // Buscar ou criar usuário
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        picture: picture?.data?.url,
        facebookId,
        emailVerified: true,
        provider: "facebook",
      });
    }

    // Gerar JWT token
    const jwtToken = generateJWT(user);

    res.json({
      success: true,
      message: "Login com Facebook realizado com sucesso",
      token: jwtToken,
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Erro ao autenticar com Facebook",
    });
  }
});

export default router;
```

## 🎨 Como Funciona

### 1. Na Página Explore

Quando o usuário clica em alguma funcionalidade que requer autenticação:

1. O modal `LoginRequiredDialog` é exibido
2. Usuário vê opções: **Google**, **Facebook** ou **Email**
3. Ao clicar em Google/Facebook:
   - SDK é carregado
   - Popup de autenticação é exibido
   - Token é recebido e enviado ao backend
   - Usuário é autenticado e redirecionado para `/private/feed`

### 2. Nas Páginas de Login/Signup

As páginas de login e cadastro agora incluem botões sociais:

- Usuário pode escolher entre email tradicional ou login social
- Mesma experiência fluida de autenticação
- Confetes celebratórios no cadastro bem-sucedido

## 🔧 Modo de Desenvolvimento

O serviço inclui um modo de desenvolvimento que simula autenticação social sem necessidade de credenciais:

```typescript
if (import.meta.env.DEV) {
  // Simula autenticação bem-sucedida
  return {
    success: true,
    message: `Login com ${provider} realizado (SIMULADO)`,
    token: `mock_token_${provider}_${Date.now()}`,
    user: { ... }
  }
}
```

Isso permite testar a UI sem configurar as credenciais reais.

## 📱 Design Responsivo

Todos os componentes são totalmente responsivos:

- **Desktop**: Botões lado a lado com textos
- **Mobile**: Botões empilhados ou ícones circulares (modo compacto)
- **Tablets**: Layout adaptativo

## 🎯 Próximos Passos

1. **Configure as credenciais** no arquivo `.env`
2. **Implemente os endpoints** no backend
3. **Teste localmente** usando o modo de desenvolvimento
4. **Deploy** em produção com credenciais reais

## 🐛 Troubleshooting

### Erro: "Google Client ID não configurado"

- Verifique se `VITE_GOOGLE_CLIENT_ID` está definido no `.env`
- Reinicie o servidor de desenvolvimento após alterar o `.env`

### Erro: "Falha ao carregar SDK do Google"

- Verifique sua conexão com a internet
- Certifique-se de que não há bloqueadores de script

### Popup de autenticação não abre

- Verifique se pop-ups não estão bloqueados no navegador
- Teste em modo anônimo para descartar extensões

## 📄 Licença

Este código é parte do projeto We Party e segue a mesma licença do projeto principal.

---

**Desenvolvido com ❤️ para We Party**
