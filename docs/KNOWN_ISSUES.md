# Known issues / TODO

## 🔴 CRÍTICO - Ranking Caído

**Estado:** Migración 080 lista para aplicar (2026-06-29)

**Problema:**
- Vista `leaderboard` rota por falta de columna `last_known_rank` en `profiles`
- Scoring injusto en eliminatorias: no premia empate + ganador correcto

**Solución:** Aplicar `migrations/080_fix_knockout_scoring_logic.sql` en Supabase SQL Editor

**Qué arregla:**
1. Agrega `last_known_rank` a `profiles` para tracking de tendencias
2. Recrea `match_scores` con lógica corregida de scoring KO
3. Recrea `leaderboard` con columnas `previous_rank` y `rank_movement`
4. Crea función `update_ranking_memory()` para snapshots automáticos
5. Grants permisos a `service_role` y `authenticated`

---

## Pendientes de funcionalidad

### Alta prioridad
- [ ] **Dominio verificado en Resend:** Actualmente los emails de recuperación de contraseña solo llegan al email verificado en Resend (el dueño del proyecto). Para que funcione con todos los participantes, se necesita:
  1. Verificar un dominio propio en Resend (ej. `quiniela2026.com`)
  2. Configurar DNS (SPF, DKIM)
  3. Actualizar `NEXT_PUBLIC_SITE_URL` en variables de entorno
  
  **Workaround actual:** El admin puede enviar recovery emails manualmente desde Supabase Dashboard → Auth → Users → "Send password recovery".

### Media prioridad
- [ ] **Auto-sync depende de configuración:** ya existe `GET /api/cron/sync-results`, pero si faltan `FOOTBALL_DATA_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` o `CRON_SECRET`, no sincroniza.
- [ ] **No hay límite de quinielas por usuario.** Un usuario podría crear 100 entries. Conviene poner un máximo (ej. 5).
- [ ] **No hay paginación en /leaderboard.** Con +100 entries la página se vuelve larga.

### Baja prioridad
- [ ] **No hay vista bracket de eliminatorias.** Solo tabs por fase.
- [ ] **No hay export de datos.** Si el admin quiere descargar todos los pronósticos para análisis, no hay endpoint.
- [ ] **El campo `flag_emoji` en teams** es legacy y no se usa.
- [ ] **`profiles.alias` y `profiles.paid` son legacy** después de migrar a entries.

## Bugs conocidos

- **Borrar una entry borra sus pronósticos** (CASCADE). Es intencional, pero puede sorprender al usuario.

## Completados (histórico)

