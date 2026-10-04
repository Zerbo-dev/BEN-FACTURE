-- Bucket de cache pour les aperçus PNG des modèles (3 modèles x 6 palettes prédéfinies = 18 combinaisons par
-- organisation). Les couleurs personnalisées (choisies au sélecteur) ne sont jamais mises en cache : seules les
-- 6 palettes prédéfinies le sont, car ce sont elles qui sont régénérées le plus souvent en changeant de modèle.
insert into storage.buckets (id, name, public) values ('previews', 'previews', false)
on conflict (id) do nothing;
