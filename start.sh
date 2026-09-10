#!/bin/bash
# StockUp AI Unified Startup Script

# Directories
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="${PROJECT_ROOT}/logs"
mkdir -p "${LOG_DIR}"

echo "=================================================="
echo "🚀 Initializing StockUp AI Local Development..."
echo "=================================================="

# Helper function to check port status & health
# Returns:
# 0 - Healthy
# 1 - Not running
# 2 - Occupied/Unhealthy
check_service_health() {
  local port=$1
  local path=$2
  
  if ! lsof -i :$port >/dev/null 2>&1; then
    return 1 # Not running at all
  fi
  
  # Fetch http status code
  local http_code
  http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 2 "http://localhost:${port}${path}")
  
  if [ "$http_code" = "200" ]; then
    return 0 # Healthy
  else
    return 2 # Occupied or returning error code
  fi
}

# 1. Check PostgreSQL
echo -n "Checking PostgreSQL (Port 5432)... "
if lsof -i :5432 >/dev/null 2>&1; then
  echo "🟢 RUNNING (PostgreSQL: 5432)"
else
  echo "🔴 NOT RUNNING (PostgreSQL: 5432)"
  echo "⚠️  Please make sure PostgreSQL is running on port 5432."
fi

# 2. Check & Start FastAPI ML Service (Port 8001)
echo -n "Checking FastAPI ML Service (Port 8001)... "
check_service_health 8001 "/health"
ML_STATUS=$?

if [ $ML_STATUS -eq 0 ]; then
  echo "🟢 ALREADY RUNNING & HEALTHY"
elif [ $ML_STATUS -eq 2 ]; then
  echo "🟡 PORT OCCUPIED (Unhealthy/Starting)"
else
  echo "🚀 Starting FastAPI ML Service..."
  cd "${PROJECT_ROOT}/stockup-backend"
  nohup python3 -m ml.api.app > "${LOG_DIR}/fastapi.log" 2>&1 &
  ML_PID=$!
  echo "   ↳ Started in background (PID: $ML_PID). Logs: logs/fastapi.log"
  cd "${PROJECT_ROOT}"
fi

# 3. Check & Start Spring Boot Backend (Port 8080)
echo -n "Checking Spring Boot Backend (Port 8080)... "
check_service_health 8080 "/actuator/health"
BOOT_STATUS=$?

if [ $BOOT_STATUS -eq 0 ]; then
  echo "🟢 ALREADY RUNNING & HEALTHY"
elif [ $BOOT_STATUS -eq 2 ]; then
  echo "🟡 PORT OCCUPIED (Unhealthy/Starting)"
else
  echo "🚀 Starting Spring Boot Backend..."
  cd "${PROJECT_ROOT}/stockup-backend"
  nohup ./mvnw spring-boot:run -Dspring-boot.run.profiles=default > "${LOG_DIR}/spring-boot.log" 2>&1 &
  BOOT_PID=$!
  echo "   ↳ Started in background (PID: $BOOT_PID). Logs: logs/spring-boot.log"
  cd "${PROJECT_ROOT}"
fi

# 4. Check & Start React Frontend (Port 5173)
echo -n "Checking React Frontend (Port 5173)... "
check_service_health 5173 "/"
FE_STATUS=$?

if [ $FE_STATUS -eq 0 ]; then
  echo "🟢 ALREADY RUNNING & HEALTHY"
elif [ $FE_STATUS -eq 2 ]; then
  echo "🟡 PORT OCCUPIED (Unhealthy/Starting)"
else
  echo "🚀 Starting React Frontend (Vite)..."
  cd "${PROJECT_ROOT}"
  nohup npm run dev > "${LOG_DIR}/frontend.log" 2>&1 &
  FE_PID=$!
  echo "   ↳ Started in background (PID: $FE_PID). Logs: logs/frontend.log"
fi

echo "--------------------------------------------------"
echo "⏳ Waiting for services to initialize..."
sleep 5

echo "=================================================="
echo "🎉 StockUp AI local services status:"
echo "--------------------------------------------------"
echo "  PostgreSQL: 5432"

if check_service_health 8080 "/actuator/health"; then
  echo "  Spring Boot: 8080 (🟢 HEALTHY)"
else
  echo "  Spring Boot: 8080 (🔴 NOT READY YET)"
fi

if check_service_health 8001 "/health"; then
  echo "  FastAPI: 8001 (🟢 HEALTHY)"
else
  echo "  FastAPI: 8001 (🔴 NOT READY YET)"
fi

if check_service_health 5173 "/"; then
  echo "  React: 5173 (🟢 HEALTHY)"
else
  echo "  React: 5173 (🔴 NOT READY YET)"
fi

echo "=================================================="
echo "🔗 Service Access URLs:"
echo "--------------------------------------------------"
echo "  Frontend:         http://localhost:5173"
echo "  Spring Boot:      http://localhost:8080"
echo "  FastAPI ML:       http://localhost:8001"
echo "=================================================="
echo "💡 To stop all application services, run: ./stop.sh"
echo "=================================================="
echo "Streaming logs (Press Ctrl+C to stop viewing)..."
echo ""

# Touch log files to ensure they exist for tail
touch "${LOG_DIR}/spring-boot.log" "${LOG_DIR}/fastapi.log" "${LOG_DIR}/frontend.log"

# Tail logs to keep terminal active
tail -f "${LOG_DIR}/spring-boot.log" "${LOG_DIR}/fastapi.log" "${LOG_DIR}/frontend.log"

