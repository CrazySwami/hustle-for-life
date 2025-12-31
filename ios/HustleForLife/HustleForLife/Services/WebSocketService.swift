/**
 * WebSocketService.swift
 *
 * Manages WebSocket connection to the backend server for real-time
 * communication with Claude Code.
 */

import Foundation
import Combine

// MARK: - Server Message Types

/// Represents all possible message types from the server
enum ServerMessage: Codable {
    case joined(JoinedMessage)
    case assistant(AssistantMessage)
    case user(UserMessage)
    case toolUse(ToolUseMessage)
    case toolResult(ToolResultMessage)
    case system(SystemMessage)
    case result(ResultMessage)
    case error(ErrorMessage)
    case exit(ExitMessage)
    case pong(PongMessage)
    case raw(RawMessage)

    enum CodingKeys: String, CodingKey {
        case type
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let type = try container.decode(String.self, forKey: .type)

        switch type {
        case "joined":
            self = .joined(try JoinedMessage(from: decoder))
        case "assistant":
            self = .assistant(try AssistantMessage(from: decoder))
        case "user":
            self = .user(try UserMessage(from: decoder))
        case "tool_use":
            self = .toolUse(try ToolUseMessage(from: decoder))
        case "tool_result":
            self = .toolResult(try ToolResultMessage(from: decoder))
        case "system":
            self = .system(try SystemMessage(from: decoder))
        case "result":
            self = .result(try ResultMessage(from: decoder))
        case "error":
            self = .error(try ErrorMessage(from: decoder))
        case "exit":
            self = .exit(try ExitMessage(from: decoder))
        case "pong":
            self = .pong(try PongMessage(from: decoder))
        default:
            self = .raw(RawMessage(type: type, content: "Unknown message type"))
        }
    }

    func encode(to encoder: Encoder) throws {
        // Encoding not typically needed for server messages
    }
}

struct JoinedMessage: Codable {
    let type: String
    let sessionId: String
    let department: String
    let name: String?
    let isNew: Bool?
}

struct AssistantMessage: Codable {
    let type: String
    let message: MessageContent?
    let content: String?

    var textContent: String {
        message?.content ?? content ?? ""
    }
}

struct MessageContent: Codable {
    let type: String
    let content: String
}

struct UserMessage: Codable {
    let type: String
    let content: String
    let timestamp: String?
}

struct ToolUseMessage: Codable {
    let type: String
    let name: String
    let input: [String: AnyCodableValue]?
}

struct ToolResultMessage: Codable {
    let type: String
    let content: String?
}

struct SystemMessage: Codable {
    let type: String
    let subtype: String?
    let sessionId: String?
    let cwd: String?
}

struct ResultMessage: Codable {
    let type: String
    let durationMs: Int?
    let costUsd: Double?
    let sessionId: String?

    enum CodingKeys: String, CodingKey {
        case type
        case durationMs = "duration_ms"
        case costUsd = "cost_usd"
        case sessionId = "session_id"
    }
}

struct ErrorMessage: Codable {
    let type: String
    let content: String
}

struct ExitMessage: Codable {
    let type: String
    let code: Int?
    let signal: String?
}

struct PongMessage: Codable {
    let type: String
    let timestamp: Int?
}

struct RawMessage: Codable {
    let type: String
    let content: String
}

/// Flexible value type for tool inputs
enum AnyCodableValue: Codable {
    case string(String)
    case int(Int)
    case double(Double)
    case bool(Bool)
    case array([AnyCodableValue])
    case dictionary([String: AnyCodableValue])
    case null

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()

        if let string = try? container.decode(String.self) {
            self = .string(string)
        } else if let int = try? container.decode(Int.self) {
            self = .int(int)
        } else if let double = try? container.decode(Double.self) {
            self = .double(double)
        } else if let bool = try? container.decode(Bool.self) {
            self = .bool(bool)
        } else if let array = try? container.decode([AnyCodableValue].self) {
            self = .array(array)
        } else if let dict = try? container.decode([String: AnyCodableValue].self) {
            self = .dictionary(dict)
        } else {
            self = .null
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .string(let value): try container.encode(value)
        case .int(let value): try container.encode(value)
        case .double(let value): try container.encode(value)
        case .bool(let value): try container.encode(value)
        case .array(let value): try container.encode(value)
        case .dictionary(let value): try container.encode(value)
        case .null: try container.encodeNil()
        }
    }
}

// MARK: - WebSocket Service

@MainActor
class WebSocketService: ObservableObject {
    // Connection state
    @Published var isConnected = false
    @Published var connectionError: String?

    // Session state
    @Published var currentSessionId: String?
    @Published var currentDepartment: String?

    // Messages
    @Published var messages: [ChatMessage] = []
    @Published var isLoading = false

    // Private properties
    private var webSocket: URLSessionWebSocketTask?
    private var session: URLSession?
    private var pingTimer: Timer?
    private var reconnectAttempts = 0
    private let maxReconnectAttempts = 5

    // Server URL (configurable via AppStorage)
    // For simulator: localhost works. For physical device: use Mac's IP
    var serverURL: String = "ws://localhost:3000/ws"

    init() {
        let configuration = URLSessionConfiguration.default
        configuration.waitsForConnectivity = true
        self.session = URLSession(configuration: configuration)
    }

    // MARK: - Connection Management

    func connect() {
        guard let url = URL(string: serverURL) else {
            connectionError = "Invalid server URL"
            return
        }

        disconnect()

        webSocket = session?.webSocketTask(with: url)
        webSocket?.resume()

        isConnected = true
        connectionError = nil
        reconnectAttempts = 0

        receiveMessage()
        startPingTimer()

        print("WebSocket connecting to: \(serverURL)")
    }

