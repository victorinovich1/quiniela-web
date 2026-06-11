# Fix: Input de Cierre Global en Admin

## Problema Resuelto

El selector de fecha "Cierre Global" en el Admin mostraba la hora incorrecta debido a que **no convertía la hora UTC de la base de datos a la zona horaria local del usuario**.

### Comportamiento Anterior (INCORRECTO)

```typescript
// ❌ ANTES: Mostraba hora UTC como si fuera local
value={s.lock_at ? s.lock_at.slice(0, 16) : ''}

// Si la BD tiene: "2026-06-11T19:00:00Z" (19:00 UTC)
// El input mostraba: "2026-06-11T19:00"
// Pero el navegador lo interpretaba como 19:00 LOCAL → ¡Desfase!
```

### Comportamiento Actual (CORRECTO)

```typescript
// ✅ AHORA: Convierte UTC a zona local
value={s.lock_at ? toLocalDateTimeInput(s.lock_at) : ''}

// Si la BD tiene: "2026-06-11T19:00:00Z" (19:00 UTC)
// toLocalDateTimeInput() convierte a zona local:
//   - En CDMX (UTC-4): "2026-06-11T15:00"
//   - En Madrid (UTC+2): "2026-06-11T21:00"
// El usuario ve la hora correcta en su zona
```

## Flujo Completo de Datos

### 1. Base de Datos → Input (Cargar)

```
BD almacena: "2026-06-11T19:00:00Z" (UTC)
       ↓
toLocalDateTimeInput() convierte a zona local del navegador
       ↓
Input muestra: "2026-06-11T15:00" (si estás en UTC-4)
```

### 2. Input → Base de Datos (Guardar)

```
Usuario edita: "2026-06-11T15:00" (en su zona local)
       ↓
new Date("2026-06-11T15:00") interpreta como hora local
       ↓
.toISOString() convierte a UTC
       ↓
BD guarda: "2026-06-11T19:00:00Z" (UTC)
```

### 3. Countdown (Visualización)

```
BD tiene: "2026-06-11T19:00:00Z" (UTC)
       ↓
parseUTCDate() asegura interpretación UTC
       ↓
target.getTime() - Date.now() = diferencia en milisegundos
       ↓
Countdown muestra: "Xd Xh Xm Xs" (idéntico para todos los usuarios)
```

## Funciones Utilizadas

### `toLocalDateTimeInput(iso: string): string`

Convierte fecha UTC a formato `YYYY-MM-DDTHH:mm` en hora local del navegador.

```typescript
export function toLocalDateTimeInput(iso: string): string {
  const d = new Date(iso) // Interpreta UTC, convierte a local automáticamente
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
```

### `parseUTCDate(dateStr: string): Date | null`

Garantiza interpretación UTC de fechas de Supabase.

```typescript
export function parseUTCDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null
  
  // Si ya tiene 'Z' o timezone offset (+XX:XX), usar directo
  if (dateStr.endsWith('Z') || dateStr.includes('+')) {
    return new Date(dateStr)
  }
  
  // Si es formato "YYYY-MM-DD HH:MM:SS" sin timezone, agregar 'Z'
  const normalized = dateStr.replace(' ', 'T')
  return new Date(normalized + 'Z')
}
```

## Verificación Manual

### Test 1: Coherencia de Visualización

1. **En la Base de Datos**, verifica el valor exacto:
   ```sql
   SELECT lock_at FROM settings WHERE id = 1;
   -- Resultado: 2026-06-11 19:00:00+00
   ```

2. **En el Admin**, abre el panel de Configuración
   - Si estás en México (UTC-4): Debes ver **11 jun 2026 15:00**
   - Si estás en España (UTC+2): Debes ver **11 jun 2026 21:00**
   - Si estás en UTC: Debes ver **11 jun 2026 19:00**

3. **En Predictions**, verifica el countdown
   - Debe mostrar el tiempo exacto hasta esa hora UTC
   - Compara con: https://www.timeanddate.com/countdown/to?iso=20260611T19&p0=1440

### Test 2: Edición y Guardado

1. **En Admin**, cambia la hora a "11 jun 2026 18:00" (tu hora local)
2. Guarda el cambio
3. **En la BD**, verifica:
   ```sql
   SELECT lock_at FROM settings WHERE id = 1;
   ```
4. El valor debe ser UTC equivalente:
   - Si editaste en México (UTC-4): `2026-06-11 22:00:00+00`
   - Si editaste en España (UTC+2): `2026-06-11 16:00:00+00`

### Test 3: Countdown Preciso

1. Modifica `lock_at` a `now() + interval '2 hours'`:
   ```sql
   UPDATE settings SET lock_at = now() + interval '2 hours' WHERE id = 1;
   ```
2. Recarga `/predictions`
3. El countdown debe mostrar aproximadamente `0d 2h 0m 0s`
4. Recarga `/admin` → Settings
5. El input debe mostrar la hora local equivalente a "ahora + 2 horas UTC"

## Coherencia con Partidos Individuales

Los inputs de `kickoff_at` (partidos) **ya estaban usando la misma lógica**:

```typescript
// Inputs de partidos (CORRECTO desde siempre)
value={m.kickoff_at ? toLocalDateTimeInput(m.kickoff_at) : ''}
onChange={(e) => update(m.id, { kickoff_at: e.target.value ? new Date(e.target.value).toISOString() : null })}

// Input de lock_at (CORREGIDO ahora)
value={s.lock_at ? toLocalDateTimeInput(s.lock_at) : ''}
onChange={(e) => update('lock_at', e.target.value ? new Date(e.target.value).toISOString() : null)}
```

## Reglas de Oro

1. **La BD siempre almacena UTC** → Tipo `timestamptz` en PostgreSQL
2. **Los inputs muestran hora local** → `toLocalDateTimeInput()`
3. **Los countdowns usan tiempo absoluto** → `target.getTime() - Date.now()`
4. **Nunca offsets manuales** → JavaScript maneja la conversión automáticamente

---

**Commit:** 48367f7 — fix: Corregir input de Cierre Global (lock_at) en Admin
**Fecha:** 2026-06-11
