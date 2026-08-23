#!/bin/bash
# StockUp AI Unified Shutdown Script

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=================================================="
echo "🛑 Stopping StockUp AI Services..."
echo "================================================--"

kill_port_service() {
  local port=$1
  local name=$2
  
  local pids
  pids=$(lsof -t -i :$port 2>/dev/null)
  
  if [ -n "$pids" ]; then
    echo "Stopping $name on port $port (PIDs: $pids)..."
    kill $pids 2>/dev/null
    sleep 1
    # Check if still running, force kill if necessary
    pids_remaining=$(lsof -t -i :$port 2>/dev/null)
    if [ -n "$pids_remaining" ]; then
      echo "Force stopping remaining processes (PIDs: $pids_remaining)..."
      kill -9 $pids_remaining 2>/dev/null
    fi
    echo "🟢 Stopped $name."
  else
    echo "⚪ $name on port $port is not running."
  fi
}

kill_port_service 8080 "Spring Boot Backend"
kill_port_service 8001 "FastAPI ML Service"
kill_port_service 8000 "Python Assistant Service"
kill_port_service 5173 "React Frontend"

echo "=================================================="
echo "✅ All application services stopped."
echo "=================================================="
