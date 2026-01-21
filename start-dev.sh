#!/bin/bash

# Token Dashboard Development Launcher
# Starts Anvil, Backend, and Frontend in the background

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$PROJECT_ROOT/logs"

# Create logs directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Token Dashboard Development Environment...${NC}"

# Function to check if a process is running
check_running() {
    if pgrep -f "$1" > /dev/null; then
        return 0
    else
        return 1
    fi
}

# Start Anvil (local Ethereum node)
echo -e "${YELLOW}Starting Anvil...${NC}"
cd "$PROJECT_ROOT/smartcontract"
anvil > "$LOG_DIR/anvil.log" 2>&1 &
ANVIL_PID=$!
echo "Anvil started (PID: $ANVIL_PID)"
echo "$ANVIL_PID" > "$LOG_DIR/anvil.pid"

# Wait a moment for Anvil to start
sleep 2

# Start Backend (Elysia on Bun)
echo -e "${YELLOW}Starting Backend...${NC}"
cd "$PROJECT_ROOT/backend"
bun run dev > "$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo "Backend started (PID: $BACKEND_PID)"
echo "$BACKEND_PID" > "$LOG_DIR/backend.pid"

# Wait a moment for backend to start
sleep 2

# Start Frontend (Vite dev server)
echo -e "${YELLOW}Starting Frontend...${NC}"
cd "$PROJECT_ROOT/frontend"
bun dev > "$LOG_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "Frontend started (PID: $FRONTEND_PID)"
echo "$FRONTEND_PID" > "$LOG_DIR/frontend.pid"

echo ""
echo -e "${GREEN}All services started successfully!${NC}"
echo ""
echo "Service Status:"
echo "  Anvil:    PID $ANVIL_PID (logs: logs/anvil.log)"
echo "  Backend:  PID $BACKEND_PID (logs: logs/backend.log)"
echo "  Frontend: PID $FRONTEND_PID (logs: logs/frontend.log)"
echo ""
echo "To stop all services, run: ./stop-dev.sh"
echo "To view logs, run: tail -f logs/<service>.log"
