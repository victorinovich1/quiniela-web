# Deployment

## Entornos

- **Local dev:** `npm run dev` (http://localhost:3000)
- **Producción:** Vercel — `https://quiniela-mundial-2026-gamma.vercel.app`

## Variables de entorno

| Variable | Local (`.env.local`) | Vercel |
|----------|----------------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✓ | ✓ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✓ | ✓ |
| `SUPABASE_SERVICE_ROLE_KEY` | ✓ | ✓ |
| `FOOTBALL_DATA_API_KEY` | ✓ | ✓ |
| `FOOTBALL_DATA_COMPETITION_CODE` | opcional | opcional |
| `FOOTBALL_DATA_SEASON` | opcional | opcional |
| `CRON_SECRET` | ✓ | ✓ |

Para obtener las claves de Supabase: Supabase Dashboard → Settings → API.

`SUPABASE_SERVICE_ROLE_KEY` se usa solo del lado servidor para el cron de sincronización.
Nunca la expongas al cliente.

## Sync automático de resultados

El proyecto incluye:
- `GET /api/cron/sync-results`
- `vercel.json` con cron cada 10 minutos (`*/10 * * * *`)

### Fuente de datos
- `football-data.org` (`/v4/competitions/WC/matches?season=2026`)

### Seguridad del cron
- Configura `CRON_SECRET` en Vercel.
- Vercel enviará `Authorization: Bearer <CRON_SECRET>` y la ruta lo valida.

### Variables mínimas para sync
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `FOOTBALL_DATA_API_KEY`
- `CRON_SECRET`

### Variables opcionales para sync
- `FOOTBALL_DATA_COMPETITION_CODE` (default `WC`)
- `FOOTBALL_DATA_SEASON` (default `2026`)

## Deploy a Vercel (rutina normal)

Desde la carpeta `quiniela-web/`:

```bash
npx vercel --prod
```

Si es la primera vez en esa máquina:
- Te pedirá login (`vercel login`)
- Te pedirá vincular el proyecto: usa el existente `quiniela-mundial-2026`

Build dura 1–3 min. Al final imprime la URL.

## Setup desde cero (recovery / nuevo entorno)

1. Crear nuevo proyecto Supabase (free tier, eu-west-1 recomendado)
2. Aplicar migraciones en orden desde `migrations/001_*.sql` hasta `017_*.sql`
3. Copiar la nueva URL y anon key a `.env.local` (y a Vercel)
4. Configurar Auth
5. Re-deploy

## Checklist pre-deploy

- [ ] `npm run build` pasa local sin errores
- [ ] Si tocaste BD: migración aplicada y verificada
- [ ] Variables de entorno en Vercel actualizadas
- [ ] El usuario actual sigue siendo admin tras el deploy
