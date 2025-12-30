/**
 * DepartmentListView.swift
 *
 * Sidebar view showing available departments and sessions.
 */

import SwiftUI

struct DepartmentListView: View {
    @EnvironmentObject var appState: AppState
    @EnvironmentObject var webSocketService: WebSocketService

    var body: some View {
        List(selection: $appState.selectedDepartment) {
            // Connection status
            Section {
                HStack {
                    Circle()
                        .fill(webSocketService.isConnected ? Color.green : Color.red)
                        .frame(width: 8, height: 8)
                    Text(webSocketService.isConnected ? "Connected" : "Disconnected")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Spacer()
                    if !webSocketService.isConnected {
                        Button("Reconnect") {
                            webSocketService.connect()
                        }
                        .buttonStyle(.bordered)
                        .controlSize(.small)
                    }
                }
            }

            // Departments
            Section("Departments") {
                ForEach(appState.departments) { department in
                    NavigationLink(value: department) {
                        DepartmentRow(department: department)
                    }
                }
            }

            // Health quick actions
            Section("Quick Health") {
                NavigationLink(destination: HealthDashboardView()) {
                    Label("Health Dashboard", systemImage: "heart.text.square.fill")
                }

                Button(action: syncHealth) {
                    Label("Sync Health Data", systemImage: "arrow.triangle.2.circlepath")
                }
            }

            // Settings
            Section {
                Button(action: { appState.showSettings = true }) {
                    Label("Settings", systemImage: "gear")
                }
            }
        }
        .navigationTitle("Hustle")
        .listStyle(.sidebar)
        .sheet(isPresented: $appState.showSettings) {
            SettingsView()
        }
    }

    private func syncHealth() {
        // Trigger health sync - implementation in HealthKitService
    }
}

struct DepartmentRow: View {
    let department: Department
    @EnvironmentObject var webSocketService: WebSocketService

    var body: some View {
        HStack {
            Image(systemName: department.icon)
                .foregroundColor(department.color)
                .frame(width: 24)

            VStack(alignment: .leading, spacing: 2) {
                Text(department.name)
                    .font(.headline)

                if webSocketService.currentDepartment == department.id {
                    Text("Active session")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding(.vertical, 4)
    }
}

struct SettingsView: View {
    @EnvironmentObject var appState: AppState
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationStack {
            Form {
                Section("Server") {
                    TextField("Server URL", text: $appState.serverURL)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                }

                Section("Health Sync") {
                    Toggle("Auto-sync Health Data", isOn: $appState.healthSyncEnabled)

                    if appState.healthSyncEnabled {
                        Picker("Sync Interval", selection: $appState.healthSyncInterval) {
                            Text("15 minutes").tag(15)
                            Text("30 minutes").tag(30)
                            Text("1 hour").tag(60)
                            Text("2 hours").tag(120)
                        }
                    }
                }

                Section("About") {
                    LabeledContent("Version", value: "1.0.0")
                    LabeledContent("Build", value: "1")
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

#Preview {
    NavigationStack {
        DepartmentListView()
    }
    .environmentObject(AppState())
    .environmentObject(WebSocketService())
}
