//
//  WakeWordEngine.swift
//  Wake word "Hey JARVIS" — burst mode (mic on only in short bursts) or continuous.
//

import AVFoundation
import Foundation
import Speech

final class WakeWordEngine {
    /// Prefer "hey jarvis" first to reduce false wakes from "jarvis" in noise.
    private let wakePhrases = ["hey jarvis", "jarvis"]
    /// When matching the short phrase "jarvis" only, require at least this many characters to reduce false wakes.
    private let minTranscriptLengthForShortPhrase = 6
    private let commandTimeoutSeconds: TimeInterval = 10

    /// Burst mode: listen for this long, then mic OFF for burstIdleDuration. Orange dot only on during burst + command.
    private let burstListenDuration: TimeInterval = 2.5
    private let burstIdleDuration: TimeInterval = 2.0

    /// Errors we can recover from by restarting the recognition task (no user alert).
    private static func isRecoverableSpeechError(_ error: Error) -> Bool {
        let ns = error as NSError
        if ns.code == 216 || ns.code == 1100 { return true } // cancelled / stopped
        let msg = (ns.localizedDescription + " " + (ns.localizedFailureReason ?? "")).lowercased()
        if msg.contains("overflow") || msg.contains("context") { return true } // context overflow
        return false
    }
    private var audioEngine: AVAudioEngine?
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private let speechRecognizer: SFSpeechRecognizer? = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))
    private var isListening = false
    private var lastTranscript = ""
    private var commandBuffer: String = ""
    private var isBufferingCommand = false
    private let queue = DispatchQueue(label: "wake.word.engine")
    /// In burst mode: we're in a short listen window (true) or idle gap (false). Nil = not burst mode (e.g. capturing command).
    private var burstListenWorkItem: DispatchWorkItem?
    /// Cycle recognition task periodically when in continuous command capture (avoid context overflow).
    private var cycleTimer: DispatchSourceTimer?
    private let cycleInterval: TimeInterval = 35

    var onStateChange: ((Bool) -> Void)?
    /// true = heard wake word, now capturing command; false = sleeping, waiting for "Hey JARVIS"
    var onAwakeChange: ((Bool) -> Void)?
    var onCommand: ((String) -> Void)?
    var onError: ((String) -> Void)?
    /// Optional: report latest transcript for debugging (what the app "heard").
    var onTranscriptUpdate: ((String) -> Void)?

    /// Request speech + mic permissions only; call completion when done (does not start listening).
    func requestPermissionsOnly(completion: @escaping () -> Void) {
        SFSpeechRecognizer.requestAuthorization { [weak self] status in
            DispatchQueue.main.async {
                switch status {
                case .authorized:
                    self?.requestMicOnly(completion: completion)
                case .denied:
                    self?.onError?("Speech recognition denied. Enable in System Settings → Privacy & Security.")
                    completion()
                case .restricted:
                    self?.onError?("Speech recognition restricted.")
                    completion()
                case .notDetermined:
                    self?.onError?("Speech recognition not determined.")
                    completion()
                @unknown default:
                    self?.onError?("Speech recognition unavailable.")
                    completion()
                }
            }
        }
    }

    /// Start listening after requesting permissions (legacy: use requestPermissionsOnly + startListening for battery-friendly default).
    func requestPermissionsAndStart() {
        requestPermissionsOnly { [weak self] in
            self?.startListening()
        }
    }

    private func requestMicOnly(completion: @escaping () -> Void) {
        switch AVCaptureDevice.authorizationStatus(for: .audio) {
        case .authorized:
            completion()
        case .notDetermined:
            AVCaptureDevice.requestAccess(for: .audio) { [weak self] granted in
                DispatchQueue.main.async {
                    if !granted { self?.onError?("Microphone access denied.") }
                    completion()
                }
            }
        default:
            onError?("Microphone access denied. Enable in System Settings → Privacy & Security.")
            completion()
        }
    }

    private func requestMicAndStart() {
        requestMicOnly { [weak self] in
            self?.startListening()
        }
    }

    func startListening() {
        guard let recognizer = speechRecognizer, recognizer.isAvailable else {
            onError?("Speech recognizer not available.")
            return
        }
        isListening = true
        DispatchQueue.main.async { [weak self] in self?.onStateChange?(true) }
        queue.async { [weak self] in self?.startBurstCycle() }
    }

    func stopListening() {
        queue.async { [weak self] in
            guard let self = self else { return }
            self.burstListenWorkItem?.cancel()
            self.burstListenWorkItem = nil
            self.cycleTimer?.cancel()
            self.cycleTimer = nil
            self.isBufferingCommand = false
            DispatchQueue.main.async { [weak self] in self?.onAwakeChange?(false) }
            self.recognitionTask?.cancel()
            self.recognitionTask = nil
            self.recognitionRequest?.endAudio()
            self.recognitionRequest = nil
            let engine = self.audioEngine
            self.audioEngine = nil
            self.isListening = false
            DispatchQueue.main.async { [weak self] in
                engine?.inputNode.removeTap(onBus: 0)
                engine?.stop()
                self?.onStateChange?(false)
            }
        }
    }

    func toggleListening() {
        if isListening { stopListening() }
        else { requestPermissionsAndStart() }
    }

    // MARK: - Burst mode (mic on only in short bursts; orange dot off between bursts)

    private func startBurstCycle() {
        guard isListening else { return }
        runBurst()
    }

    private func runBurst() {
        guard isListening, let speechRecognizer = speechRecognizer, speechRecognizer.isAvailable else { return }
        runRecognition(for: burstListenDuration) { [weak self] transcript in
            self?.onBurstCompleted(transcript: transcript)
        }
    }

    private func onBurstCompleted(transcript: String) {
        guard isListening else { return }
        let t = transcript.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        if !t.isEmpty {
            DispatchQueue.main.async { [weak self] in self?.onTranscriptUpdate?(t) }
        }
        for phrase in wakePhrases {
            guard t.contains(phrase) else { continue }
            // Harden: for "jarvis" alone (short phrase), require minimum transcript length to reduce false wakes.
            if phrase == "jarvis", t.count < minTranscriptLengthForShortPhrase { continue }
            let after = t.components(separatedBy: phrase).last?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
            if !after.isEmpty {
                submitCommand(after)
                scheduleNextBurst()
                return
            }
            startCommandCapture()
            return
        }
        scheduleNextBurst()
    }

    private func scheduleNextBurst() {
        guard isListening else { return }
        let work = DispatchWorkItem { [weak self] in
            self?.startBurstCycle()
        }
        burstListenWorkItem = work
        queue.asyncAfter(deadline: .now() + burstIdleDuration, execute: work)
    }

    private func startCommandCapture() {
        guard isListening else { return }
        DispatchQueue.main.async { [weak self] in self?.onAwakeChange?(true) }
        runRecognition(for: commandTimeoutSeconds) { [weak self] transcript in
            self?.onCommandCaptureCompleted(transcript: transcript)
        }
    }

    private func onCommandCaptureCompleted(transcript: String) {
        DispatchQueue.main.async { [weak self] in self?.onAwakeChange?(false) }
        let cmd = transcript.trimmingCharacters(in: .whitespacesAndNewlines)
        if !cmd.isEmpty {
            submitCommand(cmd)
        }
        scheduleNextBurst()
    }

    /// Run mic + recognition for `duration` seconds, then stop mic and call `completion(transcript)` on queue.
    private func runRecognition(for duration: TimeInterval, completion: @escaping (String) -> Void) {
        guard let speechRecognizer = speechRecognizer, audioEngine == nil else {
            completion("")
            return
        }
        let engine = AVAudioEngine()
        audioEngine = engine
        let request = SFSpeechAudioBufferRecognitionRequest()
        recognitionRequest = request
        request.shouldReportPartialResults = true
        request.requiresOnDeviceRecognition = false
        if #available(macOS 13.0, *) {
            request.requiresOnDeviceRecognition = speechRecognizer.supportsOnDeviceRecognition
        }
        let inputNode = engine.inputNode
        let format = inputNode.outputFormat(forBus: 0)
        inputNode.installTap(onBus: 0, bufferSize: 2048, format: format) { [weak self] buffer, _ in
            guard buffer.frameLength > 0 else { return }
            self?.recognitionRequest?.append(buffer)
        }
        engine.prepare()
        var startError: Error?
        let sem = DispatchSemaphore(value: 0)
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
            do { try engine.start() } catch { startError = error }
            sem.signal()
        }
        sem.wait()
        if let startError = startError {
            audioEngine = nil
            recognitionRequest = nil
            onError?(startError.localizedDescription)
            completion("")
            return
        }
        var finalTranscript = ""
        var completionDone = false
        let endAudioCalled = UnsafeMutablePointer<Bool>.allocate(capacity: 1)
        endAudioCalled.initialize(to: false)
        defer { endAudioCalled.deallocate() }
        queue.asyncAfter(deadline: .now() + duration) { [weak self] in
            endAudioCalled.pointee = true
            self?.recognitionRequest?.endAudio()
        }
        recognitionTask = speechRecognizer.recognitionTask(with: request) { [weak self] result, error in
            if let result = result {
                finalTranscript = result.bestTranscription.formattedString
            }
            if let error = error, !Self.isRecoverableSpeechError(error) {
                DispatchQueue.main.async { self?.onError?(error.localizedDescription) }
            }
            let taskEnded = endAudioCalled.pointee || (error != nil && (error.map { !Self.isRecoverableSpeechError($0) } ?? true))
            self?.queue.async {
                guard let self = self, !completionDone, taskEnded else { return }
                completionDone = true
                DispatchQueue.main.async {
                    engine.inputNode.removeTap(onBus: 0)
                    engine.stop()
                }
                self.audioEngine = nil
                self.recognitionRequest = nil
                self.recognitionTask = nil
                completion(finalTranscript)
            }
        }
    }

    private func processPartialTranscript(_ transcript: String, isFinal: Bool = false) {
        lastTranscript = transcript
        if !transcript.isEmpty {
            DispatchQueue.main.async { [weak self] in self?.onTranscriptUpdate?(transcript) }
        }
        for phrase in wakePhrases {
            if transcript.contains(phrase) {
                // Harden: for "jarvis" alone, require minimum length to reduce false wakes.
                let t = transcript.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
                if phrase == "jarvis", t.count < minTranscriptLengthForShortPhrase { continue }
                // Extract command: text after the wake phrase
                let afterPhrase = transcript
                    .components(separatedBy: phrase)
                    .last?
                    .trimmingCharacters(in: .whitespacesAndNewlines)
                    ?? ""
                if !afterPhrase.isEmpty {
                    submitCommand(afterPhrase)
                    return
                }
                // Wake heard but no command in same utterance — start buffering
                startCommandBuffer()
                return
            }
        }
        if isBufferingCommand {
            commandBuffer = transcript
            if isFinal && !transcript.isEmpty {
                isBufferingCommand = false
                DispatchQueue.main.async { [weak self] in self?.onAwakeChange?(false) }
                queue.asyncAfter(deadline: .now() + 0.3) { [weak self] in
                    let cmd = self?.commandBuffer.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
                    if !cmd.isEmpty { self?.submitCommand(cmd) }
                }
            }
        }
    }

    private func startCommandBuffer() {
        isBufferingCommand = true
        commandBuffer = ""
        DispatchQueue.main.async { [weak self] in self?.onAwakeChange?(true) }
        queue.asyncAfter(deadline: .now() + commandTimeoutSeconds) { [weak self] in
            guard let self = self, self.isBufferingCommand else { return }
            self.isBufferingCommand = false
            DispatchQueue.main.async { [weak self] in self?.onAwakeChange?(false) }
            let cmd = self.commandBuffer.trimmingCharacters(in: .whitespacesAndNewlines)
            if !cmd.isEmpty {
                self.submitCommand(cmd)
            }
        }
    }

    private func submitCommand(_ command: String) {
        isBufferingCommand = false
        commandBuffer = ""
        DispatchQueue.main.async { [weak self] in self?.onAwakeChange?(false) }
        let trimmed = command.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.isEmpty { return }
        DispatchQueue.main.async { [weak self] in
            self?.onCommand?(trimmed)
        }
    }
}
