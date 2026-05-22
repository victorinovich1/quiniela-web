# Style guide — Diseño y código

## Diseño visual: FIFA Dark

Inspirado en gráficos oficiales del Mundial 2026: fondo navy oscuro, glow sutiles, equipos en pills blancos con bandera, tipografía bold mayúscula, acento verde FIFA.

## Formato de Imágenes: WebP Obligatorio

**Estándar:** Todas las imágenes del proyecto usan formato **WebP** para optimización de tamaño.

### Beneficios

- **Reducción de tamaño**: ~30-50% menor que PNG/JPG equivalente
- **Calidad visual**: Sin pérdida perceptible de calidad
- **Compatibilidad**: Soportado en todos los navegadores modernos

### Uso en el Proyecto

| Directorio | Cantidad | Uso |
|------------|----------|-----|
| `/public/images/avatars/permanentes/` | 39 avatares | Categoría básica desbloqueada |
| `/public/images/avatars/especiales/` | 12 avatares | Desbloqueable por desempeño |
| `/public/images/avatars/premium/` | 12 avatares | Desbloqueable por desempeño |
| `/public/images/avatars/leyendas/` | 12 avatares | Desbloqueable por desempeño |
| `/public/images/avatars/` | 1 default.webp | Fallback si avatar no existe |
| `/public/images/` | hero-*.webp | Landing page |

**Total:** 75 avatares + 1 default + imágenes de landing

### Componente de Avatares

```typescript
// lib/avatars.ts
export const AVATAR_PATHS = {
  permanent: (id: number) => `/images/avatars/permanentes/${id}.webp`,
  special: (id: number) => `/images/avatars/especiales/${id}.webp`,
  premium: (id: number) => `/images/avatars/premium/${id}.webp`,
  legend: (id: number) => `/images/avatars/leyendas/${id}.webp`,
  default: '/images/avatars/default.webp',
}
```

### Construcción Dinámica de Paths

En `leaderboard` view y componentes:

```typescript
const avatarPath = avatarPermId && avatarCategory
  ? `/images/avatars/${avatarCategory}/${avatarPermId}.webp`
  : '/images/avatars/default.webp'
```

**Fallback:** Si la imagen falla al cargar, se muestra `default.webp` automáticamente via `onError` handler.

### Conversión de Imágenes Existentes

Para convertir PNG/JPG a WebP:

```bash
# Con ImageMagick
magick convert input.png -quality 85 output.webp

# Con cwebp (Google)
cwebp -q 85 input.png -o output.webp
```

**Calidad recomendada:** 80-90 para avatares, 75-85 para imágenes decorativas.

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

### Carrusel de Avatares

**Componente:** `app/profile/ProfileClient.tsx` → `AvatarTierSection`

Carrusel horizontal con scroll snap para selección de avatares con gamificación por niveles.

#### Características

**Scroll Horizontal:**
- `overflow-x-auto scroll-smooth snap-x snap-mandatory`
- `scrollbar-hide` en móvil, `scrollbar-styled` en desktop (md:)
- Scroll snap cada avatar: `snap-center`

**Navegación con Flechas (Desktop):**
- ChevronLeft / ChevronRight de `lucide-react`
- Posicionados `absolute left-0` y `right-0` con `top-1/2 -translate-y-1/2`
- Fondo: `bg-navy-dark/80 backdrop-blur-sm`
- Borde: `border border-white/10`
- Color: `text-fifaGreen`
- Hover: `hover:bg-navy-dark hover:scale-110`
- Visibilidad: `hidden md:flex` + `opacity-0 group-hover:opacity-100`
- Click: Scroll 300px smooth

**Navegación con Rueda del Mouse:**
```typescript
onWheel={(e) => {
  if (e.deltaY !== 0) {
    e.currentTarget.scrollLeft += e.deltaY
  }
}}
```
- Convierte scroll vertical a horizontal
- Sin `preventDefault` para evitar warnings de passive listeners
- Clase `touch-pan-y` para permitir gestos táctiles

