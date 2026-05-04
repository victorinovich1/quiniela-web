-- =====================================================
-- 013 - Carga aproximada de fechas/horas (UTC)
-- 4 partidos/día tras el inaugural. M1 fijo a 19:00 UTC del 11 jun.
-- Migración 015 sobrescribe la mayoría con datos oficiales verificados.
-- =====================================================

update public.matches set kickoff_at = '2026-06-11 19:00:00+00' where match_number = 1;
update public.matches set kickoff_at = '2026-06-12 16:00:00+00' where match_number = 2;
update public.matches set kickoff_at = '2026-06-12 19:00:00+00' where match_number = 3;
update public.matches set kickoff_at = '2026-06-12 22:00:00+00' where match_number = 4;
update public.matches set kickoff_at = '2026-06-13 01:00:00+00' where match_number = 5;
update public.matches set kickoff_at = '2026-06-13 16:00:00+00' where match_number = 6;
update public.matches set kickoff_at = '2026-06-13 19:00:00+00' where match_number = 7;
update public.matches set kickoff_at = '2026-06-13 22:00:00+00' where match_number = 8;
update public.matches set kickoff_at = '2026-06-14 01:00:00+00' where match_number = 9;
update public.matches set kickoff_at = '2026-06-14 16:00:00+00' where match_number = 10;
update public.matches set kickoff_at = '2026-06-14 19:00:00+00' where match_number = 11;
update public.matches set kickoff_at = '2026-06-14 22:00:00+00' where match_number = 12;
update public.matches set kickoff_at = '2026-06-15 01:00:00+00' where match_number = 13;
update public.matches set kickoff_at = '2026-06-15 16:00:00+00' where match_number = 14;
update public.matches set kickoff_at = '2026-06-15 19:00:00+00' where match_number = 15;
update public.matches set kickoff_at = '2026-06-15 22:00:00+00' where match_number = 16;
update public.matches set kickoff_at = '2026-06-16 01:00:00+00' where match_number = 17;
update public.matches set kickoff_at = '2026-06-16 16:00:00+00' where match_number = 18;
update public.matches set kickoff_at = '2026-06-16 19:00:00+00' where match_number = 19;
update public.matches set kickoff_at = '2026-06-16 22:00:00+00' where match_number = 20;
update public.matches set kickoff_at = '2026-06-17 01:00:00+00' where match_number = 21;
update public.matches set kickoff_at = '2026-06-17 16:00:00+00' where match_number = 22;
update public.matches set kickoff_at = '2026-06-17 19:00:00+00' where match_number = 23;
update public.matches set kickoff_at = '2026-06-17 22:00:00+00' where match_number = 24;
update public.matches set kickoff_at = '2026-06-18 01:00:00+00' where match_number = 25;
update public.matches set kickoff_at = '2026-06-18 16:00:00+00' where match_number = 26;
update public.matches set kickoff_at = '2026-06-18 19:00:00+00' where match_number = 27;
update public.matches set kickoff_at = '2026-06-18 22:00:00+00' where match_number = 28;
update public.matches set kickoff_at = '2026-06-19 01:00:00+00' where match_number = 29;
update public.matches set kickoff_at = '2026-06-19 16:00:00+00' where match_number = 30;
update public.matches set kickoff_at = '2026-06-19 19:00:00+00' where match_number = 31;
update public.matches set kickoff_at = '2026-06-19 22:00:00+00' where match_number = 32;
update public.matches set kickoff_at = '2026-06-20 01:00:00+00' where match_number = 33;
update public.matches set kickoff_at = '2026-06-20 16:00:00+00' where match_number = 34;
update public.matches set kickoff_at = '2026-06-20 19:00:00+00' where match_number = 35;
update public.matches set kickoff_at = '2026-06-20 22:00:00+00' where match_number = 36;
update public.matches set kickoff_at = '2026-06-21 01:00:00+00' where match_number = 37;
update public.matches set kickoff_at = '2026-06-21 16:00:00+00' where match_number = 38;
update public.matches set kickoff_at = '2026-06-21 19:00:00+00' where match_number = 39;
update public.matches set kickoff_at = '2026-06-21 22:00:00+00' where match_number = 40;
update public.matches set kickoff_at = '2026-06-22 01:00:00+00' where match_number = 41;
update public.matches set kickoff_at = '2026-06-22 16:00:00+00' where match_number = 42;
update public.matches set kickoff_at = '2026-06-22 19:00:00+00' where match_number = 43;
update public.matches set kickoff_at = '2026-06-22 22:00:00+00' where match_number = 44;
update public.matches set kickoff_at = '2026-06-23 01:00:00+00' where match_number = 45;
update public.matches set kickoff_at = '2026-06-23 16:00:00+00' where match_number = 46;
update public.matches set kickoff_at = '2026-06-23 19:00:00+00' where match_number = 47;
update public.matches set kickoff_at = '2026-06-23 22:00:00+00' where match_number = 48;
update public.matches set kickoff_at = '2026-06-24 01:00:00+00' where match_number = 49;
update public.matches set kickoff_at = '2026-06-24 16:00:00+00' where match_number = 50;
update public.matches set kickoff_at = '2026-06-24 19:00:00+00' where match_number = 51;
update public.matches set kickoff_at = '2026-06-24 22:00:00+00' where match_number = 52;
update public.matches set kickoff_at = '2026-06-25 01:00:00+00' where match_number = 53;
update public.matches set kickoff_at = '2026-06-25 16:00:00+00' where match_number = 54;
update public.matches set kickoff_at = '2026-06-25 19:00:00+00' where match_number = 55;
update public.matches set kickoff_at = '2026-06-25 22:00:00+00' where match_number = 56;
update public.matches set kickoff_at = '2026-06-26 01:00:00+00' where match_number = 57;
update public.matches set kickoff_at = '2026-06-26 16:00:00+00' where match_number = 58;
update public.matches set kickoff_at = '2026-06-26 19:00:00+00' where match_number = 59;
update public.matches set kickoff_at = '2026-06-26 22:00:00+00' where match_number = 60;
update public.matches set kickoff_at = '2026-06-27 01:00:00+00' where match_number = 61;
update public.matches set kickoff_at = '2026-06-27 16:00:00+00' where match_number = 62;
update public.matches set kickoff_at = '2026-06-27 19:00:00+00' where match_number = 63;
update public.matches set kickoff_at = '2026-06-27 22:00:00+00' where match_number = 64;
update public.matches set kickoff_at = '2026-06-28 01:00:00+00' where match_number = 65;
update public.matches set kickoff_at = '2026-06-28 16:00:00+00' where match_number = 66;
update public.matches set kickoff_at = '2026-06-28 19:00:00+00' where match_number = 67;
update public.matches set kickoff_at = '2026-06-28 22:00:00+00' where match_number = 68;
update public.matches set kickoff_at = '2026-06-29 01:00:00+00' where match_number = 69;
update public.matches set kickoff_at = '2026-06-29 16:00:00+00' where match_number = 70;
update public.matches set kickoff_at = '2026-06-29 19:00:00+00' where match_number = 71;
update public.matches set kickoff_at = '2026-06-29 22:00:00+00' where match_number = 72;

