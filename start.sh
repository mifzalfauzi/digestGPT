#!/bin/bash

# DigestGPT Development Startup Script

echo "🧠 Starting DigestGPT Development Environment"
echo "============================================="

# Check if .env file exists in backend
if [ ! -f "backend/.env" ]; then
    echo "⚠️  Creating backend/.env file..."
    echo "ANTHROPIC_API_KEY=your_anthropic_api_key_here" > backend/.env
    echo "📝 Please update backend/.env with your Anthropic API key"
fi

# Start backend
echo "🔧 Starting backend..."
cd backend
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python -m venv venv
fi

# Activate virtual environment (Linux/Mac)
source venv/bin/activate

# Install backend dependencies
echo "📥 Installing backend dependencies..."
pip install -r requirements.txt

# Start backend in background
echo "🚀 Starting backend server..."
python main.py &
BACKEND_PID=$!

cd ..

# Start frontend
echo "🎨 Starting frontend..."
cd frontend

# Install frontend dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📥 Installing frontend dependencies..."
    npm install
fi

# Start frontend
echo "🚀 Starting frontend server..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ DigestGPT is starting up!"
echo "📍 Backend:  http://localhost:8000"
echo "📍 Frontend: http://localhost:3000"
echo ""
echo "🛑 Press Ctrl+C to stop both servers"

# Wait for Ctrl+C
trap "echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait 