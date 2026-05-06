-- =====================================================
-- 027 - Limpieza y carga oficial de los 104 partidos
-- Fuente: FIFA + Wikipedia (Mayo 2026)
-- Horarios UTC, estadios oficiales, emparejamientos del sorteo
-- =====================================================

-- Limpiar todos los partidos actuales
DELETE FROM public.predictions;
DELETE FROM public.matches;

-- FASE DE GRUPOS (72 partidos)
-- Estructura: match_number, phase, group_code, position_home (1-4), position_away (1-4), kickoff_at UTC, stadium

-- GRUPO A
INSERT INTO public.matches (match_number, phase, group_code, home_team_label, away_team_label, kickoff_at, stadium) VALUES
(1, 'group', 'A', 'A1', 'A2', '2026-06-11 19:00:00+00', 'Estadio Azteca, Ciudad de México'),
(2, 'group', 'A', 'A3', 'A4', '2026-06-12 02:00:00+00', 'Estadio Akron, Guadalajara'),
(25, 'group', 'A', 'A4', 'A2', '2026-06-18 16:00:00+00', 'Mercedes-Benz Stadium, Atlanta'),
(28, 'group', 'A', 'A1', 'A3', '2026-06-19 01:00:00+00', 'Estadio Akron, Guadalajara'),
(53, 'group', 'A', 'A4', 'A1', '2026-06-25 01:00:00+00', 'Estadio Azteca, Ciudad de México'),
(54, 'group', 'A', 'A2', 'A3', '2026-06-25 01:00:00+00', 'Estadio BBVA, Monterrey');

-- GRUPO B
INSERT INTO public.matches (match_number, phase, group_code, home_team_label, away_team_label, kickoff_at, stadium) VALUES
(3, 'group', 'B', 'B1', 'B2', '2026-06-12 19:00:00+00', 'BMO Field, Toronto'),
(8, 'group', 'B', 'B3', 'B4', '2026-06-13 19:00:00+00', 'Levi''s Stadium, Área de la Bahía de San Francisco'),
(26, 'group', 'B', 'B4', 'B2', '2026-06-18 19:00:00+00', 'SoFi Stadium, Los Ángeles'),
(27, 'group', 'B', 'B1', 'B3', '2026-06-18 22:00:00+00', 'BC Place, Vancouver'),
(51, 'group', 'B', 'B4', 'B1', '2026-06-24 19:00:00+00', 'BC Place, Vancouver'),
(52, 'group', 'B', 'B2', 'B3', '2026-06-24 19:00:00+00', 'Lumen Field, Seattle');

-- GRUPO C
INSERT INTO public.matches (match_number, phase, group_code, home_team_label, away_team_label, kickoff_at, stadium) VALUES
(7, 'group', 'C', 'C1', 'C2', '2026-06-13 22:00:00+00', 'MetLife Stadium, Nueva York/Nueva Jersey'),
(5, 'group', 'C', 'C3', 'C4', '2026-06-14 01:00:00+00', 'Gillette Stadium, Boston'),
(30, 'group', 'C', 'C4', 'C2', '2026-06-19 22:00:00+00', 'Gillette Stadium, Boston'),
(29, 'group', 'C', 'C1', 'C3', '2026-06-20 00:30:00+00', 'Lincoln Financial Field, Filadelfia'),
(49, 'group', 'C', 'C4', 'C1', '2026-06-24 22:00:00+00', 'Hard Rock Stadium, Miami'),
(50, 'group', 'C', 'C2', 'C3', '2026-06-24 22:00:00+00', 'Mercedes-Benz Stadium, Atlanta');

-- GRUPO D
INSERT INTO public.matches (match_number, phase, group_code, home_team_label, away_team_label, kickoff_at, stadium) VALUES
(4, 'group', 'D', 'D1', 'D2', '2026-06-13 01:00:00+00', 'SoFi Stadium, Los Ángeles'),
(6, 'group', 'D', 'D3', 'D4', '2026-06-14 04:00:00+00', 'BC Place, Vancouver'),
(32, 'group', 'D', 'D1', 'D3', '2026-06-19 19:00:00+00', 'Lumen Field, Seattle'),
(31, 'group', 'D', 'D4', 'D2', '2026-06-20 03:00:00+00', 'Levi''s Stadium, Área de la Bahía de San Francisco'),
(59, 'group', 'D', 'D4', 'D1', '2026-06-26 02:00:00+00', 'SoFi Stadium, Los Ángeles'),
(60, 'group', 'D', 'D2', 'D3', '2026-06-26 02:00:00+00', 'Levi''s Stadium, Área de la Bahía de San Francisco');

