# Agenda Sandvik Taubaté

Sistema de agendamento de recebimento e expedição com agenda centralizada.

## Rodar localmente

```powershell
py -m server
```

Abra:

```text
http://127.0.0.1:4173/
```

## Publicar no Render

1. Suba este projeto para um repositório Git.
2. No Render, crie um novo **Blueprint** usando o arquivo `render.yaml`.
3. O serviço será iniciado com `python server.py`.
4. O banco SQLite fica na pasta `data`, montada como disco persistente.

## Observações

- Todos os agendamentos ficam salvos no banco `data/agenda.db`.
- O front-end usa a API `/api/schedules`.
- A senha simples do administrador está em `app.js`.
- Para produção corporativa, recomenda-se trocar essa senha simples por login Microsoft/SSO.
