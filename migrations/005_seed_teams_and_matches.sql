-- =====================================================
-- 005 - Seed inicial: 48 equipos placeholder + 104 partidos
-- (Los nombres reales se cargan en migración 008)
-- =====================================================

INSERT INTO public.teams (code, name, group_code, position_in_group) VALUES
('A1', 'Equipo A1', 'A', 1),('A2', 'Equipo A2', 'A', 2),('A3', 'Equipo A3', 'A', 3),('A4', 'Equipo A4', 'A', 4),
('B1', 'Equipo B1', 'B', 1),('B2', 'Equipo B2', 'B', 2),('B3', 'Equipo B3', 'B', 3),('B4', 'Equipo B4', 'B', 4),
('C1', 'Equipo C1', 'C', 1),('C2', 'Equipo C2', 'C', 2),('C3', 'Equipo C3', 'C', 3),('C4', 'Equipo C4', 'C', 4),
('D1', 'Equipo D1', 'D', 1),('D2', 'Equipo D2', 'D', 2),('D3', 'Equipo D3', 'D', 3),('D4', 'Equipo D4', 'D', 4),
('E1', 'Equipo E1', 'E', 1),('E2', 'Equipo E2', 'E', 2),('E3', 'Equipo E3', 'E', 3),('E4', 'Equipo E4', 'E', 4),
('F1', 'Equipo F1', 'F', 1),('F2', 'Equipo F2', 'F', 2),('F3', 'Equipo F3', 'F', 3),('F4', 'Equipo F4', 'F', 4),
('G1', 'Equipo G1', 'G', 1),('G2', 'Equipo G2', 'G', 2),('G3', 'Equipo G3', 'G', 3),('G4', 'Equipo G4', 'G', 4),
('H1', 'Equipo H1', 'H', 1),('H2', 'Equipo H2', 'H', 2),('H3', 'Equipo H3', 'H', 3),('H4', 'Equipo H4', 'H', 4),
('I1', 'Equipo I1', 'I', 1),('I2', 'Equipo I2', 'I', 2),('I3', 'Equipo I3', 'I', 3),('I4', 'Equipo I4', 'I', 4),
('J1', 'Equipo J1', 'J', 1),('J2', 'Equipo J2', 'J', 2),('J3', 'Equipo J3', 'J', 3),('J4', 'Equipo J4', 'J', 4),
('K1', 'Equipo K1', 'K', 1),('K2', 'Equipo K2', 'K', 2),('K3', 'Equipo K3', 'K', 3),('K4', 'Equipo K4', 'K', 4),
('L1', 'Equipo L1', 'L', 1),('L2', 'Equipo L2', 'L', 2),('L3', 'Equipo L3', 'L', 3),('L4', 'Equipo L4', 'L', 4);

