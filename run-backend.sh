#!/bin/bash
# StockUp AI — Run Backend Server
# Run this from the B-TECh root folder

cd "$(dirname "$0")/backend"
echo "📡 Starting StockUp AI backend from: $(pwd)"
python3 -m uvicorn main:app --reload --port 8000