-- R32
update public.matches set kickoff_at = '2026-06-30 16:00:00+00' where match_number = 73;
update public.matches set kickoff_at = '2026-06-30 19:00:00+00' where match_number = 74;
update public.matches set kickoff_at = '2026-06-30 22:00:00+00' where match_number = 75;
update public.matches set kickoff_at = '2026-07-01 01:00:00+00' where match_number = 76;
update public.matches set kickoff_at = '2026-07-01 19:00:00+00' where match_number = 77;
update public.matches set kickoff_at = '2026-07-01 22:00:00+00' where match_number = 78;
update public.matches set kickoff_at = '2026-07-02 01:00:00+00' where match_number = 79;
update public.matches set kickoff_at = '2026-07-02 19:00:00+00' where match_number = 80;
update public.matches set kickoff_at = '2026-07-02 22:00:00+00' where match_number = 81;
update public.matches set kickoff_at = '2026-07-03 01:00:00+00' where match_number = 82;
update public.matches set kickoff_at = '2026-07-03 19:00:00+00' where match_number = 83;
update public.matches set kickoff_at = '2026-07-03 22:00:00+00' where match_number = 84;
update public.matches set kickoff_at = '2026-07-04 01:00:00+00' where match_number = 85;
update public.matches set kickoff_at = '2026-07-04 19:00:00+00' where match_number = 86;
update public.matches set kickoff_at = '2026-07-04 22:00:00+00' where match_number = 87;
update public.matches set kickoff_at = '2026-07-05 19:00:00+00' where match_number = 88;

-- R16
update public.matches set kickoff_at = '2026-07-06 19:00:00+00' where match_number = 89;
update public.matches set kickoff_at = '2026-07-06 22:00:00+00' where match_number = 90;
update public.matches set kickoff_at = '2026-07-07 19:00:00+00' where match_number = 91;
update public.matches set kickoff_at = '2026-07-07 22:00:00+00' where match_number = 92;
update public.matches set kickoff_at = '2026-07-08 19:00:00+00' where match_number = 93;
update public.matches set kickoff_at = '2026-07-08 22:00:00+00' where match_number = 94;
update public.matches set kickoff_at = '2026-07-09 19:00:00+00' where match_number = 95;
update public.matches set kickoff_at = '2026-07-09 22:00:00+00' where match_number = 96;

-- QF, SF, 3rd, Final
update public.matches set kickoff_at = '2026-07-11 19:00:00+00' where match_number = 97;
update public.matches set kickoff_at = '2026-07-11 22:00:00+00' where match_number = 98;
update public.matches set kickoff_at = '2026-07-12 19:00:00+00' where match_number = 99;
update public.matches set kickoff_at = '2026-07-12 22:00:00+00' where match_number = 100;
update public.matches set kickoff_at = '2026-07-15 19:00:00+00' where match_number = 101;
update public.matches set kickoff_at = '2026-07-16 19:00:00+00' where match_number = 102;
update public.matches set kickoff_at = '2026-07-18 19:00:00+00' where match_number = 103;
update public.matches set kickoff_at = '2026-07-19 19:00:00+00' where match_number = 104;

update public.settings set lock_at = '2026-06-11 19:00:00+00' where id = 1;
