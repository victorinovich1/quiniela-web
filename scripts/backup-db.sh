#!/bin/bash

# Script de backup automático de la base de datos de la Quiniela
# Usa pg_dump para extraer tablas específicas del esquema public

set -e

if [ -z "$SUPABASE_DB_URL" ]; then
  echo "❌ Error: SUPABASE_DB_URL no está definida"
  echo "Verifica que el Secret esté configurado en GitHub Settings → Secrets → Actions"
  exit 1
fi

echo "🔄 Iniciando backup de base de datos..."
echo "📅 Fecha: $(date)"
echo "🔌 Usando Supabase Pooler (puerto 6543) con SSL"

# Probar conexión antes de continuar
echo "🔍 Verificando conexión a Supabase..."
if ! pg_isready -d "$SUPABASE_DB_URL" -t 10 > /dev/null 2>&1; then
  echo "❌ Error: No se pudo conectar a Supabase"
  echo "Verifica:"
  echo "  1. El Secret SUPABASE_DB_URL está configurado correctamente"
  echo "  2. La contraseña no contiene caracteres especiales sin codificar (@→%40, #→%23, etc.)"
  echo "  3. La URL usa el puerto 6543 (pooler compatible con IPv4)"
  exit 1
fi
echo "✅ Conexión exitosa"

# Nombre del archivo con timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="quiniela_backup_${TIMESTAMP}.sql"

# Tablas a respaldar
TABLES=(
  "profiles"
  "entries"
  "matches"
  "teams"
  "predictions"
  "special_predictions"
  "settings"
  "invitations"
)

# Construir opciones de pg_dump
TABLE_OPTS=""
for table in "${TABLES[@]}"; do
  TABLE_OPTS="${TABLE_OPTS} -t public.${table}"
done

# Verificar versión de pg_dump
echo "🔍 Versión de pg_dump:"
/usr/lib/postgresql/17/bin/pg_dump --version

# Ejecutar pg_dump usando Pooler (compatible con Pgbouncer)
/usr/lib/postgresql/17/bin/pg_dump \
  "$SUPABASE_DB_URL" \
  --no-owner \
  --no-acl \
  --no-privileges \
  --format=plain \
  --data-only \
  $TABLE_OPTS \
  > "$BACKUP_FILE"

echo "✅ Backup creado: $BACKUP_FILE"
echo "📊 Tamaño: $(du -h "$BACKUP_FILE" | cut -f1)"

# Comprimir
zip "${BACKUP_FILE}.zip" "$BACKUP_FILE"
rm "$BACKUP_FILE"

echo "📦 Archivo comprimido: ${BACKUP_FILE}.zip"
echo "✅ Backup completado exitosamente"
