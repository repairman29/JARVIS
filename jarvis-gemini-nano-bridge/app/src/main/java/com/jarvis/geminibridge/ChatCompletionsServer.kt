package com.jarvis.geminibridge

import fi.iki.elonen.NanoHTTPD
import org.json.JSONArray
import org.json.JSONObject
/**
 * HTTP server that exposes POST /v1/chat/completions (OpenAI-compatible).
 * Binds to 127.0.0.1:8890 so Termux/JARVIS on the same device can call it.
 */
class ChatCompletionsServer(port: Int = 8890) : NanoHTTPD("127.0.0.1", port) {

    override fun serve(session: IHTTPSession): Response {
        if (session.method != Method.POST) {
            return newFixedLengthResponse(Response.Status.METHOD_NOT_ALLOWED, MIME_PLAINTEXT, "Method Not Allowed")
        }
        val uri = session.uri ?: ""
        if (!uri.startsWith("/v1/chat/completions")) {
            return newFixedLengthResponse(Response.Status.NOT_FOUND, MIME_PLAINTEXT, "Not Found")
        }
        val body = try {
            val map = HashMap<String, String>()
            session.parseBody(map)
            map["postData"] ?: "{}"
        } catch (e: Exception) {
            "{}"
        }
        val stream = try {
            JSONObject(body).optBoolean("stream", false)
        } catch (e: Exception) {
            false
        }
        val messages = mutableListOf<GeminiNano.Message>()
        try {
            val root = JSONObject(body)
            val arr = root.optJSONArray("messages") ?: JSONArray()
            for (i in 0 until arr.length()) {
                val obj = arr.getJSONObject(i)
                messages.add(
                    GeminiNano.Message(
                        role = obj.optString("role", "user"),
                        content = obj.optString("content", "")
                    )
                )
            }
        } catch (e: Exception) {
            return newFixedLengthResponse(Response.Status.BAD_REQUEST, "application/json", """{"error":{"message":"Invalid JSON"}}""")
        }
        if (messages.isEmpty()) {
            return newFixedLengthResponse(Response.Status.BAD_REQUEST, "application/json", """{"error":{"message":"messages required"}}""")
        }
        val content = try {
            GeminiNano.complete(messages)
        } catch (e: Exception) {
            "Error: ${e.message}"
        }
        return if (stream) {
            val sb = StringBuilder()
            for (chunk in content.chunked(50)) {
                val data = JSONObject().apply {
                    put("choices", JSONArray().put(JSONObject().apply {
                        put("delta", JSONObject().apply { put("content", chunk) })
                    }))
                }
                sb.append("data: $data\n\n")
            }
            sb.append("data: [DONE]\n\n")
            newFixedLengthResponse(Response.Status.OK, "text/event-stream", sb.toString())
        } else {
            val json = JSONObject().apply {
                put("choices", JSONArray().apply {
                    put(JSONObject().apply {
                        put("message", JSONObject().apply {
                            put("role", "assistant")
                            put("content", content)
                        })
                    })
                })
            }
            newFixedLengthResponse(Response.Status.OK, "application/json", json.toString())
        }
    }
}
