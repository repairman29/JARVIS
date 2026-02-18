/**
 * Focus Pro — focus sessions and deep-work blocks.
 * Starts a timer; when it ends, notifies: macOS say, Linux notify-send, Windows toast (PowerShell).
 */

const { spawn } = require('child_process');
const os = require('os');

const MAX_MINUTES = 180; // 3 hours cap

function notifyWhenDone(label) {
  const text = label ? `Focus session complete: ${label}.` : 'Focus session complete.';
  const platform = os.platform();

  if (platform === 'darwin') {
    const child = spawn('say', [text], { detached: true, stdio: 'ignore' });
    child.unref();
    return;
  }

  if (platform === 'linux') {
    const child = spawn('notify-send', ['Focus Pro', text], { detached: true, stdio: 'ignore' });
    child.unref();
    return;
  }

  if (platform === 'win32') {
    const script = `
      $title = $env:NOTIFY_TITLE; $body = $env:NOTIFY_BODY
      try {
        [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
        $xml = [Windows.Data.Xml.Dom.XmlDocument]::new()
        $xml.LoadXml(('<toast><visual><binding template="ToastText02"><text id="1">' + [System.Security.SecurityElement]::Escape($title) + '</text><text id="2">' + [System.Security.SecurityElement]::Escape($body) + '</text></binding></visual></toast>'))
        [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('JARVIS Focus Pro').Show([Windows.UI.Notifications.ToastNotification]::new($xml))
      } catch { }
    `;
    const child = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
      env: { ...process.env, NOTIFY_TITLE: 'Focus Pro', NOTIFY_BODY: text },
    });
    child.unref();
  }
}

const tools = {
  start_focus_session: async ({ duration_minutes = 25, label = '' } = {}) => {
    const mins = Math.min(MAX_MINUTES, Math.max(1, Number(duration_minutes) || 25));
    const labelStr = typeof label === 'string' && label.trim() ? label.trim() : 'focus';
    const ms = mins * 60 * 1000;
    setTimeout(() => notifyWhenDone(labelStr), ms);
    return {
      success: true,
      message: `Focus session started: ${mins} min${labelStr !== 'focus' ? ` (${labelStr})` : ''}. You'll get a notification when it ends.`,
      data: { duration_minutes: mins, label: labelStr },
    };
  },
};

module.exports = { tools };
