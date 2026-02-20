package com.jarvis.geminibridge

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var statusText: TextView
    private lateinit var startButton: Button
    private lateinit var stopButton: Button

    private val statusReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action != BridgeService.ACTION_STATUS) return
            val running = intent.getBooleanExtra(BridgeService.EXTRA_RUNNING, false)
            val message = intent.getStringExtra(BridgeService.EXTRA_MESSAGE) ?: ""
            statusText.text = message
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        statusText = findViewById(R.id.status_text)
        startButton = findViewById(R.id.start_btn)
        stopButton = findViewById(R.id.stop_btn)

        startButton.setOnClickListener {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(Intent(this, BridgeService::class.java))
            } else {
                startService(Intent(this, BridgeService::class.java))
            }
            statusText.text = "Starting…"
        }
        stopButton.setOnClickListener {
            stopService(Intent(this, BridgeService::class.java))
            statusText.text = "Bridge stopped"
        }
    }

    override fun onResume() {
        super.onResume()
        val filter = IntentFilter(BridgeService.ACTION_STATUS)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(statusReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            registerReceiver(statusReceiver, filter)
        }
    }

    override fun onPause() {
        super.onPause()
        try { unregisterReceiver(statusReceiver) } catch (_: Exception) { }
    }
}
