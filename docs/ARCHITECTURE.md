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

### Recuperación de contraseña
1. Usuario va a `/forgot-password` (o admin usa botón en `/admin` → Participantes)
2. Ingresa email → `supabase.auth.resetPasswordForEmail(email, { redirectTo: origin + '/auth/callback?next=/reset-password' })`
3. Supabase envía email vía SMTP (Resend) con enlace que contiene código de un solo uso
4. Usuario hace clic en enlace del email → `/auth/callback?code=XXX&next=/reset-password`
5. Callback ejecuta `supabase.auth.exchangeCodeForSession(code)` → crea sesión temporal de recovery
6. Callback redirige a `/reset-password`
7. Página verifica sesión activa (evento `PASSWORD_RECOVERY`)
8. Usuario ingresa nueva contraseña → `supabase.auth.updateUser({ password: newPassword })`
9. Contraseña actualizada, redirect a `/predictions`

**Notas:**
- Enlace de recuperación expira en 1 hora
- Si Resend está en plan free, emails solo llegan al correo verificado (el admin puede enviarlos manualmente)
- El código se intercambia por sesión en server-side (seguro)
- La sesión de recovery permite solo cambiar la contraseña, no acceso completo

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

### Gestionar jugadas (entries)
1. `/entries` muestra todas las jugadas (participaciones) del usuario
2. Cada jugada tiene:
   - **Alias único** (ej: "Casa", "Oficina", "Conservadora")
   - Estado de pago (pagada/pendiente) — marcado por el admin
   - Fecha de creación
   - Pronósticos independientes
3. Usuarios pueden:
   - **Crear nuevas jugadas** (si el torneo no ha empezado)
   - **Editar el alias** de jugadas existentes (botón de lápiz junto al nombre)
   - **Eliminar jugadas** (solo si el torneo no ha empezado)
   - Navegar a `/predictions?entry=N` para llenar pronósticos
4. Cada jugada compite independientemente en el ranking
5. Cada jugada paga su propia cuota (marcada manualmente por el admin)

**Restricciones:**
- Alias deben ser únicos por usuario
- No se pueden crear/editar/eliminar jugadas después de `lock_at`
- RLS asegura que solo el usuario pueda modificar sus propias jugadas

## Páginas y guard de auth

`middleware.ts` protege estas rutas:
- `/predictions` → requiere autenticación
- `/leaderboard` → requiere autenticación
- `/entries` → requiere autenticación
- `/profile` → requiere autenticación (gestión de perfil y cambio de contraseña)
- `/admin` → requiere autenticación + rol admin (validado en el server component también)

Si no autenticado, redirige a `/login?next=<ruta_original>`.

## Capacidades administrativas

El panel `/admin` ofrece control completo del sistema al rol `admin`:

### Gestión de Equipos
- Editar nombres de los 48 equipos según el sorteo oficial
- Ver banderas automáticas vía flagcdn.com (iso_code)

### Gestión de Resultados
- Capturar marcadores oficiales tras cada partido
- Marcar partidos como "finalizado" para que cuenten en el ranking
- Editar fechas, estadios y detalles de partidos
- Manejar ganadores por penales en eliminatorias

### Gestión de Invitaciones
- Generar códigos únicos de invitación
- Opcionalmente restringir códigos a emails específicos
- Ver estado de invitaciones (usadas/disponibles)

### Gestión de Participantes
- Ver todas las jugadas (entries) de cada usuario
- Marcar jugadas como pagadas/pendientes
- Cambiar roles (admin/manager/participant)
  - **admin**: Acceso completo al panel de administración
  - **manager**: Acceso restringido (solo Invitaciones y Participantes, sin permisos de edición)
  - **participant**: Usuario normal sin acceso al panel de administración
- **Enviar correos de recuperación de contraseña**: Botón de "sobre" junto a cada usuario permite enviar email de reset password directamente (útil cuando Resend está en plan free y solo envía a email verificado)

### Configuración del Sistema
- Establecer fecha/hora de cierre de pronósticos (`lock_at`)
- Configurar sistema de puntos (12 categorías editables)
- Cargar resultados especiales al final del torneo (campeón, subcampeón, tercer y cuarto lugar)

Todos los cambios en configuración y resultados actualizan el ranking automáticamente gracias a las views calculadas en tiempo real.

## Bloqueo de pronósticos

**Bloqueo global (`lock_at`):**
- `settings.lock_at` marca la fecha/hora de cierre global.
- Función `predictions_locked()` retorna `lock_at < now()`.
- Deshabilita creación/edición de entries y predicciones especiales.

**Bloqueo por partido (15 minutos antes):**
- Función `can_predict_match(match_id)` retorna true solo si faltan más de 15 min para el kickoff.
- RLS de `predictions` usa esta función para bloquear INSERT/UPDATE de cada partido individualmente.
- Permite pronosticar partidos futuros incluso si otros ya comenzaron.

**Bloqueo de borrado de entries:**
- No se pueden borrar jugadas (entries) una vez que el mundial comenzó.
- Función `tournament_started()` detecta si ya hay al menos un partido con kickoff en el pasado.
- Solo admin puede borrar entries después del inicio.

**Bloqueo dinámico de eliminatorias:**
- En UI, los inputs de score de eliminatorias están deshabilitados si los equipos aún no se definen (`home_team_id` o `away_team_id` NULL).
- Muestra mensaje "Esperando rivales..." hasta que se completen las rondas previas.

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
