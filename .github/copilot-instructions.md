# Quiniela Mundial 2026 — Project Instructions

Proyecto: quiniela web del Mundial 2026. Next.js 14 App Router + Supabase. El propietario NO programa; mantén las cosas simples y bien documentadas.
UI en español. Comentarios y docs en español. Variables/tipos en inglés.

## Stack (NO cambiar sin razón fuerte)

- next 14.2.15 (App Router — NO migrar a 15+)
- react 18.3.1
- @supabase/ssr 0.5.1
- @supabase/supabase-js 2.45.4
- typescript 5.6.2 (strict mode)
- tailwindcss 3.4.13
- node >=20

No introducir: Zustand/Redux, Mantine/Chakra, ORMs, ni dependencias pesadas injustificadas.

## Código

**Imports:** siempre `@/` para paths internos. Sin imports relativos largos.

**Server vs Client:**
- Server por defecto. Solo `'use client'` cuando se necesita interactividad.
- Server components → `@/lib/supabase/server`. Client components → `@/lib/supabase/client`. Nunca mezclar.
- Patrón: `app/foo/page.tsx` (server, queries) + `app/foo/FooClient.tsx` (client, interactividad).

**Supabase:**
- Siempre RLS. Nunca `service_role` key desde el browser.
- Mutaciones de usuario: desde client component con `createClient()` del browser.
- Queries iniciales SSR: server client.

**TypeScript:** strict mode. Sin `any`. Tipos en `lib/types.ts`, deben coincidir exactamente con el schema de BD.

**Estilo (Tailwind dark FIFA-style):** ver `docs/STYLE_GUIDE.md`.
- Colores: `bg-navy-deepest`, texto `text-white` con opacidades, acento `text-fifaGreen`.
- Botones: clases en `globals.css` (`btn`, `btn-primary`, `btn-outline`). Sin inline styles.
- Banderas: `<img>` directo a `https://flagcdn.com/{w}/{iso}.png`. NO usar `next/image`.

**Nombres:**
- Tablas/columnas: `snake_case` plural.
- Componentes: `PascalCase`. Hooks: `useFoo`. Archivos: `kebab-case` folders, `PascalCase.tsx` componentes, `lowerCamelCase.ts` utils.

## Base de datos

- Cambios de schema: SIEMPRE migración nueva, nunca editar existentes. Numeración secuencial: `018_descripcion`.
- Aplicar vía Supabase MCP (`apply_migration`). Si no disponible, el usuario copia en SQL Editor.
- Tras DDL, ejecutar `get_advisors` y resolver warnings.

## NUNCA hacer

1. Confirmar email en signups (mantener "Confirm email" desactivado).
2. Romper RLS — toda tabla nueva necesita policies desde el inicio.
3. Hardcodear claves Supabase. Solo en `.env.local` o env vars de Vercel.
4. Cambiar `match_number` — los pronósticos lo referencian.
5. Usar emoji de banderas — usar `iso_code` con flagcdn.com.
6. Romper el bloqueo: cuando `predictions_locked()` = true, ningún usuario modifica pronósticos.
7. Reescribir archivos enteros cuando un edit pequeño basta.
8. Tocar `.env*` sin razón o sin confirmar con el usuario.

## Convenciones del agente

1. Leer `docs/ARCHITECTURE.md` y `docs/DATABASE.md` antes de cambios grandes.
2. Al agregar columnas: migración con `alter table add column if not exists` + actualizar `lib/types.ts`.
3. Al editar RLS: ejecutar `get_advisors` después.
4. Cambios visuales grandes: mostrar mockup al usuario antes de implementar.

## Docs de referencia

- `docs/ARCHITECTURE.md` — arquitectura detallada
- `docs/DATABASE.md` — schema, migraciones, RLS
- `docs/STYLE_GUIDE.md` — design system completo
- `docs/KNOWN_ISSUES.md` — bugs conocidos y pendientes