-- 72 partidos de fase de grupos (patrón 1v2, 3v4, 1v3, 2v4, 1v4, 2v3 por cada grupo)
INSERT INTO public.matches (phase, group_code, match_number, home_team_id, away_team_id, home_team_label, away_team_label) VALUES
('group','A',1,1,2,'Equipo A1','Equipo A2'),('group','A',2,3,4,'Equipo A3','Equipo A4'),
('group','A',3,1,3,'Equipo A1','Equipo A3'),('group','A',4,2,4,'Equipo A2','Equipo A4'),
('group','A',5,1,4,'Equipo A1','Equipo A4'),('group','A',6,2,3,'Equipo A2','Equipo A3'),
('group','B',7,5,6,'Equipo B1','Equipo B2'),('group','B',8,7,8,'Equipo B3','Equipo B4'),
('group','B',9,5,7,'Equipo B1','Equipo B3'),('group','B',10,6,8,'Equipo B2','Equipo B4'),
('group','B',11,5,8,'Equipo B1','Equipo B4'),('group','B',12,6,7,'Equipo B2','Equipo B3'),
('group','C',13,9,10,'Equipo C1','Equipo C2'),('group','C',14,11,12,'Equipo C3','Equipo C4'),
('group','C',15,9,11,'Equipo C1','Equipo C3'),('group','C',16,10,12,'Equipo C2','Equipo C4'),
('group','C',17,9,12,'Equipo C1','Equipo C4'),('group','C',18,10,11,'Equipo C2','Equipo C3'),
('group','D',19,13,14,'Equipo D1','Equipo D2'),('group','D',20,15,16,'Equipo D3','Equipo D4'),
('group','D',21,13,15,'Equipo D1','Equipo D3'),('group','D',22,14,16,'Equipo D2','Equipo D4'),
('group','D',23,13,16,'Equipo D1','Equipo D4'),('group','D',24,14,15,'Equipo D2','Equipo D3'),
('group','E',25,17,18,'Equipo E1','Equipo E2'),('group','E',26,19,20,'Equipo E3','Equipo E4'),
('group','E',27,17,19,'Equipo E1','Equipo E3'),('group','E',28,18,20,'Equipo E2','Equipo E4'),
('group','E',29,17,20,'Equipo E1','Equipo E4'),('group','E',30,18,19,'Equipo E2','Equipo E3'),
('group','F',31,21,22,'Equipo F1','Equipo F2'),('group','F',32,23,24,'Equipo F3','Equipo F4'),
('group','F',33,21,23,'Equipo F1','Equipo F3'),('group','F',34,22,24,'Equipo F2','Equipo F4'),
('group','F',35,21,24,'Equipo F1','Equipo F4'),('group','F',36,22,23,'Equipo F2','Equipo F3'),
('group','G',37,25,26,'Equipo G1','Equipo G2'),('group','G',38,27,28,'Equipo G3','Equipo G4'),
('group','G',39,25,27,'Equipo G1','Equipo G3'),('group','G',40,26,28,'Equipo G2','Equipo G4'),
('group','G',41,25,28,'Equipo G1','Equipo G4'),('group','G',42,26,27,'Equipo G2','Equipo G3'),
('group','H',43,29,30,'Equipo H1','Equipo H2'),('group','H',44,31,32,'Equipo H3','Equipo H4'),
('group','H',45,29,31,'Equipo H1','Equipo H3'),('group','H',46,30,32,'Equipo H2','Equipo H4'),
('group','H',47,29,32,'Equipo H1','Equipo H4'),('group','H',48,30,31,'Equipo H2','Equipo H3'),
('group','I',49,33,34,'Equipo I1','Equipo I2'),('group','I',50,35,36,'Equipo I3','Equipo I4'),
('group','I',51,33,35,'Equipo I1','Equipo I3'),('group','I',52,34,36,'Equipo I2','Equipo I4'),
('group','I',53,33,36,'Equipo I1','Equipo I4'),('group','I',54,34,35,'Equipo I2','Equipo I3'),
('group','J',55,37,38,'Equipo J1','Equipo J2'),('group','J',56,39,40,'Equipo J3','Equipo J4'),
('group','J',57,37,39,'Equipo J1','Equipo J3'),('group','J',58,38,40,'Equipo J2','Equipo J4'),
('group','J',59,37,40,'Equipo J1','Equipo J4'),('group','J',60,38,39,'Equipo J2','Equipo J3'),
('group','K',61,41,42,'Equipo K1','Equipo K2'),('group','K',62,43,44,'Equipo K3','Equipo K4'),
('group','K',63,41,43,'Equipo K1','Equipo K3'),('group','K',64,42,44,'Equipo K2','Equipo K4'),
('group','K',65,41,44,'Equipo K1','Equipo K4'),('group','K',66,42,43,'Equipo K2','Equipo K3'),
('group','L',67,45,46,'Equipo L1','Equipo L2'),('group','L',68,47,48,'Equipo L3','Equipo L4'),
('group','L',69,45,47,'Equipo L1','Equipo L3'),('group','L',70,46,48,'Equipo L2','Equipo L4'),
('group','L',71,45,48,'Equipo L1','Equipo L4'),('group','L',72,46,47,'Equipo L2','Equipo L3');

-- R32 (16 partidos)
INSERT INTO public.matches (phase, match_number, home_team_label, away_team_label) VALUES
('r32',73,'1A','3CDEF'),('r32',74,'1C','3ABFH'),('r32',75,'1D','3BEFI'),('r32',76,'1E','3ACHI'),
('r32',77,'1F','3GHJK'),('r32',78,'1H','3CGJL'),('r32',79,'1J','3DGIK'),('r32',80,'1K','3FILJ'),
('r32',81,'2A','2C'),('r32',82,'2D','2E'),('r32',83,'2F','2H'),('r32',84,'2J','2K'),
('r32',85,'1B','2L'),('r32',86,'1G','2I'),('r32',87,'1L','2G'),('r32',88,'1I','2B');

-- R16 (8 partidos)
INSERT INTO public.matches (phase, match_number, home_team_label, away_team_label) VALUES
('r16',89,'Ganador M73','Ganador M74'),('r16',90,'Ganador M75','Ganador M76'),
('r16',91,'Ganador M77','Ganador M78'),('r16',92,'Ganador M79','Ganador M80'),
('r16',93,'Ganador M81','Ganador M82'),('r16',94,'Ganador M83','Ganador M84'),
('r16',95,'Ganador M85','Ganador M86'),('r16',96,'Ganador M87','Ganador M88');

-- Cuartos (4)
INSERT INTO public.matches (phase, match_number, home_team_label, away_team_label) VALUES
('qf',97,'Ganador M89','Ganador M90'),('qf',98,'Ganador M91','Ganador M92'),
('qf',99,'Ganador M93','Ganador M94'),('qf',100,'Ganador M95','Ganador M96');

-- Semis, 3er lugar, Final
INSERT INTO public.matches (phase, match_number, home_team_label, away_team_label) VALUES
('sf',101,'Ganador M97','Ganador M98'),('sf',102,'Ganador M99','Ganador M100'),
('third',103,'Perdedor M101','Perdedor M102'),('final',104,'Ganador M101','Ganador M102');
