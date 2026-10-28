-- Company details filled in by the admin. All optional: an account works without them.

create type public.trade as enum (
  'couvreur',
  'elagueur',
  'paysagiste',
  'plombier',
  'chauffagiste',
  'electricien',
  'macon',
  'menuisier',
  'peintre',
  'autre'
);

-- French administrative regions (2016), mainland and overseas.
create type public.region as enum (
  'auvergne-rhone-alpes',
  'bourgogne-franche-comte',
  'bretagne',
  'centre-val-de-loire',
  'corse',
  'grand-est',
  'hauts-de-france',
  'ile-de-france',
  'normandie',
  'nouvelle-aquitaine',
  'occitanie',
  'pays-de-la-loire',
  'provence-alpes-cote-d-azur',
  'guadeloupe',
  'martinique',
  'guyane',
  'la-reunion',
  'mayotte'
);

alter table public.companies
  add column siret text check (siret ~ '^[0-9]{14}$'),
  add column trade public.trade,
  add column region public.region;