**Scroll Buttons State:**
```typescript
const [canScrollLeft, setCanScrollLeft] = useState(false)
const [canScrollRight, setCanScrollRight] = useState(false)

const updateScrollButtons = () => {
  if (!containerRef.current) return
  const { scrollLeft, scrollWidth, clientWidth } = containerRef.current
  setCanScrollLeft(scrollLeft > 10)
  setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
}
```
- Botones disabled cuando no hay más scroll en esa dirección
- Umbral de 10px para evitar flickering

**Padding del Contenedor:**
- `px-10 md:px-12` — Espacio extra para que las flechas no tapen los avatares

#### Avatares Individuales

**Estructura:**
```tsx
<button
  className={cn(
    "flex-shrink-0 w-20 h-20 rounded-full overflow-hidden transition-all snap-center",
    "border-4",
    isSelected ? "border-fifaGreen scale-110" : "border-transparent",
    isUnlocked ? "opacity-100 hover:scale-105" : "opacity-40 cursor-not-allowed"
  )}
>
  <img
    src={`/images/avatars/${category}/${avatar.id}.webp`}
    alt={`Avatar ${avatar.id}`}
    className="w-full h-full object-cover"
  />
  {isSelected && (
    <div className="absolute top-0 right-0 bg-fifaGreen rounded-full p-1">
      <Check size={12} className="text-navy-deepest" />
    </div>
  )}
  {!isUnlocked && (
    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
      <Lock size={24} className="text-white/80" />
    </div>
  )}
</button>
```

**Estados Visuales:**
- **Seleccionado**: Borde verde `border-fifaGreen` + scale 110% + checkmark verde
- **Bloqueado**: Opacidad 40% + candado 🔒 + cursor-not-allowed
- **Hover desbloqueado**: Scale 105%

#### Texto de Requisitos

Debajo del carrusel:

```tsx
<p className="text-xs text-white/50 text-center mt-2">
  Requiere de {req_pts} ptos o acertar {req_exact} marcadores exactos
</p>
```

#### Scrollbar Estilizado (CSS)

```css
/* globals.css */
.scrollbar-styled {
  scrollbar-color: rgba(52, 211, 153, 0.5) transparent;
  scrollbar-width: thin;
}

.scrollbar-styled::-webkit-scrollbar {
  height: 8px;
}

.scrollbar-styled::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-styled::-webkit-scrollbar-thumb {
  background-color: rgba(52, 211, 153, 0.5);
  border-radius: 4px;
}

@media (max-width: 768px) {
  .scrollbar-styled {
    scrollbar-width: none;
  }
  .scrollbar-styled::-webkit-scrollbar {
    display: none;
  }
}
```

### Badge de Estado en Vivo

Indicador visual para partidos que están actualmente en juego.

#### Variantes

**Variante Estándar (Predictions):**
```tsx
{getMatchStatus(match) === 'live' && (
  <div className="absolute -top-1 -right-1 bg-danger text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full animate-pulse">
    EN VIVO
  </div>
)}
```

**Variante Compacta (CompactMatchRow):**
```tsx
<div className="bg-danger text-white text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-sm">
  VIVO
</div>
```

**Variante Admin (Virtual):**
```tsx
<span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-fifaGreen/20 text-fifaGreen border border-fifaGreen/30">
  VIVO (Virtual)
</span>
```

#### Estilos Comunes

