# Especificação: Endpoint de Busca de Usuários

## 📋 Resumo

Endpoint para permitir busca de usuários no sistema por nome ou username. Essencial para a funcionalidade de adicionar amigos.

## 🔗 Endpoint

```
GET /users/search
```

**Autenticação**: Requerida (JWT Bearer Token)

## 📥 Query Parameters

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `q` | string | Sim | Termo de busca (nome ou username) |
| `page` | number | Não | Página de resultados (padrão: 1) |
| `limit` | number | Não | Limite por página (padrão: 20, máx: 50) |

**Exemplo:**
```
GET /users/search?q=joão&page=1&limit=20
```

## 📤 Response

### Sucesso (200 OK)

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user_123",
        "name": "João Silva",
        "username": "joaosilva",
        "profileImage": "/uploads/avatars/user_123.jpg",
        "bio": "Desenvolvedor web",
        "isFollowing": false,
        "followersCount": 150,
        "followingCount": 89
      },
      {
        "id": "user_456",
        "name": "João Pedro",
        "username": "jpedro",
        "profileImage": null,
        "bio": null,
        "isFollowing": true,
        "followersCount": 342,
        "followingCount": 201
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalResults": 52,
      "limit": 20
    }
  }
}
```

### Erro - Query vazia (400 Bad Request)

```json
{
  "success": false,
  "message": "O parâmetro 'q' é obrigatório"
}
```

### Erro - Não Autenticado (401 Unauthorized)

```json
{
  "success": false,
  "message": "Token inválido ou expirado"
}
```

## 💾 Lógica de Busca

### Comportamento Esperado

1. **Busca case-insensitive** em `name` e `username`
2. **Busca parcial** (ex: "joão" encontra "João Silva", "Joãozinho", etc.)
3. **Ordenação** por relevância:
   - Matches exatos no username primeiro
   - Matches no início do nome
   - Outros matches
4. **Excluir o próprio usuário** dos resultados
5. **Incluir flag `isFollowing`** indicando se o usuário atual já segue

### Exemplo de Query SQL (PostgreSQL/Prisma)

```sql
SELECT 
  u.id,
  u.name,
  u.username,
  u.profile_image AS "profileImage",
  u.bio,
  EXISTS(
    SELECT 1 FROM follows 
    WHERE follower_id = $currentUserId 
    AND following_id = u.id
  ) AS "isFollowing",
  (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS "followersCount",
  (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) AS "followingCount"
FROM users u
WHERE 
  u.id != $currentUserId
  AND (
    LOWER(u.name) LIKE LOWER($query)
    OR LOWER(u.username) LIKE LOWER($query)
  )
ORDER BY
  CASE 
    WHEN LOWER(u.username) = LOWER($queryExact) THEN 1
    WHEN LOWER(u.name) LIKE LOWER($queryStart) THEN 2
    ELSE 3
  END,
  u.name ASC
LIMIT $limit
OFFSET $offset;
```

## 🛠️ Implementação Sugerida (Node.js/Express)

```javascript
// routes/users.routes.js
router.get('/search', authMiddleware, usersController.searchUsers);

// controllers/users.controller.js
async searchUsers(req, res) {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    const currentUserId = req.user.id;

    // Validações
    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'O parâmetro "q" é obrigatório'
      });
    }

    if (q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'A busca deve ter no mínimo 2 caracteres'
      });
    }

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 50); // Máximo de 50
    const offset = (pageNum - 1) * limitNum;

    const searchTerm = `%${q.trim().toLowerCase()}%`;
    const searchExact = q.trim().toLowerCase();
    const searchStart = `${q.trim().toLowerCase()}%`;

    // Busca no banco
    const users = await db.query(`
      SELECT 
        u.id,
        u.name,
        u.username,
        u.profile_image AS "profileImage",
        u.bio,
        EXISTS(
          SELECT 1 FROM follows 
          WHERE follower_id = $1 
          AND following_id = u.id
        ) AS "isFollowing",
        (SELECT COUNT(*) FROM follows WHERE following_id = u.id)::int AS "followersCount",
        (SELECT COUNT(*) FROM follows WHERE follower_id = u.id)::int AS "followingCount"
      FROM users u
      WHERE 
        u.id != $1
        AND (
          LOWER(u.name) LIKE $2
          OR LOWER(u.username) LIKE $2
        )
      ORDER BY
        CASE 
          WHEN LOWER(u.username) = $3 THEN 1
          WHEN LOWER(u.name) LIKE $4 THEN 2
          ELSE 3
        END,
        u.name ASC
      LIMIT $5
      OFFSET $6
    `, [currentUserId, searchTerm, searchExact, searchStart, limitNum, offset]);

    // Conta total para paginação
    const total = await db.query(`
      SELECT COUNT(*) as count
      FROM users u
      WHERE 
        u.id != $1
        AND (
          LOWER(u.name) LIKE $2
          OR LOWER(u.username) LIKE $2
        )
    `, [currentUserId, searchTerm]);

    const totalResults = parseInt(total.rows[0].count);
    const totalPages = Math.ceil(totalResults / limitNum);

    return res.status(200).json({
      success: true,
      data: {
        users: users.rows,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalResults,
          limit: limitNum
        }
      }
    });

  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao buscar usuários'
    });
  }
}
```

## 📊 Otimizações Recomendadas

1. **Índices no banco de dados:**
```sql
CREATE INDEX idx_users_name_lower ON users (LOWER(name));
CREATE INDEX idx_users_username_lower ON users (LOWER(username));
```

2. **Cache (Redis):**
   - Cachear buscas populares por 5 minutos
   - Key: `user_search:${userId}:${query}:${page}`

3. **Rate Limiting:**
   - Máximo de 10 buscas por minuto por usuário

## 🧪 Casos de Teste

```javascript
// Teste 1: Busca básica
GET /users/search?q=João
Expected: 200 OK com lista de usuários

