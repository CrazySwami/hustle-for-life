/**
 * WatchContentView.swift
 *
 * Main content view for the watchOS app.
 */

import SwiftUI

struct WatchContentView: View {
    @EnvironmentObject var connectivity: WatchConnectivityManager

    var body: some View {
        NavigationStack {
            List {
                // Connection status
                Section {
                    HStack {
                        Circle()
                            .fill(connectivity.isConnected ? Color.green : Color.red)
                            .frame(width: 8, height: 8)
                        Text(connectivity.isConnected ? "Connected" : "Disconnected")
                            .font(.caption)
                    }
                }

                // Quick logging
                Section("Quick Log") {
                    Button(action: { connectivity.logWater() }) {
                        Label("Log Water", systemImage: "drop.fill")
                    }
                    .tint(.blue)

                    NavigationLink(destination: MoodLogView()) {
                        Label("Log Mood", systemImage: "face.smiling")
                    }
                }

                // Quick replies
                Section("Quick Replies") {
                    ForEach(connectivity.quickReplies, id: \.self) { reply in
                        Button(action: { connectivity.sendQuickReply(reply) }) {
                            Text(reply)
                        }
                    }
                }

                // Last message
                if let message = connectivity.lastMessage {
                    Section("Status") {
                        Text(message)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }
            .navigationTitle("Hustle")
        }
    }
}

struct MoodLogView: View {
    @EnvironmentObject var connectivity: WatchConnectivityManager
    @Environment(\.dismiss) var dismiss

    var body: some View {
        VStack(spacing: 16) {
            Text("How are you feeling?")
                .font(.headline)

            ForEach(1...5, id: \.self) { rating in
                Button(action: {
                    connectivity.logMood(rating)
                    dismiss()
                }) {
                    HStack {
                        moodEmoji(rating)
                        Text(moodText(rating))
                    }
                }
                .buttonStyle(.bordered)
            }
        }
        .navigationTitle("Mood")
    }

    private func moodEmoji(_ rating: Int) -> some View {
        let emojis = ["", "😔", "😕", "😐", "🙂", "😄"]
        return Text(emojis[rating])
    }

    private func moodText(_ rating: Int) -> String {
        let texts = ["", "Very Low", "Low", "Neutral", "Good", "Great"]
        return texts[rating]
    }
}

struct WatchQuickActionsView: View {
    @EnvironmentObject var connectivity: WatchConnectivityManager

    var body: some View {
        List {
            Section("Health") {
                Button(action: { connectivity.sendCommand("/water 1") }) {
                    Label("Drink Water", systemImage: "drop.fill")
                }

                Button(action: { connectivity.sendCommand("/steps") }) {
                    Label("Log Steps", systemImage: "figure.walk")
                }
            }

            Section("Check-in") {
                Button(action: { connectivity.sendCommand("/checkin") }) {
                    Label("Full Check-in", systemImage: "checkmark.circle")
                }

                Button(action: { connectivity.sendCommand("/winddown") }) {
                    Label("Wind Down", systemImage: "moon.fill")
                }
            }
        }
        .navigationTitle("Actions")
    }
}

#Preview {
    WatchContentView()
        .environmentObject(WatchConnectivityManager())
}
