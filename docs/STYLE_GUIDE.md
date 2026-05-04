# Style guide — Diseño y código

## Diseño visual: FIFA Dark

Inspirado en gráficos oficiales del Mundial 2026: fondo navy oscuro, glow sutiles, equipos en pills blancos con bandera, tipografía bold mayúscula, acento verde FIFA.

### Paleta de colores (Tailwind)

| Token | Hex | Uso |
|-------|-----|-----|
| `navy-deepest` | `#04061a` | Fondo más oscuro (page bg base) |
| `navy-dark` | `#080b22` | Fondo medio |
| `navy DEFAULT` | `#0f1437` | Fondo medio claro |
| `navy-light` | `#1f2660` | Hover de fondos |
| `fifaGreen DEFAULT` | `#34d399` | Acento principal (active, links, success) |
| `fifaGreen-light` | `#6ee7b7` | Hover en verde |
| `gold DEFAULT` | `#ffd34a` | Top 1 / acento secundario |
| `gold-light` | `#ffe17a` | Hover en gold |
| `accent-purple` | `#7c3aed` | Glow superior izquierdo del fondo |
| `accent-blue` | `#3b82f6` | Glow inferior derecho |
| `danger` | `#f87171` | Errores, "no pagado" |
| `warning` | `#fbbf24` | Avisos amarillos |

**Texto:** siempre `text-white` con opacidades:
- `text-white` 100% — títulos, cifras importantes
- `text-white/80` — texto secundario
- `text-white/60` — labels y meta
- `text-white/40` — placeholder, hints
- `text-white/20` — divisores

### Tipografía

- **Familia:** `Inter` (Google Fonts, importada en `layout.tsx`)
- **Pesos usados:** 400, 500, 600, 700, 800, 900
- **Reglas:**
  - **Títulos:** `font-black uppercase tracking-tight` (peso 900, sin tracking ancho)
  - **Labels:** `label-up` (componente CSS) — uppercase + tracking-[0.2em] + tamaño 10px + bold
  - **Body:** sans regular, `text-sm` o `text-base`
  - **Botones:** `font-bold uppercase tracking-wider`
  - **Pills de equipos:** `font-extrabold uppercase tracking-tight`
  - **Mayúsculas para todo branding** (excepto texto largo en párrafos)

### Componentes CSS reutilizables (en `globals.css`)

```css
.btn              /* base botón: 44px alto, rounded-lg, font-bold uppercase tracking-wider */
.btn-primary      /* fondo fifaGreen, texto navy-deepest */
.btn-gold         /* fondo gold, texto navy-deepest */
.btn-outline      /* border blanco/30, hover bg-white/10 */
.btn-secondary    /* bg-white/10 */
.btn-danger       /* bg-danger */
.input            /* bg-white/5, border-white/15, text-white */
.score-input      /* 48x48, font-extrabold, para marcadores */
.card             /* bg-white/5 backdrop-blur, rounded-2xl, border-white/10 */
.card-dark        /* bg-navy-dark/60 + blur */
.badge            /* uppercase 10px tracking-wider */
.label-up         /* label uppercase tracking-[0.2em] 10px */
.divider-with-label  /* línea horizontal con un span centrado encima */
```

### Patrón "pill de equipo"

Siempre que muestres un equipo en pequeño:

```tsx
<div className="bg-white rounded-full px-3 py-1.5 inline-flex items-center gap-2">
  <Flag team={team} size={14} />
  <span className="text-xs font-extrabold text-slate-900 uppercase tracking-tight">{team.name}</span>
</div>
```

O usa `<TeamPill team={team} />` del componente `Flag.tsx`.

### Patrón "header de grupo"

Cápsula verde con la letra del grupo + 4 pills de equipos:

```tsx
<div className="bg-fifaGreen/10 border border-fifaGreen/30 rounded-2xl p-4">
  <div className="flex items-center gap-3">
    <div className="bg-fifaGreen rounded-lg px-4 py-3 flex flex-col items-center">
      <span className="text-[10px] font-bold text-navy-deepest tracking-widest">GRUPO</span>
      <span className="text-3xl font-black text-navy-deepest">A</span>
    </div>
    <div className="grid grid-cols-2 gap-1.5 flex-1">
      {/* 4 pills */}
    </div>
  </div>
</div>
```

### Patrón "fila de partido FIFA"

5 columnas: hora · equipo local · score · equipo visitante · ciudad.

```
┌──────────────────────────────────────────────────────────────────┐
│  21:00  | [🇲🇽 MÉXICO] | [2]−[1] | [🇿🇦 SUDÁFRICA] |  CDMX        │
│  CEST   |             |         |                  |  AZTECA     │
└──────────────────────────────────────────────────────────────────┘
```

Ver `app/predictions/PredictionsClient.tsx` → función `FifaMatchRow`.

### Banderas

Componente `<Flag team={team} size={N} />`. Carga PNG de flagcdn.com.

