#!/bin/bash

echo "🚀 Starting Postwoman App..."

# Load NVM (Node Version Manager) if available to ensure Node 20 is used
if [ -s "$HOME/.nvm/nvm.sh" ]; then
    source "$HOME/.nvm/nvm.sh"
    nvm use 20
fi

# Function to cleanup background processes on exit
cleanup() {
    echo "🛑 Shutting down Postwoman..."
    kill $BACKEND_PID 2>/dev/null
    exit
}

# Catch termination signals and run cleanup
trap cleanup SIGINT SIGTERM

echo "📦 Starting FastAPI Backend on port 8000..."
# Activate virtual environment and start backend
source backend/venv/bin/activate
uvicorn backend.main:app --port 8000 --reload &
BACKEND_PID=$!

echo "🖥️  Starting Next.js Frontend on port 3000..."
# Start frontend
cd frontend
npm run dev -- -p 3000

# Wait for frontend process to finish (if it somehow stops)
wait
