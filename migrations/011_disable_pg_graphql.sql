-- =====================================================
-- 011 - Desactiva pg_graphql (no se usa, limpia warnings)
-- =====================================================

drop extension if exists pg_graphql cascade;
