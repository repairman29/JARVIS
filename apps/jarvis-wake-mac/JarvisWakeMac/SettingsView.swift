//
//  SettingsView.swift
//  Configure JARVIS URL and token.
//

import SwiftUI

struct SettingsView: View {
    @State private var baseURLText: String = ""
    @State private var tokenText: String = ""
    @State private var startLiveOnLaunch: Bool = false
    @State private var globalHotkeyEnabled: Bool = false
    @State private var showMenuBarIcon: Bool = true
    @State private var didLoad = false

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Group {
                Text("Menu bar").font(.headline)
                Toggle("Show JARVIS Wake icon in menu bar", isOn: $showMenuBarIcon)
                    .onChange(of: showMenuBarIcon) { new in
                        WakeConfig.shared.showMenuBarIcon = new
                        NotificationCenter.default.post(name: AppDelegate.showMenuBarIconDidChange, object: nil)
                    }
                Text("Turn off to hide the ear icon. Use the dock or main window to open the app and quit.")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            Group {
                Text("Listening (saves battery)").font(.headline)
                Toggle("Start listening when app opens", isOn: $startLiveOnLaunch)
                    .onChange(of: startLiveOnLaunch) { new in WakeConfig.shared.startLiveOnLaunch = new }
                Text("Default is off: click \"Go live\" in the menu (or press ⌘⇧J) when you want to use Hey JARVIS.")
                    .font(.caption)
                    .foregroundColor(.secondary)
                Toggle("Global hotkey ⌘⇧J (requires Accessibility)", isOn: $globalHotkeyEnabled)
                    .onChange(of: globalHotkeyEnabled) { new in
                        WakeConfig.shared.globalHotkeyEnabled = new
                        NotificationCenter.default.post(name: AppDelegate.globalHotkeySettingDidChange, object: nil)
                    }
                Text("When on, press ⌘⇧J from any app to start or stop listening. Add this app in System Settings → Privacy & Security → Accessibility if the hotkey doesn’t work.")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            Group {
                Text("JARVIS endpoint").font(.headline)
                TextField("Base URL", text: $baseURLText)
                    .textFieldStyle(.roundedBorder)
                Text("Gateway: http://127.0.0.1:18789 — Edge: https://YOUR_PROJECT.supabase.co/functions/v1/jarvis")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            Group {
                Text("Auth").font(.headline)
                SecureField("Token", text: $tokenText)
                    .textFieldStyle(.roundedBorder)
                Text("If you get 401: use the same token as your gateway (e.g. grep CLAWDBOT_GATEWAY_TOKEN ~/.clawdbot/.env)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            Button("Save") {
                if let u = URL(string: baseURLText.trimmingCharacters(in: .whitespaces)) {
                    WakeConfig.shared.baseURL = u
                }
                let t = tokenText.trimmingCharacters(in: .whitespaces)
                WakeConfig.shared.token = t.isEmpty ? nil : t
            }
        }
        .padding(20)
        .frame(minWidth: 400, minHeight: 280)
        .onAppear {
            if !didLoad {
                didLoad = true
                baseURLText = WakeConfig.shared.baseURL.absoluteString
                tokenText = WakeConfig.shared.token ?? ""
                startLiveOnLaunch = WakeConfig.shared.startLiveOnLaunch
                globalHotkeyEnabled = WakeConfig.shared.globalHotkeyEnabled
                showMenuBarIcon = WakeConfig.shared.showMenuBarIcon
            }
        }
    }
}
