-- Migration 064: Add last_full_check_at to settings
-- Permite rastrear cuándo se ejecutó manualmente la última verificación completa
-- sin necesidad de actualizar los 104 partidos individualmente

ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS last_full_check_at timestamptz;

COMMENT ON COLUMN public.settings.last_full_check_at IS 
'Timestamp de la última verificación manual completa desde el panel de admin. Se actualiza solo cuando el usuario pulsa el botón de sincronización manualmente.';