-- GRUPO E
INSERT INTO public.matches (match_number, phase, group_code, home_team_label, away_team_label, kickoff_at, stadium) VALUES
(10, 'group', 'E', 'E1', 'E2', '2026-06-14 17:00:00+00', 'NRG Stadium, Houston'),
(9, 'group', 'E', 'E3', 'E4', '2026-06-14 23:00:00+00', 'Lincoln Financial Field, Filadelfia'),
(33, 'group', 'E', 'E1', 'E3', '2026-06-20 20:00:00+00', 'BMO Field, Toronto'),
(34, 'group', 'E', 'E4', 'E2', '2026-06-21 00:00:00+00', 'Arrowhead Stadium, Kansas City'),
(55, 'group', 'E', 'E2', 'E3', '2026-06-25 20:00:00+00', 'Lincoln Financial Field, Filadelfia'),
(56, 'group', 'E', 'E4', 'E1', '2026-06-25 20:00:00+00', 'MetLife Stadium, Nueva York/Nueva Jersey');

-- GRUPO F
INSERT INTO public.matches (match_number, phase, group_code, home_team_label, away_team_label, kickoff_at, stadium) VALUES
(11, 'group', 'F', 'F1', 'F2', '2026-06-14 20:00:00+00', 'AT&T Stadium, Dallas'),
(12, 'group', 'F', 'F3', 'F4', '2026-06-15 02:00:00+00', 'Estadio BBVA, Monterrey'),
(35, 'group', 'F', 'F1', 'F3', '2026-06-20 17:00:00+00', 'NRG Stadium, Houston'),
(36, 'group', 'F', 'F4', 'F2', '2026-06-21 04:00:00+00', 'Estadio BBVA, Monterrey'),
(57, 'group', 'F', 'F2', 'F3', '2026-06-25 23:00:00+00', 'AT&T Stadium, Dallas'),
(58, 'group', 'F', 'F4', 'F1', '2026-06-26 00:00:00+00', 'Arrowhead Stadium, Kansas City');

-- GRUPO G
INSERT INTO public.matches (match_number, phase, group_code, home_team_label, away_team_label, kickoff_at, stadium) VALUES
(16, 'group', 'G', 'G1', 'G2', '2026-06-15 19:00:00+00', 'Lumen Field, Seattle'),
(15, 'group', 'G', 'G3', 'G4', '2026-06-16 01:00:00+00', 'SoFi Stadium, Los Ángeles'),
(39, 'group', 'G', 'G1', 'G3', '2026-06-21 19:00:00+00', 'SoFi Stadium, Los Ángeles'),
(40, 'group', 'G', 'G4', 'G2', '2026-06-22 01:00:00+00', 'BC Place, Vancouver'),
(63, 'group', 'G', 'G2', 'G3', '2026-06-27 03:00:00+00', 'Lumen Field, Seattle'),
(64, 'group', 'G', 'G4', 'G1', '2026-06-27 03:00:00+00', 'BC Place, Vancouver');

-- GRUPO H
INSERT INTO public.matches (match_number, phase, group_code, home_team_label, away_team_label, kickoff_at, stadium) VALUES
(14, 'group', 'H', 'H1', 'H2', '2026-06-15 16:00:00+00', 'Mercedes-Benz Stadium, Atlanta'),
(13, 'group', 'H', 'H3', 'H4', '2026-06-15 22:00:00+00', 'Hard Rock Stadium, Miami'),
(38, 'group', 'H', 'H1', 'H3', '2026-06-21 16:00:00+00', 'Mercedes-Benz Stadium, Atlanta'),
(37, 'group', 'H', 'H4', 'H2', '2026-06-21 22:00:00+00', 'Hard Rock Stadium, Miami'),
(65, 'group', 'H', 'H2', 'H3', '2026-06-27 00:00:00+00', 'NRG Stadium, Houston'),
(66, 'group', 'H', 'H4', 'H1', '2026-06-27 01:00:00+00', 'Estadio Akron, Guadalajara');

-- GRUPO I
INSERT INTO public.matches (match_number, phase, group_code, home_team_label, away_team_label, kickoff_at, stadium) VALUES
(17, 'group', 'I', 'I1', 'I2', '2026-06-16 19:00:00+00', 'MetLife Stadium, Nueva York/Nueva Jersey'),
(18, 'group', 'I', 'I3', 'I4', '2026-06-16 22:00:00+00', 'Gillette Stadium, Boston'),
(42, 'group', 'I', 'I1', 'I3', '2026-06-22 21:00:00+00', 'Lincoln Financial Field, Filadelfia'),
(41, 'group', 'I', 'I4', 'I2', '2026-06-23 00:00:00+00', 'MetLife Stadium, Nueva York/Nueva Jersey'),
(61, 'group', 'I', 'I4', 'I1', '2026-06-26 19:00:00+00', 'Gillette Stadium, Boston'),
(62, 'group', 'I', 'I2', 'I3', '2026-06-26 19:00:00+00', 'BMO Field, Toronto');

