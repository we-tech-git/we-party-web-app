# Preservação de ref no redirect de login

> Documento criado pelo hub a partir de respostas do refinamento. Revise e ajuste o título e a organização.

## Preservação de ref no redirect de login

Quando visitante deslogado acessa rota privada com ?ref=, o guard deve preservar o caminho completo em ?next= do redirect para /login. Após auth, redirecionar de volta com ref intacto.

_Origem: WEPARTY-239, resposta do Pedro no refinamento (2026-11-10). Registrado pelo hub como proposta; revise antes de aprovar._
