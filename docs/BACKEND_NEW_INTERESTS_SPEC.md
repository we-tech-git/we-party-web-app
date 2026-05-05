# Especificação: Endpoint de Solicitação de Novos Interesses

## 📋 Resumo

Novo endpoint para permitir que usuários solicitem a criação de novos interesses que não existem no sistema. As solicitações ficam pendentes de aprovação do administrador.

## 🔗 Endpoint

```
POST /interest/request
```

**Autenticação**: Requerida (JWT Bearer Token)

## 📥 Request Body

```json
{
  "interests": ["string", "string", ...]
}
```

**Exemplo:**
```json
{
  "interests": [
    "Festa Eletrônica",
    "Show de Blues", 
    "Festival de Cerveja Artesanal"
  ]
}
```

### Validações

- ✅ `interests` deve ser um array não vazio
- ✅ Cada item deve ser uma string com no mínimo 3 caracteres
- ✅ Máximo de 10 interesses por requisição
- ✅ Remover duplicatas e trim em cada string

## 📤 Response

### Sucesso (200 OK)

```json
{
  "success": true,
  "message": "Solicitações recebidas com sucesso",
  "data": {
    "requestsCreated": 3,
    "requestIds": ["req_abc123", "req_def456", "req_ghi789"]
  }
}
```

### Erro - Validação (400 Bad Request)

```json
{
  "success": false,
  "message": "Dados inválidos",
  "errors": [
    "O campo 'interests' é obrigatório",
    "Mínimo de caracteres não atingido no interesse: 'ab'"
  ]
}
```

### Erro - Não Autenticado (401 Unauthorized)

```json
{
  "success": false,
  "message": "Token inválido ou expirado"
}
```

## 💾 Banco de Dados

### Tabela Sugerida: `interest_requests`

```sql
CREATE TABLE interest_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  requested_by UUID NOT NULL REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_interest_request UNIQUE(name, requested_by)
);

CREATE INDEX idx_interest_requests_status ON interest_requests(status);
CREATE INDEX idx_interest_requests_user ON interest_requests(requested_by);
```

## 🔄 Lógica de Backend

### Fluxo Recomendado

1. **Validar JWT e extrair userId**
2. **Validar body da requisição**
   - Verificar se `interests` é array e não está vazio
   - Validar cada string (trim, min 3 chars, max 100 chars)
3. **Filtrar interesses já existentes**
   ```sql
   -- Opcional: verificar se o interesse já existe na tabela principal
   SELECT name FROM interests WHERE LOWER(name) = LOWER($1)
   ```
4. **Filtrar solicitações duplicadas do mesmo usuário**
   ```sql
   SELECT name FROM interest_requests 
   WHERE requested_by = $userId 
   AND name = ANY($interests)
   AND status = 'pending'
   ```
5. **Inserir solicitações únicas**
   ```sql
   INSERT INTO interest_requests (name, requested_by, status)
   VALUES ($name, $userId, 'pending')
   ON CONFLICT (name, requested_by) DO NOTHING
   RETURNING id
   ```
6. **Retornar resposta de sucesso**

## 🛠️ Implementação Sugerida (Node.js/Express)

```javascript
// routes/interest.routes.js
router.post('/request', authMiddleware, interestController.requestNewInterests);

// controllers/interest.controller.js
async requestNewInterests(req, res) {
  try {
    const { interests } = req.body;
    const userId = req.user.id; // Extraído do JWT

    // Validações
    if (!Array.isArray(interests) || interests.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'O campo interests deve ser um array não vazio'
      });
    }

    if (interests.length > 10) {
      return res.status(400).json({
        success: false,
        message: 'Máximo de 10 interesses por requisição'
      });
    }

    // Normalizar e validar cada interesse
    const validInterests = interests
      .map(name => name.trim())
      .filter(name => name.length >= 3 && name.length <= 100)
      .filter((name, index, self) => self.indexOf(name) === index); // Remove duplicatas

    if (validInterests.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum interesse válido encontrado'
      });
    }

    // Inserir no banco
    const requestIds = [];
    for (const interest of validInterests) {
      try {
        const result = await db.query(
          `INSERT INTO interest_requests (name, requested_by, status)
           VALUES ($1, $2, 'pending')
           ON CONFLICT (name, requested_by) DO NOTHING
           RETURNING id`,
          [interest, userId]
        );
        
        if (result.rows.length > 0) {
          requestIds.push(result.rows[0].id);
        }
      } catch (error) {
        console.error('Erro ao inserir interesse:', interest, error);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Solicitações recebidas com sucesso',
      data: {
        requestsCreated: requestIds.length,
        requestIds
      }
    });

  } catch (error) {
    console.error('Erro ao processar solicitação de interesses:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao processar solicitação'
    });
  }
}
```

## 📊 Endpoints Administrativos (Futuro)

Para gerenciar as solicitações, considere criar:

### 1. Listar Solicitações Pendentes
```
GET /admin/interest-requests?status=pending&page=1&limit=20
```

### 2. Aprovar Solicitação
```
POST /admin/interest-requests/:id/approve
```
- Cria o interesse na tabela `interests`
- Atualiza status para `approved`
- (Opcional) Adiciona automaticamente aos interesses do solicitante

### 3. Rejeitar Solicitação
```
POST /admin/interest-requests/:id/reject
```
- Atualiza status para `rejected`
- (Opcional) Envia notificação ao usuário

## 🔔 Notificações (Opcional)

Considere adicionar:
- Email ao administrador quando nova solicitação chega
- Notificação in-app ao usuário quando solicitação é aprovada/rejeitada

## 🧪 Testes Sugeridos

```javascript
// Teste 1: Solicitação válida
POST /interest/request
Body: { "interests": ["Festa Reggae", "Show de Jazz"] }
Expected: 200 OK

// Teste 2: Array vazio
POST /interest/request
Body: { "interests": [] }
Expected: 400 Bad Request

// Teste 3: String muito curta
POST /interest/request
Body: { "interests": ["ab"] }
Expected: 400 Bad Request

// Teste 4: Sem autenticação
POST /interest/request (sem token)
Expected: 401 Unauthorized

// Teste 5: Duplicata do mesmo usuário
POST /interest/request (mesmo interesse 2x)
Expected: 200 OK (mas sem criar duplicada)
```

## 📝 Notas de Implementação

1. **Performance**: Para muitas solicitações simultâneas, use transações ou batch insert
2. **Segurança**: Rate limiting recomendado (ex: 5 solicitações por minuto por usuário)
3. **Logging**: Registre todas as solicitações para análise de tendências
4. **Analytics**: Dashboard mostrando interesses mais solicitados

## 🚀 Frontend (Já Implementado)

O frontend já está enviando requisições neste formato quando o usuário:
1. Busca um interesse que não existe
2. Clica em "Solicitar novo interesse"
3. Adiciona um ou mais nomes
4. Clica em "Solicitar"

**Arquivo**: `src/api/interest.ts` → `requestNewInterests()`
**Componente**: `src/components/modules/interest/Interest.vue`

---

**Dúvidas?** Entre em contato com o time de frontend.
