//
//  JarvisWakeMacApp.swift
//  JARVIS Wake — "Hey JARVIS" on macOS (menu bar app)
//

import SwiftUI

@main
struct JarvisWakeMacApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    var body: some Scene {
        WindowGroup("JARVIS Wake") {
            MainWindowView(state: appDelegate.wakeAppState, delegate: appDelegate)
        }
        .windowResizability(.contentSize)
        .defaultSize(width: 280, height: 260)
        Settings {
            SettingsView()
        }
    }
}

final class AppDelegate: NSObject, NSApplicationDelegate {
    var statusItem: NSStatusItem?
    var wakeEngine: WakeWordEngine?
    var menu: NSMenu?
    var lastHeardItem: NSMenuItem?
    var goLiveItem: NSMenuItem?
    let wakeAppState = WakeAppState()
    private var lastHeardText = ""
    private var isListening = false
    private var isAwake = false
    private var globalHotkeyMonitor: Any?

    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.regular) // Show in dock so user sees the app is running
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        if let button = statusItem?.button {
            button.image = Self.makeStatusBarImage(systemSymbolName: "ear.slash")
            button.toolTip = "Click to open menu — Go live to listen for Hey JARVIS"
        }
        menu = NSMenu()
        let toggleItem = NSMenuItem(title: "Go live", action: #selector(toggleListening), keyEquivalent: "j")
        toggleItem.keyEquivalentModifierMask = [.command, .shift]
        toggleItem.target = self
        goLiveItem = toggleItem
        menu?.addItem(toggleItem)
        let hintItem = NSMenuItem(title: "Say \"Hey JARVIS\" to wake, then your command", action: nil, keyEquivalent: "")
        hintItem.isEnabled = false
        menu?.addItem(hintItem)
        let heardItem = NSMenuItem(title: "Heard: (say something…)", action: nil, keyEquivalent: "")
        heardItem.isEnabled = false
        lastHeardItem = heardItem
        menu?.addItem(heardItem)
        menu?.addItem(NSMenuItem.separator())
        let testItem = NSMenuItem(title: "Test: Send \"What time is it?\"", action: #selector(sendTestCommand), keyEquivalent: "")
        testItem.target = self
        menu?.addItem(testItem)
        menu?.addItem(NSMenuItem.separator())
        let settingsItem = NSMenuItem(title: "Settings…", action: #selector(openSettings), keyEquivalent: ",")
        settingsItem.target = self
        menu?.addItem(settingsItem)
        let quitItem = NSMenuItem(title: "Quit", action: #selector(quit), keyEquivalent: "q")
        quitItem.target = self
        menu?.addItem(quitItem)
        statusItem?.menu = menu
        statusItem?.isVisible = WakeConfig.shared.showMenuBarIcon

        NotificationCenter.default.addObserver(self, selector: #selector(updateMenuBarIconVisibility), name: AppDelegate.showMenuBarIconDidChange, object: nil)

        wakeEngine = WakeWordEngine()
        wakeEngine?.onStateChange = { [weak self] listening in
            DispatchQueue.main.async {
                self?.isListening = listening
                if !listening { self?.isAwake = false }
                self?.wakeAppState.isListening = listening
                self?.updateMenuAndIcon()
            }
        }
        wakeEngine?.onAwakeChange = { [weak self] awake in
            DispatchQueue.main.async {
                self?.isAwake = awake
                self?.wakeAppState.isAwake = awake
                self?.updateMenuAndIcon()
            }
        }
        wakeEngine?.onCommand = { [weak self] command in
            self?.handleCommand(command)
        }
        wakeEngine?.onError = { [weak self] message in
            DispatchQueue.main.async {
                self?.showError(message)
            }
        }
        wakeEngine?.onTranscriptUpdate = { [weak self] transcript in
            DispatchQueue.main.async {
                self?.lastHeardText = transcript
                let short = transcript.count > 50 ? String(transcript.suffix(50)) + "…" : transcript
                self?.lastHeardItem?.title = "Heard: \(short.isEmpty ? "(nothing)" : short)"
            }
        }
        // Request permissions so first "Go live" works; only start listening if user prefers it (saves battery)
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [weak self] in
            NSApp.activate(ignoringOtherApps: true) // Bring app forward so permission dialogs are visible
            self?.wakeEngine?.requestPermissionsOnly { [weak self] in
                if WakeConfig.shared.startLiveOnLaunch {
                    self?.wakeEngine?.startListening()
                } else {
                    self?.updateMenuAndIcon()
                }
            }
        }
        setupGlobalHotkeyIfNeeded()
        NotificationCenter.default.addObserver(self, selector: #selector(refreshGlobalHotkey), name: AppDelegate.globalHotkeySettingDidChange, object: nil)
        // Bring app and its window to front so the user sees it
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            NSApp.activate(ignoringOtherApps: true)
        }
    }

    @objc private func refreshGlobalHotkey() {
        setupGlobalHotkeyIfNeeded()
    }

    private func setupGlobalHotkeyIfNeeded() {
        if let monitor = globalHotkeyMonitor {
            NSEvent.removeMonitor(monitor)
            globalHotkeyMonitor = nil
        }
        guard WakeConfig.shared.globalHotkeyEnabled else { return }
        globalHotkeyMonitor = NSEvent.addGlobalMonitorForEvents(matching: .keyDown) { [weak self] event in
            guard event.modifierFlags.intersection(.deviceIndependentFlagsMask) == [.command, .shift],
                  event.charactersIgnoringModifiers == "j" else { return }
            DispatchQueue.main.async { self?.toggleListening() }
        }
    }

    static let globalHotkeySettingDidChange = Notification.Name("jarvis.wake.globalHotkeySettingDidChange")
    static let showMenuBarIconDidChange = Notification.Name("jarvis.wake.showMenuBarIconDidChange")

    @objc private func updateMenuBarIconVisibility() {
        statusItem?.isVisible = WakeConfig.shared.showMenuBarIcon
    }

    func applicationWillTerminate(_ notification: Notification) {
        if let monitor = globalHotkeyMonitor {
            NSEvent.removeMonitor(monitor)
            globalHotkeyMonitor = nil
        }
    }

    /// When user clicks the dock icon, show the menu bar menu (if visible) or bring app to front.
    func applicationShouldHandleReopen(_ sender: NSApplication, hasVisibleWindows flag: Bool) -> Bool {
        if WakeConfig.shared.showMenuBarIcon, let statusItem = statusItem {
            statusItem.button?.performClick(nil)
        } else {
            NSApp.activate(ignoringOtherApps: true)
        }
        return true
    }

    /// Template images for the menu bar avoid a CoreUI/malloc crash on macOS 26 when drawing SF Symbols.
    private static func makeStatusBarImage(systemSymbolName name: String) -> NSImage? {
        guard let img = NSImage(systemSymbolName: name, accessibilityDescription: nil) else { return nil }
        img.isTemplate = true
        return img
    }

    private func updateMenuAndIcon() {
        guard let button = statusItem?.button, let goLive = goLiveItem else { return }
        if !isListening {
            goLive.title = "Go live"
            goLive.keyEquivalent = "j"
            goLive.keyEquivalentModifierMask = [.command, .shift]
            button.image = Self.makeStatusBarImage(systemSymbolName: "ear.slash")
        } else if isAwake {
            goLive.title = "Stop"
            goLive.keyEquivalent = ""
            button.image = Self.makeStatusBarImage(systemSymbolName: "mic.fill")
        } else {
            goLive.title = "Stop"
            goLive.keyEquivalent = ""
            button.image = Self.makeStatusBarImage(systemSymbolName: "ear")
        }
    }

    @objc func toggleListening() {
        // Engine's toggleListening uses requestPermissionsAndStart when starting so first "Go live" always requests permissions.
        wakeEngine?.toggleListening()
    }

    @objc func openSettings() {
        NSApp.activate(ignoringOtherApps: true)
        let sel = Selector(("showSettingsWindow:"))
        if NSApp.sendAction(sel, to: nil, from: nil) { return }
        if NSApp.sendAction(sel, to: NSApp, from: nil) { return }
        // Fallback: find "Settings…" in the app menu (first menu) and perform its action
        if let appMenu = NSApp.mainMenu?.item(at: 0)?.submenu,
           let settingsItem = appMenu.items.first(where: { $0.title == "Settings…" }),
           let action = settingsItem.action {
            NSApp.sendAction(action, to: settingsItem.target, from: settingsItem)
            return
        }
        let alert = NSAlert()
        alert.messageText = "Settings"
        alert.informativeText = "Use the app menu: JARVIS Wake → Settings… or press ⌘,"
        alert.addButton(withTitle: "OK")
        alert.runModal()
    }

    @objc func quit() {
        NSApp.terminate(nil)
    }

    @objc func sendTestCommand() {
        handleCommand("What time is it?")
    }

    private func handleCommand(_ command: String) {
        guard !command.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
        Task {
            do {
                let reply = try await JarvisClient.shared.send(message: command)
                await MainActor.run {
                    if let reply = reply, !reply.isEmpty {
                        TTSManager.shared.speak(reply)
                        updateMenuAndIcon()
                    }
                }
            } catch {
                await MainActor.run { showError(error.localizedDescription) }
            }
        }
    }

    private func showError(_ message: String) {
        (menu?.items.first)?.title = "Error — see Settings"
        let alert = NSAlert()
        alert.messageText = "JARVIS Wake Error"
        let lower = message.lowercased()
        let isConnectionError = lower.contains("could not connect") || lower.contains("connection") || lower.contains("network") || lower.contains("host") || lower.contains("server") || lower.contains("timed out")
        let isPermissionError = lower.contains("denied") || lower.contains("privacy") || lower.contains("speech recognition") || lower.contains("microphone")
        if isConnectionError {
            alert.informativeText = message + "\n\nCheck that the JARVIS server is running and the Base URL in Settings is correct (e.g. http://127.0.0.1:18789)."
        } else {
            alert.informativeText = message
        }
        alert.alertStyle = .warning
        alert.addButton(withTitle: "OK")
        if isConnectionError {
            alert.addButton(withTitle: "Open Settings")
        } else if isPermissionError {
            alert.addButton(withTitle: "Open System Settings")
        }
        let response = alert.runModal()
        if isConnectionError && response == .alertSecondButtonReturn {
            openSettings()
        } else if isPermissionError && response == .alertSecondButtonReturn {
            openPrivacySettings()
        }
    }

    private func openPrivacySettings() {
        // Open Privacy & Security so user can enable Speech Recognition and Microphone.
        if let url = URL(string: "x-apple.systempreferences:com.apple.preference.security?Privacy") {
            NSWorkspace.shared.open(url)
        }
    }
}
