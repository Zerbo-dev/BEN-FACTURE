-- BAG Facture SaaS — schéma initial (à exécuter dans Supabase > SQL Editor)
create extension if not exists pgcrypto;

-- Une organisation = un client du SaaS = un bot Telegram
create table organizations (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null unique references auth.users(id) on delete cascade,
  slug text not null unique,                       -- nom du dossier sur le Drive d'archives
  name text not null default '',
  email text not null default '',
  phone text not null default '',
  address text not null default '',
  footer_text text not null default '',            -- ex: "RCCM : ... | IFU : ..."
  currency text not null default 'FCFA',
  default_tva numeric not null default 0,
  default_terms text not null default '',
  default_garantie text not null default '',
  payment_methods jsonb not null default '[]',     -- [{ "label": "Orange Money", "lines": ["+226 ..."] }]
  template text not null default 'moderne',        -- moderne | classique | sobre
  theme jsonb not null default '{"primary":"#2a2f66","accent":"#c81e3b"}',
  logo_path text,
  signature_path text,
  -- Bot Telegram propre au client
  bot_id bigint unique,
  bot_username text,
  bot_token_enc text,                              -- chiffré AES-256-GCM
  webhook_secret text,
  authorized_chats bigint[] not null default '{}', -- chats autorisés à utiliser le bot
  claim_code text,                                 -- code du lien d'association /start <code>
  storage_channel_id bigint,                       -- canal Telegram privé d'archivage des PDF
  created_at timestamptz not null default now()
);

-- Compteurs de numérotation : par organisation, type de document et année (jamais purgés)
create table counters (
  org_id uuid not null references organizations(id) on delete cascade,
  doc_type text not null,
  year int not null,
  value int not null default 0,
  primary key (org_id, doc_type, year)
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  doc_type text not null check (doc_type in ('devis','facture','proforma')),
  number text not null,
  issued_on date not null default current_date,
  client_name text not null default '',
  currency text not null default 'FCFA',
  total_ht numeric not null default 0,
  total_ttc numeric not null default 0,
  payload jsonb,                                   -- détail complet ; mis à null après archivage (fiche allégée)
  tg_channel_id bigint,
  tg_message_id bigint,
  tg_file_id text,                                 -- PDF stocké dans Telegram
  archived_at timestamptz,
  archive_batch_id uuid,
  created_at timestamptz not null default now(),
  unique (org_id, doc_type, number)
);
create index documents_org_issued on documents (org_id, issued_on desc);
create index documents_archivable on documents (issued_on) where archived_at is null;

-- Trace de chaque fichier d'archive envoyé sur le Drive
create table archive_batches (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  period text not null,                            -- AAAA-MM
  drive_file_id text not null,
  registre_file_id text,
  md5 text not null,
  row_count int not null,
  created_at timestamptz not null default now()
);

-- État des conversations du bot (remplace Redis)
create table bot_sessions (
  org_id uuid not null references organizations(id) on delete cascade,
  chat_id bigint not null,
  state jsonb not null,
  expires_at timestamptz not null,
  primary key (org_id, chat_id)
);
create index bot_sessions_expires on bot_sessions (expires_at);

-- Numéro suivant, atomique
create or replace function next_doc_number(p_org uuid, p_type text, p_year int)
returns int language sql as $$
  insert into counters (org_id, doc_type, year, value) values (p_org, p_type, p_year, 1)
  on conflict (org_id, doc_type, year) do update set value = counters.value + 1
  returning value;
$$;

create or replace function db_size_bytes()
returns bigint language sql security definer as $$ select pg_database_size(current_database()) $$;

revoke execute on function next_doc_number(uuid, text, int) from public, anon, authenticated;
revoke execute on function db_size_bytes() from public, anon, authenticated;
grant execute on function next_doc_number(uuid, text, int) to service_role;
grant execute on function db_size_bytes() to service_role;

-- Sécurité : RLS activée sans aucune policy => l'accès direct (clé anon) est refusé.
-- Toutes les lectures/écritures passent par les routes API (clé service_role).
alter table organizations enable row level security;
alter table counters enable row level security;
alter table documents enable row level security;
alter table archive_batches enable row level security;
alter table bot_sessions enable row level security;

-- Stockage privé des logos et signatures
insert into storage.buckets (id, name, public) values ('branding', 'branding', false)
on conflict (id) do nothing;
