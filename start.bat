@echo off
echo 🧠 Starting DigestGPT Development Environment
echo =============================================

REM Check if .env file exists in backend
if not exist "backend\.env" (
    echo ⚠️  Creating backend\.env file...
    echo ANTHROPIC_API_KEY=your_anthropic_api_key_here > backend\.env
    echo 📝 Please update backend\.env with your Anthropic API key
)

REM Start backend
echo 🔧 Starting backend...
cd backend

if not exist "venv" (
    echo 📦 Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment (Windows)
call venv\Scripts\activate.bat

REM Install backend dependencies
echo 📥 Installing backend dependencies...
pip install -r requirements.txt

REM Start backend in background
echo 🚀 Starting backend server...
start /B python main.py

cd ..

REM Start frontend
echo 🎨 Starting frontend...
cd frontend

REM Install frontend dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo 📥 Installing frontend dependencies...
    npm install
)

REM Start frontend
echo 🚀 Starting frontend server...
start /B npm run dev

echo.
echo ✅ DigestGPT is starting up!
echo 📍 Backend:  http://localhost:8000
echo 📍 Frontend: http://localhost:3000
echo.
echo 🛑 Press Ctrl+C to stop servers (you may need to close terminal windows)

pause 