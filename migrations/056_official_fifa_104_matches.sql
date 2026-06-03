-- =====================================================
-- 027 - Carga oficial FIFA de 104 partidos Mundial 2026
-- Fuente: https://www.fifa.com/es/tournaments/mens/worldcup/canadamexicousa2026/articles/calendario-fixture-mundial-2026-partidos-fechas
-- Todos los horarios convertidos de EDT (UTC-4) a UTC
-- Estadios según nomenclatura oficial FIFA
-- =====================================================

-- Limpieza total con CASCADE para eliminar predictions relacionados
TRUNCATE matches CASCADE;

-- ==========================================
-- FASE DE GRUPOS (72 partidos)
-- Orden cronológico según FIFA.com
-- ==========================================

INSERT INTO matches (match_number, phase, group_code, home_team_label, away_team_label, kickoff_at, stadium) VALUES
-- Jueves 11 junio
(1, 'group', 'A', 'México', 'Sudáfrica', '2026-06-11 19:00:00+00', 'Estadio Ciudad de México'),
(2, 'group', 'A', 'República de Corea', 'República Checa', '2026-06-12 02:00:00+00', 'Estadio Guadalajara'),
-- Viernes 12 junio
(3, 'group', 'B', 'Canadá', 'Bosnia y Herzegovina', '2026-06-12 19:00:00+00', 'Estadio Toronto'),
(4, 'group', 'D', 'Estados Unidos', 'Paraguay', '2026-06-13 01:00:00+00', 'Estadio Los Ángeles'),
-- Sábado 13 junio
(5, 'group', 'B', 'Catar', 'Suiza', '2026-06-13 19:00:00+00', 'Estadio Bahía de San Francisco'),
(6, 'group', 'C', 'Brasil', 'Marruecos', '2026-06-13 22:00:00+00', 'Estadio Nueva York Nueva Jersey'),
(7, 'group', 'C', 'Haití', 'Escocia', '2026-06-14 01:00:00+00', 'Estadio Boston'),
(8, 'group', 'D', 'Australia', 'Turquía', '2026-06-14 04:00:00+00', 'Estadio BC Place Vancouver'),
-- Domingo 14 junio
(9, 'group', 'E', 'Alemania', 'Curazao', '2026-06-14 17:00:00+00', 'Estadio Houston'),
(10, 'group', 'F', 'Países Bajos', 'Japón', '2026-06-14 20:00:00+00', 'Estadio Dallas'),
(11, 'group', 'E', 'Costa de Marfil', 'Ecuador', '2026-06-14 23:00:00+00', 'Estadio Filadelfia'),
(12, 'group', 'F', 'Suecia', 'Túnez', '2026-06-15 02:00:00+00', 'Estadio Monterrey'),
-- Lunes 15 junio
(13, 'group', 'H', 'España', 'Cabo Verde', '2026-06-15 16:00:00+00', 'Estadio Atlanta'),
(14, 'group', 'G', 'Bélgica', 'Egipto', '2026-06-15 19:00:00+00', 'Estadio Seattle'),
(15, 'group', 'H', 'Arabia Saudí', 'Uruguay', '2026-06-15 22:00:00+00', 'Estadio Miami'),
(16, 'group', 'G', 'RI de Irán', 'Nueva Zelanda', '2026-06-16 01:00:00+00', 'Estadio Los Ángeles'),
-- Martes 16 junio
(17, 'group', 'I', 'Francia', 'Senegal', '2026-06-16 19:00:00+00', 'Estadio Nueva York Nueva Jersey'),
(18, 'group', 'I', 'Irak', 'Noruega', '2026-06-16 22:00:00+00', 'Estadio Boston'),
(19, 'group', 'J', 'Argentina', 'Argelia', '2026-06-17 01:00:00+00', 'Estadio Kansas City'),
(20, 'group', 'J', 'Austria', 'Jordania', '2026-06-17 04:00:00+00', 'Estadio Bahía de San Francisco'),
-- Miércoles 17 junio
(21, 'group', 'K', 'Portugal', 'RD Congo', '2026-06-17 17:00:00+00', 'Estadio Houston'),
(22, 'group', 'L', 'Inglaterra', 'Croacia', '2026-06-17 20:00:00+00', 'Estadio Dallas'),
(23, 'group', 'L', 'Ghana', 'Panamá', '2026-06-17 23:00:00+00', 'Estadio Toronto'),
(24, 'group', 'K', 'Uzbekistán', 'Colombia', '2026-06-18 02:00:00+00', 'Estadio Ciudad de México'),
-- Jueves 18 junio
(25, 'group', 'A', 'República Checa', 'Sudáfrica', '2026-06-18 16:00:00+00', 'Estadio Atlanta'),
(26, 'group', 'B', 'Suiza', 'Bosnia y Herzegovina', '2026-06-18 19:00:00+00', 'Estadio Los Ángeles'),
(27, 'group', 'B', 'Canadá', 'Catar', '2026-06-18 22:00:00+00', 'Estadio BC Place Vancouver'),
(28, 'group', 'A', 'México', 'República de Corea', '2026-06-19 01:00:00+00', 'Estadio Guadalajara'),
-- Viernes 19 junio
(29, 'group', 'D', 'Estados Unidos', 'Australia', '2026-06-19 19:00:00+00', 'Estadio Seattle'),
(30, 'group', 'C', 'Escocia', 'Marruecos', '2026-06-19 22:00:00+00', 'Estadio Boston'),
(31, 'group', 'C', 'Brasil', 'Haití', '2026-06-20 01:00:00+00', 'Estadio Filadelfia'),
(32, 'group', 'D', 'Turquía', 'Paraguay', '2026-06-20 04:00:00+00', 'Estadio Bahía de San Francisco'),
-- Sábado 20 junio
(33, 'group', 'F', 'Países Bajos', 'Suecia', '2026-06-20 17:00:00+00', 'Estadio Houston'),
(34, 'group', 'E', 'Alemania', 'Costa de Marfil', '2026-06-20 20:00:00+00', 'Estadio Toronto'),
(35, 'group', 'E', 'Ecuador', 'Curazao', '2026-06-21 02:00:00+00', 'Estadio Kansas City'),
(36, 'group', 'F', 'Túnez', 'Japón', '2026-06-21 04:00:00+00', 'Estadio Monterrey'),
-- Domingo 21 junio
(37, 'group', 'H', 'España', 'Arabia Saudí', '2026-06-21 16:00:00+00', 'Estadio Atlanta'),
(38, 'group', 'G', 'Bélgica', 'Irán', '2026-06-21 19:00:00+00', 'Estadio Los Ángeles'),
(39, 'group', 'H', 'Uruguay', 'Cabo Verde', '2026-06-21 22:00:00+00', 'Estadio Miami'),
(40, 'group', 'G', 'Nueva Zelanda', 'Egipto', '2026-06-22 01:00:00+00', 'Estadio BC Place Vancouver'),
-- Lunes 22 junio
(41, 'group', 'J', 'Argentina', 'Austria', '2026-06-22 17:00:00+00', 'Estadio Dallas'),
(42, 'group', 'I', 'Francia', 'Irak', '2026-06-22 21:00:00+00', 'Estadio Filadelfia'),
(43, 'group', 'I', 'Noruega', 'Senegal', '2026-06-23 00:00:00+00', 'Estadio Nueva York Nueva Jersey'),
(44, 'group', 'J', 'Jordania', 'Argelia', '2026-06-23 03:00:00+00', 'Estadio Bahía de San Francisco'),
-- Martes 23 junio
(45, 'group', 'K', 'Portugal', 'Uzbekistán', '2026-06-23 17:00:00+00', 'Estadio Houston'),
(46, 'group', 'L', 'Inglaterra', 'Ghana', '2026-06-23 20:00:00+00', 'Estadio Boston'),
(47, 'group', 'L', 'Panamá', 'Croacia', '2026-06-23 23:00:00+00', 'Estadio Toronto'),
(48, 'group', 'K', 'Colombia', 'RD Congo', '2026-06-24 02:00:00+00', 'Estadio Guadalajara'),
-- Miércoles 24 junio
(49, 'group', 'B', 'Suiza', 'Canadá', '2026-06-24 19:00:00+00', 'Estadio BC Place Vancouver'),
(50, 'group', 'B', 'Bosnia y Herzegovina', 'Catar', '2026-06-24 19:00:00+00', 'Estadio Seattle'),
(51, 'group', 'C', 'Escocia', 'Brasil', '2026-06-24 22:00:00+00', 'Estadio Miami'),
(52, 'group', 'C', 'Marruecos', 'Haití', '2026-06-24 22:00:00+00', 'Estadio Atlanta'),
(53, 'group', 'A', 'República Checa', 'México', '2026-06-25 01:00:00+00', 'Estadio Ciudad de México'),
(54, 'group', 'A', 'Sudáfrica', 'República de Corea', '2026-06-25 01:00:00+00', 'Estadio Monterrey'),
-- Jueves 25 junio
(55, 'group', 'E', 'Curazao', 'Costa de Marfil', '2026-06-25 20:00:00+00', 'Estadio Filadelfia'),
(56, 'group', 'E', 'Ecuador', 'Alemania', '2026-06-25 20:00:00+00', 'Estadio Nueva York Nueva Jersey'),
(57, 'group', 'F', 'Japón', 'Suecia', '2026-06-25 23:00:00+00', 'Estadio Dallas'),
(58, 'group', 'F', 'Túnez', 'Países Bajos', '2026-06-25 23:00:00+00', 'Estadio Kansas City'),
(59, 'group', 'D', 'Turquía', 'Estados Unidos', '2026-06-26 02:00:00+00', 'Estadio Los Ángeles'),
(60, 'group', 'D', 'Paraguay', 'Australia', '2026-06-26 02:00:00+00', 'Estadio Bahía de San Francisco'),
-- Viernes 26 junio
(61, 'group', 'I', 'Noruega', 'Francia', '2026-06-26 19:00:00+00', 'Estadio Boston'),
(62, 'group', 'I', 'Senegal', 'Irak', '2026-06-26 19:00:00+00', 'Estadio Toronto'),
(63, 'group', 'H', 'Cabo Verde', 'Arabia Saudí', '2026-06-27 00:00:00+00', 'Estadio Houston'),
(64, 'group', 'H', 'Uruguay', 'España', '2026-06-27 00:00:00+00', 'Estadio Guadalajara'),
(65, 'group', 'G', 'Egipto', 'Irán', '2026-06-27 03:00:00+00', 'Estadio Seattle'),
(66, 'group', 'G', 'Nueva Zelanda', 'Bélgica', '2026-06-27 03:00:00+00', 'Estadio BC Place Vancouver'),
-- Sábado 27 junio
(67, 'group', 'L', 'Panamá', 'Inglaterra', '2026-06-27 21:00:00+00', 'Estadio Nueva York Nueva Jersey'),
(68, 'group', 'L', 'Croacia', 'Ghana', '2026-06-27 21:00:00+00', 'Estadio Filadelfia'),
(69, 'group', 'K', 'Colombia', 'Portugal', '2026-06-27 23:30:00+00', 'Estadio Miami'),
(70, 'group', 'K', 'RD Congo', 'Uzbekistán', '2026-06-27 23:30:00+00', 'Estadio Atlanta'),
(71, 'group', 'J', 'Argelia', 'Austria', '2026-06-28 02:00:00+00', 'Estadio Kansas City'),
(72, 'group', 'J', 'Jordania', 'Argentina', '2026-06-28 02:00:00+00', 'Estadio Dallas');

