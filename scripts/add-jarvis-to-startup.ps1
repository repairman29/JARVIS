# Add JARVIS ROG Ed. to Windows startup (run gateway at logon)
# Run this script once. To remove later: Task Scheduler → JARVIS ROG Ed → Delete

$taskName = "JARVIS ROG Ed"
$batPath = Join-Path $PSScriptRoot "start-jarvis-ally-background.bat"
$batPath = (Resolve-Path $batPath).Path

if (-not (Test-Path $batPath)) {
    Write-Host "Error: $batPath not found." -ForegroundColor Red
    exit 1
}

$action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$batPath`"" -WorkingDirectory (Split-Path $batPath)
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

try {
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null
    Write-Host "Done. JARVIS ROG Ed. will start when you log on." -ForegroundColor Green
    Write-Host "To remove: Task Scheduler → Task Scheduler Library → '$taskName' → Delete" -ForegroundColor Gray
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}
