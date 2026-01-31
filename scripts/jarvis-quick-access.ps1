# JARVIS Quick Access - Opens the web dashboard
# Assign this script to Win+J using PowerToys Keyboard Manager or a shortcut

$jarvisUrl = "http://127.0.0.1:18789/"

# Check if gateway is running
$gatewayRunning = $false
try {
    $response = Invoke-WebRequest -Uri $jarvisUrl -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        $gatewayRunning = $true
    }
} catch {
    $gatewayRunning = $false
}

if ($gatewayRunning) {
    # Open in default browser
    Start-Process $jarvisUrl
} else {
    # Show notification that gateway isn't running
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.MessageBox]::Show(
        "JARVIS gateway is not running.`n`nStart it with:`nnpx clawdbot gateway run`n`nor:`nnode scripts/start-gateway-with-vault.js",
        "JARVIS",
        [System.Windows.Forms.MessageBoxButtons]::OK,
        [System.Windows.Forms.MessageBoxIcon]::Information
    )
}
