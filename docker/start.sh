#!/bin/sh
set -e

i=0
until npx prisma migrate deploy; do
  i=$((i + 1))
  if [ "$i" -gt 15 ]; then
    echo "Die Datenbankmigration ist fehlgeschlagen."
    exit 1
  fi
  sleep 2
done

npx tsx prisma/seed.ts
exec npx next start -H 0.0.0.0 -p 3000
