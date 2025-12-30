/**
 * ChatMessage.swift
 *
 * Model representing a single message in the chat conversation.
 */

import Foundation

/// Role of the message sender
enum MessageRole: String, Codable {
    case user
    case assistant
    case tool
    case error
    case system
}

/// Chat message model
struct ChatMessage: Identifiable, Equatable {
    let id: String
    let role: MessageRole
    var content: String
    let timestamp: Date
    var isStreaming: Bool = false

    // Tool-specific properties
    var toolName: String?
    var toolInput: String?
    var toolResult: String?

    // Computed properties
    var isToolMessage: Bool {
        role == .tool
    }

    var formattedTimestamp: String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter.string(from: timestamp)
    }

    static func == (lhs: ChatMessage, rhs: ChatMessage) -> Bool {
        lhs.id == rhs.id &&
        lhs.content == rhs.content &&
        lhs.isStreaming == rhs.isStreaming
    }
}

/// Extension for creating common message types
extension ChatMessage {
    static func userMessage(_ text: String) -> ChatMessage {
        ChatMessage(
            id: UUID().uuidString,
            role: .user,
            content: text,
            timestamp: Date()
        )
    }

    static func assistantMessage(_ text: String, streaming: Bool = false) -> ChatMessage {
        ChatMessage(
            id: UUID().uuidString,
            role: .assistant,
            content: text,
            timestamp: Date(),
            isStreaming: streaming
        )
    }

    static func errorMessage(_ text: String) -> ChatMessage {
        ChatMessage(
            id: UUID().uuidString,
            role: .error,
            content: text,
            timestamp: Date()
        )
    }

    static func toolMessage(name: String, input: String? = nil) -> ChatMessage {
        ChatMessage(
            id: UUID().uuidString,
            role: .tool,
            content: "Using \(name)...",
            timestamp: Date(),
            toolName: name,
            toolInput: input
        )
    }
}
