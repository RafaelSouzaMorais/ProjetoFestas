#!/bin/sh
set -e

echo "🚀 Iniciando aplicação..."
echo "📦 NODE_ENV: ${NODE_ENV}"
echo "🔌 Backend PORT: ${PORT}"

# Aguardar o banco de dados se necessário
if [ -n "$DB_HOST" ]; then
  echo "⏳ Aguardando banco de dados..."
  sleep 10
fi

echo "✅ Iniciando backend (que também serve o frontend)..."
exec node server/index.js
