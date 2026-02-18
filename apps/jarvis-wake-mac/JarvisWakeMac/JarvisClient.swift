//
//  JarvisClient.swift
//  POST command to JARVIS gateway or Edge; parse reply content.
//

import Foundation

enum JarvisClientError: LocalizedError {
    case invalidURL
    case noData
    case httpError(Int, String?)

    var errorDescription: String? {
        switch self {
        case .invalidURL: return "Invalid JARVIS URL"
        case .noData: return "No response from JARVIS"
        case .httpError(let code, let msg): return "JARVIS error \(code): \(msg ?? "unknown")"
        }
    }
}

final class JarvisClient {
    static let shared = JarvisClient()

    private init() {}

    /// Send a message and return the assistant reply text. Uses WakeConfig for URL and token.
    func send(message: String) async throws -> String? {
        let config = WakeConfig.shared
        let url = config.baseURL
        let token = config.token

        if url.absoluteString.contains("supabase.co") && url.absoluteString.contains("functions/v1") {
            return try await sendToEdge(url: url, token: token, message: message)
        } else {
            return try await sendToGateway(url: url, token: token, message: message)
        }
    }

    /// Edge: POST { "message": "...", "session_id": "wake-word" } → { "content": "..." }
    private func sendToEdge(url: URL, token: String?, message: String) async throws -> String? {
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token = token, !token.isEmpty {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        let body: [String: Any] = [
            "message": message,
            "session_id": "wake-word"
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw JarvisClientError.noData }
        if http.statusCode != 200 {
            let msg = String(data: data, encoding: .utf8)
            throw JarvisClientError.httpError(http.statusCode, msg)
        }
        return extractContent(from: data)
    }

    /// Gateway: POST .../v1/chat/completions (same contract as jarvis-ui: openclaw:main + agent-id header)
    private func sendToGateway(url: URL, token: String?, message: String) async throws -> String? {
        let completionsURL = url.appendingPathComponent("v1/chat/completions")
        var request = URLRequest(url: completionsURL)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("main", forHTTPHeaderField: "x-openclaw-agent-id")
        if let token = token, !token.isEmpty {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        let trimmed = String(message.trimmingCharacters(in: .whitespacesAndNewlines).prefix(4000))
        // Unique user/session per request so the gateway doesn't accumulate history (avoids "prompt too large")
        let sessionId = "wake-\(UUID().uuidString)"
        let body: [String: Any] = [
            "model": "openclaw:main",
            "messages": [["role": "user", "content": trimmed]],
            "stream": false,
            "user": sessionId
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw JarvisClientError.noData }
        if http.statusCode != 200 {
            let msg = String(data: data, encoding: .utf8)
            throw JarvisClientError.httpError(http.statusCode, msg)
        }
        return extractContent(from: data)
    }

    /// Parse JSON response for content (OpenAI-style or Edge-style)
    private func extractContent(from data: Data) -> String? {
        guard let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else { return nil }
        if let content = json["content"] as? String, !content.isEmpty { return content }
        if let message = json["message"] as? String, !message.isEmpty { return message }
        if let text = json["text"] as? String, !text.isEmpty { return text }
        if let choices = json["choices"] as? [[String: Any]], let first = choices.first,
           let msg = first["message"] as? [String: Any],
           let content = msg["content"] as? String { return content }
        return nil
    }
}
