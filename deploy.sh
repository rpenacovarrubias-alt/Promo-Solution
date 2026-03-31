#!/usr/bin/env bash
# =============================================================
# Promo Solution — Script de despliegue en VPS (EasyPanel)
# VPS: 82.180.173.228
#
# USO:
#   1. Copia este archivo al VPS:
#      scp deploy.sh root@82.180.173.228:~/promosolution/
#
#   2. Crea el .env en el servidor:
#      nano ~/promosolution/.env
#      (llena los valores reales — ver .env.example)
#
#   3. Ejecuta:
#      chmod +x deploy.sh && ./deploy.sh
# =============================================================
set -euo pipefail

REPO_URL="https://github.com/rpenacovarrubias-alt/Promo-Solution.git"
APP_DIR="$HOME/promosolution"
NETWORK="promosolution"

echo ""
echo "🚀  Promo Solution — Despliegue"
echo "================================"

# ── 1. Red Docker compartida ──────────────────────────────────────────────────
if ! docker network ls --format '{{.Name}}' | grep -q "^${NETWORK}$"; then
  echo "📡  Creando red Docker '${NETWORK}'..."
  docker network create "$NETWORK"
else
  echo "✅  Red '${NETWORK}' ya existe"
fi

# ── 2. Clonar o actualizar repositorio ───────────────────────────────────────
if [ -d "$APP_DIR/.git" ]; then
  echo "📥  Actualizando repositorio..."
  git -C "$APP_DIR" pull
else
  echo "📥  Clonando repositorio..."
  git clone "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"

# ── 3. Verificar .env ─────────────────────────────────────────────────────────
if [ ! -f ".env" ]; then
  echo ""
  echo "⚠️   FALTA el archivo .env"
  echo "     Copia .env.example → .env y llena los valores reales:"
  echo "     cp .env.example .env && nano .env"
  echo ""
  exit 1
fi

echo "✅  Archivo .env encontrado"

# ── 4. Instalar dependencias del admin (para Prisma generate) ─────────────────
echo "📦  Instalando dependencias npm..."
npm install --prefer-offline

# ── 5. Migraciones Prisma ─────────────────────────────────────────────────────
echo "🗄️   Ejecutando migraciones Prisma..."
source .env
export DATABASE_URL
npx prisma migrate deploy

# ── 6. Build y levantar contenedores ─────────────────────────────────────────
echo "🐳  Construyendo imágenes Docker..."
docker compose build \
  --build-arg NEXT_PUBLIC_ADMIN_API="${NEXT_PUBLIC_ADMIN_API:-https://admin.promosolution.com.mx}"

echo "🐳  Levantando servicios..."
docker compose up -d --remove-orphans

# ── 7. Health check ───────────────────────────────────────────────────────────
echo ""
echo "⏳  Esperando que el admin arranque..."
sleep 8

if curl -sf "http://localhost:4000/api/health" > /dev/null; then
  echo "✅  Admin API: OK  (http://localhost:4000)"
else
  echo "⚠️   Admin API no responde — revisa: docker compose logs admin"
fi

if curl -sf "http://localhost:3000" > /dev/null; then
  echo "✅  Web Next.js: OK  (http://localhost:3000)"
else
  echo "⚠️   Web no responde — revisa: docker compose logs web"
fi

echo ""
echo "🎉  ¡Despliegue completado!"
echo ""
echo "   Panel admin:   https://admin.promosolution.com.mx"
echo "   Sitio público: https://promosolution.com.mx"
echo ""
echo "   Para ver logs:"
echo "   docker compose logs -f admin"
echo "   docker compose logs -f web"