-- ==========================================
-- DIECISEISAVOS DE FINAL (16 partidos)
-- ==========================================

INSERT INTO matches (match_number, phase, home_team_label, away_team_label, kickoff_at, stadium) VALUES
-- Domingo 28 junio
(73, 'r32', '2A', '2B', '2026-06-28 19:00:00+00', 'Estadio Los Ángeles'),
-- Lunes 29 junio
(74, 'r32', '1E', '3A/B/C/D/F', '2026-06-29 20:30:00+00', 'Estadio Boston'),
(75, 'r32', '1F', '2C', '2026-06-30 01:00:00+00', 'Estadio Monterrey'),
(76, 'r32', '1C', '2F', '2026-06-29 17:00:00+00', 'Estadio Houston'),
-- Martes 30 junio
(77, 'r32', '1I', '3C/D/F/G/H', '2026-06-30 21:00:00+00', 'Estadio Nueva York Nueva Jersey'),
(78, 'r32', '2E', '2I', '2026-06-30 17:00:00+00', 'Estadio Dallas'),
-- Miércoles 1 julio
(79, 'r32', '1A', '3C/E/F/H/I', '2026-07-01 02:00:00+00', 'Estadio Ciudad de México'),
(80, 'r32', '1L', '3E/H/I/J/K', '2026-07-01 16:00:00+00', 'Estadio Atlanta'),
(81, 'r32', '1D', '3B/E/F/I/J', '2026-07-01 21:00:00+00', 'Estadio Bahía de San Francisco'),
(82, 'r32', '1G', '3A/E/H/I/J', '2026-07-01 20:00:00+00', 'Estadio Seattle'),
-- Jueves 2 julio
(83, 'r32', '2K', '2L', '2026-07-02 23:00:00+00', 'Estadio Toronto'),
(84, 'r32', '1H', '2J', '2026-07-02 19:00:00+00', 'Estadio Los Ángeles'),
-- Viernes 3 julio
(85, 'r32', '1B', '3E/F/G/I/J', '2026-07-03 03:00:00+00', 'Estadio BC Place Vancouver'),
(86, 'r32', '1J', '2H', '2026-07-03 22:00:00+00', 'Estadio Miami'),
(87, 'r32', '1K', '3D/E/I/J/L', '2026-07-04 00:30:00+00', 'Estadio Kansas City'),
(88, 'r32', '2D', '2G', '2026-07-03 18:00:00+00', 'Estadio Dallas');

