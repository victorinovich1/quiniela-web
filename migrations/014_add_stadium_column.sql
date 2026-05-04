-- =====================================================
-- 014 - Agrega columna stadium a matches
-- =====================================================

alter table public.matches add column if not exists stadium text;
