## ADDED Requirements

### Requirement: Tela do evento repassa o ref da URL

Ao carregar o evento, o web-app SHALL repassar o parâmetro `ref` da query da URL da página como `?ref=<valor codificado>` em `GET /events/:id`. Quando a URL não tem `ref`, ou o valor é vazio, o web-app SHALL chamar `GET /events/:id` exatamente como hoje, sem query string. Com `ref` repetido, o web-app SHALL usar o primeiro valor. O web-app SHALL NOT acrescentar `ref` aos links gerados pelo botão de compartilhar.

#### Scenario: URL com ref

- **GIVEN** o usuário logado abre `/event/ev1?ref=k3m9x2ab`
- **WHEN** `NewEventDetails` carrega o evento
- **THEN** `getEventById` é chamado com `('ev1', 'k3m9x2ab')`
- **AND** a requisição vai para `/events/ev1?ref=k3m9x2ab`

#### Scenario: URL sem ref

- **GIVEN** o usuário abre `/event/ev1`
- **WHEN** `NewEventDetails` carrega o evento
- **THEN** a requisição vai para `/events/ev1`, sem query string

#### Scenario: ref vazio ou repetido

- **WHEN** o usuário abre `/event/ev1?ref=` ou `/event/ev1?ref=k3m9x2ab&ref=p4q5r6st`
- **THEN** a primeira abertura chama `/events/ev1` sem query
- **AND** a segunda chama `/events/ev1?ref=k3m9x2ab`

#### Scenario: Valor com caracteres especiais

- **WHEN** o usuário abre `/event/ev1?ref=a%26b%3D1`
- **THEN** a requisição vai para `/events/ev1?ref=a%26b%3D1`, sem criar parâmetros extras

#### Scenario: Compartilhar não leva o ref

- **GIVEN** o usuário abriu `/event/ev1?ref=k3m9x2ab`
- **WHEN** ele toca em compartilhar
- **THEN** a URL do `ShareSheet` é `<origem>/event/ev1`, sem `ref`

### Requirement: Uma abertura da tela, uma chamada com ref

O web-app SHALL enviar `GET /events/:id?ref=...` no máximo uma vez por abertura da tela do evento (mesmo `id` e mesmo `ref`), para o backend não contar a mesma visita duas vezes.

#### Scenario: Abertura normal com preview do feed

- **GIVEN** o usuário abre `/event/ev1?ref=k3m9x2ab` e a tela recebe `eventData` de preview
- **WHEN** a tela monta
- **THEN** `getEventById` é chamado 1 vez

#### Scenario: Tentar de novo depois de falha

- **GIVEN** que a primeira chamada falhou e a tela mostra o botão de tentar de novo
- **WHEN** o usuário toca no botão
- **THEN** `getEventById` é chamado de novo com o mesmo `ref`