```tsx
<Flag team={team} size={18} />  // 18px alto, ancho automático ~24px
```

**Uso obligatorio en TODAS las vistas (Admin y User).** Siempre que se muestre el nombre de un equipo/selección, debe ir acompañado de `<Flag />` o el patrón `<img>` con `flagcdn.com`. Prohibido usar emoji de banderas (`flag_emoji` existe en BD pero no se usa en UI por compatibilidad con Windows).

Códigos ISO especiales:
- Inglaterra: `gb-eng`
- Escocia: `gb-sct`
- Resto: ISO 3166 alpha-2 lowercase

### Encabezados de página (PageHeader)

**Componente unificado:** `<PageHeader />` en `components/PageHeader.tsx`.

Todas las páginas principales deben usar este componente para mantener consistencia visual.

**Props:**
- `title` (requerido): Título principal de la página
- `label` (opcional): Label superior en estilo `label-up` (ej: "Clasificación general")
- `subtitle` (opcional): Texto descriptivo debajo del título
- `action` (opcional): Elemento React (botón, link) que se muestra debajo del subtítulo

**Ejemplo de uso:**
```tsx
import PageHeader from '@/components/PageHeader'

<PageHeader
  label="Clasificación general"
  title="Ranking"
  subtitle="Actualizado: 14:32"
/>

// Con acción
<PageHeader
  label="Tus participaciones"
  title="Mis jugadas"
  subtitle="Cada jugada compite por separado"
  action={<button className="btn btn-primary">+ Nueva jugada</button>}
/>
```

**Páginas que usan PageHeader:**
- `/leaderboard` — Ranking
- `/entries` — Mis jugadas
- `/profile` — Mi perfil
- `/admin` — Panel de administración

**Páginas con estructura especial:**
- `/predictions` — Usa selector de jugada + tabs (no PageHeader)

### Estructura de página

Todas las páginas siguen este patrón:

```tsx
// Server component (page.tsx)
export default async function MyPage() {
  // 1. Auth check
  const user = await getUser()
  if (!user) redirect('/login')
  
  // 2. Cargar datos server-side
  const data = await supabase.from(...)...
  
  // 3. Pasar a client component
  return <MyPageClient data={data} />
}

// Client component (MyPageClient.tsx)
'use client'

import PageHeader from '@/components/PageHeader'

export default function MyPageClient({ data }: Props) {
  // Estado local, handlers, etc.
  
  return (
    <div>
      <PageHeader title="Mi página" />
      {/* Contenido */}
    </div>
  )
}
```

**Contenedor base:**
El `layout.tsx` ya define el contenedor principal con `max-w-5xl mx-auto px-4 py-6`.
No añadas contenedores adicionales a menos que necesites un ancho específico menor (ej: formularios con `max-w-2xl`).

**Espaciado:**
- Entre secciones: `space-y-6` o `mb-6`
- Entre elementos pequeños: `gap-3`, `gap-2`
- Padding de cards: `p-4` (desktop) o `p-3` (mobile con `sm:p-4`)

## Reglas de código

### Imports
```tsx
// Externos primero
import { useState } from 'react'
import Link from 'next/link'

// Internos con alias @/
import { createClient } from '@/lib/supabase/client'
import Flag from '@/components/Flag'
import type { Team } from '@/lib/types'
```

### Server vs Client
- Server por defecto. Solo `'use client'` cuando se necesita interactividad.
- En server components puedes hacer `await supabase.from(...)` directo.
- En client components, usa estado local + llamadas asíncronas.

### Tipos
- Siempre tipar props de componentes inline:
  ```tsx
  function Foo({ name, age }: { name: string; age: number }) { }
  ```
- Para contratos compartidos (props que viajan server→client), usa `lib/types.ts`.
- No usar `any`. Si no sabes el tipo, usa `unknown` y narrow.

### Async / errors
- Try/catch en mutaciones de cara al usuario; mostrar error en UI.
- En server components, errores de Supabase deben ser manejados o el componente entero falla.

### Tailwind
- Clases compuestas en `globals.css` (`btn`, `input`, `card`) — usa esas en lugar de repetir clases.
- Para colores con opacidad: `bg-white/5`, `text-white/60`, `border-fifaGreen/30`.
- Responsive: mobile-first. Usa `md:` para tablet+, `lg:` para desktop.

### Naming
- Components: `PascalCase.tsx`
- Hooks: `useFoo`
- Utils: `lowerCamelCase`
- Folders: `kebab-case`

## Animaciones

Mantenlas sutiles. Tailwind built-in:
- `transition-colors`, `transition-all` (200ms default)
- `hover:scale-105` solo en botones de tab activo
- No usar animaciones complejas o keyframes custom.

## Accesibilidad

- Todos los inputs con `<label>` o `aria-label`.
- Todos los botones de icono con `aria-label`.
- Contraste suficiente: blanco sobre navy-deepest cumple WCAG AA.
- Foco visible: el ring `focus:ring-2 focus:ring-fifaGreen/30` en inputs.
