package com.jarvis.geminibridge

import com.google.mlkit.genai.common.FeatureStatus
import com.google.mlkit.genai.prompt.Generation
import com.google.mlkit.genai.prompt.GenerativeModel
import com.google.mlkit.genai.prompt.GenerateContentResponse
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext
import kotlinx.coroutines.Dispatchers

/**
 * Calls Gemini Nano via ML Kit GenAI Prompt API (on-device).
 * See: https://developers.google.com/ml-kit/genai/prompt/android
 */
object GeminiNano {

    private var model: GenerativeModel? = null
    private var initError: String? = null

    /**
     * Call from BridgeService.onCreate(). Gets the client and checks availability.
     */
    @Synchronized
    fun init() {
        if (model != null || initError != null) return
        try {
            val generativeModel = Generation.getClient()
            val status = runBlocking(Dispatchers.Default) { generativeModel.checkStatus() }
            when (status) {
                FeatureStatus.AVAILABLE -> {
                    model = generativeModel
                }
                FeatureStatus.UNAVAILABLE -> {
                    initError = "Gemini Nano not available on this device"
                }
                FeatureStatus.DOWNLOADABLE -> {
                    initError = "Gemini Nano can be downloaded in device settings (AICore / Google Play)"
                }
                FeatureStatus.DOWNLOADING -> {
                    initError = "Gemini Nano is downloading; try again in a few minutes"
                }
                else -> initError = "Gemini Nano status: $status"
            }
        } catch (e: Exception) {
            initError = e.message ?: "Failed to init Gemini Nano"
        }
    }

    /**
     * Turn OpenAI-style messages into a single prompt and get a completion from Gemini Nano.
     * Blocks on the calling thread. Returns error string if model not ready.
     */
    fun complete(messages: List<Message>): String {
        val err = initError
        if (err != null) return "Error: $err"
        val m = model ?: return "Error: Gemini Nano not initialized"
        val prompt = messages.joinToString("\n") { msg ->
            when (msg.role) {
                "system" -> "System: ${msg.content}"
                "user" -> "User: ${msg.content}"
                "assistant" -> "Assistant: ${msg.content}"
                else -> msg.content
            }
        }
        return runBlocking(Dispatchers.Default) {
            try {
                val response: GenerateContentResponse = m.generateContent(prompt)
                val text = response.candidates.firstOrNull()?.text
                text ?: "Error: empty response"
            } catch (e: Exception) {
                "Error: ${e.message ?: "generation failed"}"
            }
        }
    }

    data class Message(val role: String, val content: String)
}