- **Color:** `bg-danger` (#f87171 rojo)
- **Texto:** `text-white uppercase font-bold/font-black`
- **Tamaño:** 8-10px según contexto
- **Animación:** `animate-pulse` para llamar la atención
- **Posición:** `absolute` en partidos, `inline` en admin

#### Lógica de Display

Usar función centralizada `getMatchStatus(match)`:

```typescript
import { getMatchStatus } from '@/lib/utils'

const status = getMatchStatus(match)  // 'finished' | 'live' | 'scheduled'

{status === 'live' && <LiveBadge />}
```

**Estado Virtual:** Si `kickoff_at <= now()` pero `status='scheduled'`, se muestra como 'live' con marcador 0-0.

### Layout de Doble Columna (Fase de Grupos)

**Componente:** `app/predictions/components/GroupStageTab.tsx`

Layout responsivo que muestra partidos del grupo a la izquierda y tabla de posiciones a la derecha.

#### Estructura Desktop

```tsx
<div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
  {/* Columna Izquierda: Partidos */}
  <div className="space-y-4">
    {groupMatches.map(match => (
      <CompactMatchRow key={match.id} match={match} />
    ))}
  </div>
  
  {/* Columna Derecha: Tabla sticky */}
  <div className="lg:sticky lg:top-6 lg:h-fit">
    <StandingsTable group={group} />
  </div>
</div>
```

#### Comportamiento Responsivo

**Mobile (< 1024px):**
- Stacked vertical: Partidos arriba, tabla abajo
- `grid-cols-1`
- Tabla no es sticky

**Desktop (>= 1024px):**
- Lado a lado: Partidos izquierda (1fr), tabla derecha (300px)
- `grid-cols-[1fr_300px]`
- Tabla sticky con `lg:sticky lg:top-6 lg:h-fit`
- Gap de 1.5rem entre columnas

#### Tabla de Posiciones

**Estructura:**
```tsx
<div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-4">
  <h3 className="text-sm font-black uppercase tracking-wider text-fifaGreen mb-3">
    Tabla Grupo {group}
  </h3>
  
  <table className="w-full text-xs">
    <thead>
      <tr className="text-white/50 uppercase text-[10px] border-b border-white/10">
        <th className="text-left pb-2">POS</th>
        <th className="text-left pb-2">EQUIPO</th>
        <th className="text-center pb-2">PJ</th>
        <th className="text-center pb-2">PTS</th>
      </tr>
    </thead>
    <tbody>
      {standings.map((team, idx) => (
        <tr key={team.id} className="border-b border-white/5 last:border-0">
          <td className="py-2 text-white/70">{idx + 1}</td>
          <td className="py-2">
            <div className="flex items-center gap-1.5">
              <Flag team={team} size={12} />
              <span className="text-white font-bold truncate">{team.name}</span>
            </div>
          </td>
          <td className="text-center text-white/70">{team.played}</td>
          <td className="text-center text-fifaGreen font-bold">{team.points}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

#### Ventajas del Layout

1. **Contexto completo:** Usuario ve partidos y tabla simultáneamente
2. **Sticky table:** Tabla siempre visible mientras scrollea partidos
3. **Responsive:** Funciona perfecto en mobile (stacked) y desktop (side-by-side)
4. **Compacto:** `CompactMatchRow` optimizado para este layout (elimina decoración innecesaria)

### Timestamp en Vivo

**Componente:** `components/LiveTimestamp.tsx`

Muestra la hora actual del usuario, actualizada cada minuto.

#### Implementación

```typescript
'use client'

import { useState, useEffect } from 'react'

export default function LiveTimestamp() {
  const [time, setTime] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
      }))
    }
    
    updateTime() // Primera actualización inmediata
    const interval = setInterval(updateTime, 60000) // Cada minuto
    
    return () => clearInterval(interval)
  }, [])

  return <span className="text-white/60">{time}</span>
}
```

#### Uso

Típicamente en subtítulo de `PageHeader`:

```tsx
<PageHeader
  label="Clasificación general"
  title="Ranking"
  subtitle={<>Actualizado: <LiveTimestamp /></>}
