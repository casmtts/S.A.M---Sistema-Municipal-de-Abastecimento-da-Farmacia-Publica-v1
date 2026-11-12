#!/usr/bin/env bash
# Sobe o S.A.M. em localhost: banco + API no Docker, frontend com Vite.
#   ./rodar-local.sh          sobe tudo
#   ADMIN_EMAIL=... ADMIN_PASSWORD=... ./rodar-local.sh   define o admin local
# Apenas para desenvolvimento. O admin criado aqui nunca deve existir em produção.
set -euo pipefail
cd "$(dirname "$0")"

command -v docker >/dev/null || { echo "Docker não encontrado. Instale o Docker Desktop ou OrbStack."; exit 1; }
docker info >/dev/null 2>&1 || { echo "O Docker não está rodando. Abra o Docker Desktop/OrbStack e tente de novo."; exit 1; }

echo "[1/4] Subindo banco e API (Docker)..."
docker compose up --build -d

echo "[2/4] Aguardando a API em http://localhost:3001 ..."
ok=""
for _ in $(seq 1 60); do
  if curl -fsS http://localhost:3001/health/check >/dev/null 2>&1; then ok=1; break; fi
  sleep 2
done
[ -n "$ok" ] || { echo "A API não respondeu em 2 min. Veja: docker compose logs backend"; exit 1; }

echo "[3/4] Criando/atualizando o administrador local..."
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@sam.local}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-$(LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c 16)}"
HASH="$(docker compose exec -T -e P="$ADMIN_PASSWORD" backend node -e "console.log(require('bcrypt').hashSync(process.env.P,12))")"
docker compose exec -T db psql -U "${POSTGRES_USER:-sam}" -d "${POSTGRES_DB:-farmacia_municipal}" \
  -v ON_ERROR_STOP=1 -v h="$HASH" -v e="$ADMIN_EMAIL" >/dev/null <<'SQL'
INSERT INTO usuarios (id, nome, email, cpf, senha, role, ativo, "tokenVersion", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'Administrador local', :'e', '52998224725', :'h', 'SUPER_ADMIN', true, 0, now(), now())
ON CONFLICT (email) DO UPDATE SET senha = EXCLUDED.senha, ativo = true, "tokenVersion" = usuarios."tokenVersion" + 1;
SQL

cat <<MSG

  ---------------------------------------------
   API:       http://localhost:3001
   Frontend:  http://localhost:3000
   E-mail:    $ADMIN_EMAIL
   Senha:     $ADMIN_PASSWORD
  ---------------------------------------------
  (Ctrl+C para parar o frontend. Para parar a API: docker compose down)

MSG

echo "[4/4] Iniciando o frontend..."
cd frontend
npm install --no-audit --no-fund
exec npm run dev -- --host 0.0.0.0 --port 3000
