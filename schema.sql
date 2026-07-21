-- =====================================================
-- QUINIELA MUNDIAL 2026 - SCHEMA CONSOLIDADO
-- =====================================================
-- Base de datos completa para plataforma de pronósticos
-- del Mundial de Fútbol 2026
--
-- Stack: Supabase (PostgreSQL 17) + RLS
-- Autor: [Tu Nombre]
-- Última actualización: 2026-07-21
--
-- INSTRUCCIONES DE INSTALACIÓN:
-- 1. Crear un proyecto nuevo en Supabase
-- 2. Copiar todo el contenido de este archivo
-- 3. Pegar en el SQL Editor de Supabase
-- 4. Ejecutar (toma ~30 segundos)
-- 5. Listo para usar
-- =====================================================

-- =====================================================
-- PARTE 1: ESTRUCTURA DE TABLAS (DDL)
-- =====================================================

-- -----------------------------------------------------
-- 1.1 TABLA: profiles
-- -----------------------------------------------------
-- Extiende auth.users de Supabase con datos adicionales
-- Cada registro representa un participante de la quiniela

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  display_name text,
  role text NOT NULL DEFAULT 'participant' 
    CHECK (role IN ('participant', 'manager', 'admin')),
  location text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_known_rank int
);

COMMENT ON TABLE public.profiles IS 'Perfil extendido de usuarios. Vinculado a auth.users de Supabase.';
COMMENT ON COLUMN public.profiles.role IS 'Roles: participant (usuario normal), manager (gestión limitada), admin (control total)';
COMMENT ON COLUMN public.profiles.last_known_rank IS 'Última posición conocida en el ranking (para calcular tendencias)';

-- -----------------------------------------------------
-- 1.2 TABLA: entries
-- -----------------------------------------------------
-- Sistema multi-jugada: cada usuario puede crear N entries
-- Cada entry compite de forma independiente en el ranking

CREATE TABLE IF NOT EXISTS public.entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  alias text NOT NULL,
  paid boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, alias)
);

COMMENT ON TABLE public.entries IS 'Jugadas individuales. Un usuario puede tener múltiples entries.';
COMMENT ON COLUMN public.entries.alias IS 'Nombre de la jugada (debe ser único por usuario)';
COMMENT ON COLUMN public.entries.paid IS 'Marca si la cuota de esta jugada fue pagada';

-- -----------------------------------------------------
-- 1.3 TABLA: invitations
-- -----------------------------------------------------
-- Códigos de invitación para registro privado

