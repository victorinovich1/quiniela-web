-- =====================================================
-- 037 - Documentación del Sistema de Penales
-- No modifica esquema, solo documenta la lógica existente
-- =====================================================

/*
SISTEMA DE DESEMPATE EN ELIMINATORIAS
======================================

COLUMNAS INVOLUCRADAS:
- predictions.ko_winner_team_id: Quién avanza según el usuario (obligatorio si predice empate)
- matches.shootout_winner_team_id: Quién ganó en penales (lo ingresa el admin)

FLUJO DE USUARIO (PredictionsClient.tsx):
1. Usuario ingresa marcador en eliminatoria (ej. 1-1, 2-2, 0-0)
2. Si es empate: aparece selector "¿Quién avanza de ronda?"
3. Usuario DEBE elegir un equipo para poder guardar
4. Si cambia el marcador a no-empate (ej. 2-1): el selector desaparece y ko_winner_team_id se limpia

LÓGICA DE PUNTOS (view match_scores - líneas 45-47 de migración 033):
======================================================================

A) MARCADOR EXACTO (pt_exact_ko = 8 puntos):
   - pred_home == real_home AND pred_away == real_away
   - Independiente de quién ganó en penales
   - Ejemplo: predijo 1-1, fue 1-1 → 8 puntos (aunque se definió en penales)

B) GANADOR CORRECTO (pt_winner_ko = 4 puntos):
   - NO hubo marcador exacto
   - Y UNA de estas condiciones:
     1. Usuario predijo victoria (ej. 2-1) y el equipo ganó (120' o penales)
        Validación: sign(pred_home - pred_away) = sign(real_home - real_away)
     2. Usuario predijo empate (ej. 1-1), el partido fue empate (ej. 2-2),
        y acertó quién ganó en penales (ko_winner_team_id == shootout_winner_team_id)

C) CERO PUNTOS:
   - Marcador incorrecto
   - O ganador incorrecto
   - O falta shootout_winner_team_id en BD cuando hubo penales

FLUJO DE ADMIN (AdminClient.tsx - líneas 356-369):
===================================================
- Cuando status='finished' y home_score == away_score en fase KO:
  aparece selector "Gana en penales"
- Admin elige el equipo que ganó (shootout_winner_team_id)
- Si el marcador cambia a no-empate, el campo shootout_winner_team_id se ignora

VALIDACIONES RLS:
=================
- Usuarios pueden leer/escribir ko_winner_team_id en sus propias predictions
- Solo admin puede escribir shootout_winner_team_id en matches

EJEMPLO COMPLETO:
=================
Partido: Argentina vs Francia (Final)
Resultado real: 3-3 (120'), Argentina gana en penales

Usuario A predice: 3-3, elige Argentina → 8 pts (marcador exacto) + bonus penales
Usuario B predice: 2-2, elige Argentina → 4 pts (ganador correcto en penales)
Usuario C predice: 2-1 Argentina → 4 pts (ganador correcto, aunque marcador diferente)
Usuario D predice: 2-2, elige Francia → 0 pts (marcador incorrecto, ganador incorrecto)
Usuario E predice: 1-0 Francia → 0 pts (todo incorrecto)

NOTA TÉCNICA:
=============
El sistema NO penaliza por empate vs victoria directa.
Si el usuario pone 2-1 y gana ese equipo en penales: suma puntos de ganador.
Si el usuario pone empate y acierta penales: también suma puntos de ganador.
El marcador exacto siempre otorga el puntaje máximo independiente del método de victoria.
*/

-- Esta migración no ejecuta DDL, solo documenta el sistema existente
select 'Sistema de penales documentado exitosamente' as status;