-- GRUPO J
INSERT INTO public.matches (match_number, phase, group_code, home_team_label, away_team_label, kickoff_at, stadium) VALUES
(19, 'group', 'J', 'J1', 'J2', '2026-06-17 01:00:00+00', 'Arrowhead Stadium, Kansas City'),
(20, 'group', 'J', 'J3', 'J4', '2026-06-17 04:00:00+00', 'Levi''s Stadium, Área de la Bahía de San Francisco'),
(43, 'group', 'J', 'J1', 'J3', '2026-06-22 17:00:00+00', 'AT&T Stadium, Dallas'),
(44, 'group', 'J', 'J4', 'J2', '2026-06-23 03:00:00+00', 'Levi''s Stadium, Área de la Bahía de San Francisco'),
(69, 'group', 'J', 'J2', 'J3', '2026-06-28 02:00:00+00', 'Arrowhead Stadium, Kansas City'),
(70, 'group', 'J', 'J4', 'J1', '2026-06-28 02:00:00+00', 'AT&T Stadium, Dallas');

-- GRUPO K
INSERT INTO public.matches (match_number, phase, group_code, home_team_label, away_team_label, kickoff_at, stadium) VALUES
(23, 'group', 'K', 'K1', 'K2', '2026-06-17 17:00:00+00', 'NRG Stadium, Houston'),
(24, 'group', 'K', 'K3', 'K4', '2026-06-18 02:00:00+00', 'Estadio Azteca, Ciudad de México'),
(47, 'group', 'K', 'K1', 'K3', '2026-06-23 17:00:00+00', 'NRG Stadium, Houston'),
(48, 'group', 'K', 'K4', 'K2', '2026-06-24 02:00:00+00', 'Estadio Akron, Guadalajara'),
(71, 'group', 'K', 'K4', 'K1', '2026-06-27 23:30:00+00', 'Hard Rock Stadium, Miami'),
(72, 'group', 'K', 'K2', 'K3', '2026-06-27 23:30:00+00', 'Mercedes-Benz Stadium, Atlanta');

-- GRUPO L
INSERT INTO public.matches (match_number, phase, group_code, home_team_label, away_team_label, kickoff_at, stadium) VALUES
(22, 'group', 'L', 'L1', 'L2', '2026-06-17 20:00:00+00', 'AT&T Stadium, Dallas'),
(21, 'group', 'L', 'L3', 'L4', '2026-06-17 23:00:00+00', 'BMO Field, Toronto'),
(45, 'group', 'L', 'L1', 'L3', '2026-06-23 20:00:00+00', 'Gillette Stadium, Boston'),
(46, 'group', 'L', 'L4', 'L2', '2026-06-23 23:00:00+00', 'BMO Field, Toronto'),
(67, 'group', 'L', 'L4', 'L1', '2026-06-27 21:00:00+00', 'MetLife Stadium, Nueva York/Nueva Jersey'),
(68, 'group', 'L', 'L2', 'L3', '2026-06-27 21:00:00+00', 'Lincoln Financial Field, Filadelfia');

-- FASE ELIMINATORIA (32 partidos)
-- Round of 32 (16 partidos)
INSERT INTO public.matches (match_number, phase, home_team_label, away_team_label, kickoff_at, stadium) VALUES
(73, 'r32', '2A', '2B', '2026-06-28 19:00:00+00', 'SoFi Stadium, Los Ángeles'),
(74, 'r32', '1E', '3A/B/C/D/F', '2026-06-29 20:30:00+00', 'Gillette Stadium, Boston'),
(75, 'r32', '1F', '2C', '2026-06-30 01:00:00+00', 'Estadio BBVA, Monterrey'),
(76, 'r32', '1C', '2F', '2026-06-29 17:00:00+00', 'NRG Stadium, Houston'),
(77, 'r32', '1I', '3C/D/F/G/H', '2026-06-30 21:00:00+00', 'MetLife Stadium, Nueva York/Nueva Jersey'),
(78, 'r32', '2E', '2I', '2026-06-30 17:00:00+00', 'AT&T Stadium, Dallas'),
(79, 'r32', '1A', '3C/E/F/H/I', '2026-07-01 02:00:00+00', 'Estadio Azteca, Ciudad de México'),
(80, 'r32', '1L', '3E/H/I/J/K', '2026-07-01 16:00:00+00', 'Mercedes-Benz Stadium, Atlanta'),
(81, 'r32', '1D', '3B/E/F/I/J', '2026-07-01 21:00:00+00', 'Levi''s Stadium, Área de la Bahía de San Francisco'),
(82, 'r32', '1G', '3A/E/H/I/J', '2026-07-01 20:00:00+00', 'Lumen Field, Seattle'),
(83, 'r32', '2K', '2L', '2026-07-02 23:00:00+00', 'BMO Field, Toronto'),
(84, 'r32', '1H', '2J', '2026-07-02 19:00:00+00', 'SoFi Stadium, Los Ángeles'),
(85, 'r32', '1B', '3E/F/G/I/J', '2026-07-03 03:00:00+00', 'BC Place, Vancouver'),
(86, 'r32', '1J', '2H', '2026-07-03 22:00:00+00', 'Hard Rock Stadium, Miami'),
(87, 'r32', '1K', '3D/E/I/J/L', '2026-07-04 00:30:00+00', 'Arrowhead Stadium, Kansas City'),
(88, 'r32', '2D', '2G', '2026-07-03 18:00:00+00', 'AT&T Stadium, Dallas');

