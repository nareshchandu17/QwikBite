# PowerShell script to kill processes on port 3000 and start dev server
Write-Host "Checking for processes on port 3000..." -ForegroundColor Green

# Find and kill any process using port 3000
$processes = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($processes) {
    foreach ($process in $processes) {
        $pid = $process.OwningProcess
        try {
            $processName = (Get-Process -Id $pid -ErrorAction SilentlyContinue).ProcessName
            Write-Host "Found process $pid ($processName) using port 3000, killing it..." -ForegroundColor Yellow
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        } catch {
            Write-Host "Could not kill process $pid" -ForegroundColor Red
        }
    }
} else {
    Write-Host "No processes found on port 3000" -ForegroundColor Green
}

Write-Host "Waiting for port to be released..." -ForegroundColor Green
Start-Sleep -Seconds 2

Write-Host "Starting development server on port 3000..." -ForegroundColor Green
npm run dev
