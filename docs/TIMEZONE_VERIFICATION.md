# Verificación de Timezone — Cuenta Atrás Mundial 2026

## Problema Resuelto

Desfase de 1 hora en la cuenta atrás causado por interpretación inconsistente de fechas UTC.

## Solución Implementada

### 1. Función `parseUTCDate()` (lib/utils.ts)

Garantiza que TODAS las fechas de Supabase se interpreten como UTC:

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

### 2. Regla de Oro

**TODAS las fechas de la BD son UTC.**

- `settings.lock_at`: UTC
- `matches.kickoff_at`: UTC
- Comparaciones: `target.getTime() - Date.now()` (milisegundos absolutos)
- Visualización: `toLocaleTimeString()` ajusta automáticamente a TZ del usuario

### 3. Sin Offsets Manuales

❌ NUNCA: `new Date(fecha).getTime() + 3600000` (ajuste manual de 1 hora)
✅ SIEMPRE: `parseUTCDate(fecha).getTime()` → JavaScript maneja la zona del usuario

## Verificación Manual en BD

### Query SQL para verificar coherencia

Ejecuta esto en el SQL Editor de Supabase:

```sql
-- Verificar que lock_at coincida con el kickoff del partido M1
SELECT 
  'settings.lock_at' as fuente,
  lock_at as fecha_utc,
  lock_at AT TIME ZONE 'America/Mexico_City' as fecha_cdmx,
  lock_at AT TIME ZONE 'Europe/Madrid' as fecha_madrid
FROM settings
WHERE id = 1

UNION ALL

SELECT 
  'M1.kickoff_at' as fuente,
  kickoff_at as fecha_utc,
  kickoff_at AT TIME ZONE 'America/Mexico_City' as fecha_cdmx,
  kickoff_at AT TIME ZONE 'Europe/Madrid' as fecha_madrid
FROM matches
WHERE match_number = 1;
```

### Resultado esperado

| fuente | fecha_utc | fecha_cdmx | fecha_madrid |
|--------|-----------|------------|--------------|
| settings.lock_at | 2026-06-11 19:00:00+00 | 2026-06-11 13:00:00 | 2026-06-11 21:00:00 |
| M1.kickoff_at | 2026-06-11 19:00:00+00 | 2026-06-11 13:00:00 | 2026-06-11 21:00:00 |

**Ambas fechas deben ser idénticas.**

### Si hay discrepancia

Si `lock_at` y `kickoff_at` del M1 difieren, actualizar:

```sql
-- Opción A: Actualizar lock_at basándose en M1
UPDATE settings
SET lock_at = (SELECT kickoff_at FROM matches WHERE match_number = 1)
WHERE id = 1;

-- Opción B: Actualizar M1 basándose en lock_at (menos común)
UPDATE matches
SET kickoff_at = (SELECT lock_at FROM settings WHERE id = 1)
WHERE match_number = 1;
```

## Cómo Probar en Local

### 1. Test de parseUTCDate()

```javascript
// En la consola del navegador (Ctrl+Shift+J)
import { parseUTCDate } from '@/lib/utils'

// Test con formato típico de Supabase
parseUTCDate('2026-06-11 19:00:00') // → Date UTC
parseUTCDate('2026-06-11T19:00:00+00:00') // → Date UTC
parseUTCDate('2026-06-11T19:00:00Z') // → Date UTC

// Todos deben devolver el mismo timestamp
```

### 2. Test de Countdown

1. Abrir `/predictions`
2. Verificar cuenta atrás en el header
3. Comparar con: https://www.timeanddate.com/countdown/to?iso=20260611T19&p0=1440
4. Debe coincidir exactamente (días, horas, minutos, segundos)

### 3. Test de Bloqueo 15 Minutos

1. Modificar manualmente `kickoff_at` de un partido a `now() + interval '16 minutes'`:
   ```sql
   UPDATE matches SET kickoff_at = now() + interval '16 minutes' WHERE match_number = 1;
   ```
2. Verificar que el partido muestre el timer de cuenta atrás (≈16 min)
3. Cambiar a `now() + interval '14 minutes'`:
   ```sql
   UPDATE matches SET kickoff_at = now() + interval '14 minutes' WHERE match_number = 1;
   ```
4. Verificar que el partido se bloquee (inputs deshabilitados)

## Componentes Actualizados

### Countdown Principal
- `app/predictions/PredictionsClient.tsx` → `parseUTCDate(lockAt)`

### Countdown Express (15 min)
- `app/predictions/PredictionsClient.tsx` → `parseUTCDate(match.kickoff_at)`

### Bloqueo de Podio
- `app/profile/ProfileClient.tsx` → `parseUTCDate(lockAt)`

### Visualización de Hora
- `app/predictions/components/FifaMatchRow.tsx` → `parseUTCDate()` + `toLocaleTimeString()`
- `app/predictions/components/CompactMatchRow.tsx` → `parseUTCDate()` + `toLocaleTimeString()`

### Utilidades
- `lib/utils.ts` → `parseUTCDate()`, `getSecondsUntil()`, `isMatchLocked()`

## Resultado Final

✅ Cuenta atrás idéntica para todos los usuarios (México, España, Japón, etc.)
✅ Sin offsets manuales ni ajustes hardcodeados
✅ Bloqueo de 15 minutos preciso
✅ Visualización local correcta (cada usuario ve su zona horaria)

---

**Última actualización:** 2026-06-10
**Commit:** f6f5224 — fix: Blindar lógica de timezone con parseUTCDate() centralizado