// Teste 2: Busca vazia
GET /users/search?q=
Expected: 400 Bad Request

// Teste 3: Busca muito curta
GET /users/search?q=a
Expected: 400 Bad Request

// Teste 4: Sem autenticação
GET /users/search?q=João (sem token)
Expected: 401 Unauthorized

// Teste 5: Paginação
GET /users/search?q=João&page=2&limit=10
Expected: 200 OK com página 2

// Teste 6: Nenhum resultado
GET /users/search?q=xyzabc123
Expected: 200 OK com array vazio

// Teste 7: Busca por username
GET /users/search?q=@joao
Expected: 200 OK com usuários cujo username contém "joao"
```

## 📝 Campos do Usuário Retornado

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | string | ID único do usuário |
| `name` | string | Nome completo |
| `username` | string | Nome de usuário único |
| `profileImage` | string or null | URL da foto de perfil |
| `bio` | string or null | Biografia do usuário |
| `isFollowing` | boolean | Se o usuário atual já segue |
| `followersCount` | number | Quantidade de seguidores |
| `followingCount` | number | Quantidade de pessoas seguindo |

## 🔐 Privacidade

- **Usuários bloqueados** não devem aparecer nos resultados
- **Contas privadas** podem ter flag `isPrivate: true`
- **Usuários desativados** ou banidos não devem aparecer

## 📈 Métricas Sugeridas

- Total de buscas por dia/mês
- Termos mais buscados
- Taxa de conversão (busca → follow)
- Tempo médio de resposta

## 🚀 Frontend (Já Implementado)

O frontend já está preparado para consumir este endpoint:

- **Arquivo**: `src/api/users.ts` → `searchUsers()`
- **Componente**: `src/components/modules/AddFriends/AddFriends.vue`
- **Comportamento**:
  - Debounce de 500ms na digitação
  - Loading state durante busca
  - Fallback para recomendações se busca falhar
  - Atualização otimista no follow/unfollow

---

**Status**: ⚠️ **Endpoint pendente de implementação no backend**

Quando implementado, a funcionalidade estará 100% funcional no frontend.
