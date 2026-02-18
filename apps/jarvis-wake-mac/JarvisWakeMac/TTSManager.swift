//
//  TTSManager.swift
//  Speak reply using NSSpeechSynthesizer or fallback to `say`.
//

import AppKit
import Foundation

final class TTSManager {
    static let shared = TTSManager()
    private var synthesizer: NSSpeechSynthesizer?

    private init() {}

    func speak(_ text: String) {
        let cleaned = text
            .replacingOccurrences(of: "\n", with: " ")
            .trimmingCharacters(in: .whitespacesAndNewlines)
        let limited = String(cleaned.prefix(2000))

        if NSSpeechSynthesizer.availableVoices.isEmpty == false {
            if synthesizer == nil {
                synthesizer = NSSpeechSynthesizer()
            }
            synthesizer?.stopSpeaking()
            synthesizer?.startSpeaking(limited)
        } else {
            // Fallback: run `say`
            Process.launchProcess(
                executableURL: URL(fileURLWithPath: "/usr/bin/say"),
                arguments: [limited]
            )
        }
    }

    func stop() {
        synthesizer?.stopSpeaking()
    }
}

extension Process {
    static func launchProcess(executableURL: URL, arguments: [String]) {
        let proc = Process()
        proc.executableURL = executableURL
        proc.arguments = arguments
        try? proc.run()
    }
}
