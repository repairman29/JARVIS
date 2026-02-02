# Schedule JARVIS watchdog to run every 5 minutes (check + restart gateway if down)
# Run this script once from repo root or scripts folder. To remove: Task Scheduler → JARVIS Watchdog → Delete

$taskName = "JARVIS Watchdog"
$repoRoot = if (Test-Path (Join-Path $PSScriptRoot "..\package.json")) { (Resolve-Path (Join-Path $PSScriptRoot "..")).Path } else { $PSScriptRoot }
$scriptPath = Join-Path $repoRoot "scripts\watchdog-jarvis-local.js"
$nodeExe = (Get-Command node -ErrorAction SilentlyContinue).Source

if (-not $nodeExe) {
    Write-Host "Error: node not found in PATH." -ForegroundColor Red
    exit 1
}
if (-not (Test-Path $scriptPath)) {
    Write-Host "Error: $scriptPath not found." -ForegroundColor Red
    exit 1
}

$action = New-ScheduledTaskAction -Execute $nodeExe -Argument "`"$scriptPath`"" -WorkingDirectory $repoRoot
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 5) -RepetitionDuration (New-TimeSpan -Days 365)
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

try {
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null
    Write-Host "Done. JARVIS Watchdog will run every 5 minutes." -ForegroundColor Green
    Write-Host "To remove: Task Scheduler → Task Scheduler Library → '$taskName' → Delete" -ForegroundColor Gray
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}
