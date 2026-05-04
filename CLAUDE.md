# Instrucciones para agentes IA (Claude, Cursor, etc.)

Este archivo describe el proyecto, sus convenciones y las reglas que cualquier agente IA debe respetar al modificar este código.

## Reglas de Brevedad (MÁXIMA PRIORIDAD)

**EDICIONES QUIRÚRGICAS:** TERMINANTEMENTE PROHIBIDO reescribir archivos completos si solo cambias pocas líneas. Usa herramientas de edición precisa (`replace_string_in_file`, `multi_replace_string_in_file`) sobre bloques afectados únicamente.

**EXPLICACIONES MINIMALISTAS:** No expliques conceptos básicos de programación ni resumas lo que vas a hacer antes de hacerlo. Ve directo a la ejecución. Solo explica si hay riesgo crítico de seguridad.

**SIN FLUFF:** Elimina frases de cortesía, introducciones largas, descripciones obvias, emojis decorativos. Sé directo y técnico.

**RESPUESTAS CONCISAS:** Tras realizar un cambio, confirma con un resumen de 1-2 líneas: qué archivos tocaste y qué se modificó. Nada más.

**PRIORIDAD DE DIFF:** Si una respuesta de código es muy larga, muestra solo las partes modificadas indicando el contexto mínimo.

## Qué es este proyecto

Una **quiniela web del Mundial 2026** construida en Next.js 14 (App Router) + Supabase. Permite a un grupo cerrado (con invitaciones) pronosticar todos los partidos del torneo. Cada usuario puede crear varias "jugadas" (entries) con alias distintos, cada una con su cuota.

**Idiomas:** UI en español. Comentarios en código y docs en español. Variables/tipos en inglés.

**Audiencia técnica:** El propietario del proyecto NO programa. Le seguimos pasos vía terminal pero el código y la arquitectura las gestionas tú. Mantén las cosas simples y bien documentadas.

## Stack y versiones (NO cambiar sin razón fuerte)

```
next:                    14.2.15  (App Router; NO migrar a 15+)
react:                   18.3.1
@supabase/ssr:           0.5.1    (cookies-based session SSR)
@supabase/supabase-js:   2.45.4
typescript:              5.6.2
tailwindcss:             3.4.13
node engine:             >=20
```

- **No introducir** state libraries (Zustand/Redux), UI libraries (Mantine, Chakra), nor ORMs. Lo que hay es suficiente.
- **No usar** `next/image` para banderas — uso `<img>` directo a `https://flagcdn.com/{w}/{iso}.png`. Cambiarlo requiere agregar dominio a `next.config.js`.
- **No introducir** Server Actions sin necesidad. La mayoría de mutaciones se hacen desde el browser con el supabase client por simplicidad.

## Arquitectura en 1 minuto

- **Frontend:** Next.js App Router. Páginas server-side renderizadas, hidratan a client components donde se necesita interactividad.
- **Auth + DB:** Supabase. Auth con email + password (sin magic link, sin OAuth). Sesión vía cookies (SSR-friendly).
- **RLS:** Cada tabla tiene Row Level Security. El usuario solo ve/edita sus propios datos (sus entries, sus predictions, sus special_predictions). Admin tiene acceso completo. Las views usan `security_invoker = true` para respetar RLS.
- **Tier:** Todo en plan gratuito. Vercel + Supabase + Resend (SMTP). Capacidad: cientos de usuarios sin pagar nada.

Más detalle: ver `docs/ARCHITECTURE.md` y `docs/DATABASE.md`.

## Reglas de código

### Imports y paths
- Usar el alias `@/` para todos los imports internos: `import { createClient } from '@/lib/supabase/client'`.
- No imports relativos largos como `../../../lib/...`.

### Server vs Client components
- **Server por defecto.** Solo añadir `'use client'` cuando se necesita interactividad (forms, hooks, eventos).
- En Server components: usa `@/lib/supabase/server`. En Client: `@/lib/supabase/client`. **Nunca mezcles.**
- Si una página tiene un client component grande, sigue el patrón:
  - `app/foo/page.tsx` (server component, hace queries iniciales)
  - `app/foo/FooClient.tsx` (client component, recibe data como props)

### Supabase queries
- **Usa siempre RLS.** Nunca uses la `service_role` key desde el browser.
- Para mutaciones del lado del usuario (predictions, entries, etc.), llama directo desde el client component al `createClient()` del browser. RLS valida.
- Para queries iniciales SSR, usa el server client.

