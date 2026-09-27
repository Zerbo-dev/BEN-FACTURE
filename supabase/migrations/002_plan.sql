-- Forfait de l'organisation : "free" (limité) ou "pro" (illimité). Le passage à "pro" se fait pour l'instant
-- manuellement (mettez plan = 'pro' pour l'organisation concernée) après réception du paiement, en attendant
-- une intégration Mobile Money automatisée.
alter table organizations add column if not exists plan text not null default 'free' check (plan in ('free', 'pro'));
