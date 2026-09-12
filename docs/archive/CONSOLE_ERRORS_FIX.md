# Correção de Erros do Console

## Resumo das Correções

Este documento explica os erros que apareciam no console do navegador e como foram corrigidos.

## ✅ Problemas Corrigidos

### 1. **Meta Tags de Segurança Inválidas**

**Erro Original:**
```
The Content Security Policy directive 'frame-ancestors' is ignored when delivered via a <meta> element.
X-Frame-Options may only be set via an HTTP header sent along with a document. It may not be set inside <meta>.
```

**Problema:** 
Políticas de segurança como CSP, X-Frame-Options e frame-ancestors devem ser configuradas como **HTTP headers** pelo servidor, não como meta tags HTML.

**Solução:**
- ✅ Removidas meta tags de segurança do `index.html`
- ✅ Adicionado CSP completo como header HTTP no `vercel.json`
- ✅ Adicionado CSP completo como header HTTP no `netlify.toml`
- ✅ Mantida apenas meta tag `referrer` como fallback

### 2. **Google Sign-In Bloqueado pelo CSP**

**Erro Original:**
```
Loading the stylesheet 'https://accounts.google.com/gsi/style' violates the following Content Security Policy directive
```

**Problema:**
O CSP não incluía o domínio completo do Google Sign-In para estilos.

**Solução:**
✅ Adicionado `https://accounts.google.com` ao `style-src` da política CSP

### 3. **Vercel Live Bloqueado pelo CSP**

**Erro Original:**
```
Loading the script 'https://vercel.live/_next-live/feedback/feedback.js' violates the following Content Security Policy
```

**Problema:**
Scripts do Vercel Live (ferramenta de preview) eram bloqueados pelo CSP.

**Solução:**
✅ Adicionado `https://vercel.live` aos seguintes directives do CSP:
- `script-src`
- `connect-src`
- `frame-src`

### 4. **Preload de Fontes**

**Aviso Original:**
```
The resource materialdesignicons-webfont-*.woff2 was preloaded using link preload but not used within a few seconds
```

**Problema:**
Fontes do Vuetify sendo precarregadas mas não utilizadas imediatamente.

**Solução:**
✅ Adicionadas configurações de build no `vite.config.mts`:
- Separação de chunks para melhor cache
- Configuração de `chunkSizeWarningLimit`
- Manual chunks para Vuetify e Vue

## ⚠️ Erros que Podem Ser Ignorados

### 1. **Erros de Extensões do Navegador**

```
bootstrap-autofill-overlay.js:1269 The Content Security Policy directive...
Uncaught (in promise) Error: A listener indicated an asynchronous response...
```

**Causa:**
Extensões do navegador (como Bitwarden, LastPass, etc.) tentam injetar scripts na página.

**Solução:**
❌ **Não pode ser corrigido** - São erros das extensões do navegador, não do seu código.
Você pode ignorá-los com segurança.

### 2. **Preload Type Unsupported**

```
<link rel=preload> has an unsupported `type` value
```

**Causa:**
Alguns navegadores podem não suportar todos os tipos de preload.

**Solução:**
✅ Parcialmente resolvido com as configurações do Vite.
Se ainda aparecer, pode ser ignorado - não afeta funcionalidade.

## 📋 Arquivos Modificados

1. **index.html**
   - Removidas meta tags de segurança que devem ser headers HTTP
   - Mantido apenas referrer policy como fallback

2. **vercel.json**
   - Adicionado Content-Security-Policy como header HTTP
   - Incluído suporte para Google Sign-In e Vercel Live

3. **netlify.toml**
   - Adicionado Content-Security-Policy como header HTTP
   - Incluído suporte para Google Sign-In e Vercel Live

4. **vite.config.mts**
   - Adicionadas configurações de build para melhor cache
   - Separação de chunks por biblioteca

## 🚀 Como Testar

1. **Faça o build do projeto:**
   ```bash
   yarn build
   ```

2. **Faça deploy no Vercel ou Netlify**
   
3. **Abra o console do navegador:**
   - Pressione F12
   - Vá para a aba Console
   - Recarregue a página (Ctrl+R)

4. **Verifique:**
   - ✅ Não deve mais aparecer erros de CSP relacionados ao Google Sign-In
   - ✅ Não deve mais aparecer avisos sobre frame-ancestors
   - ✅ Avisos de extensões do navegador podem continuar (normal)

## 📝 Notas Importantes

### Content Security Policy

A CSP agora está configurada para permitir:
- ✅ Google Sign-In (scripts, styles, iframes)
- ✅ Google Maps
- ✅ Vercel Live (para preview e desenvolvimento)
- ✅ Fontes do Google Fonts e CDN
- ✅ Conexões com as APIs do We Party

### Modo de Desenvolvimento Local

Durante o desenvolvimento local (`yarn dev`), o CSP não é aplicado porque é configurado como header HTTP pelo servidor de produção. Para testar o CSP localmente, use um servidor que suporte headers customizados.

### Segurança

As configurações aplicadas mantêm a segurança do site enquanto permitem funcionalidades essenciais:
- Proteção contra XSS (Cross-Site Scripting)
- Proteção contra Clickjacking
- Proteção contra MIME type sniffing
- Controle de referrer
- Restrição de APIs do navegador

## 🔍 Debugging

Se novos erros de CSP aparecerem:

1. Identifique o recurso bloqueado no erro
2. Determine qual directive CSP está bloqueando (script-src, style-src, etc.)
3. Adicione o domínio necessário ao directive apropriado no `vercel.json` e `netlify.toml`
4. Faça novo deploy para testar

Exemplo:
```
Recurso bloqueado: https://example.com/script.js
Directive: script-src
Solução: Adicionar "https://example.com" ao script-src na CSP
```
