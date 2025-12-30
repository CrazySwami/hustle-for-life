/**
 * ContentView.swift
 *
 * Main content view that manages navigation between departments and chat.
 */

import SwiftUI

struct ContentView: View {
    @EnvironmentObject var appState: AppState
    @EnvironmentObject var webSocketService: WebSocketService

    var body: some View {
        NavigationSplitView {
            DepartmentListView()
        } detail: {
            if let department = appState.selectedDepartment {
                ChatView(department: department)
            } else {
                WelcomeView()
            }
        }
        .onAppear {
            // Set default department if none selected
            if appState.selectedDepartment == nil && !appState.departments.isEmpty {
                appState.selectedDepartment = appState.departments.first
            }
        }
    }
}

/**
 * Welcome view shown when no department is selected
 */
struct WelcomeView: View {
    @EnvironmentObject var appState: AppState

    var body: some View {
        VStack(spacing: 24) {
            Image(systemName: "figure.run")
                .font(.system(size: 80))
                .foregroundColor(.purple)

            Text("Hustle For Life")
                .font(.largeTitle)
                .fontWeight(.bold)

            Text("Your AI-powered well-being companion")
                .font(.subheadline)
                .foregroundColor(.secondary)

            Divider()
                .padding(.vertical)

            Text("Select a department to start chatting")
                .font(.callout)
                .foregroundColor(.secondary)

            // Quick access buttons
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
                ForEach(appState.departments) { department in
                    DepartmentCard(department: department)
                        .onTapGesture {
                            appState.selectedDepartment = department
                        }
                }
            }
            .padding()
        }
        .padding()
    }
}

/**
 * Card view for department selection
 */
struct DepartmentCard: View {
    let department: Department

    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: department.icon)
                .font(.system(size: 32))
                .foregroundColor(department.color)

            Text(department.name)
                .font(.headline)
                .foregroundColor(.primary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(department.color.opacity(0.1))
        .cornerRadius(12)
    }
}

#Preview {
    ContentView()
        .environmentObject(AppState())
        .environmentObject(WebSocketService())
        .environmentObject(HealthKitService())
}
