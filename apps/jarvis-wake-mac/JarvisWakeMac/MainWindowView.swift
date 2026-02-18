//
//  MainWindowView.swift
//  JARVIS Wake — main window so the app is always visible
//

import SwiftUI

struct MainWindowView: View {
    @ObservedObject var state: WakeAppState
    var delegate: AppDelegate?

    var body: some View {
        VStack(spacing: 16) {
            HStack(spacing: 8) {
                Image(systemName: state.isListening ? "ear" : "ear.slash")
                    .font(.title2)
                Text("JARVIS Wake")
                    .font(.headline)
            }
            .padding(.top, 8)

            Text(state.isListening ? "Listening for \"Hey JARVIS\"…" : "Click Go live to listen for \"Hey JARVIS\"")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)

            Divider()

            Button(action: { delegate?.toggleListening() }) {
                Label(state.isListening ? "Stop" : "Go live", systemImage: state.isListening ? "stop.circle" : "play.circle.fill")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)

            Button("Test: What time is it?") {
                delegate?.sendTestCommand()
            }
            .buttonStyle(.bordered)
            .controlSize(.large)

            HStack(spacing: 12) {
                Button("Settings…") {
                    delegate?.openSettings()
                }
                Button("Quit") {
                    delegate?.quit()
                }
            }
            .padding(.bottom, 12)
        }
        .frame(width: 280)
    }
}

/// Shared state so the main window and menu bar stay in sync.
final class WakeAppState: ObservableObject {
    @Published var isListening = false
    @Published var isAwake = false
}
