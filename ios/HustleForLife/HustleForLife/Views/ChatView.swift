/**
 * ChatView.swift
 *
 * Main chat interface for communicating with Claude Code.
 */

import SwiftUI

struct ChatView: View {
    let department: Department

    @EnvironmentObject var webSocketService: WebSocketService
    @State private var inputText = ""
    @State private var isShowingSlashCommands = false
    @FocusState private var isInputFocused: Bool

    var body: some View {
        VStack(spacing: 0) {
            // Messages list
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(webSocketService.messages) { message in
                            MessageBubble(message: message)
                                .id(message.id)
                        }

                        // Loading indicator
                        if webSocketService.isLoading {
                            HStack {
                                ProgressView()
                                    .scaleEffect(0.8)
                                Text("Claude is thinking...")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            .padding()
                            .id("loading")
                        }
                    }
                    .padding()
                }
                .onChange(of: webSocketService.messages.count) { _, _ in
                    withAnimation {
                        proxy.scrollTo(webSocketService.isLoading ? "loading" : webSocketService.messages.last?.id)
                    }
                }
            }

            Divider()

            // Input area
            inputArea
        }
        .navigationTitle(department.name)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Menu {
                    Button(action: { insertSlashCommand("/compact") }) {
                        Label("Compact History", systemImage: "arrow.down.right.and.arrow.up.left")
                    }
                    Button(action: { insertSlashCommand("/clear") }) {
                        Label("Clear Chat", systemImage: "trash")
                    }
                    Button(action: { insertSlashCommand("/init") }) {
                        Label("Re-read CLAUDE.md", systemImage: "arrow.clockwise")
                    }
                    Divider()
                    Button(action: { insertSlashCommand("/help") }) {
                        Label("Help", systemImage: "questionmark.circle")
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                }
            }

            ToolbarItem(placement: .secondaryAction) {
                if webSocketService.isLoading {
                    Button("Stop") {
                        webSocketService.abort()
                    }
                    .foregroundColor(.red)
                }
            }
        }
        .onAppear {
            joinSession()
        }
        .onChange(of: department.id) { _, _ in
            joinSession()
        }
    }

    private var inputArea: some View {
        VStack(spacing: 8) {
            // Quick slash commands
            if inputText.hasPrefix("/") || isShowingSlashCommands {
                slashCommandBar
            }

            // Main input
            HStack(alignment: .bottom, spacing: 8) {
                // Slash command button
                Button(action: { isShowingSlashCommands.toggle() }) {
                    Image(systemName: "slash.circle")
                        .font(.title2)
                        .foregroundColor(isShowingSlashCommands ? .accentColor : .secondary)
                }

                // Text input
                TextField("Message Claude...", text: $inputText, axis: .vertical)
                    .textFieldStyle(.plain)
                    .lineLimit(1...6)
                    .focused($isInputFocused)
                    .onSubmit {
                        if !inputText.isEmpty {
                            sendMessage()
                        }
                    }

                // Send button
                Button(action: sendMessage) {
                    Image(systemName: "arrow.up.circle.fill")
                        .font(.title)
                        .foregroundColor(inputText.isEmpty ? .gray : .accentColor)
                }
                .disabled(inputText.isEmpty || webSocketService.isLoading)
            }
            .padding(.horizontal)
            .padding(.vertical, 8)
        }
        .background(Color(.systemBackground))
    }

    private var slashCommandBar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                slashCommandButton("/meal", icon: "fork.knife", label: "Meal")
                slashCommandButton("/water", icon: "drop.fill", label: "Water")
                slashCommandButton("/mood", icon: "face.smiling", label: "Mood")
                slashCommandButton("/bp", icon: "heart.fill", label: "BP")
                slashCommandButton("/glucose", icon: "drop.triangle.fill", label: "Glucose")
                slashCommandButton("/steps", icon: "figure.walk", label: "Steps")
                slashCommandButton("/weight", icon: "scalemass.fill", label: "Weight")
                slashCommandButton("/summary", icon: "chart.bar.fill", label: "Summary")
                slashCommandButton("/checkin", icon: "checkmark.circle.fill", label: "Check-in")
                slashCommandButton("/winddown", icon: "moon.fill", label: "Wind Down")
            }
            .padding(.horizontal)
        }
        .padding(.vertical, 4)
        .background(Color(.secondarySystemBackground))
    }

    private func slashCommandButton(_ command: String, icon: String, label: String) -> some View {
        Button(action: { insertSlashCommand(command) }) {
            HStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.caption)
                Text(label)
                    .font(.caption)
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(Color(.tertiarySystemBackground))
            .cornerRadius(16)
        }
        .buttonStyle(.plain)
    }

    private func insertSlashCommand(_ command: String) {
        inputText = command + " "
        isInputFocused = true
        isShowingSlashCommands = false
    }

    private func sendMessage() {
        guard !inputText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }

        webSocketService.sendInput(inputText)
        inputText = ""
        isShowingSlashCommands = false
    }

    private func joinSession() {
        webSocketService.clearMessages()
        webSocketService.joinSession(department: department.id)
    }
}

#Preview {
    NavigationStack {
        ChatView(department: Department(id: "life-agent", name: "Life Agent", icon: "brain.head.profile", color: .purple))
    }
    .environmentObject(WebSocketService())
}