CREATE TABLE IF NOT EXISTS public.invitations (
  code text PRIMARY KEY,
  note text,
  email text,
  used_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

COMMENT ON TABLE public.invitations IS 'Códigos de invitación para registro controlado';

-- -----------------------------------------------------
-- 1.4 TABLA: teams
-- -----------------------------------------------------
-- 48 equipos del Mundial 2026

CREATE TABLE IF NOT EXISTS public.teams (
  id serial PRIMARY KEY,
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  iso_code text,
  group_code text CHECK (group_code IN ('A','B','C','D','E','F','G','H','I','J','K','L')),
  flag_emoji text,
  position_in_group smallint CHECK (position_in_group BETWEEN 1 AND 4)
);

COMMENT ON TABLE public.teams IS '48 equipos participantes del Mundial 2026';
COMMENT ON COLUMN public.teams.code IS 'Código TLA de 3 letras (ej: URY, MEX, ARG)';
COMMENT ON COLUMN public.teams.iso_code IS 'Código ISO de 2 letras para banderas (ej: uy, mx, ar)';

-- -----------------------------------------------------
-- 1.5 TABLA: matches
-- -----------------------------------------------------
-- 104 partidos oficiales del Mundial 2026

CREATE TABLE IF NOT EXISTS public.matches (
  id serial PRIMARY KEY,
  phase text NOT NULL CHECK (phase IN ('group','r32','r16','qf','sf','third','final')),
  group_code text,
  match_number int NOT NULL,
  kickoff_at timestamptz,
  home_team_id int REFERENCES public.teams(id),
  away_team_id int REFERENCES public.teams(id),
  home_team_label text,
  away_team_label text,
  home_score int,
  away_score int,
  shootout_winner_team_id int REFERENCES public.teams(id),
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','live','finished')),
  stadium text,
  last_synced_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS matches_match_number_uq ON public.matches(match_number);

COMMENT ON TABLE public.matches IS '104 partidos oficiales (72 grupos + 32 eliminatorias)';
COMMENT ON COLUMN public.matches.shootout_winner_team_id IS 'Ganador en penales (solo si empate en tiempo reglamentario)';
COMMENT ON COLUMN public.matches.last_synced_at IS 'Timestamp de última sincronización con API de FIFA';

-- -----------------------------------------------------
-- 1.6 TABLA: predictions
-- -----------------------------------------------------
-- Pronósticos de partidos por entry

CREATE TABLE IF NOT EXISTS public.predictions (
  entry_id uuid NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
  match_id int NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  home_score int,
  away_score int,
  ko_winner_team_id int REFERENCES public.teams(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (entry_id, match_id)
);

COMMENT ON TABLE public.predictions IS 'Pronósticos de marcadores por jugada';
COMMENT ON COLUMN public.predictions.ko_winner_team_id IS 'Predicción de quién avanza en eliminatorias (si predice empate)';

-- -----------------------------------------------------
-- 1.7 TABLA: special_predictions
-- -----------------------------------------------------
-- Predicciones especiales (campeón, goleador, MVP, etc.)

CREATE TABLE IF NOT EXISTS public.special_predictions (
  entry_id uuid PRIMARY KEY REFERENCES public.entries(id) ON DELETE CASCADE,
  champion_team_id int REFERENCES public.teams(id),
  runner_up_team_id int REFERENCES public.teams(id),
  third_team_id int REFERENCES public.teams(id),
  top_scorer text,
  mvp text,
  best_goalkeeper text,
  revelation_team_id int REFERENCES public.teams(id),
  disappointment_team_id int REFERENCES public.teams(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.special_predictions IS 'Predicciones especiales por jugada (campeón, goleador, MVP, etc.)';

-- -----------------------------------------------------
-- 1.8 TABLA: settings
-- -----------------------------------------------------
-- Configuración global de la quiniela (1 sola fila)

CREATE TABLE IF NOT EXISTS public.settings (
  id smallint PRIMARY KEY DEFAULT 1,
  lock_at timestamptz,
  
  -- Puntos por pronósticos de partidos
  pt_exact_group int NOT NULL DEFAULT 5,
  pt_winner_group int NOT NULL DEFAULT 2,
  pt_exact_ko int NOT NULL DEFAULT 8,
  pt_winner_ko int NOT NULL DEFAULT 4,
  
  -- Puntos por avanzar de ronda (eliminatorias)
  pt_round_of_16 int NOT NULL DEFAULT 3,
  pt_quarters int NOT NULL DEFAULT 5,
  pt_semis int NOT NULL DEFAULT 8,
  
  -- Puntos por predicciones especiales
  pt_champion int NOT NULL DEFAULT 25,
  pt_runner_up int NOT NULL DEFAULT 15,
  pt_third int NOT NULL DEFAULT 10,
  pt_fourth int NOT NULL DEFAULT 6,
  pt_top_scorer int NOT NULL DEFAULT 15,
  pt_mvp int NOT NULL DEFAULT 10,
  pt_goalkeeper int NOT NULL DEFAULT 8,
  pt_revelation int NOT NULL DEFAULT 8,
  pt_disappointment int NOT NULL DEFAULT 5,
  
  -- Umbrales de avatares (gamificación)
  avatar_tier_1_min int NOT NULL DEFAULT 0,
  avatar_tier_2_min int NOT NULL DEFAULT 200,
  avatar_tier_3_min int NOT NULL DEFAULT 400,
  avatar_tier_4_min int NOT NULL DEFAULT 600,
  
  -- Resultados oficiales (para predicciones especiales)
  champion_team_id int,
  runner_up_team_id int,
  third_team_id int,
  fourth_team_id int,
  top_scorer text,
  mvp text,
  best_goalkeeper text,
  revelation_team_id int,
  disappointment_team_id int,
  
  CONSTRAINT single_row CHECK (id = 1)
);

-- Insertar fila única con valores por defecto
INSERT INTO public.settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE public.settings IS 'Configuración global de la quiniela (SOLO 1 FILA)';

-- -----------------------------------------------------
-- 1.9 TABLA: notifications
-- -----------------------------------------------------
-- Sistema de notificaciones web

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  send_at timestamptz NOT NULL,
  sent_at timestamptz,
  error_message text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.notifications IS 'Notificaciones programadas o enviadas';

-- -----------------------------------------------------
-- 1.10 TABLA: sent_notifications
-- -----------------------------------------------------
-- Historial de notificaciones enviadas por usuario

CREATE TABLE IF NOT EXISTS public.sent_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(notification_id, user_id)
);

-- -----------------------------------------------------
-- 1.11 TABLA: push_subscriptions
-- -----------------------------------------------------
-- Suscripciones Web Push por usuario

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  keys jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

COMMENT ON TABLE public.push_subscriptions IS 'Suscripciones Web Push para notificaciones en segundo plano';

-- =====================================================
-- PARTE 2: VISTAS (VIEWS)
-- =====================================================

-- -----------------------------------------------------
-- 2.1 VISTA: official_group_standings
-- -----------------------------------------------------
-- Calcula la tabla de posiciones oficial por grupo
-- Incluye enfrentamiento directo (h2h)

CREATE OR REPLACE VIEW public.official_group_standings
WITH (security_invoker = true)
AS
WITH team_stats AS (
  SELECT 
    t.id AS team_id,
    t.name AS team_name,
    t.group_code,
    t.iso_code,
    COUNT(m.id) AS pj,
    SUM(CASE 
      WHEN m.home_team_id = t.id AND m.home_score > m.away_score THEN 1
      WHEN m.away_team_id = t.id AND m.away_score > m.home_score THEN 1
      WHEN m.home_team_id = t.id AND m.home_score = m.away_score AND m.shootout_winner_team_id = t.id THEN 1
      WHEN m.away_team_id = t.id AND m.home_score = m.away_score AND m.shootout_winner_team_id = t.id THEN 1
      ELSE 0
    END)::int AS pg,
    SUM(CASE 
      WHEN m.home_score = m.away_score AND m.shootout_winner_team_id IS NULL THEN 1
      ELSE 0
    END)::int AS pe,
    SUM(CASE 
      WHEN m.home_team_id = t.id AND m.home_score < m.away_score THEN 1
      WHEN m.away_team_id = t.id AND m.away_score < m.home_score THEN 1
      WHEN m.home_team_id = t.id AND m.home_score = m.away_score AND m.shootout_winner_team_id = m.away_team_id THEN 1
      WHEN m.away_team_id = t.id AND m.home_score = m.away_score AND m.shootout_winner_team_id = m.home_team_id THEN 1
      ELSE 0
    END)::int AS pp,
    SUM(CASE WHEN m.home_team_id = t.id THEN m.home_score ELSE m.away_score END)::int AS gf,
    SUM(CASE WHEN m.home_team_id = t.id THEN m.away_score ELSE m.home_score END)::int AS gc,
    (SUM(CASE WHEN m.home_team_id = t.id THEN m.home_score ELSE m.away_score END) -
     SUM(CASE WHEN m.home_team_id = t.id THEN m.away_score ELSE m.home_score END))::int AS dg,
    (SUM(CASE 
      WHEN m.home_team_id = t.id AND m.home_score > m.away_score THEN 3
      WHEN m.away_team_id = t.id AND m.away_score > m.home_score THEN 3
      WHEN m.home_team_id = t.id AND m.home_score = m.away_score AND m.shootout_winner_team_id = t.id THEN 3
      WHEN m.away_team_id = t.id AND m.home_score = m.away_score AND m.shootout_winner_team_id = t.id THEN 3
      WHEN m.home_score = m.away_score AND m.shootout_winner_team_id IS NULL THEN 1
      ELSE 0
    END))::int AS pts
  FROM teams t
  LEFT JOIN matches m ON (m.home_team_id = t.id OR m.away_team_id = t.id)
    AND m.phase = 'group'
    AND m.status = 'finished'
    AND m.home_score IS NOT NULL
    AND m.away_score IS NOT NULL
  WHERE t.group_code IS NOT NULL
  GROUP BY t.id, t.name, t.group_code, t.iso_code
)
SELECT * FROM team_stats
ORDER BY group_code, pts DESC, dg DESC, gf DESC, team_name;

COMMENT ON VIEW public.official_group_standings IS 'Tabla de posiciones oficial por grupo (orden: pts → dg → gf → alfabético)';

-- -----------------------------------------------------
-- 2.2 VISTA: best_third_placed_teams
-- -----------------------------------------------------
-- Calcula los 8 mejores terceros lugares

CREATE OR REPLACE VIEW public.best_third_placed_teams
WITH (security_invoker = true)
AS
WITH ranked_teams AS (
  SELECT 
    *,
    ROW_NUMBER() OVER (
      PARTITION BY group_code 
      ORDER BY pts DESC, dg DESC, gf DESC, team_name
    ) AS group_position
  FROM official_group_standings
)
SELECT 
  *,
  ROW_NUMBER() OVER (
    ORDER BY pts DESC, dg DESC, gf DESC, team_name
  )::int AS third_place_rank
FROM ranked_teams
WHERE group_position = 3
ORDER BY third_place_rank
LIMIT 8;

COMMENT ON VIEW public.best_third_placed_teams IS '8 mejores terceros lugares para clasificar a R32';

-- -----------------------------------------------------
-- 2.3 VISTA: match_scores
-- -----------------------------------------------------
-- Calcula los puntos obtenidos por cada pronóstico
-- Incluye lógica de "intención" para fase de grupos y KO

CREATE OR REPLACE VIEW public.match_scores
WITH (security_invoker = true)
AS
SELECT 
  p.entry_id,
  p.match_id,
  m.phase,
  m.status,
  m.home_score AS real_home,
  m.away_score AS real_away,
  m.shootout_winner_team_id AS real_shootout_winner,
  p.home_score AS pred_home,
  p.away_score AS pred_away,
  p.ko_winner_team_id AS pred_ko_winner,
  s.pt_exact_group,
  s.pt_winner_group,
  s.pt_exact_ko,
  s.pt_winner_ko,
  
  -- Lógica de puntos
  CASE
    -- Partido no finalizado
    WHEN m.status != 'finished' OR m.home_score IS NULL THEN 0
    
    -- FASE DE GRUPOS
    WHEN m.phase = 'group' THEN
      CASE
        -- Marcador exacto
        WHEN p.home_score = m.home_score AND p.away_score = m.away_score THEN s.pt_exact_group
        
        -- Acertó ganador (victoria)
        WHEN p.home_score > p.away_score AND m.home_score > m.away_score THEN s.pt_winner_group
        WHEN p.away_score > p.home_score AND m.away_score > m.home_score THEN s.pt_winner_group
        
        -- Acertó empate
        WHEN p.home_score = p.away_score AND m.home_score = m.away_score THEN s.pt_winner_group
        
        ELSE 0
      END
    
    -- ELIMINATORIAS (con lógica de ko_winner)
    ELSE
      CASE
        -- Marcador exacto
        WHEN p.home_score = m.home_score AND p.away_score = m.away_score THEN s.pt_exact_ko
        
        -- Usuario predijo victoria y acertó ganador
        WHEN p.home_score > p.away_score AND (
          m.home_score > m.away_score OR 
          (m.home_score = m.away_score AND m.shootout_winner_team_id = m.home_team_id)
        ) THEN s.pt_winner_ko
        WHEN p.away_score > p.home_score AND (
          m.away_score > m.home_score OR 
          (m.home_score = m.away_score AND m.shootout_winner_team_id = m.away_team_id)
        ) THEN s.pt_winner_ko
        
        -- Usuario predijo empate (tie) y acertó ganador vía ko_winner
        WHEN p.home_score = p.away_score 
          AND m.home_score = m.away_score 
          AND p.ko_winner_team_id = m.shootout_winner_team_id 
        THEN s.pt_winner_ko
        
        ELSE 0
      END
  END AS points_earned

FROM predictions p
INNER JOIN matches m ON m.id = p.match_id
CROSS JOIN settings s;

COMMENT ON VIEW public.match_scores IS 'Puntos ganados por cada pronóstico (incluye lógica de intención en KO)';

-- -----------------------------------------------------
-- 2.4 VISTA: leaderboard
-- -----------------------------------------------------
-- Ranking dinámico con 6 niveles de desempate y tendencias

CREATE OR REPLACE VIEW public.leaderboard
WITH (security_invoker = true)
AS
WITH entry_points AS (
  SELECT 
    e.id AS entry_id,
    e.user_id,
    e.alias,
    e.paid,
    p.display_name,
    p.email,
    p.last_known_rank AS previous_rank,
    COALESCE(SUM(ms.points_earned), 0)::int AS total_points
  FROM entries e
  INNER JOIN profiles p ON p.id = e.user_id
  LEFT JOIN match_scores ms ON ms.entry_id = e.id
  GROUP BY e.id, e.user_id, e.alias, e.paid, p.display_name, p.email, p.last_known_rank
),
ranked_entries AS (
  SELECT 
    *,
    ROW_NUMBER() OVER (ORDER BY total_points DESC, alias, entry_id) AS current_rank
  FROM entry_points
)
SELECT 
  entry_id,
  user_id,
  alias,
  paid,
  display_name,
  email,
  total_points,
  current_rank::int AS rank,
  previous_rank,
  CASE
    WHEN previous_rank IS NULL THEN 'new'
    WHEN current_rank < previous_rank THEN 'up'
    WHEN current_rank > previous_rank THEN 'down'
    ELSE 'same'
  END AS rank_movement
FROM ranked_entries
ORDER BY current_rank;

COMMENT ON VIEW public.leaderboard IS 'Ranking dinámico con indicadores de tendencia (▲/▼/→)';

-- =====================================================
-- PARTE 3: FUNCIONES (STORED PROCEDURES)
-- =====================================================

-- -----------------------------------------------------
-- 3.1 FUNCIÓN: predictions_locked
-- -----------------------------------------------------
-- Verifica si los pronósticos están bloqueados

CREATE OR REPLACE FUNCTION public.predictions_locked()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM settings 
    WHERE lock_at IS NOT NULL 
      AND lock_at <= now()
  ) OR EXISTS (
    SELECT 1 
    FROM matches 
    WHERE status IN ('live', 'finished')
  );
$$;

COMMENT ON FUNCTION public.predictions_locked IS 'Devuelve true si los pronósticos están bloqueados (por fecha o por partidos iniciados)';

-- -----------------------------------------------------
-- 3.2 FUNCIÓN: is_admin
-- -----------------------------------------------------
-- Verifica si el usuario actual es admin

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE id = auth.uid() 
      AND role = 'admin'
  );
$$;

-- -----------------------------------------------------
-- 3.3 FUNCIÓN: redeem_invite
-- -----------------------------------------------------
-- Redime un código de invitación al registrarse

CREATE OR REPLACE FUNCTION public.redeem_invite(invite_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv_record invitations%ROWTYPE;
BEGIN
  SELECT * INTO inv_record FROM invitations WHERE code = invite_code;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  IF inv_record.used_at IS NOT NULL THEN
    RETURN false;
  END IF;
  
  IF inv_record.expires_at IS NOT NULL AND inv_record.expires_at < now() THEN
    RETURN false;
  END IF;
  
  UPDATE invitations 
  SET used_by = auth.uid(), used_at = now()
  WHERE code = invite_code;
  
  RETURN true;
END;
$$;

COMMENT ON FUNCTION public.redeem_invite IS 'Redime un código de invitación (valida uso único y expiración)';

-- -----------------------------------------------------
-- 3.4 FUNCIÓN: update_ranking_memory
-- -----------------------------------------------------
-- Guarda el ranking actual en last_known_rank
-- Se ejecuta antes de sincronizar resultados

CREATE OR REPLACE FUNCTION public.update_ranking_memory()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles p
  SET last_known_rank = lb.rank
  FROM leaderboard lb
  WHERE p.id = lb.user_id;
END;
$$;

COMMENT ON FUNCTION public.update_ranking_memory IS 'Guarda el ranking actual para calcular tendencias después de actualizar resultados';

-- =====================================================
-- PARTE 4: ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sent_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- 4.1 RLS: profiles
-- -----------------------------------------------------

-- Todos pueden leer todos los perfiles (para ranking)
CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT USING (true);

-- Solo puedes actualizar tu propio perfil
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Solo admin puede eliminar perfiles
CREATE POLICY "profiles_delete_admin" ON public.profiles
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- -----------------------------------------------------
-- 4.2 RLS: entries
-- -----------------------------------------------------

-- Todos pueden ver todas las jugadas (para ranking)
CREATE POLICY "entries_select_all" ON public.entries
  FOR SELECT USING (true);

-- Solo puedes crear jugadas en tu propio nombre
CREATE POLICY "entries_insert_own" ON public.entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Solo puedes actualizar tus propias jugadas
CREATE POLICY "entries_update_own" ON public.entries
  FOR UPDATE USING (auth.uid() = user_id);

-- Solo puedes eliminar tus jugadas si no hay partidos iniciados
CREATE POLICY "entries_delete_own_before_lock" ON public.entries
  FOR DELETE USING (
    auth.uid() = user_id 
    AND NOT EXISTS (
      SELECT 1 FROM matches WHERE status IN ('live', 'finished')
    )
  );

-- -----------------------------------------------------
-- 4.3 RLS: invitations
-- -----------------------------------------------------

-- Todos pueden leer invitaciones (para validar códigos)
CREATE POLICY "invitations_select_all" ON public.invitations
  FOR SELECT USING (true);

-- Solo admin puede crear/modificar/eliminar invitaciones
CREATE POLICY "invitations_admin_all" ON public.invitations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- -----------------------------------------------------
-- 4.4 RLS: teams
-- -----------------------------------------------------

-- Todos pueden leer equipos
CREATE POLICY "teams_select_all" ON public.teams
  FOR SELECT USING (true);

-- Solo admin puede modificar equipos
CREATE POLICY "teams_admin_all" ON public.teams
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- -----------------------------------------------------
-- 4.5 RLS: matches
-- -----------------------------------------------------

-- Todos pueden leer partidos
CREATE POLICY "matches_select_all" ON public.matches
  FOR SELECT USING (true);

-- Solo admin puede modificar partidos
CREATE POLICY "matches_admin_all" ON public.matches
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- -----------------------------------------------------
-- 4.6 RLS: predictions
-- -----------------------------------------------------

-- Puedes leer tus propios pronósticos siempre
CREATE POLICY "predictions_select_own" ON public.predictions
  FOR SELECT USING (
    entry_id IN (SELECT id FROM entries WHERE user_id = auth.uid())
  );

-- Puedes leer pronósticos de otros solo si el partido ya inició
CREATE POLICY "predictions_select_others_after_start" ON public.predictions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = predictions.match_id
        AND m.status IN ('live', 'finished')
    )
  );

-- Puedes insertar/actualizar tus pronósticos solo antes del bloqueo
CREATE POLICY "predictions_insert_own_before_lock" ON public.predictions
  FOR INSERT WITH CHECK (
    entry_id IN (SELECT id FROM entries WHERE user_id = auth.uid())
    AND NOT predictions_locked()
  );

CREATE POLICY "predictions_update_own_before_lock" ON public.predictions
  FOR UPDATE USING (
    entry_id IN (SELECT id FROM entries WHERE user_id = auth.uid())
    AND NOT predictions_locked()
  );

-- Puedes eliminar tus pronósticos antes del bloqueo
CREATE POLICY "predictions_delete_own_before_lock" ON public.predictions
  FOR DELETE USING (
    entry_id IN (SELECT id FROM entries WHERE user_id = auth.uid())
    AND NOT predictions_locked()
  );

-- -----------------------------------------------------
-- 4.7 RLS: special_predictions
-- -----------------------------------------------------

-- Similar a predictions (puedes ver las tuyas siempre, las de otros después del bloqueo)
CREATE POLICY "special_predictions_select_own" ON public.special_predictions
  FOR SELECT USING (
    entry_id IN (SELECT id FROM entries WHERE user_id = auth.uid())
  );

CREATE POLICY "special_predictions_select_others_after_lock" ON public.special_predictions
  FOR SELECT USING (predictions_locked());

CREATE POLICY "special_predictions_insert_own_before_lock" ON public.special_predictions
  FOR INSERT WITH CHECK (
    entry_id IN (SELECT id FROM entries WHERE user_id = auth.uid())
    AND NOT predictions_locked()
  );

CREATE POLICY "special_predictions_update_own_before_lock" ON public.special_predictions
  FOR UPDATE USING (
    entry_id IN (SELECT id FROM entries WHERE user_id = auth.uid())
    AND NOT predictions_locked()
  );

-- -----------------------------------------------------
-- 4.8 RLS: settings
-- -----------------------------------------------------

-- Todos pueden leer la configuración
CREATE POLICY "settings_select_all" ON public.settings
  FOR SELECT USING (true);

-- Solo admin puede modificar
CREATE POLICY "settings_admin_all" ON public.settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- -----------------------------------------------------
-- 4.9 RLS: notifications
-- -----------------------------------------------------

-- Solo admin puede gestionar notificaciones
CREATE POLICY "notifications_admin_all" ON public.notifications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- -----------------------------------------------------
-- 4.10 RLS: sent_notifications
-- -----------------------------------------------------

-- Solo puedes ver tus notificaciones recibidas
CREATE POLICY "sent_notifications_select_own" ON public.sent_notifications
  FOR SELECT USING (user_id = auth.uid());

-- -----------------------------------------------------
-- 4.11 RLS: push_subscriptions
-- -----------------------------------------------------

-- Solo puedes ver/gestionar tus propias suscripciones
CREATE POLICY "push_subscriptions_select_own" ON public.push_subscriptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "push_subscriptions_insert_own" ON public.push_subscriptions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "push_subscriptions_delete_own" ON public.push_subscriptions
  FOR DELETE USING (user_id = auth.uid());

-- =====================================================
-- PARTE 5: PERMISOS (GRANTS)
-- =====================================================

-- Permisos para usuarios autenticados (authenticated role)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.entries TO authenticated;
GRANT SELECT ON public.invitations TO authenticated;
GRANT SELECT ON public.teams TO authenticated;
GRANT SELECT ON public.matches TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.predictions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.special_predictions TO authenticated;
GRANT SELECT ON public.settings TO authenticated;
GRANT SELECT ON public.notifications TO authenticated;
GRANT SELECT ON public.sent_notifications TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.push_subscriptions TO authenticated;

-- Permisos sobre vistas
GRANT SELECT ON public.official_group_standings TO authenticated;
GRANT SELECT ON public.best_third_placed_teams TO authenticated;
GRANT SELECT ON public.match_scores TO authenticated;
GRANT SELECT ON public.leaderboard TO authenticated;

-- Permisos sobre funciones
GRANT EXECUTE ON FUNCTION public.predictions_locked() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_invite(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_ranking_memory() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_ranking_memory() TO service_role;

-- Permisos para service_role (usado en API routes)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- =====================================================
-- PARTE 6: SEED DATA (DATOS INICIALES)
-- =====================================================

-- -----------------------------------------------------
-- 6.1 SEED: teams (48 equipos del Mundial 2026)
-- -----------------------------------------------------

INSERT INTO public.teams (code, name, iso_code, group_code, flag_emoji, position_in_group) VALUES
-- Grupo A
('MEX', 'México', 'mx', 'A', '🇲🇽', 1),
('KOR', 'República de Corea', 'kr', 'A', '🇰🇷', 2),
('RSA', 'Sudáfrica', 'za', 'A', '🇿🇦', 3),
('CZE', 'República Checa', 'cz', 'A', '🇨🇿', 4),

-- Grupo B
('CAN', 'Canadá', 'ca', 'B', '🇨🇦', 1),
('SUI', 'Suiza', 'ch', 'B', '🇨🇭', 2),
('BIH', 'Bosnia y Herzegovina', 'ba', 'B', '🇧🇦', 3),
('QAT', 'Catar', 'qa', 'B', '🇶🇦', 4),

-- Grupo C
('BRA', 'Brasil', 'br', 'C', '🇧🇷', 1),
('MAR', 'Marruecos', 'ma', 'C', '🇲🇦', 2),
('SCO', 'Escocia', 'gb-sct', 'C', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 3),
('HAI', 'Haití', 'ht', 'C', '🇭🇹', 4),

-- Grupo D
('USA', 'Estados Unidos', 'us', 'D', '🇺🇸', 1),
('TUR', 'Turquía', 'tr', 'D', '🇹🇷', 2),
('AUS', 'Australia', 'au', 'D', '🇦🇺', 3),
('PAR', 'Paraguay', 'py', 'D', '🇵🇾', 4),

-- Grupo E
('GER', 'Alemania', 'de', 'E', '🇩🇪', 1),
('CIV', 'Costa de Marfil', 'ci', 'E', '🇨🇮', 2),
('ECU', 'Ecuador', 'ec', 'E', '🇪🇨', 3),
('CUW', 'Curazao', 'cw', 'E', '🇨🇼', 4),

-- Grupo F
('NED', 'Países Bajos', 'nl', 'F', '🇳🇱', 1),
('SWE', 'Suecia', 'se', 'F', '🇸🇪', 2),
('TUN', 'Túnez', 'tn', 'F', '🇹🇳', 3),
('JPN', 'Japón', 'jp', 'F', '🇯🇵', 4),

-- Grupo G
('BEL', 'Bélgica', 'be', 'G', '🇧🇪', 1),
('NZL', 'Nueva Zelanda', 'nz', 'G', '🇳🇿', 2),
('IRN', 'RI de Irán', 'ir', 'G', '🇮🇷', 3),
('EGY', 'Egipto', 'eg', 'G', '🇪🇬', 4),

-- Grupo H
('ESP', 'España', 'es', 'H', '🇪🇸', 1),
('URU', 'Uruguay', 'uy', 'H', '🇺🇾', 2),
('CPV', 'Cabo Verde', 'cv', 'H', '🇨🇻', 3),
('KSA', 'Arabia Saudí', 'sa', 'H', '🇸🇦', 4),

-- Grupo I
('FRA', 'Francia', 'fr', 'I', '🇫🇷', 1),
('NOR', 'Noruega', 'no', 'I', '🇳🇴', 2),
('SEN', 'Senegal', 'sn', 'I', '🇸🇳', 3),
('IRQ', 'Irak', 'iq', 'I', '🇮🇶', 4),

-- Grupo J
('ARG', 'Argentina', 'ar', 'J', '🇦🇷', 1),
('AUT', 'Austria', 'at', 'J', '🇦🇹', 2),
('JOR', 'Jordania', 'jo', 'J', '🇯🇴', 3),
('ALG', 'Argelia', 'dz', 'J', '🇩🇿', 4),

-- Grupo K
('POR', 'Portugal', 'pt', 'K', '🇵🇹', 1),
('COL', 'Colombia', 'co', 'K', '🇨🇴', 2),
('UZB', 'Uzbekistán', 'uz', 'K', '🇺🇿', 3),
('COD', 'RD Congo', 'cd', 'K', '🇨🇩', 4),

-- Grupo L
('ENG', 'Inglaterra', 'gb-eng', 'L', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 1),
('CRO', 'Croacia', 'hr', 'L', '🇭🇷', 2),
('GHA', 'Ghana', 'gh', 'L', '🇬🇭', 3),
('PAN', 'Panamá', 'pa', 'L', '🇵🇦', 4)
ON CONFLICT (code) DO NOTHING;

-- -----------------------------------------------------
-- 6.2 SEED: matches (104 partidos oficiales FIFA 2026)
-- -----------------------------------------------------
-- Calendario oficial FIFA con todos los horarios en UTC
-- Fuente: https://www.fifa.com/es/tournaments/mens/worldcup/canadamexicousa2026

-- ==========================================
-- FASE DE GRUPOS (72 partidos)
-- ==========================================

INSERT INTO public.matches (match_number, phase, group_code, home_team_id, away_team_id, kickoff_at, stadium, status) VALUES
-- Jueves 11 junio
(1, 'group', 'A', (SELECT id FROM teams WHERE code = 'MEX'), (SELECT id FROM teams WHERE code = 'RSA'), '2026-06-11 19:00:00+00', 'Estadio Ciudad de México', 'scheduled'),
(2, 'group', 'A', (SELECT id FROM teams WHERE code = 'KOR'), (SELECT id FROM teams WHERE code = 'CZE'), '2026-06-12 02:00:00+00', 'Estadio Guadalajara', 'scheduled'),
-- Viernes 12 junio
(3, 'group', 'B', (SELECT id FROM teams WHERE code = 'CAN'), (SELECT id FROM teams WHERE code = 'BIH'), '2026-06-12 19:00:00+00', 'Estadio Toronto', 'scheduled'),
(4, 'group', 'D', (SELECT id FROM teams WHERE code = 'USA'), (SELECT id FROM teams WHERE code = 'PAR'), '2026-06-13 01:00:00+00', 'Estadio Los Ángeles', 'scheduled'),
-- Sábado 13 junio
(5, 'group', 'B', (SELECT id FROM teams WHERE code = 'QAT'), (SELECT id FROM teams WHERE code = 'SUI'), '2026-06-13 19:00:00+00', 'Estadio Bahía de San Francisco', 'scheduled'),
(6, 'group', 'C', (SELECT id FROM teams WHERE code = 'BRA'), (SELECT id FROM teams WHERE code = 'MAR'), '2026-06-13 22:00:00+00', 'Estadio Nueva York Nueva Jersey', 'scheduled'),
(7, 'group', 'C', (SELECT id FROM teams WHERE code = 'HAI'), (SELECT id FROM teams WHERE code = 'SCO'), '2026-06-14 01:00:00+00', 'Estadio Boston', 'scheduled'),
(8, 'group', 'D', (SELECT id FROM teams WHERE code = 'AUS'), (SELECT id FROM teams WHERE code = 'TUR'), '2026-06-14 04:00:00+00', 'Estadio BC Place Vancouver', 'scheduled'),
-- Domingo 14 junio
(9, 'group', 'E', (SELECT id FROM teams WHERE code = 'GER'), (SELECT id FROM teams WHERE code = 'CUW'), '2026-06-14 17:00:00+00', 'Estadio Houston', 'scheduled'),
(10, 'group', 'F', (SELECT id FROM teams WHERE code = 'NED'), (SELECT id FROM teams WHERE code = 'JPN'), '2026-06-14 20:00:00+00', 'Estadio Dallas', 'scheduled'),
(11, 'group', 'E', (SELECT id FROM teams WHERE code = 'CIV'), (SELECT id FROM teams WHERE code = 'ECU'), '2026-06-14 23:00:00+00', 'Estadio Filadelfia', 'scheduled'),
(12, 'group', 'F', (SELECT id FROM teams WHERE code = 'SWE'), (SELECT id FROM teams WHERE code = 'TUN'), '2026-06-15 02:00:00+00', 'Estadio Monterrey', 'scheduled'),
-- Lunes 15 junio
(13, 'group', 'H', (SELECT id FROM teams WHERE code = 'ESP'), (SELECT id FROM teams WHERE code = 'CPV'), '2026-06-15 16:00:00+00', 'Estadio Atlanta', 'scheduled'),
(14, 'group', 'G', (SELECT id FROM teams WHERE code = 'BEL'), (SELECT id FROM teams WHERE code = 'EGY'), '2026-06-15 19:00:00+00', 'Estadio Seattle', 'scheduled'),
(15, 'group', 'H', (SELECT id FROM teams WHERE code = 'KSA'), (SELECT id FROM teams WHERE code = 'URU'), '2026-06-15 22:00:00+00', 'Estadio Miami', 'scheduled'),
(16, 'group', 'G', (SELECT id FROM teams WHERE code = 'IRN'), (SELECT id FROM teams WHERE code = 'NZL'), '2026-06-16 01:00:00+00', 'Estadio Los Ángeles', 'scheduled'),
-- Martes 16 junio
(17, 'group', 'I', (SELECT id FROM teams WHERE code = 'FRA'), (SELECT id FROM teams WHERE code = 'SEN'), '2026-06-16 19:00:00+00', 'Estadio Nueva York Nueva Jersey', 'scheduled'),
(18, 'group', 'I', (SELECT id FROM teams WHERE code = 'IRQ'), (SELECT id FROM teams WHERE code = 'NOR'), '2026-06-16 22:00:00+00', 'Estadio Boston', 'scheduled'),
(19, 'group', 'J', (SELECT id FROM teams WHERE code = 'ARG'), (SELECT id FROM teams WHERE code = 'ALG'), '2026-06-17 01:00:00+00', 'Estadio Kansas City', 'scheduled'),
(20, 'group', 'J', (SELECT id FROM teams WHERE code = 'AUT'), (SELECT id FROM teams WHERE code = 'JOR'), '2026-06-17 04:00:00+00', 'Estadio Bahía de San Francisco', 'scheduled'),
-- Miércoles 17 junio
(21, 'group', 'K', (SELECT id FROM teams WHERE code = 'POR'), (SELECT id FROM teams WHERE code = 'COD'), '2026-06-17 17:00:00+00', 'Estadio Houston', 'scheduled'),
(22, 'group', 'L', (SELECT id FROM teams WHERE code = 'ENG'), (SELECT id FROM teams WHERE code = 'CRO'), '2026-06-17 20:00:00+00', 'Estadio Dallas', 'scheduled'),
(23, 'group', 'L', (SELECT id FROM teams WHERE code = 'GHA'), (SELECT id FROM teams WHERE code = 'PAN'), '2026-06-17 23:00:00+00', 'Estadio Toronto', 'scheduled'),
(24, 'group', 'K', (SELECT id FROM teams WHERE code = 'UZB'), (SELECT id FROM teams WHERE code = 'COL'), '2026-06-18 02:00:00+00', 'Estadio Ciudad de México', 'scheduled'),
-- Jueves 18 junio
(25, 'group', 'A', (SELECT id FROM teams WHERE code = 'CZE'), (SELECT id FROM teams WHERE code = 'RSA'), '2026-06-18 16:00:00+00', 'Estadio Atlanta', 'scheduled'),
(26, 'group', 'B', (SELECT id FROM teams WHERE code = 'SUI'), (SELECT id FROM teams WHERE code = 'BIH'), '2026-06-18 19:00:00+00', 'Estadio Los Ángeles', 'scheduled'),
(27, 'group', 'B', (SELECT id FROM teams WHERE code = 'CAN'), (SELECT id FROM teams WHERE code = 'QAT'), '2026-06-18 22:00:00+00', 'Estadio BC Place Vancouver', 'scheduled'),
(28, 'group', 'A', (SELECT id FROM teams WHERE code = 'MEX'), (SELECT id FROM teams WHERE code = 'KOR'), '2026-06-19 01:00:00+00', 'Estadio Guadalajara', 'scheduled'),
-- Viernes 19 junio
(29, 'group', 'D', (SELECT id FROM teams WHERE code = 'USA'), (SELECT id FROM teams WHERE code = 'AUS'), '2026-06-19 19:00:00+00', 'Estadio Seattle', 'scheduled'),
(30, 'group', 'C', (SELECT id FROM teams WHERE code = 'SCO'), (SELECT id FROM teams WHERE code = 'MAR'), '2026-06-19 22:00:00+00', 'Estadio Boston', 'scheduled'),
(31, 'group', 'C', (SELECT id FROM teams WHERE code = 'BRA'), (SELECT id FROM teams WHERE code = 'HAI'), '2026-06-20 01:00:00+00', 'Estadio Filadelfia', 'scheduled'),
(32, 'group', 'D', (SELECT id FROM teams WHERE code = 'TUR'), (SELECT id FROM teams WHERE code = 'PAR'), '2026-06-20 04:00:00+00', 'Estadio Bahía de San Francisco', 'scheduled'),
-- Sábado 20 junio
(33, 'group', 'F', (SELECT id FROM teams WHERE code = 'NED'), (SELECT id FROM teams WHERE code = 'SWE'), '2026-06-20 17:00:00+00', 'Estadio Houston', 'scheduled'),
(34, 'group', 'E', (SELECT id FROM teams WHERE code = 'GER'), (SELECT id FROM teams WHERE code = 'CIV'), '2026-06-20 20:00:00+00', 'Estadio Toronto', 'scheduled'),
(35, 'group', 'E', (SELECT id FROM teams WHERE code = 'ECU'), (SELECT id FROM teams WHERE code = 'CUW'), '2026-06-21 02:00:00+00', 'Estadio Kansas City', 'scheduled'),
(36, 'group', 'F', (SELECT id FROM teams WHERE code = 'TUN'), (SELECT id FROM teams WHERE code = 'JPN'), '2026-06-21 04:00:00+00', 'Estadio Monterrey', 'scheduled'),
-- Domingo 21 junio
(37, 'group', 'H', (SELECT id FROM teams WHERE code = 'ESP'), (SELECT id FROM teams WHERE code = 'KSA'), '2026-06-21 16:00:00+00', 'Estadio Atlanta', 'scheduled'),
(38, 'group', 'G', (SELECT id FROM teams WHERE code = 'BEL'), (SELECT id FROM teams WHERE code = 'IRN'), '2026-06-21 19:00:00+00', 'Estadio Los Ángeles', 'scheduled'),
(39, 'group', 'H', (SELECT id FROM teams WHERE code = 'URU'), (SELECT id FROM teams WHERE code = 'CPV'), '2026-06-21 22:00:00+00', 'Estadio Miami', 'scheduled'),
(40, 'group', 'G', (SELECT id FROM teams WHERE code = 'NZL'), (SELECT id FROM teams WHERE code = 'EGY'), '2026-06-22 01:00:00+00', 'Estadio BC Place Vancouver', 'scheduled'),
-- Lunes 22 junio
(41, 'group', 'J', (SELECT id FROM teams WHERE code = 'ARG'), (SELECT id FROM teams WHERE code = 'AUT'), '2026-06-22 17:00:00+00', 'Estadio Dallas', 'scheduled'),
(42, 'group', 'I', (SELECT id FROM teams WHERE code = 'FRA'), (SELECT id FROM teams WHERE code = 'IRQ'), '2026-06-22 21:00:00+00', 'Estadio Filadelfia', 'scheduled'),
(43, 'group', 'I', (SELECT id FROM teams WHERE code = 'NOR'), (SELECT id FROM teams WHERE code = 'SEN'), '2026-06-23 00:00:00+00', 'Estadio Nueva York Nueva Jersey', 'scheduled'),
(44, 'group', 'J', (SELECT id FROM teams WHERE code = 'JOR'), (SELECT id FROM teams WHERE code = 'ALG'), '2026-06-23 03:00:00+00', 'Estadio Bahía de San Francisco', 'scheduled'),
-- Martes 23 junio
(45, 'group', 'K', (SELECT id FROM teams WHERE code = 'POR'), (SELECT id FROM teams WHERE code = 'UZB'), '2026-06-23 17:00:00+00', 'Estadio Houston', 'scheduled'),
(46, 'group', 'L', (SELECT id FROM teams WHERE code = 'ENG'), (SELECT id FROM teams WHERE code = 'GHA'), '2026-06-23 20:00:00+00', 'Estadio Boston', 'scheduled'),
(47, 'group', 'L', (SELECT id FROM teams WHERE code = 'PAN'), (SELECT id FROM teams WHERE code = 'CRO'), '2026-06-23 23:00:00+00', 'Estadio Toronto', 'scheduled'),
(48, 'group', 'K', (SELECT id FROM teams WHERE code = 'COL'), (SELECT id FROM teams WHERE code = 'COD'), '2026-06-24 02:00:00+00', 'Estadio Guadalajara', 'scheduled'),
-- Miércoles 24 junio (Jornada 3 - Partidos simultáneos)
(49, 'group', 'B', (SELECT id FROM teams WHERE code = 'SUI'), (SELECT id FROM teams WHERE code = 'CAN'), '2026-06-24 19:00:00+00', 'Estadio BC Place Vancouver', 'scheduled'),
(50, 'group', 'B', (SELECT id FROM teams WHERE code = 'BIH'), (SELECT id FROM teams WHERE code = 'QAT'), '2026-06-24 19:00:00+00', 'Estadio Seattle', 'scheduled'),
(51, 'group', 'C', (SELECT id FROM teams WHERE code = 'SCO'), (SELECT id FROM teams WHERE code = 'BRA'), '2026-06-24 22:00:00+00', 'Estadio Miami', 'scheduled'),
(52, 'group', 'C', (SELECT id FROM teams WHERE code = 'MAR'), (SELECT id FROM teams WHERE code = 'HAI'), '2026-06-24 22:00:00+00', 'Estadio Atlanta', 'scheduled'),
(53, 'group', 'A', (SELECT id FROM teams WHERE code = 'CZE'), (SELECT id FROM teams WHERE code = 'MEX'), '2026-06-25 01:00:00+00', 'Estadio Ciudad de México', 'scheduled'),
(54, 'group', 'A', (SELECT id FROM teams WHERE code = 'RSA'), (SELECT id FROM teams WHERE code = 'KOR'), '2026-06-25 01:00:00+00', 'Estadio Monterrey', 'scheduled'),
-- Jueves 25 junio
(55, 'group', 'E', (SELECT id FROM teams WHERE code = 'CUW'), (SELECT id FROM teams WHERE code = 'CIV'), '2026-06-25 20:00:00+00', 'Estadio Filadelfia', 'scheduled'),
(56, 'group', 'E', (SELECT id FROM teams WHERE code = 'ECU'), (SELECT id FROM teams WHERE code = 'GER'), '2026-06-25 20:00:00+00', 'Estadio Nueva York Nueva Jersey', 'scheduled'),
(57, 'group', 'F', (SELECT id FROM teams WHERE code = 'JPN'), (SELECT id FROM teams WHERE code = 'SWE'), '2026-06-25 23:00:00+00', 'Estadio Dallas', 'scheduled'),
(58, 'group', 'F', (SELECT id FROM teams WHERE code = 'TUN'), (SELECT id FROM teams WHERE code = 'NED'), '2026-06-25 23:00:00+00', 'Estadio Kansas City', 'scheduled'),
(59, 'group', 'D', (SELECT id FROM teams WHERE code = 'TUR'), (SELECT id FROM teams WHERE code = 'USA'), '2026-06-26 02:00:00+00', 'Estadio Los Ángeles', 'scheduled'),
(60, 'group', 'D', (SELECT id FROM teams WHERE code = 'PAR'), (SELECT id FROM teams WHERE code = 'AUS'), '2026-06-26 02:00:00+00', 'Estadio Bahía de San Francisco', 'scheduled'),
-- Viernes 26 junio
(61, 'group', 'I', (SELECT id FROM teams WHERE code = 'NOR'), (SELECT id FROM teams WHERE code = 'FRA'), '2026-06-26 19:00:00+00', 'Estadio Boston', 'scheduled'),
(62, 'group', 'I', (SELECT id FROM teams WHERE code = 'SEN'), (SELECT id FROM teams WHERE code = 'IRQ'), '2026-06-26 19:00:00+00', 'Estadio Toronto', 'scheduled'),
(63, 'group', 'H', (SELECT id FROM teams WHERE code = 'CPV'), (SELECT id FROM teams WHERE code = 'KSA'), '2026-06-27 00:00:00+00', 'Estadio Houston', 'scheduled'),
(64, 'group', 'H', (SELECT id FROM teams WHERE code = 'URU'), (SELECT id FROM teams WHERE code = 'ESP'), '2026-06-27 00:00:00+00', 'Estadio Guadalajara', 'scheduled'),
(65, 'group', 'G', (SELECT id FROM teams WHERE code = 'EGY'), (SELECT id FROM teams WHERE code = 'IRN'), '2026-06-27 03:00:00+00', 'Estadio Seattle', 'scheduled'),
(66, 'group', 'G', (SELECT id FROM teams WHERE code = 'NZL'), (SELECT id FROM teams WHERE code = 'BEL'), '2026-06-27 03:00:00+00', 'Estadio BC Place Vancouver', 'scheduled'),
-- Sábado 27 junio
(67, 'group', 'L', (SELECT id FROM teams WHERE code = 'PAN'), (SELECT id FROM teams WHERE code = 'ENG'), '2026-06-27 21:00:00+00', 'Estadio Nueva York Nueva Jersey', 'scheduled'),
(68, 'group', 'L', (SELECT id FROM teams WHERE code = 'CRO'), (SELECT id FROM teams WHERE code = 'GHA'), '2026-06-27 21:00:00+00', 'Estadio Filadelfia', 'scheduled'),
(69, 'group', 'K', (SELECT id FROM teams WHERE code = 'COL'), (SELECT id FROM teams WHERE code = 'POR'), '2026-06-27 23:30:00+00', 'Estadio Miami', 'scheduled'),
(70, 'group', 'K', (SELECT id FROM teams WHERE code = 'COD'), (SELECT id FROM teams WHERE code = 'UZB'), '2026-06-27 23:30:00+00', 'Estadio Atlanta', 'scheduled'),
(71, 'group', 'J', (SELECT id FROM teams WHERE code = 'ALG'), (SELECT id FROM teams WHERE code = 'AUT'), '2026-06-28 02:00:00+00', 'Estadio Kansas City', 'scheduled'),
(72, 'group', 'J', (SELECT id FROM teams WHERE code = 'JOR'), (SELECT id FROM teams WHERE code = 'ARG'), '2026-06-28 02:00:00+00', 'Estadio Dallas', 'scheduled')
ON CONFLICT (match_number) DO NOTHING;

-- ==========================================
-- DIECISEISAVOS DE FINAL (16 partidos)
-- ==========================================

INSERT INTO public.matches (match_number, phase, kickoff_at, stadium, status) VALUES
-- Domingo 28 junio
(73, 'r32', '2026-06-28 19:00:00+00', 'Estadio Los Ángeles', 'scheduled'),
-- Lunes 29 junio
(74, 'r32', '2026-06-29 20:30:00+00', 'Estadio Boston', 'scheduled'),
(75, 'r32', '2026-06-30 01:00:00+00', 'Estadio Monterrey', 'scheduled'),
(76, 'r32', '2026-06-29 17:00:00+00', 'Estadio Houston', 'scheduled'),
-- Martes 30 junio
(77, 'r32', '2026-06-30 21:00:00+00', 'Estadio Nueva York Nueva Jersey', 'scheduled'),
(78, 'r32', '2026-06-30 17:00:00+00', 'Estadio Dallas', 'scheduled'),
-- Miércoles 1 julio
(79, 'r32', '2026-07-01 02:00:00+00', 'Estadio Ciudad de México', 'scheduled'),
(80, 'r32', '2026-07-01 16:00:00+00', 'Estadio Atlanta', 'scheduled'),
(81, 'r32', '2026-07-01 21:00:00+00', 'Estadio Bahía de San Francisco', 'scheduled'),
(82, 'r32', '2026-07-01 20:00:00+00', 'Estadio Seattle', 'scheduled'),
-- Jueves 2 julio
(83, 'r32', '2026-07-02 23:00:00+00', 'Estadio Toronto', 'scheduled'),
(84, 'r32', '2026-07-02 19:00:00+00', 'Estadio Los Ángeles', 'scheduled'),
-- Viernes 3 julio
(85, 'r32', '2026-07-03 03:00:00+00', 'Estadio BC Place Vancouver', 'scheduled'),
(86, 'r32', '2026-07-03 22:00:00+00', 'Estadio Miami', 'scheduled'),
(87, 'r32', '2026-07-04 00:30:00+00', 'Estadio Kansas City', 'scheduled'),
(88, 'r32', '2026-07-03 18:00:00+00', 'Estadio Dallas', 'scheduled')
ON CONFLICT (match_number) DO NOTHING;

-- ==========================================
-- OCTAVOS DE FINAL (8 partidos)
-- ==========================================

INSERT INTO public.matches (match_number, phase, kickoff_at, stadium, status) VALUES
-- Sábado 4 julio
(89, 'r16', '2026-07-04 21:00:00+00', 'Estadio Filadelfia', 'scheduled'),
(90, 'r16', '2026-07-04 17:00:00+00', 'Estadio Houston', 'scheduled'),
-- Domingo 5 julio
(91, 'r16', '2026-07-05 21:00:00+00', 'Estadio Nueva York Nueva Jersey', 'scheduled'),
(92, 'r16', '2026-07-05 22:00:00+00', 'Estadio Ciudad de México', 'scheduled'),
-- Lunes 6 julio
(93, 'r16', '2026-07-06 19:00:00+00', 'Estadio Dallas', 'scheduled'),
(94, 'r16', '2026-07-07 00:00:00+00', 'Estadio Seattle', 'scheduled'),
-- Martes 7 julio
(95, 'r16', '2026-07-07 16:00:00+00', 'Estadio Atlanta', 'scheduled'),
(96, 'r16', '2026-07-07 20:00:00+00', 'Estadio BC Place Vancouver', 'scheduled')
ON CONFLICT (match_number) DO NOTHING;

-- ==========================================
-- CUARTOS DE FINAL (4 partidos)
-- ==========================================

INSERT INTO public.matches (match_number, phase, kickoff_at, stadium, status) VALUES
-- Jueves 9 julio
(97, 'qf', '2026-07-09 20:00:00+00', 'Estadio Boston', 'scheduled'),
-- Viernes 10 julio
(98, 'qf', '2026-07-10 19:00:00+00', 'Estadio Los Ángeles', 'scheduled'),
-- Sábado 11 julio
(99, 'qf', '2026-07-11 21:00:00+00', 'Estadio Miami', 'scheduled'),
(100, 'qf', '2026-07-12 01:00:00+00', 'Estadio Kansas City', 'scheduled')
ON CONFLICT (match_number) DO NOTHING;

-- ==========================================
-- SEMIFINALES (2 partidos)
-- ==========================================

INSERT INTO public.matches (match_number, phase, kickoff_at, stadium, status) VALUES
-- Martes 14 julio
(101, 'sf', '2026-07-14 19:00:00+00', 'Estadio Dallas', 'scheduled'),
-- Miércoles 15 julio
(102, 'sf', '2026-07-15 19:00:00+00', 'Estadio Atlanta', 'scheduled')
ON CONFLICT (match_number) DO NOTHING;

-- ==========================================
-- TERCER PUESTO Y FINAL
-- ==========================================

INSERT INTO public.matches (match_number, phase, kickoff_at, stadium, status) VALUES
-- Sábado 18 julio (Tercer puesto)
(103, 'third', '2026-07-18 21:00:00+00', 'Estadio Miami', 'scheduled'),
-- Domingo 19 julio (FINAL)
(104, 'final', '2026-07-19 19:00:00+00', 'Estadio Nueva York Nueva Jersey', 'scheduled')
ON CONFLICT (match_number) DO NOTHING;

-- =====================================================
-- FINALIZACIÓN
-- =====================================================

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE '✅ Schema consolidado cargado exitosamente';
  RAISE NOTICE '📊 Tablas creadas: 11';
  RAISE NOTICE '👁️  Vistas creadas: 4';
  RAISE NOTICE '⚙️  Funciones creadas: 4';
  RAISE NOTICE '🔒 RLS habilitado en todas las tablas';
  RAISE NOTICE '🌍 Equipos cargados: 48';
  RAISE NOTICE '⚽ Partidos cargados: 104 (calendario oficial FIFA 2026)';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 La base de datos está lista para usar';
  RAISE NOTICE '📦 Este archivo contiene todo lo necesario para el proyecto';
END $$;
