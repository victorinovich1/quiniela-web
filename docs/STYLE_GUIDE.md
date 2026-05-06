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

Componente clave: `FifaMatchRow` en `app/predictions/PredictionsClient.tsx`.

**Estructura desktop (5 columnas):**
```
┌──────────────────────────────────────────────────────────────────┐
│  21:00  | [🇲🇽 MÉXICO] | [2]−[1] | [🇿🇦 SUDÁFRICA] |  CDMX        │
│  CEST   |             |         |                  |  AZTECA     │
└──────────────────────────────────────────────────────────────────┘
```

**Grid responsivo:**
- **Móvil:** `grid-cols-[60px_1fr_auto_1fr_1px]` — Estadio oculto, más espacio para equipos
- **Desktop:** `grid-cols-[80px_1fr_auto_1fr_100px]` — Todas las columnas visibles

**Reglas de visibilidad:**

| Elemento | Móvil | Desktop | Clase |
|----------|-------|---------|-------|
| Hora (HH:MM) | ✅ Visible (text-xs) | ✅ Visible (text-base) | - |
| Zona horaria | ❌ Oculto | ✅ Visible | `hidden sm:block` |
| Fecha (día/mes) | ❌ Oculto | ✅ Visible | `hidden sm:block` |
| Equipo local (bandera + nombre) | ✅ Visible (text-xs) | ✅ Visible (text-xs) | - |
| Marcador (inputs) | ✅ Visible (36x36px) | ✅ Visible (44x44px) | `w-9 h-9 sm:w-11 sm:h-11` |
| Equipo visitante (bandera + nombre) | ✅ Visible (text-xs) | ✅ Visible (text-xs) | - |
| Estadio/Ciudad | ❌ Oculto | ✅ Visible | `hidden md:block` |

**Pills de equipo:**
```tsx
// Equipo con datos (team real)
<div className="bg-white rounded-full px-2 py-1 sm:px-3 sm:py-1.5 inline-flex items-center gap-1.5 sm:gap-2 min-w-0">
  <Flag team={homeTeam} size={14} />
  <span className="text-xs font-extrabold text-slate-900 uppercase tracking-tight truncate">
    {homeLabel}
  </span>
</div>

// Equipo por definir (placeholder)
<div className="bg-white/10 rounded-full px-2 py-1 sm:px-3 sm:py-1.5 text-xs text-white/50 font-bold uppercase truncate">
  {homeLabel}
</div>
```

**Truncamiento:**
- Los nombres de equipos usan `truncate` para no romper el layout
- En móvil, el espacio es limitado pero los nombres SIEMPRE son visibles
- Prioridad: bandera → nombre → estadio (oculto en móvil)

**Inputs de marcador:**
- Móvil: `36x36px` (`w-9 h-9`)
- Desktop: `44x44px` (`w-11 h-11`)
- Clase base: `score-input` (definida en `globals.css`)
- Siempre con `inputMode="numeric"` para teclado numérico en móvil

**Inputs y selects estándar:**
- Clase base: `.input` (definida en `globals.css`)
- Aplica a `<input>`, `<textarea>` y `<select>`
- Estilos: fondo oscuro `bg-white/5`, borde `border-white/15`, texto `text-white`
- Las opciones (`<option>`) heredan visibilidad del navegador

```tsx
<input type="text" className="input" />
<select className="input">
  <option value="1">Opción 1</option>
  <option value="2">Opción 2</option>
</select>
```

**Para ajustes de tamaño:** Combinar `.input` con clases de Tailwind:
```tsx
<select className="input text-xs">  {/* Select pequeño */}
<input className="input w-20" />    {/* Input angosto */}
```

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

### Contenedor estándar (obligatorio)

**⚠️ REGLA CRÍTICA:** Todas las páginas DEBEN usar el contenedor global definido en `layout.tsx`. **NO** agregues contenedores `max-w-*` adicionales en el JSX de las páginas.

**Contenedor global:**
El `layout.tsx` define el contenedor principal:
```tsx
<main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-6">
  {children}
</main>
```

**Qué significa:**
- `max-w-7xl` — Ancho máximo de 80rem (1280px)
- `mx-auto` — Centrado horizontal
- `px-4 sm:px-6 lg:px-8` — Padding horizontal responsivo (16px → 24px → 32px)
- `py-6` — Padding vertical de 1.5rem
- `pb-24 md:pb-6` — Padding bottom extra en mobile para el BottomNav

