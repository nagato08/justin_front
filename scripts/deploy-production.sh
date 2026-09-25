#!/usr/bin/env bash
set -Eeuo pipefail

readonly STACK_DIR="/home/nagato/apps/ma-cuisine"
readonly ROLLBACK_IMAGE="ma-cuisine-web:ci-rollback"
COMPOSE=(docker compose --env-file "$STACK_DIR/.env.production" -f "$STACK_DIR/docker-compose.prod.yml")

cd "$STACK_DIR"
exec 9>/tmp/ma-cuisine-deploy.lock
flock -w 900 9

had_previous=0
container_changed=0
if docker image inspect ma-cuisine-web:latest >/dev/null 2>&1; then
  docker tag ma-cuisine-web:latest "$ROLLBACK_IMAGE"
  had_previous=1
fi

rollback() {
  local exit_code=$?
  echo "Frontend deployment failed; restoring the previous image." >&2
  if [[ "$container_changed" -eq 1 && "$had_previous" -eq 1 ]]; then
    docker tag "$ROLLBACK_IMAGE" ma-cuisine-web:latest
    "${COMPOSE[@]}" up -d --no-deps --force-recreate web || true
  fi
  "${COMPOSE[@]}" logs --tail=100 web || true
  exit "$exit_code"
}
trap rollback ERR

"${COMPOSE[@]}" build web
container_changed=1
"${COMPOSE[@]}" up -d --no-deps --force-recreate web

healthy=0
for _ in $(seq 1 30); do
  if curl --fail --silent --show-error --max-time 10 https://justin.tadjo.dev/ >/dev/null; then
    healthy=1
    break
  fi
  sleep 2
done
[[ "$healthy" -eq 1 ]]

trap - ERR
if [[ "$had_previous" -eq 1 ]]; then
  docker image rm "$ROLLBACK_IMAGE" >/dev/null 2>&1 || true
fi
echo "Frontend deployment completed successfully."
