# Arquitectura

## Visión general

```
┌─────────────────────────────────────────────────────────────┐
│                       USUARIO (browser)                      │
│  [Pronósticos]  [Ranking]  [Mis jugadas]  [Perfil]  [Admin]  │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    VERCEL (Next.js 14 SSR)                   │
│  - Server Components + Client Components                     │
│  - middleware.ts (auth guard)                                │
│  - @supabase/ssr (cookies-based session)                     │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS + JWT
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  SUPABASE (Postgres + Auth)                  │
│  - tables: profiles, entries, matches, teams, predictions...│
│  - RLS policies on every table                               │
│  - views (security_invoker): leaderboard, match_scores...    │
│  - RPCs: redeem_invite, validate_invite, is_admin, etc.      │
└──────────────────────────┬──────────────────────────────────┘
                           │ SMTP
                           ▼
                    ┌──────────────┐
                    │    RESEND    │  ← solo para reset password
                    │  (free tier) │
                    └──────────────┘
```

## Flujo típico de un usuario

### Registro
1. Usuario va a `/signup`
2. Llena email + contraseña + nombre + código de invitación
3. Frontend llama `validate_invite(code, email)` (RPC) → bool
4. Si válido → `supabase.auth.signUp({ email, password })`
5. Trigger `handle_new_user` crea perfil en `profiles` (rol = 'admin' si email coincide con el admin hardcodeado, sino 'participant')
6. Frontend llama `redeem_invite(code)` para marcar el código como usado
7. Frontend hace UPDATE a `profiles.display_name` con el nombre dado
8. Redirect a `/entries` para crear primera jugada

### Login
1. Usuario va a `/login`
2. Email + contraseña → `supabase.auth.signInWithPassword`
3. Cookie de sesión se setea automáticamente
4. Redirect a `/predictions`

### Pronosticar
1. `/predictions` (server component) carga del usuario:
   - Sus entries
   - Todos los teams y matches
   - Sus predictions de la entry activa (?entry=N)
   - Sus special_predictions de esa entry
   - El estado del bloqueo (`predictions_locked()` RPC)
2. Pasa todo como props al `PredictionsClient` (client component)
3. Usuario llena marcadores → estado local
4. Click "Guardar" → upsert masivo en `predictions` y `special_predictions` con `entry_id`

### Ver ranking
1. `/leaderboard` (server component) lee la view `leaderboard` ordenada por `total_points DESC`
2. La view recalcula puntos cada vez que se consulta (no hay cache)
3. Punto fuerte: los puntos siempre reflejan el estado actual (resultados + scoring config)

## Páginas y guard de auth

`middleware.ts` protege estas rutas:
- `/predictions` → requiere autenticación
- `/leaderboard` → requiere autenticación
- `/entries` → requiere autenticación
- `/profile` → requiere autenticación (gestión de perfil y cambio de contraseña)
- `/admin` → requiere autenticación + rol admin (validado en el server component también)

Si no autenticado, redirige a `/login?next=<ruta_original>`.

## Bloqueo de pronósticos (lock_at)

- `settings.lock_at` (timestamptz) marca cuándo se cierran los pronósticos.
- Función `predictions_locked()` retorna `lock_at < now()`.
- RLS de `predictions`, `special_predictions`, y `entries` bloquea inserts/updates cuando `predictions_locked() = true`.
- El frontend también deshabilita inputs cuando `locked = true` para UX.

## Modelo de datos clave

```
auth.users (Supabase)
   │
   ├──► profiles      (1:1 con auth.users; tiene role)
   │
   └──► entries       (1:N — un usuario, muchas jugadas)
            │
            ├──► predictions          (1:N — una entry, sus 104 pronósticos máx)
            │
            └──► special_predictions  (1:1 — una entry, sus predicciones especiales)

teams (48 selecciones)
   │
   └──► matches       (104 partidos referenciando teams)

settings (1 fila — config global, scoring, lock_at, resultados especiales)
invitations (códigos para registro)
```

Detalle completo del schema: `DATABASE.md`.

## Cálculo de puntos (views)

Tres views con `security_invoker = true`:

- **`match_scores`**: por (entry_id, match_id), calcula puntos del pronóstico vs resultado real.
- **`special_scores`**: por entry_id, calcula puntos de pronósticos especiales vs `settings.*` (resultados oficiales).
- **`leaderboard`**: por entry, suma `match_points + special_points = total_points`.

El sistema de puntos es **configurable** desde el panel admin (`settings.pt_*` columnas). Cambiar valores ahí actualiza el ranking automáticamente.

## Auth: por qué SSR cookies

Usamos `@supabase/ssr` (no el legacy `@supabase/auth-helpers-nextjs`). La sesión vive en cookies HTTP-only que el server puede leer en server components y middleware. Permite:

- Server components leer la sesión sin round-trip extra al browser
- Middleware proteger rutas sin código duplicado
- RLS funciona transparente: el JWT viaja en cada request

## Tier limits y costos

| Servicio | Plan | Límite | Status actual |
|----------|------|--------|---------------|
| Vercel   | Free | 100 GB egress/mes | OK |
| Supabase | Free | 500 MB DB, 50.000 usuarios auth, 5 GB egress | OK |
| Resend   | Free | 3.000 emails/mes, 100/día | Suficiente para reset password |
| flagcdn.com | Free | Sin límite documentado | OK |

Coste actual: **$0/mes**.
