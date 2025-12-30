/**
 * MessageBubble.swift
 *
 * Individual message bubble component for the chat view.
 */

import SwiftUI

struct MessageBubble: View {
    let message: ChatMessage

    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            // Avatar/Icon
            if message.role != .user {
                avatar
            } else {
                Spacer()
            }

            // Message content
            VStack(alignment: message.role == .user ? .trailing : .leading, spacing: 4) {
                messageContent

                // Timestamp
                Text(message.formattedTimestamp)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }

            // Trailing spacer for non-user messages
            if message.role == .user {
                avatar
            } else {
                Spacer()
            }
        }
    }

    @ViewBuilder
    private var avatar: some View {
        switch message.role {
        case .user:
            Image(systemName: "person.circle.fill")
                .font(.title2)
                .foregroundColor(.blue)
        case .assistant:
            Image(systemName: "brain.head.profile")
                .font(.title2)
                .foregroundColor(.purple)
        case .tool:
            Image(systemName: "wrench.and.screwdriver.fill")
                .font(.title2)
                .foregroundColor(.orange)
        case .error:
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.title2)
                .foregroundColor(.red)
        case .system:
            Image(systemName: "info.circle.fill")
                .font(.title2)
                .foregroundColor(.gray)
        }
    }

    @ViewBuilder
    private var messageContent: some View {
        switch message.role {
        case .user:
            userBubble
        case .assistant:
            assistantBubble
        case .tool:
            toolBubble
        case .error:
            errorBubble
        case .system:
            systemBubble
        }
    }

    private var userBubble: some View {
        Text(message.content)
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(Color.blue)
            .foregroundColor(.white)
            .cornerRadius(18)
            .cornerRadius(4, corners: .topRight)
    }

    private var assistantBubble: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Render markdown content
            Text(LocalizedStringKey(message.content))
                .textSelection(.enabled)

            // Streaming indicator
            if message.isStreaming {
                HStack(spacing: 4) {
                    Circle()
                        .fill(Color.purple)
                        .frame(width: 6, height: 6)
                    Circle()
                        .fill(Color.purple.opacity(0.6))
                        .frame(width: 6, height: 6)
                    Circle()
                        .fill(Color.purple.opacity(0.3))
                        .frame(width: 6, height: 6)
                }
                .padding(.top, 8)
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(Color(.secondarySystemBackground))
        .cornerRadius(18)
        .cornerRadius(4, corners: .topLeft)
    }

    private var toolBubble: some View {
        ToolUseView(message: message)
    }

    private var errorBubble: some View {
        HStack {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundColor(.red)
            Text(message.content)
                .foregroundColor(.red)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(Color.red.opacity(0.1))
        .cornerRadius(12)
    }

    private var systemBubble: some View {
        Text(message.content)
            .font(.caption)
            .foregroundColor(.secondary)
            .padding(.horizontal, 14)
            .padding(.vertical, 8)
            .background(Color(.tertiarySystemBackground))
            .cornerRadius(8)
    }
}

/// Custom corner radius modifier
extension View {
    func cornerRadius(_ radius: CGFloat, corners: UIRectCorner) -> some View {
        clipShape(RoundedCorner(radius: radius, corners: corners))
    }
}

struct RoundedCorner: Shape {
    var radius: CGFloat = .infinity
    var corners: UIRectCorner = .allCorners

    func path(in rect: CGRect) -> Path {
        let path = UIBezierPath(
            roundedRect: rect,
            byRoundingCorners: corners,
            cornerRadii: CGSize(width: radius, height: radius)
        )
        return Path(path.cgPath)
    }
}

#Preview("User Message") {
    MessageBubble(message: .userMessage("Hello, how are you?"))
        .padding()
}

#Preview("Assistant Message") {
    MessageBubble(message: .assistantMessage("I'm doing well! How can I help you today?"))
        .padding()
}

#Preview("Tool Message") {
    MessageBubble(message: .toolMessage(name: "Read", input: "{\"file_path\": \"/path/to/file\"}"))
        .padding()
}
