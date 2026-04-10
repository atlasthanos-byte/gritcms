#!/bin/bash
sudo systemctl start docker

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Log files
LOG_DIR=".logs"
mkdir -p "$LOG_DIR"

cleanup() {
  echo -e "\n${YELLOW}Shutting down...${NC}"
  kill "$API_PID" "$FRONTEND_PID" 2>/dev/null
  wait "$API_PID" "$FRONTEND_PID" 2>/dev/null
  echo -e "${GREEN}Done.${NC}"
  exit 0
}
trap cleanup SIGINT SIGTERM

echo -e "${CYAN}=== GritCMS Dev Start ===${NC}"

# 1. Docker
echo -e "${BLUE}[docker]${NC} Starting infrastructure..."
docker compose up -d
if [ $? -ne 0 ]; then
  echo -e "${RED}[docker] Failed to start. Is Docker running?${NC}"
  exit 1
fi
echo -e "${GREEN}[docker] OK${NC}"

# 2. Wait for Postgres to be ready
echo -e "${BLUE}[docker]${NC} Waiting for Postgres..."
for i in $(seq 1 20); do
  docker exec gritcms-postgres pg_isready -U grit -q 2>/dev/null && break
  sleep 1
done
echo -e "${GREEN}[docker] Postgres ready${NC}"

# 3. Start Go API
echo -e "${BLUE}[api]${NC} Starting Go API on :8080..."
(cd apps/api && air 2>&1 | sed "s/^/$(echo -e "${BLUE}[api]${NC}") /") &
API_PID=$!

# 4. Wait for API to be ready
echo -e "${BLUE}[api]${NC} Waiting for API..."
for i in $(seq 1 30); do
  curl -s http://localhost:8080/api/health > /dev/null 2>&1 && break
  sleep 1
done
echo -e "${GREEN}[api] Ready at http://localhost:8080${NC}"

# 5. Start frontends
echo -e "${BLUE}[frontend]${NC} Starting admin + web..."
(pnpm dev 2>&1 | sed "s/^/$(echo -e "${CYAN}[frontend]${NC}") /") &
FRONTEND_PID=$!

echo ""
echo -e "${GREEN}=== All services running ===${NC}"
echo -e "  API:      ${CYAN}http://localhost:8080${NC}"
echo -e "  Admin:    ${CYAN}http://localhost:3001${NC}"
echo -e "  Web:      ${CYAN}http://localhost:3000${NC}"
echo -e "  MinIO:    ${CYAN}http://localhost:9001${NC}"
echo -e "  Mailhog:  ${CYAN}http://localhost:8025${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop everything${NC}"
echo ""

# Keep running and show logs
wait "$API_PID" "$FRONTEND_PID"