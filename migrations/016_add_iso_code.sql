-- =====================================================
-- 016 - Códigos ISO para banderas reales (flagcdn.com)
-- =====================================================

alter table public.teams add column if not exists iso_code text;

update public.teams set iso_code = 'mx' where code = 'MEX';
update public.teams set iso_code = 'za' where code = 'RSA';
update public.teams set iso_code = 'kr' where code = 'KOR';
update public.teams set iso_code = 'cz' where code = 'CZE';
update public.teams set iso_code = 'ca' where code = 'CAN';
update public.teams set iso_code = 'ch' where code = 'SUI';
update public.teams set iso_code = 'qa' where code = 'QAT';
update public.teams set iso_code = 'ba' where code = 'BIH';
update public.teams set iso_code = 'br' where code = 'BRA';
update public.teams set iso_code = 'ma' where code = 'MAR';
update public.teams set iso_code = 'ht' where code = 'HAI';
update public.teams set iso_code = 'gb-sct' where code = 'SCO';
update public.teams set iso_code = 'us' where code = 'USA';
update public.teams set iso_code = 'py' where code = 'PAR';
update public.teams set iso_code = 'au' where code = 'AUS';
update public.teams set iso_code = 'tr' where code = 'TUR';
update public.teams set iso_code = 'de' where code = 'GER';
update public.teams set iso_code = 'cw' where code = 'CUW';
update public.teams set iso_code = 'ci' where code = 'CIV';
update public.teams set iso_code = 'ec' where code = 'ECU';
update public.teams set iso_code = 'nl' where code = 'NED';
update public.teams set iso_code = 'jp' where code = 'JPN';
update public.teams set iso_code = 'tn' where code = 'TUN';
update public.teams set iso_code = 'se' where code = 'SWE';
update public.teams set iso_code = 'be' where code = 'BEL';
update public.teams set iso_code = 'eg' where code = 'EGY';
update public.teams set iso_code = 'ir' where code = 'IRN';
update public.teams set iso_code = 'nz' where code = 'NZL';
update public.teams set iso_code = 'es' where code = 'ESP';
update public.teams set iso_code = 'cv' where code = 'CPV';
update public.teams set iso_code = 'sa' where code = 'KSA';
update public.teams set iso_code = 'uy' where code = 'URU';
update public.teams set iso_code = 'fr' where code = 'FRA';
update public.teams set iso_code = 'sn' where code = 'SEN';
update public.teams set iso_code = 'no' where code = 'NOR';
update public.teams set iso_code = 'iq' where code = 'IRQ';
update public.teams set iso_code = 'ar' where code = 'ARG';
update public.teams set iso_code = 'dz' where code = 'ALG';
update public.teams set iso_code = 'at' where code = 'AUT';
update public.teams set iso_code = 'jo' where code = 'JOR';
update public.teams set iso_code = 'pt' where code = 'POR';
update public.teams set iso_code = 'uz' where code = 'UZB';
update public.teams set iso_code = 'co' where code = 'COL';
update public.teams set iso_code = 'cd' where code = 'COD';
update public.teams set iso_code = 'gb-eng' where code = 'ENG';
update public.teams set iso_code = 'hr' where code = 'CRO';
update public.teams set iso_code = 'gh' where code = 'GHA';
update public.teams set iso_code = 'pa' where code = 'PAN';
