#!/bin/bash

# Script de backup automático de la base de datos de la Quiniela
# Usa pg_dump para extraer tablas específicas del esquema public

set -e

if [ -z "$SUPABASE_DB_URL" ]; then
  echo "Error: SUPABASE_DB_URL no está definida"
  exit 1
fi

# Nombre del archivo con timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="quiniela_backup_${TIMESTAMP}.sql"

echo "🔄 Iniciando backup de base de datos..."
echo "📅 Fecha: $(date)"

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

# Ejecutar pg_dump
pg_dump \
  "$SUPABASE_DB_URL" \
  --no-owner \
  --no-acl \
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
