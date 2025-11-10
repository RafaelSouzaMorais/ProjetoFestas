#!/bin/sh
set -e

echo "🚀 Iniciando aplicação..."
echo "📦 NODE_ENV: ${NODE_ENV}"
echo "🔌 Backend PORT: ${PORT}"
echo "🌐 VITE_API_URL: ${VITE_API_URL}"

# Aguardar o banco de dados se necessário
if [ -n "$DB_HOST" ]; then
  echo "⏳ Aguardando banco de dados..."
  sleep 5
fi

echo "✅ Iniciando serviços..."
exec npm run start
