# Arquitectura

## Visión general

```
┌─────────────────────────────────────────────────────────────┐
│                       USUARIO (browser)                      │
│  [Pronósticos]  [Ranking]  [Mis Quinielas]  [Perfil]  [Admin]│
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
8. Redirect a `/entries` para crear primera quiniela

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

### Gestionar perfil
1. `/profile` permite al usuario gestionar su cuenta:
   - Cambiar nombre de pantalla (display_name)
   - Cambiar contraseña
   - Ver información de la cuenta (rol, fecha de creación)
2. **Zona de Peligro** al final de la página:
   - Botón "Eliminar mi cuenta" (permanente, borra todas las quinielas y pronósticos)
   - **Solo permitido antes de `lock_at`** — una vez iniciado el torneo, el botón se deshabilita
   - Tras confirmación doble, llama a RPC `delete_user_self()` que valida permisos y elimina en cascada
   - Cierra sesión automáticamente y redirige a la landing page

### Gestionar quinielas (entries)
1. `/entries` muestra todas las quinielas (participaciones) del usuario
2. Cada quiniela tiene:
   - **Alias único** (ej: "Casa", "Oficina", "Conservadora")
   - Estado de pago (pagada/pendiente) — marcado por el admin
   - Fecha de creación
   - Pronósticos independientes
3. Usuarios pueden:
   - **Crear nuevas quinielas** (si el torneo no ha empezado)
   - **Editar el alias** de quinielas existentes (botón de lápiz junto al nombre)
   - **Eliminar quinielas** (solo si el torneo no ha empezado)
   - Navegar a `/predictions?entry=N` para llenar pronósticos
4. Cada quiniela compite independientemente en el ranking
5. Cada quiniela paga su propia cuota (marcada manualmente por el admin)

**Restricciones:**
- Alias deben ser únicos por usuario
- No se pueden crear/editar/eliminar quinielas después de `lock_at`
- RLS asegura que solo el usuario pueda modificar sus propias quinielas

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
- Ver todas las quinielas (entries) de cada usuario
- Marcar quinielas como pagadas/pendientes
- Cambiar roles (admin/manager/participant)
  - **admin**: Acceso completo al panel de administración
  - **manager**: Acceso restringido (solo Invitaciones y Participantes, sin permisos de edición)
  - **participant**: Usuario normal sin acceso al panel de administración
- **Enviar correos de recuperación de contraseña**: Botón de "sobre" junto a cada usuario permite enviar email de reset password directamente (útil cuando Resend está en plan free y solo envía a email verificado)
- **Eliminar usuarios**: Botón de papelera roja elimina permanentemente al usuario y todas sus quinielas (en cascada). No requiere que el torneo haya iniciado.
- **Eliminar quinielas individuales**: Botón de papelera en cada quiniela permite eliminar una entry específica sin borrar al usuario

### Configuración del Sistema
- Establecer fecha/hora de cierre de pronósticos (`lock_at`)
- Configurar sistema de puntos (12 categorías editables)
- Cargar resultados especiales al final del torneo (campeón, subcampeón, tercer y cuarto lugar)

Todos los cambios en configuración y resultados actualizan el ranking automáticamente gracias a las views calculadas en tiempo real.

## Bloqueo de pronósticos

El sistema implementa un **bloqueo dual** para máxima flexibilidad:

### 1. Bloqueo Global (`settings.lock_at`)
Afecta solo a:
- **Predicciones especiales (podio)**: Los 4 selectores (campeón, subcampeón, 3º, 4º) se bloquean al llegar a `lock_at`
- **Borrado de quinielas (entries)**: No se pueden eliminar entries después de `lock_at`

**Implementación:**
- Función SQL `predictions_locked()` retorna `lock_at < now()`
- RLS de `special_predictions`: bloquea UPDATE si `predictions_locked() = true`
- RLS de `entries`: bloquea DELETE si `predictions_locked() = true`
- Frontend: Calcula `podiumLocked` y deshabilita selectores del podio
- UI muestra advertencia: "⚠️ El podio se bloquea definitivamente al iniciar el mundial"

### 2. Bloqueo por Partido (15 minutos antes de kickoff)
Afecta solo a:
- **Marcadores individuales de cada partido**: Cada partido se bloquea 15 min antes de su `kickoff_at`

**Implementación:**
- Función `isMatchLocked(match, globalLocked)` en frontend retorna:
  - `true` si `Date.now() >= (kickoff - 15 min)` 
  - O si `globalLocked = true` (fallback legacy)
- Inputs de score se deshabilitan individualmente cuando `isMatchLocked = true`
- Permite pronosticar partidos futuros incluso si otros ya comenzaron
- RLS valida que no haya pasado el `lock_at` global (protección adicional)

**Bloqueo dinámico de eliminatorias:**
- En UI, los inputs de score de eliminatorias están deshabilitados si los equipos aún no se definen (`home_team_id` o `away_team_id` NULL)
- Muestra mensaje "Esperando rivales..." o pill opaco hasta que se completen las rondas previas
- Admin puede asignar equipos manualmente en la pestaña Resultados cuando se definan los clasificados

**Resumen:**
| Elemento | Bloqueado por | Momento del bloqueo |
|----------|--------------|---------------------|
| Podio (campeón, subcampeón, 3º, 4º) | `lock_at` global | Al iniciar el primer partido |
| Borrado de jugadas (entries) | `lock_at` global | Al iniciar el primer partido |
| Marcadores de partidos individuales | `kickoff_at - 15 min` | Por partido, 15 min antes |

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

## Funciones RPC de eliminación

El sistema incluye funciones `SECURITY DEFINER` para eliminación segura de usuarios:

### `delete_user_self()`
- **Propósito**: Permite que un usuario autenticado elimine su propia cuenta
- **Restricción**: Solo funciona si `not predictions_locked()` (antes del inicio del torneo)
- **Cascada**: Elimina automáticamente profile, entries, predictions y special_predictions
- **Uso**: Llamada desde `/profile` → "Zona de Peligro" → Botón "Eliminar mi cuenta"
- **Seguridad**: SECURITY DEFINER con validaciones estrictas de `auth.uid()` y `predictions_locked()`

### `admin_delete_user(target_user_id uuid)`
- **Propósito**: Permite que un administrador elimine cualquier usuario
- **Restricción**: Valida que el caller sea admin vía `is_admin()`
- **Cascada**: Igual que delete_user_self — elimina todo en cascada desde auth.users
- **Uso**: Llamada desde `/admin` → Participantes → Botón de papelera roja junto a cada usuario
- **Seguridad**: SECURITY DEFINER con validación de rol admin

**Foreign Keys con ON DELETE CASCADE:**
- `profiles.id → auth.users(id)`
- `entries.user_id → auth.users(id)`
- `predictions.entry_id → entries(id)`
- `special_predictions.entry_id → entries(id)`

Al eliminar un usuario de `auth.users`, PostgreSQL ejecuta la cascada automáticamente y elimina todas las filas relacionadas en orden correcto.

## Cálculo de puntos (views)

Tres views con `security_invoker = true`:

- **`match_scores`**: por (entry_id, match_id), calcula puntos del pronóstico vs resultado real.
- **`special_scores`**: por entry_id, calcula puntos de pronósticos especiales vs `settings.*` (resultados oficiales).
- **`leaderboard`**: por entry, suma `match_points + special_points = total_points`.

El sistema de puntos es **configurable** desde el panel admin (`settings.pt_*` columnas). Cambiar valores ahí actualiza el ranking automáticamente.

### Sistema de Desempate en Eliminatorias (Penales)

En fases eliminatorias (32avos hasta la Final), el sistema maneja desempates por tanda de penales:

#### Flujo de Usuario
1. **Predicción de empate**: Si el usuario pronostica un empate en eliminatoria (ej. 1-1, 2-2, 0-0):
   - Aparece selector obligatorio: "¿Quién avanza de ronda?"
   - Debe elegir un equipo para poder guardar (`predictions.ko_winner_team_id`)
   
2. **Cambio de predicción**: Si cambia el marcador a victoria directa (ej. 2-1):
   - El selector desaparece automáticamente
   - `ko_winner_team_id` se limpia (porque el ganador es obvio)

#### Flujo de Admin
1. Cuando un partido de eliminatoria termina en empate:
   - Ingresa el marcador oficial (ej. 3-3)
   - Aparece selector "Gana en penales"
   - Elige el equipo ganador (`matches.shootout_winner_team_id`)

#### Lógica de Puntos

**A) Marcador Exacto (8 puntos en eliminatorias)**:
- `pred_home == real_home AND pred_away == real_away`
- Independiente de quién ganó en penales
- Ejemplo: predijo 1-1, fue 1-1 → 8 puntos (aunque Argentina ganara en penales)

**B) Ganador Correcto (4 puntos en eliminatorias)**:
- NO hubo marcador exacto, pero:
  - Usuario predijo victoria (ej. 2-1) y el equipo ganó (ya sea en 120' o penales)
  - O usuario predijo empate (ej. 1-1), el partido fue empate (ej. 2-2), y acertó quién ganó en penales

**C) Sin puntos**:
- Marcador incorrecto
- Ganador incorrecto
- Falta `shootout_winner_team_id` cuando hubo penales

**Ejemplo completo** (Final del Mundial):
```
Partido real: Argentina 3-3 Francia (penales: Argentina)

Usuario A → 3-3 + Argentina: 8 pts (marcador exacto)
Usuario B → 2-2 + Argentina: 4 pts (ganador en penales)
Usuario C → 2-1 Argentina: 4 pts (ganador correcto, aunque marcador diferente)
Usuario D → 2-2 + Francia: 0 pts (ganador incorrecto)
Usuario E → 1-0 Francia: 0 pts (todo incorrecto)
```

**Implementación técnica**:
- View `match_scores` (migración 033, líneas 45-47) evalúa automáticamente
- RLS permite usuarios leer/escribir `ko_winner_team_id` en sus predictions
- Solo admin escribe `shootout_winner_team_id` en matches

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
