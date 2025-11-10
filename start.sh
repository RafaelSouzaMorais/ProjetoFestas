#!/bin/sh
set -e

echo "🚀 Iniciando aplicação..."
echo "📦 NODE_ENV: ${NODE_ENV}"
echo "🔌 Backend PORT: ${PORT}"
echo "🌐 VITE_API_URL: ${VITE_API_URL}"

# Aguardar o banco de dados se necessário
if [ -n "$DB_HOST" ]; then
  echo "⏳ Aguardando banco de dados..."
  sleep 10
fi

echo "✅ Iniciando serviços..."
npm run start &

# Aguardar os serviços ficarem prontos
echo "⏳ Aguardando backend iniciar..."
for i in 1 2 3 4 5 6 7 8 9 10; do
  if wget --spider --quiet http://localhost:3100/api/health 2>/dev/null; then
    echo "✅ Backend pronto!"
    break
  fi
  echo "   Tentativa $i/10..."
  sleep 2
done

echo "⏳ Aguardando frontend iniciar..."
for i in 1 2 3 4 5 6 7 8 9 10; do
  if wget --spider --quiet http://localhost:5173 2>/dev/null; then
    echo "✅ Frontend pronto!"
    break
  fi
  echo "   Tentativa $i/10..."
  sleep 2
done

echo "🎉 Aplicação iniciada com sucesso!"
wait
