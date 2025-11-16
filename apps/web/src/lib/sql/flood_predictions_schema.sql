-- Schema for storing flood risk predictions
-- Run this in your Supabase SQL editor to create the `flood_risk_predictions` table

create table if not exists public.flood_risk_predictions (
  id bigserial primary key,
  prediction_id text not null,
  created_at timestamptz not null default now(),
  location_lat double precision not null,
  location_lng double precision not null,
  risk_level text,
  probability double precision default 0,
  estimated_depth double precision default 0,
  time_to_flood double precision default -1,
  confidence double precision default 0,
  risk_factors jsonb,
  model_version text,
  prediction_method text,
  metadata jsonb
);

create index if not exists idx_flood_predictions_created_at on public.flood_risk_predictions(created_at desc);
create index if not exists idx_flood_predictions_location on public.flood_risk_predictions(location_lat, location_lng);

-- Optional: grant insert/select to anon or a service role as appropriate
-- grant insert, select on public.flood_risk_predictions to anon;
