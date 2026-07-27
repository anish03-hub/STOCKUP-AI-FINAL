#!/bin/bash
# StockUp AI — Full Stack Startup Script
# Starts both the Python FastAPI backend and the React frontend

echo "🚀 Starting StockUp AI Full Stack..."
echo ""

# Check .env for HF_TOKEN
if grep -q "your_huggingface_token_here" "backend/.env"; then
  echo "⚠️  WARNING: HF_TOKEN is not set in backend/.env"
  echo "   Get your free token at: https://huggingface.co/settings/tokens"
  echo "   Then edit: backend/.env"
  echo ""
fi

# Start Python backend in background
echo "📡 Starting Python FastAPI backend on http://localhost:8000 ..."
cd backend && uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 2

# Start React frontend
echo "⚛️  Starting React frontend on http://localhost:5173 ..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Both servers are running!"
echo "   Frontend → http://localhost:5173"
echo "   Backend  → http://localhost:8000"
echo "   API Docs → http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers."

# Wait and cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo '🛑 Servers stopped.'" EXIT
wait
