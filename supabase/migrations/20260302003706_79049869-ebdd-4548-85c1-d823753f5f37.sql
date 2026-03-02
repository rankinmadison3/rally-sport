
-- Add invite code column to teams
ALTER TABLE public.teams ADD COLUMN code text UNIQUE;

-- Generate codes for existing teams
UPDATE public.teams SET code = upper(substr(md5(random()::text), 1, 6)) WHERE code IS NULL;

-- Make code not null after backfill
ALTER TABLE public.teams ALTER COLUMN code SET NOT NULL;
ALTER TABLE public.teams ALTER COLUMN code SET DEFAULT upper(substr(md5(random()::text), 1, 6));
