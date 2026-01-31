# Create a Windows shortcut that opens the JARVIS web dashboard (quick access)
# Run once. No PowerToys needed—double-click the shortcut. Optional: if you use PowerToys, bind Win+J to this shortcut.

$url = "http://127.0.0.1:18789/"
$desktop = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktop "JARVIS.lnk"

$ws = New-Object -ComObject WScript.Shell
$sc = $ws.CreateShortcut($shortcutPath)
$sc.TargetPath = $url
$sc.Description = "Open JARVIS dashboard"
$sc.Save()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($ws) | Out-Null

Write-Host "Created shortcut: $shortcutPath" -ForegroundColor Green
Write-Host "Double-click the shortcut to open JARVIS. (PowerToys optional: bind Win+J to this shortcut for hotkey access.)" -ForegroundColor Gray
