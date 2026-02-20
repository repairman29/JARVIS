package com.jarvis.geminibridge

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat

class BridgeService : Service() {

    companion object {
        const val ACTION_STATUS = "com.jarvis.geminibridge.STATUS"
        const val EXTRA_RUNNING = "running"
        const val EXTRA_MESSAGE = "message"
    }

    private var server: ChatCompletionsServer? = null
    private var started = false

    private fun sendStatus(running: Boolean, message: String) {
        Intent(ACTION_STATUS).apply {
            setPackage(packageName)
            putExtra(EXTRA_RUNNING, running)
            putExtra(EXTRA_MESSAGE, message)
            sendBroadcast(this)
        }
    }

    override fun onCreate() {
        super.onCreate()
        // Init Gemini Nano in background so we don't block the main thread (avoids ANR / app not responding)
        Thread {
            try {
                GeminiNano.init()
            } catch (_: Exception) { }
        }.start()
        server = ChatCompletionsServer(8890)
        try {
            server?.start()
            started = true
        } catch (e: Exception) {
            started = false
            sendStatus(false, "Failed: ${e.message ?: "could not bind port 8890"}")
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val channelId = "jarvis_bridge_channel"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "JARVIS Gemini Bridge",
                NotificationManager.IMPORTANCE_DEFAULT
            )
            channel.description = "Bridge is running when you see this"
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }
        val pending = PendingIntent.getActivity(
            this, 0, Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val statusText = if (started) "Listening on 127.0.0.1:8890 — tap to open" else "Failed to start"
        val notification: Notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle("JARVIS Gemini Bridge")
            .setContentText(statusText)
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setContentIntent(pending)
            .setOngoing(true)
            .build()
        startForeground(1, notification)
        if (started) sendStatus(true, "Listening on 127.0.0.1:8890")
        return START_STICKY
    }

    override fun onDestroy() {
        sendStatus(false, "Bridge stopped")
        try {
            server?.stop()
        } catch (e: Exception) { }
        server = null
        stopForeground(STOP_FOREGROUND_REMOVE)
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