    func disconnect() {
        stopPingTimer()
        webSocket?.cancel(with: .normalClosure, reason: nil)
        webSocket = nil
        isConnected = false
    }

    // MARK: - Session Management

    func joinSession(sessionId: String? = nil, department: String) {
        let message: [String: Any] = [
            "type": "join",
            "sessionId": sessionId as Any,
            "department": department
        ]
        send(message)
        currentDepartment = department
        isLoading = true
    }

    func sendInput(_ text: String) {
        guard !text.isEmpty else { return }

        let message = ["type": "input", "text": text]
        send(message)

        // Optimistically add user message
        let chatMessage = ChatMessage(
            id: UUID().uuidString,
            role: .user,
            content: text,
            timestamp: Date()
        )
        messages.append(chatMessage)
        isLoading = true
    }

    func abort() {
        send(["type": "abort"])
        isLoading = false
    }

    func clearMessages() {
        messages.removeAll()
    }

    // MARK: - Private Methods

    private func send(_ dict: [String: Any]) {
        guard let data = try? JSONSerialization.data(withJSONObject: dict),
              let string = String(data: data, encoding: .utf8) else {
            print("Failed to serialize message")
            return
        }

        webSocket?.send(.string(string)) { [weak self] error in
            if let error = error {
                print("WebSocket send error: \(error)")
                Task { @MainActor in
                    self?.connectionError = error.localizedDescription
                }
            }
        }
    }

    private func receiveMessage() {
        webSocket?.receive { [weak self] result in
            switch result {
            case .success(let message):
                switch message {
                case .string(let text):
                    Task { @MainActor in
                        self?.handleMessage(text)
                    }
                case .data(let data):
                    if let text = String(data: data, encoding: .utf8) {
                        Task { @MainActor in
                            self?.handleMessage(text)
                        }
                    }
                @unknown default:
                    break
                }
                // Continue receiving
                self?.receiveMessage()

            case .failure(let error):
                print("WebSocket receive error: \(error)")
                Task { @MainActor in
                    self?.handleDisconnection(error: error)
                }
            }
        }
    }

    private func handleMessage(_ text: String) {
        guard let data = text.data(using: .utf8) else { return }

        do {
            let serverMsg = try JSONDecoder().decode(ServerMessage.self, from: data)
            processServerMessage(serverMsg)
        } catch {
            print("Failed to decode server message: \(error)")
            print("Raw message: \(text)")
        }
    }

    private func processServerMessage(_ serverMsg: ServerMessage) {
        switch serverMsg {
        case .joined(let msg):
            currentSessionId = msg.sessionId
            currentDepartment = msg.department
            isLoading = false
            print("Joined session: \(msg.sessionId) (\(msg.department))")

        case .assistant(let msg):
            let content = msg.textContent
            if !content.isEmpty {
                // Check if we should append to the last assistant message or create new
                if let lastIndex = messages.lastIndex(where: { $0.role == .assistant && $0.isStreaming }) {
                    messages[lastIndex].content += content
                } else {
                    let chatMessage = ChatMessage(
                        id: UUID().uuidString,
                        role: .assistant,
                        content: content,
                        timestamp: Date(),
                        isStreaming: true
                    )
                    messages.append(chatMessage)
                }
            }

        case .user(let msg):
            // User message echo - we already added it optimistically
            break

        case .toolUse(let msg):
            let chatMessage = ChatMessage(
                id: UUID().uuidString,
                role: .tool,
                content: "Using \(msg.name)...",
                timestamp: Date(),
                toolName: msg.name,
                toolInput: formatToolInput(msg.input)
            )
            messages.append(chatMessage)

        case .toolResult(let msg):
            // Update the last tool message with the result
            if let lastIndex = messages.lastIndex(where: { $0.role == .tool }) {
                messages[lastIndex].toolResult = msg.content
            }

        case .result(let msg):
            // Mark the last assistant message as complete
            if let lastIndex = messages.lastIndex(where: { $0.role == .assistant && $0.isStreaming }) {
                messages[lastIndex].isStreaming = false
            }
            isLoading = false

        case .error(let msg):
            let chatMessage = ChatMessage(
                id: UUID().uuidString,
                role: .error,
                content: msg.content,
                timestamp: Date()
            )
            messages.append(chatMessage)
            isLoading = false

        case .exit(let msg):
            print("Session exited with code: \(msg.code ?? -1)")
            isLoading = false

        case .pong:
            // Keepalive response
            break

        case .system, .raw:
            // Ignore system messages in the UI
            break
        }
    }

    private func formatToolInput(_ input: [String: AnyCodableValue]?) -> String? {
        guard let input = input else { return nil }
        if let data = try? JSONEncoder().encode(input),
           let string = String(data: data, encoding: .utf8) {
            return string
        }
        return nil
    }

    private func handleDisconnection(error: Error) {
        isConnected = false
        connectionError = error.localizedDescription
        stopPingTimer()

        // Attempt reconnection
        if reconnectAttempts < maxReconnectAttempts {
            reconnectAttempts += 1
            let delay = Double(reconnectAttempts * 2)
            print("Attempting reconnection in \(delay) seconds (attempt \(reconnectAttempts))")

            DispatchQueue.main.asyncAfter(deadline: .now() + delay) { [weak self] in
                self?.connect()
            }
        }
    }

    private func startPingTimer() {
        pingTimer = Timer.scheduledTimer(withTimeInterval: 30, repeats: true) { [weak self] _ in
            self?.send(["type": "ping"])
        }
    }

    private func stopPingTimer() {
        pingTimer?.invalidate()
        pingTimer = nil
    }
}
