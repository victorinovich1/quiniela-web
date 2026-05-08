# Avatares del Sistema de Trono y Castigo

Este directorio contiene las imágenes de avatares para el **Sistema de Avatares** de la quiniela.

## Estructura de carpetas

```
/images/avatars/
  ├── 0.png              # Corona del Rey (#1)
  ├── default.png        # Avatar por defecto
  ├── permanentes/       # Avatares permanentes (21)
  │   ├── 1.png
  │   ├── 2.png
  │   └── ... hasta 21.png
  └── bromas/            # Avatares de castigo (10)
      ├── 1.png
      ├── 2.png
      └── ... hasta 10.png
```

## Archivos requeridos

### Avatar del Rey
- **`0.png`** - Corona o imagen especial para el usuario en puesto #1

### Avatares Permanentes (21)
Carpeta: **`permanentes/`**

Cada usuario puede elegir uno como su avatar permanente:
- `1.png`, `2.png`, `3.png`, ... hasta `21.png`

**Restricción:** Cada avatar permanente es ÚNICO. Solo un usuario puede tener cada número.

### Avatares de Broma (10)
Carpeta: **`bromas/`**

Usados por el Rey para "castigar" a otros usuarios:
- `1.png`, `2.png`, `3.png`, ... hasta `10.png`

**Nota:** Los castigos se limpian automáticamente cuando el próximo partido cambia a estado "live".

### Avatar por Defecto
- **`default.png`** - Imagen de respaldo para usuarios sin avatar asignado

## Configuración dinámica

El número de avatares se configura en **`lib/avatars.ts`**:

```typescript
export const TOTAL_PERM_AVATARS = 21  // Actualiza cuando agregues más
export const TOTAL_JOKE_AVATARS = 10  // Actualiza cuando agregues más
```

Cuando agregues más imágenes:
1. Añade los archivos PNG en la carpeta correspondiente
2. Actualiza las constantes en `lib/avatars.ts`
3. Los componentes se ajustarán automáticamente

## Formato recomendado

- **Tamaño:** 256x256px (cuadrado)
- **Formato:** PNG con fondo transparente
- **Peso:** < 50KB por imagen

## Fallback

Si una imagen no se encuentra, el código muestra automáticamente `default.png` como fallback.
