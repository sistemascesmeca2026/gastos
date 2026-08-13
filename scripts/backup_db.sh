#!/bin/bash
# Respaldo diario de la base de datos poa_cesmeca
# Guarda un .sql.gz por día, conserva los últimos 30 días

set -e

BACKUP_DIR="/home/dockerdata/sistema-gastos/backups"
FECHA=$(date +%Y-%m-%d)
ARCHIVO="$BACKUP_DIR/poa_cesmeca_$FECHA.sql.gz"

mkdir -p "$BACKUP_DIR"

docker exec gastos_db pg_dump -U admin_gastos poa_cesmeca | gzip > "$ARCHIVO"

echo "$(date '+%Y-%m-%d %H:%M:%S') Respaldo creado: $ARCHIVO"

# Borrar respaldos con más de 30 días
find "$BACKUP_DIR" -name "poa_cesmeca_*.sql.gz" -mtime +30 -delete
