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
2. Crie um projeto gratuito no Supabase.
3. No Supabase, abra **SQL Editor** e rode o conteúdo de `supabase_schema.sql`.
4. Copie no Supabase:
   - `Project URL`
   - `service_role key`
5. No Render, crie um novo **Blueprint** usando o arquivo `render.yaml`.
6. Preencha as variáveis solicitadas:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
7. O serviço será iniciado com `python server.py`.

## Observações

- Em produção, todos os agendamentos ficam salvos no Supabase.
- Localmente, se o Supabase não estiver configurado, o sistema usa SQLite em `data/agenda.db`.
- O front-end usa a API `/api/schedules`.
- A senha simples do administrador está em `app.js`.
- Para produção corporativa, recomenda-se trocar essa senha simples por login Microsoft/SSO.
