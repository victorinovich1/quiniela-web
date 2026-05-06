-- =====================================================
-- 028 - Corregir nombres oficiales de estadios
-- Fuente: https://www.fifa.com y https://en.wikipedia.org/wiki/2026_FIFA_World_Cup
-- Los nombres deben ser los oficiales de FIFA, no genéricos
-- =====================================================

-- MÉXICO
UPDATE public.matches SET stadium = 'Estadio Azteca, Ciudad de México' 
WHERE stadium = 'Estadio Ciudad de México, Ciudad de México';

UPDATE public.matches SET stadium = 'Estadio Akron, Guadalajara' 
WHERE stadium = 'Estadio Guadalajara, Guadalajara';

UPDATE public.matches SET stadium = 'Estadio BBVA, Monterrey' 
WHERE stadium = 'Estadio Monterrey, Monterrey';

-- CANADÁ
UPDATE public.matches SET stadium = 'BMO Field, Toronto' 
WHERE stadium = 'Estadio de Toronto, Toronto';

UPDATE public.matches SET stadium = 'BC Place, Vancouver' 
WHERE stadium = 'Estadio BC Place Vancouver, Vancouver';

-- ESTADOS UNIDOS
UPDATE public.matches SET stadium = 'SoFi Stadium, Los Ángeles' 
WHERE stadium = 'Estadio Los Angeles, Los Ángeles';

UPDATE public.matches SET stadium = 'Gillette Stadium, Boston' 
WHERE stadium = 'Estadio Boston, Boston';

UPDATE public.matches SET stadium = 'MetLife Stadium, Nueva York/Nueva Jersey' 
WHERE stadium = 'Estadio Nueva York/Nueva Jersey, Nueva York';

UPDATE public.matches SET stadium = 'Levi''s Stadium, Área de la Bahía de San Francisco' 
WHERE stadium = 'Estadio de la Bahía de San Francisco, Área de la Bahía de San Francisco';

UPDATE public.matches SET stadium = 'Lumen Field, Seattle' 
WHERE stadium = 'Estadio de Seattle, Seattle';

UPDATE public.matches SET stadium = 'Mercedes-Benz Stadium, Atlanta' 
WHERE stadium = 'Estadio Atlanta, Atlanta';

UPDATE public.matches SET stadium = 'Hard Rock Stadium, Miami' 
WHERE stadium = 'Estadio Miami, Miami';

UPDATE public.matches SET stadium = 'NRG Stadium, Houston' 
WHERE stadium = 'Estadio Houston, Houston';

UPDATE public.matches SET stadium = 'AT&T Stadium, Dallas' 
WHERE stadium = 'Estadio Dallas, Dallas';

UPDATE public.matches SET stadium = 'Arrowhead Stadium, Kansas City' 
WHERE stadium = 'Estadio Kansas City, Kansas City';

UPDATE public.matches SET stadium = 'Lincoln Financial Field, Filadelfia' 
WHERE stadium = 'Estadio Filadelfia, Filadelfia';
