create table if not exists public.schedules (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists schedules_payload_data_idx on public.schedules ((payload ->> 'data'));
create index if not exists schedules_payload_doca_idx on public.schedules ((payload ->> 'doca'));

alter table public.schedules enable row level security;

drop policy if exists "server only" on public.schedules;

create policy "server only"
on public.schedules
for all
using (false)
with check (false);