-- ==========================================
-- OCTAVOS DE FINAL (8 partidos)
-- ==========================================

INSERT INTO matches (match_number, phase, home_team_label, away_team_label, kickoff_at, stadium) VALUES
-- Sábado 4 julio
(89, 'r16', 'W74', 'W77', '2026-07-04 21:00:00+00', 'Estadio Filadelfia'),
(90, 'r16', 'W73', 'W75', '2026-07-04 17:00:00+00', 'Estadio Houston'),
-- Domingo 5 julio
(91, 'r16', 'W76', 'W78', '2026-07-05 21:00:00+00', 'Estadio Nueva York Nueva Jersey'),
(92, 'r16', 'W79', 'W80', '2026-07-05 22:00:00+00', 'Estadio Ciudad de México'),
-- Lunes 6 julio
(93, 'r16', 'W83', 'W84', '2026-07-06 19:00:00+00', 'Estadio Dallas'),
(94, 'r16', 'W81', 'W82', '2026-07-07 00:00:00+00', 'Estadio Seattle'),
-- Martes 7 julio
(95, 'r16', 'W86', 'W88', '2026-07-07 16:00:00+00', 'Estadio Atlanta'),
(96, 'r16', 'W85', 'W87', '2026-07-07 20:00:00+00', 'Estadio BC Place Vancouver');