- [x] **Admin: Cambio Manual de Contraseña** (2026-07-04): Nueva funcionalidad para que el admin pueda cambiar contraseñas de usuarios directamente desde la web. Endpoint `/api/admin/update-password` con validación de rol admin y uso de service_role key. UI en ParticipantsTab con botón 🔑 por usuario que abre modal de cambio de contraseña. Validaciones: longitud mínima 6 caracteres, solo admin puede ejecutar, acción logueada en consola del servidor. Modal con input de texto plano y confirmación. Útil cuando fallan los correos de recuperación o usuarios no tienen acceso a email.
- [x] **Bracket: Perfección Estética con Conectores Visuales** (2026-06-30): Refinamiento completo del bracket para efecto árbol profesional. Contenedor con altura mínima fija (850px) y gap horizontal aumentado a 6 unidades. Columnas con justify-around sobre flex-1 para distribución vertical automática. Tarjetas con altura fija h-20 para alineación exacta. Conectores visuales: líneas horizontales finas (w-6 h-[1px] bg-white/10) desde/hacia cada partido usando pseudo-elementos absolutos. Columnas 2-3 con conectores de entrada (-left-6), columnas 5-6 con conectores de salida (-right-6), columna central con conectores bilaterales. Simetría central perfecta con justify-center en columna 4. TeamRow compacto (py-1, text-[9px], flag size 10). FinalMatch destacado (min-h-[96px], border-gold, glow effect). Spacing vertical calculado por fase: R32 (space-y-2), R16 (space-y-4), QF (space-y-8), SF-Final (space-y-6). Layout profesional tipo diagrama técnico FIFA.
- [x] **Bracket: Reconstrucción Total con Llaves Simétricas** (2026-06-30): Reorganización arquitectónica completa del bracket de eliminatorias. Sistema de 7 columnas convergentes al centro. Mapeo por IDs específicos (no orden numérico) para seguir flujo lógico de llaves: Col1(R32: 74,77,73,75,83,84,81,82) → Col2(R16: 89,90,93,94) → Col3(QF: 97,98) → Col4(Centro: SF1-101, Final-104, SF2-102, 3er-103) → Col5(QF: 99,100) → Col6(R16: 91,92,95,96) → Col7(R32: 76,78,79,80,86,88,85,87). Tarjetas estándar 150px con componente MatchCard unificado. Final destacada 180px con borde dorado y glow. Alineación vertical automática con justify-around. Indicadores LIVE (borde rojo parpadeante), PENALES. Ganadores en text-fifaGreen. Overflow-x-auto para responsividad móvil. Grid profesional simétrico FIFA-style.
- [x] **Bracket: Flujo Lógico Corregido** (2026-06-30): Reorganización completa del bracket para que las llaves coincidan con el flujo real de ganadores. Partidos agrupados correctamente: R32 [73-80] → R16 [89-92] → QF [97-98] → SF 101 (llave izquierda), R32 [81-88] → R16 [93-96] → QF [99-100] → SF 102 (llave derecha). Alineación vertical con marginTop calculado. Números de partido (M73, M89, etc.) en headers. Leyenda desplegable del flujo completo. Agrupación visual con espaciado cada 2 partidos R32.
- [x] **Bracket Compacto y Profesional** (2026-06-30): Refactorización completa del bracket de eliminatorias. Layout simétrico de 5 columnas con grid CSS profesional. 4 tipos de tarjetas (MicroMatch para R32, MiniMatch para R16/QF, CompactMatch para SF, FinalMatch destacada). Tamaños ultra compactos: R32 24px, R16/QF 32px, SF 40px, Final 48px. R32 usa códigos ISO en vez de nombres. Conectores visuales sutiles. Scroll horizontal optimizado. Estilo esquema técnico FIFA.
- [x] **Bracket de Eliminatorias en /tournament** (2026-06-30): Implementado cuadro visual simétrico de eliminatorias con diseño de videojuego deportivo. Dieciseisavos en extremos, Final en el centro. Tabs para alternar entre Fase de Grupos y Bracket. Componente KnockoutBracket.tsx con líneas de conexión, highlights para semifinales y final, indicadores de ganador, estado EN VIVO, y penales. Estilo FIFA dark con gradientes gold/fifaGreen.
- [x] **Visualización de Bandera Ko_Winner en Ranking** (2026-06-29): Mini-bandera del equipo elegido para avanzar ahora aparece bajo el badge del pronóstico cuando el usuario predijo empate en eliminatorias, independientemente de si ganó o perdió puntos. Log de depuración mejorado para verificar datos de ko_winner_team_id.
- [x] **Transparencia de Puntos en Eliminatorias** (2026-06-29): Mejorada visualización de aciertos en el ranking. Badges de pronósticos ahora distinguen entre fase de grupos y eliminatorias, mostrando correctamente puntos por ganador en penales. Tooltips informativos ('Ganador por penales', 'Marcador exacto', etc.). Color verde FIFA consistente con sombra sutil.
- [x] **Sistema de Avatares por Niveles** (2026-05-12): Sistema completo de gamificación con 4 categorías (Básicos, Especiales, Premium, Leyendas) y desbloqueo basado en desempeño. Incluye carrusel con navegación por flechas, scrollbar estilizado, y requisitos configurables desde Admin.
- [x] **Optimización de Imágenes a WebP** (2026-05-12): Migración completa de todos los avatares (75 imágenes) y assets de landing page a formato WebP. Reducción de ~30-50% en tamaño de archivos sin pérdida perceptible de calidad.
- [x] **Estado Virtual de Partidos** (2026-05-12): Implementación de lógica de estado virtual donde partidos se marcan como "EN VIVO" exactamente a su `kickoff_at` sin depender de la API. Marcador 0-0 placeholder hasta que la API sincronice datos reales.
- [x] **Sincronización Híbrida de Resultados** (2026-05-12): Sistema de 3 capas: Vercel Cron diario, Cron-job.org cada 10 min, y botón manual en Admin. Endpoint `/api/cron/sync-results` con autenticación vía CRON_SECRET.
- [x] **Página de Resumen de Resultados** (2026-05-12): Nueva ruta `/predictions/summary` con vista de solo lectura de todos los partidos organizados por fase.
- [x] **Estadios Oficiales FIFA** (2026-05-12): Migración 048 con los 104 estadios oficiales del Mundial 2026 poblados en la tabla `matches`. Visualización en `CompactMatchRow` (ciudad) y `FifaMatchRow` (estadio completo).
- [x] **Limpieza de Errores de Hidratación** (2026-05-12): Eliminados todos los warnings de hidratación moviendo inicializaciones de `Date.now()` a `useEffect`. Componentes: AdminClient, ProfileClient.
- [x] **Fix de Passive Event Listeners** (2026-05-12): Removido `preventDefault` de onWheel handlers. Añadida clase CSS `touch-pan-y` para permitir gestos táctiles sin warnings.
- [x] **Limpieza de Console.log** (2026-05-12): Eliminados todos los `console.log` residuales del código de producción. Verificado vía grep search.
- [x] **Favicon SVG** (2026-05-12): Añadido favicon SVG con emoji ⚽ para eliminar error 404 de `favicon.ico`.
- [x] **LiveTimestamp Component** (2026-05-12): Componente que muestra hora actual actualizada cada minuto sin problemas de hidratación. Usado en `/leaderboard`.
- [x] **Layout de Doble Columna para Grupos** (2026-05-12): Grid responsivo en `GroupStageTab` con partidos a la izquierda y tabla de posiciones sticky a la derecha en desktop.
- [x] **Sistema de Bloqueo Dual** (2026-05-11): Bloqueo granular por partido (15 min antes de kickoff) para marcadores individuales. Bloqueo global solo afecta podio y borrado de jugadas.
- [x] **Country Code en Perfiles** (2026-05-11): Añadida columna `country_code` a `profiles` para permitir a usuarios seleccionar su país de origen. Visualizado con bandera en ranking.
- [x] **Fix de Unicidad de Avatares** (2026-05-11): Migración 047 que permite el mismo `avatar_perm_id` en diferentes `avatar_category`. Constraint compuesto sobre ambas columnas.
- [x] **Flujo de Recuperación de Contraseña** (2026-05-04): Implementado flujo completo `/forgot-password` → email → `/reset-password`. Detección automática de URL (producción/local) usando `window.location.origin`. Mensajes de UX mejorados con mejor manejo de errores y enlaces expirados.
- [x] **Página de Perfil de Usuario** (2026-05-04): Agregada ruta `/profile` con formulario para editar nombre de pantalla y cambiar contraseña. Accesible desde Navbar (desktop) y BottomNav (mobile).
- [x] **Banderas en Admin** (2026-05-04): `AdminClient.tsx` muestra `<Flag />` junto a todos los nombres de equipos en las pestañas Equipos y Resultados. Emoji de banderas removido de la UI.
- [x] **Terminología 'Mis Quinielas'** (2026-05-09): El término 'jugadas' fue reemplazado por 'quinielas' en toda la aplicación (navegación, mensajes, documentación) para mayor claridad conceptual. El modelo de datos (tabla `entries`) permanece sin cambios.
- [x] **Bloqueo de eliminación de entries** (2026-05-04): Migración `018_lock_entries_deletion.sql` aplicada. RLS de `entries` DELETE bloquea a participantes tras el inicio del primer partido. Admin conserva permiso total.
- [x] **Auditoría de Seguridad y Robustez** (2026-06-03): Resueltos 5 hallazgos críticos:
  - **C-01 (SSR Crash)**: Protegido `window.innerWidth` con `isMounted` en PredictionsClient para evitar crash en server-side rendering.
  - **C-02 (Supabase)**: Unificados imports de Supabase eliminando `await` innecesarios en `createClient()` (función síncrona). Consolidado a un único import `createClient` sin alias.
  - **C-03/C-04 (Cron)**: Registrado `/api/cron/check-reminders` en vercel.json. Ajustados horarios de cron a 05:00 UTC (respaldo diario, frecuencia principal vía Cron-job.org).
  - **C-05 (Roles)**: Reforzada seguridad en `/api/admin/sync-results` (solo admin, rechaza manager). Endpoint `/api/admin/notifications` permite admin+manager por diseño.
  - **A-03 (Non-null assertions)**: Eliminadas todas las assertions `!` en Pronóstico Express. Validaciones reales para `home_team_id`/`away_team_id` nulos con fallback a 'TBD'.

## Decisiones de diseño que podrían revisarse

- **Match number** no coincide exactamente con numeración pública FIFA histórica; no afecta cálculos internos.
- **El sistema admite múltiples quinielas por usuario pero no múltiples pools.** Si quisieras varios grupos/quinielas paralelas con participantes distintos, habría que añadir tabla `pools` y FK en `entries`. Actualmente todos participan en una única quiniela global.

## Compatibilidad

- **Probado en:** Chrome, Firefox, Safari (desktop) y Chrome iOS/Android.
- **No probado en:** IE (no soportado), navegadores antiguos.

## Riesgos operativos

- **Plan free de Supabase** se pausa tras 7 días sin actividad.
- **flagcdn.com** es servicio de terceros.
- **Vercel Hobby** tiene límite de egress mensual.
