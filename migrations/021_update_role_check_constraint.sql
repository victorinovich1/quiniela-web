-- Migración 021: Actualizar constraint de role para incluir 'manager'

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'participant', 'manager'));