-- Round of 16 (8 partidos)
INSERT INTO public.matches (match_number, phase, home_team_label, away_team_label, kickoff_at, stadium) VALUES
(89, 'r16', 'W74', 'W77', '2026-07-04 21:00:00+00', 'Lincoln Financial Field, Filadelfia'),
(90, 'r16', 'W73', 'W75', '2026-07-04 17:00:00+00', 'NRG Stadium, Houston'),
(91, 'r16', 'W76', 'W78', '2026-07-05 21:00:00+00', 'MetLife Stadium, Nueva York/Nueva Jersey'),
(92, 'r16', 'W79', 'W80', '2026-07-05 22:00:00+00', 'Estadio Azteca, Ciudad de México'),
(93, 'r16', 'W83', 'W84', '2026-07-06 19:00:00+00', 'AT&T Stadium, Dallas'),
(94, 'r16', 'W81', 'W82', '2026-07-07 00:00:00+00', 'Lumen Field, Seattle'),
(95, 'r16', 'W86', 'W88', '2026-07-07 16:00:00+00', 'Mercedes-Benz Stadium, Atlanta'),
(96, 'r16', 'W85', 'W87', '2026-07-07 20:00:00+00', 'BC Place, Vancouver');

-- Quarterfinals (4 partidos)
INSERT INTO public.matches (match_number, phase, home_team_label, away_team_label, kickoff_at, stadium) VALUES
(97, 'qf', 'W89', 'W90', '2026-07-09 20:00:00+00', 'Gillette Stadium, Boston'),
(98, 'qf', 'W93', 'W94', '2026-07-10 19:00:00+00', 'SoFi Stadium, Los Ángeles'),
(99, 'qf', 'W91', 'W92', '2026-07-11 21:00:00+00', 'Hard Rock Stadium, Miami'),
(100, 'qf', 'W95', 'W96', '2026-07-12 01:00:00+00', 'Arrowhead Stadium, Kansas City');

-- Semifinals (2 partidos)
INSERT INTO public.matches (match_number, phase, home_team_label, away_team_label, kickoff_at, stadium) VALUES
(101, 'sf', 'W97', 'W98', '2026-07-14 19:00:00+00', 'AT&T Stadium, Dallas'),
(102, 'sf', 'W99', 'W100', '2026-07-15 19:00:00+00', 'Mercedes-Benz Stadium, Atlanta');

-- Third place (1 partido)
INSERT INTO public.matches (match_number, phase, home_team_label, away_team_label, kickoff_at, stadium) VALUES
(103, 'third', 'L101', 'L102', '2026-07-18 21:00:00+00', 'Hard Rock Stadium, Miami');

-- Final (1 partido)
INSERT INTO public.matches (match_number, phase, home_team_label, away_team_label, kickoff_at, stadium) VALUES
(104, 'final', 'W101', 'W102', '2026-07-19 19:00:00+00', 'MetLife Stadium, Nueva York/Nueva Jersey');

-- Actualizar emparejamientos de fase de grupos con equipos reales
UPDATE public.matches m
SET home_team_id = t.id, home_team_label = t.name
FROM public.teams t
WHERE m.phase = 'group'
  AND m.group_code = t.group_code
  AND m.home_team_label = CONCAT(t.group_code, t.position_in_group::text);

UPDATE public.matches m
SET away_team_id = t.id, away_team_label = t.name
FROM public.teams t
WHERE m.phase = 'group'
  AND m.group_code = t.group_code
  AND m.away_team_label = CONCAT(t.group_code, t.position_in_group::text);
