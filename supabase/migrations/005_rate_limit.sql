-- Limite de débit sur la génération d'aperçu (surtout utile pour les couleurs personnalisées, jamais mises en
-- cache) : un compteur par organisation et par fenêtre d'une minute, incrémenté atomiquement.
create table preview_rate_limits (
  org_id uuid not null references organizations(id) on delete cascade,
  window_start timestamptz not null,
  count int not null default 0,
  primary key (org_id, window_start)
);
alter table preview_rate_limits enable row level security;

create or replace function bump_preview_rate(p_org uuid, p_window timestamptz)
returns int language sql as $$
  insert into preview_rate_limits (org_id, window_start, count) values (p_org, p_window, 1)
  on conflict (org_id, window_start) do update set count = preview_rate_limits.count + 1
  returning count;
$$;
revoke execute on function bump_preview_rate(uuid, timestamptz) from public, anon, authenticated;
grant execute on function bump_preview_rate(uuid, timestamptz) to service_role;