/>
```

**Resultado visual:** "Actualizado: 14:32"

#### Ventajas

- **Sin hidratación:** Inicializa vacío, actualiza en cliente
- **Bajo overhead:** Solo re-render cada 60 segundos
- **UX mejorada:** Usuario ve que el ranking está "vivo"

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

## Componente NotificationBell

**Ubicación:** `components/NotificationBell.tsx` (integrado en `Navbar.tsx`)

### Diseño Visual

```
┌────────────────────────────────────────┐
│  🔔  [5]  ← Badge rojo con contador    │
└────┬───────────────────────────────────┘
     │ Al hacer click, abre dropdown:
     ▼
┌──────────────────────────────────────────┐
│ NOTIFICACIONES                   [header]│
├──────────────────────────────────────────┤
│ ⚽ Partido finalizado         🟢          │
│ MEX 2-1 ARG                              │
│ 22 may 14:30                             │
├──────────────────────────────────────────┤
│ 📢 Actualización importante              │
│ El sistema está funcionando...           │
│ 21 may 10:15                             │
├──────────────────────────────────────────┤
│                  ...                      │
├──────────────────────────────────────────┤
│ Marcar todas como leídas        [footer]│
└──────────────────────────────────────────┘
```

### Estilo

**Badge (contador no leídas):**
- Círculo rojo: `bg-danger`
- Tamaño: `w-5 h-5`
- Posición: `absolute -top-1 -right-1`
- Texto: `text-xs font-bold`
- Máximo: Si > 9, muestra "9+"

**Dropdown:**
- Ancho fijo: `w-80`
- Fondo: `bg-navy-deep`
- Borde: `border border-white/15`
- Sombra: `shadow-xl`
- Altura máxima: `max-h-96` con scroll interno

**Header:**
- Fondo: `bg-navy-medium`
- Padding: `px-4 py-3`
- Texto: `font-bold uppercase tracking-wider text-sm`

**Items de notificación:**
- Padding: `p-3`
- Borde inferior: `border-b border-white/10`
- Hover: `hover:bg-navy-medium/60`
- No leídas: `bg-navy-medium/20` (fondo más claro)
- **Borde lateral por tipo:**
  - `match_update`: `border-l-4 border-fifaGreen`
  - `ranking_update`: `border-l-4 border-yellow-400`
  - `info`: `border-l-4 border-blue-400`
  - `success`: `border-l-4 border-fifaGreen`
  - `warning`: `border-l-4 border-yellow-500`
  - `error`: `border-l-4 border-danger`

**Indicador de no leída:**
- Círculo verde: `w-2 h-2 bg-fifaGreen rounded-full`
- Posición: Esquina superior derecha del item

**Footer (Marcar todas):**
- Fondo: `bg-navy-medium`
- Botón: `text-xs text-fifaGreen hover:text-fifaGreen/80`
- Estilo: `font-bold uppercase tracking-wider`

### Interactividad

**Campana:**
- Color default: `text-white/60`
- Hover: `text-white`
- Transición: `transition-colors`

**Notificaciones:**
- Click en item → marca como leída (UPDATE) y navega a `link` si existe
- Click en "Marcar todas" → UPDATE masivo de todas las no leídas

**Audio:**
- Archivo: `/sounds/notification.mp3`
- Volumen: 50% (`audioRef.current.volume = 0.5`)
- Se activa solo después del primer click en campana (bypass de autoplay block)
- Solo reproduce si `notifications_enabled && notifications_sound`

### Realtime

**Suscripción:**
```typescript
const channel = supabase
  .channel('notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${userId}`,
  }, (payload) => {
    // Actualizar estado + reproducir sonido
  })
  .subscribe()
```

**Cleanup:** El canal se desuscribe en el `return` del `useEffect`

### Accesibilidad

- Botón tiene `aria-label="Notificaciones"`
- Badge tiene contador visible para screen readers
- Dropdown se cierra al hacer click fuera (event listener `mousedown`)

### Responsive

**Desktop:** Campana visible en `Navbar` junto a botón "Salir"

**Mobile:** Campana visible en mismo lugar (el `BottomNav` no la incluye)

**Nota:** El dropdown siempre abre alineado a la derecha (`absolute right-0`)

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
