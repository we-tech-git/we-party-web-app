# Guia de Teste - Upload de Imagens

## Melhorias Implementadas

### 1. Validação de Arquivos
- ✅ Tamanho máximo: 5MB
- ✅ Apenas arquivos de imagem são aceitos
- ✅ Mensagens de erro claras para o usuário

### 2. Logs Detalhados
- ✅ Informações do arquivo antes do upload
- ✅ Status da resposta do servidor
- ✅ Estrutura completa da resposta da API
- ✅ Erros específicos da API

### 3. Tratamento de Erros
- ✅ Verificação de token de autenticação
- ✅ Mensagens de erro específicas
- ✅ Feedback visual durante upload (spinner)
- ✅ Alerta de sucesso após upload

## Como Testar

### 1. Abrir o Console do Navegador
Pressione `F12` ou `Ctrl+Shift+I` para abrir o DevTools

### 2. Fazer Upload de Avatar
1. Clique no ícone de câmera sobre a foto de perfil
2. Selecione uma imagem
3. Observe os logs no console:
   - "Iniciando upload do avatar..."
   - Informações do arquivo
   - Status da resposta
   - "✅ Avatar atualizado com sucesso"

### 3. Fazer Upload de Banner/Capa
1. Clique no ícone de câmera sobre a capa
2. Selecione uma imagem
3. Observe os logs similares

## Possíveis Problemas e Soluções

### Erro: "Token de autenticação não encontrado"
**Solução:** Faça login novamente

### Erro: "A imagem deve ter no máximo 5MB"
**Solução:** Escolha uma imagem menor ou comprima a imagem

### Erro 401 (Não autorizado)
**Solução:** O token expirou, faça login novamente

### Erro 404 (Não encontrado)
**Solução:** Verifique se a API está rodando e a URL está correta em `.env`

### Erro 413 (Payload muito grande)
**Solução:** O servidor não aceita arquivos tão grandes, reduza o tamanho

### Erro de CORS
**Solução:** Configure o backend para aceitar requisições do frontend

## Verificar Configuração

### 1. Verificar URL da API
No arquivo `.env`, a URL deve estar correta:
```
VITE__BASE_URL=https://api.dev.wepartyapp.com
```

### 2. Verificar Token
No console do navegador, execute:
```javascript
console.log('Token:', localStorage.getItem('ACCESS_TOKEN'))
```

### 3. Verificar Usuário Logado
```javascript
console.log('Usuário:', localStorage.getItem('LOGGED_USER'))
```

## Endpoints Utilizados

- **Avatar:** `PATCH /users/profile-image`
- **Banner:** `PATCH /users/banner-image`

Ambos esperam:
- FormData com campo `file`
- Header: `Authorization: Bearer {token}`
- Resposta esperada: `{ url: "..." }` ou `{ profileImage: "..." }` ou `{ data: { url: "..." } }`

## Testes Adicionais

1. **Teste com imagem muito grande** (> 5MB)
   - Deve mostrar: "A imagem deve ter no máximo 5MB"

2. **Teste com PDF ou outro arquivo**
   - Deve mostrar: "Por favor, selecione apenas arquivos de imagem"

3. **Teste sem estar logado**
   - Deve redirecionar para login ou mostrar erro

4. **Teste com imagem válida**
   - Deve mostrar spinner durante upload
   - Deve atualizar a imagem na tela
   - Deve mostrar: "Foto de perfil atualizada com sucesso!"
