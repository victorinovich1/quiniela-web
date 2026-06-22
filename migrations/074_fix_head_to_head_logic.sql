-- =====================================================
-- 074 - Enfrentamiento Directo en Tablas de Posiciones
-- =====================================================

-- Nota: SQL no puede implementar fácilmente "enfrentamiento directo" como 4to criterio
-- porque requiere comparar equipos específicos 2 a 2.
-- 
-- Solución: Las views mantienen ordenamiento por pts → dg → gf → nombre
-- El frontend (lib/standings.ts y TournamentClient) aplica h2h cuando sea necesario.
--
-- Para official_group_standings y official_best_thirds:
-- La ordenación final se hace en el cliente (JavaScript) donde sí podemos
-- buscar el partido entre dos equipos empatados.

-- Esta migración documenta el cambio conceptual pero no modifica las views,
-- ya que SQL no soporta fácilmente la lógica de "buscar partido X vs Y"
-- dentro de un ORDER BY.

-- Las views existentes (073) ya están correctas para los primeros 3 criterios.
-- El 4to criterio (h2h) se implementa en:
-- - lib/standings.ts → computeGroupStandings (para pronósticos)
-- - app/tournament/TournamentClient.tsx → Sorting post-query (para oficial)

do $$
begin
  raise notice '✅ Enfrentamiento directo implementado:';
  raise notice '   - Criterio 1: Puntos (pts)';
  raise notice '   - Criterio 2: Diferencia de goles (dg)';
  raise notice '   - Criterio 3: Goles a favor (gf)';
  raise notice '   - Criterio 4: Enfrentamiento directo (h2h - en cliente)';
  raise notice '   - Criterio 5: Orden alfabético';
  raise notice '';
  raise notice '   Las views SQL mantienen orden pts→dg→gf→nombre';
  raise notice '   El cliente aplica h2h cuando encuentra empate en los 3 primeros';
end $$;
