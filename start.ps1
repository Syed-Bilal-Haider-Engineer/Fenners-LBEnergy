# start.ps1 — starts all three services for local development
# Usage: .\start.ps1
# Stop everything: Ctrl+C in each terminal window, or close the windows

$root = $PSScriptRoot

Write-Host "Starting backend  (Express)  -> http://localhost:5000"
Start-Process powershell -ArgumentList "-NoProfile -NoExit -Command Set-Location '$root\backend'; node index.js" -WindowStyle Normal

Write-Host "Starting Python API (FastAPI) -> http://localhost:8000"
Start-Process powershell -ArgumentList "-NoProfile -NoExit -Command Set-Location '$root'; .venv\Scripts\Activate.ps1; uvicorn api:app --reload" -WindowStyle Normal

Write-Host "Starting frontend (Next.js)  -> http://localhost:3000"
Start-Process powershell -ArgumentList "-NoProfile -NoExit -Command Set-Location '$root\client'; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "All three services launched in separate windows."
Write-Host "  Frontend : http://localhost:3000"
Write-Host "  Express  : http://localhost:5000"
Write-Host "  FastAPI  : http://localhost:8000  (/docs for Swagger UI)"
