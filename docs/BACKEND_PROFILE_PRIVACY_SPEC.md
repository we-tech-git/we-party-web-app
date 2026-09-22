# Especificação: Privacidade do Perfil Público

## 📋 Resumo

Preferências que o dono do perfil controla em "Preferências → Privacidade do Perfil"
e que definem o que aparece para quem visita `/profile/:id` (perfil público de
terceiro). Primeira leva: visibilidade de **eventos curtidos** e de
**presenças confirmadas**.

## 🔗 Endpoints afetados

### Atualizar preferência

```
PATCH /users/profile
```

**Autenticação**: Requerida (JWT Bearer Token)
**Body**: `multipart/form-data` (mesmo endpoint já usado para nome/username/bio/fotos)

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `showLikedEvents` | `"true" \| "false"` | Não | Se `false`, oculta a aba/lista de eventos curtidos no perfil público. |
| `showConfirmedEvents` | `"true" \| "false"` | Não | Se `false`, oculta a aba/lista de presenças confirmadas no perfil público. |

Enviado como string (`FormData`), igual aos demais campos deste endpoint — o
backend deve fazer o parse para boolean.

### Ler perfil (próprio e de terceiro)

```
GET /users/:id
```

A resposta (`data`) deve passar a incluir os dois campos, refletindo o valor
salvo pelo dono do perfil:

```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "name": "Jonathan Santos",
    "username": "jonathan.zemaloka",
    "likedEvents": [ /* ... */ ],
    "eventAttendances": [ /* ... */ ],
    "showLikedEvents": true,
    "showConfirmedEvents": false
  }
}
```

**Default quando o campo não existe ainda no banco**: tratar como `true`
(visível) — é o que o frontend já assume enquanto o backend não implementa
isso, para não quebrar perfis existentes.

**Importante — não pular a query**: mesmo quando `showLikedEvents`/
`showConfirmedEvents` é `false`, o backend pode continuar retornando
`likedEvents`/`eventAttendances` sem problema (o frontend decide o que
renderizar com base nas duas flags); só não deve depender disso, porque o
respeito à preferência é responsabilidade de quem exibe.

## 🔐 Autorização

- Só o dono do perfil (dono do JWT) pode alterar `showLikedEvents`/
  `showConfirmedEvents` do próprio usuário — mesma regra de autorização já
  aplicada aos outros campos de `PATCH /users/profile`.
- Qualquer usuário autenticado pode **ler** essas duas flags via
  `GET /users/:id` (elas descrevem o que ele já vai ver na mesma resposta).

## 🚀 Frontend (já implementado)

O frontend já está pronto para consumir esses campos assim que existirem:

- **Preferências (dono do perfil)**: `src/components/modules/Profile/ProfileSettingsPanel.vue`
  (seção "Privacidade do Perfil") + `src/components/modules/Profile/Profile.vue`
  (`updatePrivacySetting`, toggle otimista via `updateUserProfile`).
- **Perfil público (visitante)**: `src/components/modules/Profile/PublicProfile.vue`
  — oculta a aba e o conteúdo conforme `showLikedEvents`/`showConfirmedEvents`
  vindos de `GET /users/:id`; se ambos forem `false`, some com as abas por
  completo.
- **API**: `src/api/users.ts` → `updateUserProfile()` já aceita os dois campos.

---

**Status**: ⚠️ **Campos pendentes de implementação no backend** (persistência
em `GET`/`PATCH /users/*`). Até lá, o toggle no frontend muda a UI localmente
mas a chamada ao backend é um no-op silencioso (DTO deve descartar campo
desconhecido) — quando implementado, a funcionalidade fica 100% ativa sem
mudança nenhuma no frontend.