### TypeScript
- Strict mode activo. No usar `any` salvo absoluta necesidad.
- Tipos compartidos viven en `lib/types.ts` y deben coincidir EXACTAMENTE con la BD. Si cambias el schema, actualiza `lib/types.ts`.
- No interfaces vacías ni unused imports.

### Estilo (Tailwind + design system)
- Tema dark FIFA-style. Ver `docs/STYLE_GUIDE.md` para el sistema completo.
- Colores principales: `bg-navy-deepest`, texto `text-white` con opacidades, acento `text-fifaGreen`.
- Tipografía: Inter (Google Fonts). Mayúsculas con `tracking-wider` para labels y headers.
- Botones: clases compuestas en `globals.css` (`btn`, `btn-primary`, `btn-outline`, etc.). NO inline styles.
- Pills de equipos: usar el componente `<Flag />` o el patrón blanco `bg-white rounded-full px-3 py-1.5` con `<Flag />` adentro.

### Mutaciones de BD
- Para cambios de schema: SIEMPRE crear migración nueva, nunca editar una existente. Numerar secuencial: `017_descripcion_corta`. Ver `docs/DATABASE.md` para reglas.
- Las migraciones se aplican vía Supabase MCP (`apply_migration`). Si el agente tiene acceso al MCP, úsalo. Si no, el usuario las copia/pega en SQL Editor de Supabase.
- Tras cualquier cambio de DDL, ejecutar `get_advisors` para ver warnings de seguridad y arreglarlos.

### Convenciones de nombres
- Tablas y columnas: `snake_case` plural (`profiles`, `entries`, `predictions`).
- Funciones SQL: `snake_case` con prefijo si aplica (`is_admin()`, `redeem_invite()`).
- Componentes React: `PascalCase`. Hooks: `useFoo`.
- Archivos: `kebab-case` para folders, `PascalCase.tsx` para componentes, `lowerCamelCase.ts` para utils.

## Reglas estrictas (NUNCA hacer)

1. **NO** confirmar email en signups (rompería el flujo). Mantener "Confirm email" desactivado en Supabase Auth settings.
2. **NO** romper RLS — toda tabla nueva debe tener policies desde el inicio.
3. **NO** hardcodear claves Supabase en el código fuente. Solo en `.env.local` (local) o env vars de Vercel.
4. **NO** introducir dependencias pesadas sin justificación: el bundle pequeño es importante.
5. **NO** cambiar el ID de partido (match_number) — los pronósticos lo referencian.
6. **NO** usar emoji de banderas (`flag_emoji` en BD existe pero no se usa en UI por compatibilidad Windows). Usar `iso_code` con flagcdn.com.
7. **NO** romper la mecánica del bloqueo: cuando `predictions_locked()` devuelve true, ningún usuario debe poder modificar sus pronósticos. Las RLS lo enforzan, pero la UI también debe deshabilitar inputs.

## Convenciones del agente Claude

Si eres una IA editando este código:

1. **Lee primero los docs en `docs/`** antes de hacer cambios grandes. Especialmente `ARCHITECTURE.md` y `DATABASE.md`.
2. **Evita reescribir archivos enteros** cuando un Edit pequeño basta. Cada edit puede romper algo.
3. **Cuando agregues columnas a tablas** existentes:
   - Crea migración con `alter table add column if not exists`
   - Actualiza `lib/types.ts`
   - Actualiza el `update()` del admin si es editable desde ahí
4. **Cuando edites RLS,** ejecuta `get_advisors` después y resuelve los warnings.
5. **Antes de commitar cambios visuales,** muéstrale un mockup al usuario primero (vía herramienta de visualización si está disponible). Diseño grande sin alineación previa = retrabajo.
6. **NO toques los `.env*`** sin razón. Las claves anon son públicas, pero confirma con el usuario antes de cambiarlas.

## Estado actual del proyecto

Ver `docs/KNOWN_ISSUES.md` para lo pendiente y bugs conocidos.

Funcionalidades implementadas:
- Auth email+password
- Multi-jugada (entries) por usuario
- Pronósticos: fase de grupos, eliminatorias (32avos→Final), predicciones especiales
- Cálculo automático de puntos vía DB views
- Ranking en vivo
- Admin: gestión de equipos, partidos, invitaciones, participantes, configuración
- Bloqueo automático al iniciar el primer partido (`lock_at`)
- UI dark FIFA-style con banderas reales

Próximos pendientes plausibles:
- Notificaciones (email/push) cuando se actualiza el ranking
- Integración con API de fútbol para sincronizar resultados
- Pagos online (actualmente "pagado" se marca manualmente desde admin)
- Dominio propio para emails (Resend)
