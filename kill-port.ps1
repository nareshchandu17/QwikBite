# PowerShell script to kill processes using ports 3001, 9229, 9230
Write-Host "Killing processes on ports 3001, 9229, 9230..." -ForegroundColor Yellow

$ports = @(3001, 9229, 9230)

foreach ($port in $ports) {
    $processes = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    
    if ($processes) {
        foreach ($pid in $processes) {
            $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
            if ($process) {
                Write-Host "Killing process $($process.Name) (PID: $pid) on port $port" -ForegroundColor Red
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            }
        }
    } else {
        Write-Host "No process found on port $port" -ForegroundColor Green
    }
}

Write-Host "Done! You can now start the dev server." -ForegroundColor Green