-- ==========================================
-- CUARTOS DE FINAL (4 partidos)
-- ==========================================

INSERT INTO matches (match_number, phase, home_team_label, away_team_label, kickoff_at, stadium) VALUES
-- Jueves 9 julio
(97, 'qf', 'W89', 'W90', '2026-07-09 20:00:00+00', 'Estadio Boston'),
-- Viernes 10 julio
(98, 'qf', 'W93', 'W94', '2026-07-10 19:00:00+00', 'Estadio Los Ángeles'),
-- Sábado 11 julio
(99, 'qf', 'W91', 'W92', '2026-07-11 21:00:00+00', 'Estadio Miami'),
(100, 'qf', 'W95', 'W96', '2026-07-12 01:00:00+00', 'Estadio Kansas City');

-- ==========================================
-- SEMIFINALES (2 partidos)
-- ==========================================

INSERT INTO matches (match_number, phase, home_team_label, away_team_label, kickoff_at, stadium) VALUES
-- Martes 14 julio
(101, 'sf', 'W97', 'W98', '2026-07-14 19:00:00+00', 'Estadio Dallas'),
-- Miércoles 15 julio
(102, 'sf', 'W99', 'W100', '2026-07-15 19:00:00+00', 'Estadio Atlanta');

-- ==========================================
-- TERCER PUESTO Y FINAL
-- ==========================================

INSERT INTO matches (match_number, phase, home_team_label, away_team_label, kickoff_at, stadium) VALUES
-- Sábado 18 julio (Tercer puesto)
(103, 'third', 'L101', 'L102', '2026-07-18 21:00:00+00', 'Estadio Miami'),
-- Domingo 19 julio (FINAL)
(104, 'final', 'W101', 'W102', '2026-07-19 19:00:00+00', 'Estadio Nueva York Nueva Jersey');

-- ==========================================
-- Vincular equipos anfitriones y asignados por sorteo
-- ==========================================

-- Actualizar equipos de fase de grupos con sus IDs reales
UPDATE matches m
SET home_team_id = t.id
FROM teams t
WHERE m.phase = 'group'
  AND m.home_team_label = t.name;

UPDATE matches m
SET away_team_id = t.id
FROM teams t
WHERE m.phase = 'group'
  AND m.away_team_label = t.name;
