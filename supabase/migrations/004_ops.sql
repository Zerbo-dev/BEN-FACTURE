-- Déduplication des webhooks Telegram : un update_id déjà traité pour un bot donné est ignoré au lieu
-- d'être rejoué (évite un document généré deux fois si Telegram relance l'envoi).
create table processed_updates (
  org_id uuid not null references organizations(id) on delete cascade,
  update_id bigint not null,
  created_at timestamptz not null default now(),
  primary key (org_id, update_id)
);
alter table processed_updates enable row level security;

-- Historique des exécutions du cron d'archivage, pour repérer un échec sans attendre que la base se remplisse.
create table cron_runs (
  id uuid primary key default gen_random_uuid(),
  ran_at timestamptz not null default now(),
  ok boolean not null,
  summary jsonb
);
alter table cron_runs enable row level security;
create index cron_runs_ran_at on cron_runs (ran_at desc);
