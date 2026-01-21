#!/bin/bash

# Token Dashboard Development Stopper
# Stops all running services (Anvil, Backend, Frontend)

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$PROJECT_ROOT/logs"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Stopping Token Dashboard Development Environment...${NC}"

# Function to stop a service
stop_service() {
    local SERVICE_NAME=$1
    local PID_FILE="$LOG_DIR/${SERVICE_NAME}.pid"

    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            echo "Stopping $SERVICE_NAME (PID: $PID)..."
            kill "$PID" 2>/dev/null || kill -9 "$PID" 2>/dev/null
            rm "$PID_FILE"
            echo -e "${GREEN}$SERVICE_NAME stopped${NC}"
        else
            echo -e "${RED}$SERVICE_NAME process (PID: $PID) not running${NC}"
            rm "$PID_FILE"
        fi
    else
        echo -e "${YELLOW}No PID file found for $SERVICE_NAME${NC}"
    fi
}

# Stop all services
stop_service "frontend"
stop_service "backend"
stop_service "anvil"

# Additional cleanup - kill any remaining processes
echo ""
echo "Performing additional cleanup..."

# Kill any remaining anvil processes
pkill -f "anvil" 2>/dev/null && echo "Killed remaining Anvil processes"

# Kill any remaining bun dev processes
pkill -f "bun.*dev" 2>/dev/null && echo "Killed remaining Bun dev processes"

echo ""
echo -e "${GREEN}All services stopped${NC}"
