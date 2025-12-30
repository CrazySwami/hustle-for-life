/**
 * HustleForLifeApp.swift
 *
 * Main entry point for the Hustle For Life iOS app.
 * Sets up the app environment and navigation structure.
 */

import SwiftUI
import HealthKit

@main
struct HustleForLifeApp: App {
    @StateObject private var appState = AppState()
    @StateObject private var webSocketService = WebSocketService()
    @StateObject private var healthKitService = HealthKitService()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
                .environmentObject(webSocketService)
                .environmentObject(healthKitService)
                .onAppear {
                    setupApp()
                }
        }
    }

    private func setupApp() {
        // Request HealthKit authorization
        Task {
            do {
                try await healthKitService.requestAuthorization()
            } catch {
                print("HealthKit authorization failed: \(error)")
            }
        }

        // Connect to backend server
        webSocketService.connect()
    }
}

/**
 * Global app state management
 */
@MainActor
class AppState: ObservableObject {
    @Published var selectedDepartment: Department?
    @Published var currentSessionId: String?
    @Published var isConnected = false
    @Published var showSettings = false

    // Available departments
    @Published var departments: [Department] = [
        Department(id: "life-agent", name: "Life Agent", icon: "brain.head.profile", color: .purple),
        Department(id: "health", name: "Health", icon: "heart.fill", color: .red),
        Department(id: "roi-amplified", name: "ROI Amplified", icon: "briefcase.fill", color: .blue),
        Department(id: "mirror-factory", name: "Mirror Factory", icon: "star.fill", color: .orange)
    ]

    // Server configuration
    @AppStorage("serverURL") var serverURL = "ws://100.114.235.8:3000/ws"
    @AppStorage("healthSyncEnabled") var healthSyncEnabled = true
    @AppStorage("healthSyncInterval") var healthSyncInterval = 30 // minutes
}

/**
 * Department model
 */
struct Department: Identifiable, Hashable {
    let id: String
    let name: String
    let icon: String
    let color: Color
}
