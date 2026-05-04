-- =====================================================
-- 015 - Datos OFICIALES verificados (FIFA + medios deportivos)
-- Sobrescribe ~50 partidos de fase de grupos con fecha+estadio reales.
-- Match by team-pair (orden indiferente).
-- =====================================================

update public.matches set kickoff_at = '2026-06-11 19:00:00+00', stadium = 'Estadio Azteca, Ciudad de México' where (home_team_id = 1 and away_team_id = 2) or (home_team_id = 2 and away_team_id = 1);
update public.matches set kickoff_at = '2026-06-12 02:00:00+00', stadium = 'Estadio Akron, Guadalajara' where (home_team_id = 3 and away_team_id = 4) or (home_team_id = 4 and away_team_id = 3);
update public.matches set kickoff_at = '2026-06-12 19:00:00+00', stadium = 'BMO Field, Toronto' where (home_team_id = 5 and away_team_id = 8) or (home_team_id = 8 and away_team_id = 5);
update public.matches set kickoff_at = '2026-06-13 01:00:00+00', stadium = 'SoFi Stadium, Inglewood (Los Angeles)' where (home_team_id = 13 and away_team_id = 14) or (home_team_id = 14 and away_team_id = 13);
update public.matches set kickoff_at = '2026-06-13 19:00:00+00', stadium = 'Levi''s Stadium, Santa Clara (San Francisco Bay Area)' where (home_team_id = 6 and away_team_id = 7) or (home_team_id = 7 and away_team_id = 6);
update public.matches set kickoff_at = '2026-06-13 22:00:00+00', stadium = 'MetLife Stadium, East Rutherford (Nueva York/Nueva Jersey)' where (home_team_id = 9 and away_team_id = 10) or (home_team_id = 10 and away_team_id = 9);
update public.matches set kickoff_at = '2026-06-14 04:00:00+00', stadium = 'BC Place, Vancouver' where (home_team_id = 15 and away_team_id = 16) or (home_team_id = 16 and away_team_id = 15);
update public.matches set kickoff_at = '2026-06-14 17:00:00+00', stadium = 'NRG Stadium, Houston' where (home_team_id = 17 and away_team_id = 18) or (home_team_id = 18 and away_team_id = 17);
update public.matches set kickoff_at = '2026-06-15 02:00:00+00', stadium = 'Estadio BBVA, Monterrey' where (home_team_id = 23 and away_team_id = 24) or (home_team_id = 24 and away_team_id = 23);
update public.matches set kickoff_at = '2026-06-15 16:00:00+00', stadium = 'Mercedes-Benz Stadium, Atlanta' where (home_team_id = 29 and away_team_id = 30) or (home_team_id = 30 and away_team_id = 29);
update public.matches set kickoff_at = '2026-06-15 22:00:00+00', stadium = 'Hard Rock Stadium, Miami' where (home_team_id = 31 and away_team_id = 32) or (home_team_id = 32 and away_team_id = 31);
update public.matches set kickoff_at = '2026-06-16 01:00:00+00', stadium = null where (home_team_id = 27 and away_team_id = 28) or (home_team_id = 28 and away_team_id = 27);
update public.matches set kickoff_at = '2026-06-16 04:00:00+00', stadium = 'Levi''s Stadium, Santa Clara (San Francisco Bay Area)' where (home_team_id = 39 and away_team_id = 40) or (home_team_id = 40 and away_team_id = 39);
update public.matches set kickoff_at = '2026-06-16 19:00:00+00', stadium = 'MetLife Stadium, East Rutherford (Nueva York/Nueva Jersey)' where (home_team_id = 33 and away_team_id = 34) or (home_team_id = 34 and away_team_id = 33);
update public.matches set kickoff_at = '2026-06-16 22:00:00+00', stadium = 'Gillette Stadium, Foxborough (Boston)' where (home_team_id = 35 and away_team_id = 36) or (home_team_id = 36 and away_team_id = 35);
update public.matches set kickoff_at = '2026-06-17 01:00:00+00', stadium = 'Arrowhead Stadium, Kansas City' where (home_team_id = 37 and away_team_id = 38) or (home_team_id = 38 and away_team_id = 37);
update public.matches set kickoff_at = '2026-06-17 17:00:00+00', stadium = 'NRG Stadium, Houston' where (home_team_id = 41 and away_team_id = 44) or (home_team_id = 44 and away_team_id = 41);
update public.matches set kickoff_at = '2026-06-17 20:00:00+00', stadium = null where (home_team_id = 45 and away_team_id = 46) or (home_team_id = 46 and away_team_id = 45);
update public.matches set kickoff_at = '2026-06-17 23:00:00+00', stadium = null where (home_team_id = 47 and away_team_id = 48) or (home_team_id = 48 and away_team_id = 47);
update public.matches set kickoff_at = '2026-06-18 02:00:00+00', stadium = 'Estadio Azteca, Ciudad de México' where (home_team_id = 42 and away_team_id = 43) or (home_team_id = 43 and away_team_id = 42);
update public.matches set kickoff_at = '2026-06-18 16:00:00+00', stadium = 'Mercedes-Benz Stadium, Atlanta' where (home_team_id = 2 and away_team_id = 4) or (home_team_id = 4 and away_team_id = 2);
update public.matches set kickoff_at = '2026-06-18 19:00:00+00', stadium = null where (home_team_id = 6 and away_team_id = 8) or (home_team_id = 8 and away_team_id = 6);
update public.matches set kickoff_at = '2026-06-18 22:00:00+00', stadium = null where (home_team_id = 5 and away_team_id = 7) or (home_team_id = 7 and away_team_id = 5);
update public.matches set kickoff_at = '2026-06-19 01:00:00+00', stadium = 'Estadio Akron, Guadalajara' where (home_team_id = 1 and away_team_id = 3) or (home_team_id = 3 and away_team_id = 1);
update public.matches set kickoff_at = '2026-06-19 19:00:00+00', stadium = 'Lumen Field, Seattle' where (home_team_id = 13 and away_team_id = 15) or (home_team_id = 15 and away_team_id = 13);
update public.matches set kickoff_at = '2026-06-19 22:00:00+00', stadium = null where (home_team_id = 10 and away_team_id = 12) or (home_team_id = 12 and away_team_id = 10);
update public.matches set kickoff_at = '2026-06-20 01:00:00+00', stadium = null where (home_team_id = 9 and away_team_id = 11) or (home_team_id = 11 and away_team_id = 9);
update public.matches set kickoff_at = '2026-06-20 03:00:00+00', stadium = 'Levi''s Stadium, Santa Clara (San Francisco Bay Area)' where (home_team_id = 14 and away_team_id = 16) or (home_team_id = 16 and away_team_id = 14);
update public.matches set kickoff_at = '2026-06-20 04:00:00+00', stadium = 'Estadio BBVA, Monterrey' where (home_team_id = 22 and away_team_id = 23) or (home_team_id = 23 and away_team_id = 22);
update public.matches set kickoff_at = '2026-06-20 17:00:00+00', stadium = 'NRG Stadium, Houston' where (home_team_id = 21 and away_team_id = 24) or (home_team_id = 24 and away_team_id = 21);
update public.matches set kickoff_at = '2026-06-20 20:00:00+00', stadium = 'BMO Field, Toronto' where (home_team_id = 17 and away_team_id = 19) or (home_team_id = 19 and away_team_id = 17);
update public.matches set kickoff_at = '2026-06-21 00:00:00+00', stadium = null where (home_team_id = 18 and away_team_id = 20) or (home_team_id = 20 and away_team_id = 18);
update public.matches set kickoff_at = '2026-06-21 16:00:00+00', stadium = 'Mercedes-Benz Stadium, Atlanta' where (home_team_id = 29 and away_team_id = 31) or (home_team_id = 31 and away_team_id = 29);
update public.matches set kickoff_at = '2026-06-21 19:00:00+00', stadium = 'SoFi Stadium, Inglewood (Los Angeles)' where (home_team_id = 25 and away_team_id = 27) or (home_team_id = 27 and away_team_id = 25);
update public.matches set kickoff_at = '2026-06-21 22:00:00+00', stadium = 'Hard Rock Stadium, Miami' where (home_team_id = 30 and away_team_id = 32) or (home_team_id = 32 and away_team_id = 30);
update public.matches set kickoff_at = '2026-06-22 17:00:00+00', stadium = null where (home_team_id = 37 and away_team_id = 39) or (home_team_id = 39 and away_team_id = 37);
update public.matches set kickoff_at = '2026-06-22 21:00:00+00', stadium = 'Lincoln Financial Field, Philadelphia' where (home_team_id = 33 and away_team_id = 36) or (home_team_id = 36 and away_team_id = 33);
update public.matches set kickoff_at = '2026-06-23 00:00:00+00', stadium = 'MetLife Stadium, East Rutherford (Nueva York/Nueva Jersey)' where (home_team_id = 34 and away_team_id = 35) or (home_team_id = 35 and away_team_id = 34);
update public.matches set kickoff_at = '2026-06-23 03:00:00+00', stadium = null where (home_team_id = 38 and away_team_id = 40) or (home_team_id = 40 and away_team_id = 38);
update public.matches set kickoff_at = '2026-06-24 19:00:00+00', stadium = 'BC Place, Vancouver' where (home_team_id = 5 and away_team_id = 6) or (home_team_id = 6 and away_team_id = 5);
update public.matches set kickoff_at = '2026-06-24 19:00:00+00', stadium = 'Lumen Field, Seattle' where (home_team_id = 7 and away_team_id = 8) or (home_team_id = 8 and away_team_id = 7);
update public.matches set kickoff_at = '2026-06-24 22:00:00+00', stadium = 'Hard Rock Stadium, Miami' where (home_team_id = 9 and away_team_id = 12) or (home_team_id = 12 and away_team_id = 9);
update public.matches set kickoff_at = '2026-06-24 22:00:00+00', stadium = 'Mercedes-Benz Stadium, Atlanta' where (home_team_id = 10 and away_team_id = 11) or (home_team_id = 11 and away_team_id = 10);
update public.matches set kickoff_at = '2026-06-25 01:00:00+00', stadium = 'Estadio Azteca, Ciudad de México' where (home_team_id = 1 and away_team_id = 4) or (home_team_id = 4 and away_team_id = 1);
update public.matches set kickoff_at = '2026-06-25 01:00:00+00', stadium = 'Estadio BBVA, Monterrey' where (home_team_id = 2 and away_team_id = 3) or (home_team_id = 3 and away_team_id = 2);
update public.matches set kickoff_at = '2026-06-25 20:00:00+00', stadium = 'MetLife Stadium, East Rutherford (Nueva York/Nueva Jersey)' where (home_team_id = 17 and away_team_id = 20) or (home_team_id = 20 and away_team_id = 17);
update public.matches set kickoff_at = '2026-06-25 20:00:00+00', stadium = 'Lincoln Financial Field, Philadelphia' where (home_team_id = 18 and away_team_id = 19) or (home_team_id = 19 and away_team_id = 18);
update public.matches set kickoff_at = '2026-06-26 02:00:00+00', stadium = 'SoFi Stadium, Inglewood (Los Angeles)' where (home_team_id = 13 and away_team_id = 16) or (home_team_id = 16 and away_team_id = 13);
update public.matches set kickoff_at = '2026-06-26 02:00:00+00', stadium = 'Levi''s Stadium, Santa Clara (San Francisco Bay Area)' where (home_team_id = 14 and away_team_id = 15) or (home_team_id = 15 and away_team_id = 14);
update public.matches set kickoff_at = '2026-06-27 21:00:00+00', stadium = 'MetLife Stadium, East Rutherford (Nueva York/Nueva Jersey)' where (home_team_id = 45 and away_team_id = 48) or (home_team_id = 48 and away_team_id = 45);
update public.matches set kickoff_at = '2026-06-27 21:00:00+00', stadium = 'Lincoln Financial Field, Philadelphia' where (home_team_id = 46 and away_team_id = 47) or (home_team_id = 47 and away_team_id = 46);
update public.matches set kickoff_at = '2026-06-27 23:30:00+00', stadium = 'Mercedes-Benz Stadium, Atlanta' where (home_team_id = 42 and away_team_id = 44) or (home_team_id = 44 and away_team_id = 42);

update public.settings set lock_at = '2026-06-11 19:00:00+00' where id = 1;
