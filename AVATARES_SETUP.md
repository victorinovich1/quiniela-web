# 📢 Instrucciones para Organizar Avatares

El sistema de avatares ha sido simplificado. Ahora **todos** los avatares (incluyendo los que antes eran "de leyenda" o "de broma") deben estar en una sola carpeta.

## ✅ Estructura Requerida

```
/public/images/avatars/
  ├── default.png           ← Avatar por defecto (fallback)
  └── permanentes/          ← TODOS los avatares aquí
      ├── 1.png
      ├── 2.png
      ├── 3.png
      ...
      └── N.png
```

## 📋 Pasos para Configurar

1. **Mueve todas tus imágenes** a `/public/images/avatars/permanentes/`
   - Los avatares que antes estaban en `/bromas/` → ahora van a `/permanentes/`
   - El avatar `0.png` (rey) → ahora también va a `/permanentes/` con un número consecutivo
   - Renombra si es necesario para mantener numeración correlativa (1, 2, 3, 4...)

2. **Actualiza la configuración** en `lib/avatars.ts`:
   ```typescript
   export const TOTAL_AVATARS = 30  // ← Cambia este número
   ```
   
3. **Aplica la migración 040** en Supabase SQL Editor:
   - Abre: `migrations/040_simplify_avatars.sql`
   - Copia el contenido completo
   - Pégalo en Supabase Dashboard → SQL Editor → Run

## 🎯 Resultado

- El usuario #1 del ranking ya NO tiene avatar forzado
- Cada usuario elige su avatar permanente de la galería completa
- Los avatares siguen siendo únicos (UNIQUE constraint)
- Sin castigos, sin reseteos automáticos, sin complicaciones

## 🔧 Configuración Actual

Por defecto, el sistema está configurado para **20 avatares**.  
Si tienes más o menos, actualiza `TOTAL_AVATARS` en `lib/avatars.ts`.
