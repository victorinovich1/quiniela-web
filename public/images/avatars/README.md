# Avatares del Sistema de Identidad

Este directorio contiene las imágenes de avatares para la **Quiniela Mundial 2026**.

## Estructura de carpetas

```
/images/avatars/
  ├── default.png        # Avatar por defecto
  └── permanentes/       # Todos los avatares disponibles
      ├── 1.png
      ├── 2.png
      └── ... hasta N.png
```

## Archivos requeridos

### Avatar por Defecto
- **`default.png`** - Imagen de respaldo para usuarios sin avatar asignado

### Avatares Permanentes
Carpeta: **`permanentes/`**

Cada usuario puede elegir uno como su avatar permanente:
- `1.png`, `2.png`, `3.png`, ... hasta `N.png`

**Restricción:** Cada avatar es ÚNICO. Solo un usuario puede tener cada número.

## Configuración dinámica

El número de avatares se configura en **`lib/avatars.ts`**:

```typescript
export const TOTAL_AVATARS = 20  // Actualiza cuando agregues más
```

Cuando agregues más imágenes:
1. Añade los archivos PNG en `/permanentes/` con numeración consecutiva
2. Actualiza la constante `TOTAL_AVATARS` en `lib/avatars.ts`
3. Los componentes se ajustarán automáticamente

## Formato recomendado

- **Tamaño:** 256x256px (cuadrado)
- **Formato:** PNG con fondo transparente o sólido
- **Peso:** < 100KB por imagen

## Fallback

Si una imagen no se encuentra, el código muestra automáticamente `default.png` como fallback.