**El Navbar también usa el mismo contenedor:**
```tsx
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
```

**Excepción única:**
Solo usa contenedores más pequeños (`max-w-2xl`, `max-w-3xl`) para **elementos específicos** dentro de una página, como:
- Formularios de login/signup
- Cards centrados
- Texto largo que necesita líneas más cortas para legibilidad

**Ejemplo correcto:**
```tsx
// ❌ MAL — duplica contenedor
export default function MyPage() {
  return (
    <div className="max-w-5xl mx-auto px-4">  {/* NO HACER */}
      <PageHeader title="..." />
    </div>
  )
}

// ✅ BIEN — usa contenedor del layout
export default function MyPage() {
  return (
    <div>
      <PageHeader title="..." />
      {/* Contenido usa automáticamente el max-w-7xl del layout */}
    </div>
  )
}

// ✅ BIEN — contenedor específico para un elemento
export default function LoginPage() {
  return (
    <div className="max-w-md mx-auto">  {/* OK para centrar form */}
      <form>...</form>
    </div>
  )
}
```

### Estabilización del layout (prevenir saltos visuales)

**Problema:** Al navegar entre páginas con distinto contenido (cortas vs largas), la scrollbar aparece/desaparece causando un "salto" lateral del contenido.

**Solución implementada en `globals.css`:**
```css
html {
  scrollbar-gutter: stable;
}
```

Esto **reserva espacio para la scrollbar siempre**, incluso en páginas cortas, eliminando el layout shift.

**Navegación sin recarga:**
- **SIEMPRE** usa `<Link>` de `next/link` para navegación interna
- **NUNCA** uses `<a href="...">` para rutas internas

```tsx
// ❌ MAL — recarga la página completa
<a href="/predictions">Pronósticos</a>

// ✅ BIEN — navegación instantánea sin recarga
import Link from 'next/link'
<Link href="/predictions">Pronósticos</Link>
```

### Landing Page - Hero Full-Width

**Caso especial:** La landing page (`app/page.tsx`) requiere un Hero de ancho completo (edge-to-edge) que rompe con el contenedor estándar del layout.

**Técnica implementada:**
```tsx
// Usuario invitado: Landing completa
return (
  <div className="-mx-4 sm:-mx-6 lg:-mx-8 -my-6 bg-navy-deepest">
    {/* Hero Section - Full Width */}
    <section className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      {/* Background Image con overlay */}
      <div className="absolute inset-0 z-0 w-full">
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/images/landing/hero.jpg)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy-deepest/80 via-navy-deepest/60 to-navy-deepest" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 text-center max-w-4xl px-4 py-20">
        {/* ... */}
      </div>
    </section>
    
    {/* Resto de secciones con padding normal */}
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* ... */}
      </div>
    </section>
  </div>
)
```

**Explicación:**
1. **Wrapper con márgenes negativos:** `-mx-4 sm:-mx-6 lg:-mx-8 -my-6` cancela el padding del `<main>` del layout, permitiendo que el Hero llegue a los bordes de la pantalla
2. **Hero con `w-full`:** Asegura que el Hero ocupe todo el ancho disponible (100vw)
3. **Background con `object-cover`:** Imagen de fondo se estira sin deformarse usando `bg-cover bg-center`
4. **Content centrado:** El contenido del Hero mantiene un `max-w-4xl` para legibilidad, pero el fondo es edge-to-edge
5. **Secciones siguientes:** Usan `px-4` para respetar márgenes laterales y `max-w-7xl mx-auto` para centrarse

**Imágenes de la landing:**
- `hero.jpg` — Hero principal (usar `.jpg` para fondos grandes)
- `estadio.jpg` — Sección seguridad (usar `.jpg` para fondos grandes)
- `paso1.png`, `paso2.png`, `paso3.png`, `paso4.png` — Cards de pasos (usar `.png` para elementos con transparencia o alta definición)
- `trofeo.png` — Footer (usar `.png` para logos/iconos)

**Textos oficiales:**
- Hero: "VIVE EL MUNDIAL A TU MANERA" (dos líneas con `<br />`)
- Footer: "VIVE EL MUNDIAL A TU MANERA" (mayúsculas con `font-bold uppercase tracking-wider`)

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
