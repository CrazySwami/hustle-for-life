/**
 * ToolUseView.swift
 *
 * Collapsible view for displaying tool usage in the chat.
 */

import SwiftUI

struct ToolUseView: View {
    let message: ChatMessage
    @State private var isExpanded = false

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header (always visible)
            Button(action: { isExpanded.toggle() }) {
                HStack {
                    Image(systemName: iconForTool(message.toolName ?? ""))
                        .foregroundColor(.orange)

                    Text(message.toolName ?? "Tool")
                        .font(.subheadline)
                        .fontWeight(.medium)

                    Spacer()

                    Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                        .foregroundColor(.secondary)
                        .font(.caption)
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
            }
            .buttonStyle(.plain)

            // Expanded content
            if isExpanded {
                Divider()

                VStack(alignment: .leading, spacing: 8) {
                    // Input
                    if let input = message.toolInput, !input.isEmpty {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Input")
                                .font(.caption)
                                .fontWeight(.medium)
                                .foregroundColor(.secondary)

                            ScrollView(.horizontal, showsIndicators: false) {
                                Text(formatJSON(input))
                                    .font(.system(.caption, design: .monospaced))
                                    .textSelection(.enabled)
                            }
                        }
                    }

                    // Result
                    if let result = message.toolResult, !result.isEmpty {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Result")
                                .font(.caption)
                                .fontWeight(.medium)
                                .foregroundColor(.secondary)

                            Text(truncateResult(result))
                                .font(.system(.caption, design: .monospaced))
                                .textSelection(.enabled)
                                .lineLimit(10)
                        }
                    }
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
            }
        }
        .background(Color.orange.opacity(0.1))
        .cornerRadius(12)
    }

    private func iconForTool(_ name: String) -> String {
        switch name.lowercased() {
        case "read":
            return "doc.text"
        case "write":
            return "square.and.pencil"
        case "edit":
            return "pencil"
        case "bash":
            return "terminal"
        case "glob", "grep":
            return "magnifyingglass"
        case "webfetch":
            return "globe"
        case "task":
            return "list.bullet"
        default:
            return "wrench.and.screwdriver"
        }
    }

    private func formatJSON(_ json: String) -> String {
        guard let data = json.data(using: .utf8),
              let object = try? JSONSerialization.jsonObject(with: data),
              let formatted = try? JSONSerialization.data(withJSONObject: object, options: .prettyPrinted),
              let string = String(data: formatted, encoding: .utf8) else {
            return json
        }
        return string
    }

    private func truncateResult(_ result: String) -> String {
        let maxLength = 500
        if result.count > maxLength {
            return String(result.prefix(maxLength)) + "\n... (truncated)"
        }
        return result
    }
}

#Preview {
    VStack(spacing: 16) {
        ToolUseView(message: ChatMessage(
            id: "1",
            role: .tool,
            content: "Using Read...",
            timestamp: Date(),
            toolName: "Read",
            toolInput: "{\"file_path\": \"/home/user/project/package.json\"}",
            toolResult: "{\n  \"name\": \"my-app\",\n  \"version\": \"1.0.0\"\n}"
        ))

        ToolUseView(message: ChatMessage(
            id: "2",
            role: .tool,
            content: "Using Bash...",
            timestamp: Date(),
            toolName: "Bash",
            toolInput: "{\"command\": \"npm test\"}",
            toolResult: nil
        ))
    }
    .padding()
}
