# Especificação: Comentários em Árvore + Likes por Comentário

## 📋 Resumo

Evolução dos comentários de evento de uma lista plana para uma **árvore de até 5 níveis** (estilo Reddit), com **likes independentes em cada nó** (comentário ou resposta).

O **frontend já está implementado** contra este contrato (ver [Contrato consumido pelo frontend](#-contrato-consumido-pelo-frontend)). Enquanto os endpoints não existirem, a UI degrada de forma controlada: as respostas falham com mensagem de erro visível, e os comentários raiz continuam funcionando.

**Repositório alvo**: backend NestJS/Prisma (`api.wepartyapp.com`) — não este repositório.

---

## 🗄️ Banco de dados

### `EventComment` — adicionar auto-relação

```prisma
model EventComment {
  id        String   @id @default(uuid())
  content   String
  eventId   String
  userId    String
  createdAt DateTime @default(now())

  // NOVO: auto-relação para respostas aninhadas
  parentId  String?
  parent    EventComment?  @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies   EventComment[] @relation("CommentReplies")

  // NOVO: likes do próprio comentário
  likes     EventCommentLike[]

  event     Event @relation(fields: [eventId], references: [id], onDelete: Cascade)
  user      User  @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([parentId])
  @@index([eventId, parentId])
}
```

### `EventCommentLike` — novo model

Tabela **separada** de `EventLike`, para não misturar likes de evento com likes de comentário.

```prisma
model EventCommentLike {
  id        String   @id @default(uuid())
  commentId String
  userId    String
  createdAt DateTime @default(now())

  comment   EventComment @relation(fields: [commentId], references: [id], onDelete: Cascade)
  user      User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([commentId, userId])
  @@index([commentId])
}
```

### Migration

- Comentários existentes ficam com `parentId = null` → continuam sendo raízes. **Sem quebra retroativa.**
- `onDelete: Cascade` na auto-relação faz o Postgres apagar a subárvore inteira ao remover um pai.
- O índice composto `[eventId, parentId]` serve a query mais quente: "raízes de um evento" (`parentId IS NULL`).

---

## 🔢 Regra de profundidade

Raiz = **nível 1**. Máximo = **nível 5**.

```
nível 1  Comentário raiz
└─ nível 2  resposta
   └─ nível 3  resposta
      └─ nível 4  resposta
         └─ nível 5  resposta   ← último nível permitido
            └─ nível 6          ← REJEITAR com 400
```

Responder a um comentário de nível 5 deve retornar **400 Bad Request**.

### Recomendação de implementação

Preferir uma coluna denormalizada `depth Int @default(1)` em `EventComment` a contar recursivamente a cada request:

- Na criação da resposta: `depth = parent.depth + 1`; rejeitar se `parent.depth >= 5`.
- Custo O(1) por escrita, contra O(profundidade) de queries por escrita.
- Se optar por não denormalizar, use uma CTE recursiva — **não** faça N queries em loop.

> Se adicionar `depth`, faça backfill de `depth = 1` para todos os registros existentes na mesma migration.

---

## 🔗 Endpoints

Todos exigem **JWT Bearer Token**.

### 1. Listar comentários (modificado)

```
GET /events/:eventId/comments
```

Passa a retornar a árvore aninhada, até 5 níveis.

**Query params sugeridos:**

| Param   | Default | Descrição                                    |
| ------- | ------- | -------------------------------------------- |
| `page`  | 1       | Paginação **apenas do nível raiz**            |
| `limit` | 20      | Raízes por página                             |

**Response 200:**

```json
{
  "data": {
    "comments": [
      {
        "id": "uuid-1",
        "content": "Que evento massa!",
        "createdAt": "2026-07-22T10:00:00.000Z",
        "parentId": null,
        "likesCount": 12,
        "isLikedByMe": true,
        "user": { "id": "u1", "name": "Ana Souza", "profileImage": "/uploads/ana.jpg", "role": "USER" },
        "replies": [
          {
            "id": "uuid-2",
            "content": "Concordo!",
            "createdAt": "2026-07-22T10:05:00.000Z",
            "parentId": "uuid-1",
            "likesCount": 3,
            "isLikedByMe": false,
            "user": { "id": "u2", "name": "Bruno Lima", "profileImage": null, "role": "USER" },
            "replies": []
          }
        ]
      }
    ],
    "total": 2,
    "page": 1
  }
}
```

**Notas de contrato:**

- `likesCount` e `isLikedByMe` são obrigatórios em **todo** nó, em qualquer nível. `isLikedByMe` é relativo ao usuário do token.
- `replies` deve vir sempre presente (array vazio quando não há filhos), para o cliente não precisar checar `undefined`.
- `total` deve contar a **árvore inteira**, não só as raízes — é o número exibido no badge de contagem.

#### 🐞 Bug aberto em produção: árvore truncada no nível 2

**Sintoma:** responder a uma resposta (criar um nó de **nível 3**) retorna `201` normalmente e o nó aparece na tela pelo insert otimista, mas **some ao recarregar a página**. Respostas de nível 2 persistem.

**Causa provável:** o `include` do Prisma está aninhado só duas vezes, algo como:

```ts
include: { user: true, replies: { include: { user: true, replies: { include: { user: true } } } } }
//                              nível 2 ──────────────────────────┘  nível 3 vem, nível 4+ não
```

Cada nível a mais exige mais um `include` literal — é por isso que a abordagem não escala e é justamente o que a seção [Pontos de atenção — performance](#-pontos-de-atenção--performance) desaconselha.

**Correção recomendada** (resolve o truncamento e o N+1 de uma vez): parar de aninhar `include` e devolver a subárvore inteira numa query só.

1. Paginar as raízes: `WHERE eventId = $1 AND parentId IS NULL`.
2. Buscar **todos** os descendentes dessas raízes numa query — via coluna denormalizada `rootId` (`WHERE rootId IN (...)`) ou CTE recursiva.
3. Montar a árvore em memória a partir do `parentId`.

O cliente aceita a resposta **plana**, em qualquer ordem — não é preciso ordenar por profundidade nem aninhar antes de responder. Basta que todo nó traga `id`, `parentId`, `likesCount`, `isLikedByMe` e `user`.

**Teste de regressão:** criar nós de nível 3, 4 e 5; um `GET /events/:id/comments` seguinte deve devolver os cinco.

> Enquanto o bug existir, `InlineComments.vue` mantém o insert otimista **sem refetch** após responder (ver comentário em `handleSendReply`), porque refazer o GET apagaria da tela a resposta recém-criada. Depois da correção, esse refetch pode voltar.

### 2. Responder a um comentário (novo)

```
POST /events/:eventId/comments/:commentId/reply
```

**Body:**

```json
{ "content": "string" }
```

O pai vem da URL (`:commentId`), não do body.

**Validações:**

- ✅ `content` string não vazia, após `trim`, com no máximo **500 caracteres** (limite que o frontend já aplica no input)
- ✅ `:commentId` existe e pertence a `:eventId` → senão **404**
- ✅ profundidade do pai < 5 → senão **400**

**Response 201:** o nó criado, no mesmo formato de um item da árvore (com `id`, `createdAt`, `parentId`, `likesCount: 0`, `isLikedByMe: false`, `user`).

> O frontend usa `id` e `createdAt` da resposta para inserir o nó otimisticamente antes do refetch. Se vierem ausentes ele cai num id temporário — funciona, mas gera um flicker. **Retorne o objeto completo.**

**Response 400** (limite de profundidade):

```json
{ "statusCode": 400, "message": "Profundidade máxima de 5 níveis atingida" }
```

### 3. Curtir/descurtir um comentário (novo, toggle)

```
POST /events/:eventId/comments/:commentId/likes
```

Sem body. Mesmo padrão dos likes de evento: primeira chamada curte, segunda descurte.

**Response 200:**

```json
{ "data": { "liked": true, "likesCount": 13 } }
```

Vale para comentário em **qualquer nível**, incluindo raízes.

### 4. Listar likes de um comentário (novo)

```
GET /events/:eventId/comments/:commentId/likes?page=1&limit=10
```

**Response 200:**

```json
{
  "data": {
    "likesCount": 13,
    "isLikedByMe": true,
    "users": [
      { "id": "u1", "name": "Ana Souza", "profileImage": "/uploads/ana.jpg" }
    ],
    "total": 13,
    "page": 1
  }
}
```

### 5. Deletar comentário (comportamento estendido)

```
DELETE /events/:eventId/comments/:commentId
```

- Regra de permissão **já existente**, agora valendo também para respostas: apenas o **autor do comentário** ou o **criador do evento** podem deletar.
- A deleção remove a **subárvore inteira** em cascata (`onDelete: Cascade`).
- Os `EventCommentLike` dos nós removidos também caem em cascata.

---

## 🔐 Regras de negócio

| Regra | Detalhe |
| ----- | ------- |
| Profundidade máxima | 5 níveis; violação → `400` |
| Permissão de deleção | autor do comentário **ou** criador do evento |
| Deleção em cascata | remove todas as respostas descendentes e seus likes |
| Like único | constraint `@@unique([commentId, userId])` |
| Toggle de like | um clique curte, outro descurte |
| Retrocompatibilidade | comentários com `parentId = null` seguem como raízes |

---

## ⚡ Pontos de atenção — performance

O risco real está no `GET /events/:eventId/comments`, não nas escritas.

1. **Não** carregue a árvore com `include` aninhado 5 vezes — são 5 JOINs e explode em eventos com muitos comentários.
2. Prefira: paginar as **raízes**, buscar todos os descendentes dessas raízes numa query só (CTE recursiva ou uma coluna `rootId` denormalizada), e montar a árvore em memória.
3. Uma coluna `rootId` (id do ancestral raiz) torna isso um único `WHERE rootId IN (...)`. Vale considerar junto com `depth`.
4. `likesCount` por nó deve sair de um agregado (`_count`) ou de contador denormalizado — **nunca** de uma query por comentário (N+1).

---

## 🧪 Testes esperados

- [ ] Criar resposta em cada nível de 2 a 5 → sucesso
- [ ] Responder um comentário de nível 5 → `400`
- [ ] Responder `commentId` inexistente → `404`
- [ ] Responder comentário de outro evento → `404`
- [ ] `GET /comments` devolve árvore aninhada com `likesCount`/`isLikedByMe` corretos em todos os níveis
- [ ] Like → `liked: true`; segundo like → `liked: false`
- [ ] Like duplicado concorrente não viola a unique constraint (testar corrida)
- [ ] Deletar pai remove todos os descendentes e seus likes
- [ ] Deletar comentário de terceiro sendo criador do evento → sucesso
- [ ] Deletar comentário de terceiro sem ser criador → `403`
- [ ] Comentários pré-migration (`parentId = null`) continuam listados como raízes

---

## 📎 Contrato consumido pelo frontend

Implementado neste repositório em:

| Arquivo | Papel |
| ------- | ----- |
| `src/api/comments.ts` | Chamadas HTTP |
| `src/components/modules/Feed/commentTree.ts` | Normalização, contagem e remoção na árvore (lógica pura) |
| `src/components/modules/Feed/CommentNode.vue` | Renderização recursiva de um nó |
| `src/components/modules/Feed/InlineComments.vue` | Orquestração e estado |

**Tolerâncias que o cliente já absorve** (não são licença para inconsistência — apenas defesa):

- `likesCount` aceita também `_count.likes` ou `likes`
- `isLikedByMe` aceita também `likedByMe`
- `parentId` aceita também `parentCommentId`
- `replies` aceita também `children`
- Aceita tanto a árvore aninhada quanto uma lista plana com `parentId`
- Nós órfãos (pai fora da página) e nós além do nível 5 são promovidos a raiz em vez de sumirem da tela

**Ainda não migrados** para este contrato (seguem usando `POST /events/:id/comments` com `parentCommentId` no body): `CommentsDrawer.vue`, `EventDetails.vue`, `NewEventDetails.vue`.
