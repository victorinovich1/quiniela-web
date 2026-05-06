Variables de entorno requeridas para sincronización API:

## Supabase (ya configuradas)
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

## Sincronización API Football Data
- FOOTBALL_DATA_API_KEY (obligatoria - clave de football-data.org)
- FOOTBALL_DATA_COMPETITION_CODE (opcional - default: "WC")
- FOOTBALL_DATA_SEASON (opcional - default: "2026")

## Seguridad Cron
- CRON_SECRET (obligatoria - token secreto para autorizar llamadas al endpoint /api/cron/sync-results)
- VERCEL_AUTOMATION_BYPASS_SECRET (opcional - para bypass de protección en Vercel Preview)

## Endpoint usado
https://api.football-data.org/v4/competitions/WC/matches?season=2026

Obtener API key en: https://www.football-data.org/client/register
