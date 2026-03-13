$ErrorActionPreference = "Stop"

$ROOT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$BACKEND_DIR = Join-Path $ROOT_DIR "backend"
$FRONTEND_DIR = Join-Path $ROOT_DIR "frontend"

if (!(Test-Path $BACKEND_DIR) -or !(Test-Path $FRONTEND_DIR)) {
    Write-Host "Error: expected backend/ and frontend/ directories next to this script."
    exit 1
}

if (!(Test-Path (Join-Path $BACKEND_DIR ".env"))) {
    Write-Host "Warning: backend/.env not found. Copy backend/.env.example -> backend/.env"
}

if (!(Test-Path (Join-Path $FRONTEND_DIR ".env"))) {
    Write-Host "Warning: frontend/.env not found. Copy frontend/.env.example -> frontend/.env"
}

Write-Host "Starting backend on http://localhost:8000 ..."
$backendProcess = Start-Process powershell `
    -ArgumentList "-NoExit", "-Command", "cd '$BACKEND_DIR'; python -m uvicorn app.main:app --reload --port 8000" `
    -PassThru

Write-Host "Starting frontend on http://localhost:5173 ..."
$frontendProcess = Start-Process powershell `
    -ArgumentList "-NoExit", "-Command", "cd '$FRONTEND_DIR'; npm run dev -- --host 0.0.0.0 --port 5173" `
    -PassThru

function Cleanup {
    Write-Host ""
    Write-Host "Shutting down dev servers..."

    if ($backendProcess -and !$backendProcess.HasExited) {
        Stop-Process -Id $backendProcess.Id -Force
    }

    if ($frontendProcess -and !$frontendProcess.HasExited) {
        Stop-Process -Id $frontendProcess.Id -Force
    }
}

Register-EngineEvent PowerShell.Exiting -Action { Cleanup } | Out-Null

Write-Host ""
Write-Host "Dev servers are running:"
Write-Host "  Frontend: http://localhost:5173"
Write-Host "  Backend:  http://localhost:8000"
Write-Host "Press Ctrl+C to stop."
Write-Host ""

Wait-Process -Id $backendProcess.Id, $frontendProcess.Id