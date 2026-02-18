//
//  WakeConfig.swift
//  Gateway/Edge URL and optional auth token (UserDefaults + ~/.jarvis/wake.conf).
//

import Foundation

final class WakeConfig {
    static let shared = WakeConfig()

    private let defaults = UserDefaults.standard
    private let baseURLKey = "jarvis.wake.baseURL"
    private let tokenKey = "jarvis.wake.token"
    private let startLiveOnLaunchKey = "jarvis.wake.startLiveOnLaunch"
    private let globalHotkeyEnabledKey = "jarvis.wake.globalHotkeyEnabled"
    private let showMenuBarIconKey = "jarvis.wake.showMenuBarIcon"

    var baseURL: URL {
        get {
            if let s = defaults.string(forKey: baseURLKey), !s.isEmpty, let u = URL(string: s) { return u }
            if let fromFile = readURLFromFile() { return fromFile }
            return URL(string: "http://127.0.0.1:18789")!
        }
        set { defaults.set(newValue.absoluteString, forKey: baseURLKey) }
    }

    var token: String? {
        get {
            if let s = defaults.string(forKey: tokenKey), !s.isEmpty { return s }
            return readTokenFromFile()
        }
        set { defaults.set(newValue, forKey: tokenKey) }
    }

    private func readURLFromFile() -> URL? {
        let fileURL = FileManager.default.homeDirectoryForCurrentUser
            .appendingPathComponent(".jarvis").appendingPathComponent("wake.conf")
        guard FileManager.default.fileExists(atPath: fileURL.path) else { return nil }
        guard let content = try? String(contentsOf: fileURL, encoding: .utf8) else { return nil }
        for line in content.components(separatedBy: .newlines) {
            let t = line.trimmingCharacters(in: .whitespaces)
            if t.hasPrefix("baseURL=") {
                let v = t.dropFirst(7).trimmingCharacters(in: .whitespaces)
                return URL(string: v)
            }
        }
        return nil
    }

    private func readTokenFromFile() -> String? {
        let fileURL = FileManager.default.homeDirectoryForCurrentUser
            .appendingPathComponent(".jarvis").appendingPathComponent("wake.conf")
        guard FileManager.default.fileExists(atPath: fileURL.path) else { return nil }
        guard let content = try? String(contentsOf: fileURL, encoding: .utf8) else { return nil }
        for line in content.components(separatedBy: .newlines) {
            let t = line.trimmingCharacters(in: .whitespaces)
            if t.hasPrefix("token=") {
                return t.dropFirst(6).trimmingCharacters(in: .whitespaces)
            }
        }
        return nil
    }

    /// When true, listening (burst cycle) starts on launch. Default false to save battery.
    var startLiveOnLaunch: Bool {
        get { defaults.object(forKey: startLiveOnLaunchKey) as? Bool ?? false }
        set { defaults.set(newValue, forKey: startLiveOnLaunchKey) }
    }

    /// When true, ⌘⇧J toggles listening from anywhere (requires Accessibility permission).
    var globalHotkeyEnabled: Bool {
        get { defaults.object(forKey: globalHotkeyEnabledKey) as? Bool ?? false }
        set { defaults.set(newValue, forKey: globalHotkeyEnabledKey) }
    }

    /// When true, show the ear icon in the menu bar. When false, use the dock/window only (icon disappears).
    var showMenuBarIcon: Bool {
        get { defaults.object(forKey: showMenuBarIconKey) as? Bool ?? true }
        set { defaults.set(newValue, forKey: showMenuBarIconKey) }
    }
}
