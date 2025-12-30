/**
 * HealthDashboardView.swift
 *
 * Overview of health metrics synced from HealthKit.
 */

import SwiftUI

struct HealthDashboardView: View {
    @EnvironmentObject var healthKitService: HealthKitService
    @State private var isLoading = false
    @State private var errorMessage: String?

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Header
                headerSection

                // Quick stats grid
                if let summary = healthKitService.todaysSummary {
                    statsGrid(summary: summary)
                } else {
                    emptyState
                }

                // Sync status
                syncStatusSection
            }
            .padding()
        }
        .navigationTitle("Health Dashboard")
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button(action: refreshData) {
                    if isLoading {
                        ProgressView()
                    } else {
                        Image(systemName: "arrow.clockwise")
                    }
                }
                .disabled(isLoading)
            }
        }
        .onAppear {
            refreshData()
        }
        .alert("Error", isPresented: .constant(errorMessage != nil)) {
            Button("OK") { errorMessage = nil }
        } message: {
            Text(errorMessage ?? "")
        }
    }

    private var headerSection: some View {
        VStack(spacing: 8) {
            Image(systemName: "heart.fill")
                .font(.system(size: 48))
                .foregroundColor(.red)

            Text("Today's Health")
                .font(.title2)
                .fontWeight(.bold)

            Text(Date(), style: .date)
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .padding()
    }

    private func statsGrid(summary: HealthSummary) -> some View {
        LazyVGrid(columns: [
            GridItem(.flexible()),
            GridItem(.flexible())
        ], spacing: 16) {
            // Steps
            MetricCard(
                title: "Steps",
                value: "\(Int(summary.steps))",
                icon: "figure.walk",
                color: .green,
                goal: "10,000"
            )

            // Sleep
            MetricCard(
                title: "Sleep",
                value: String(format: "%.1f hrs", summary.sleepHours ?? 0),
                icon: "bed.double.fill",
                color: .purple,
                goal: "8 hrs"
            )

            // Heart Rate
            if let hr = summary.heartRateAvg {
                MetricCard(
                    title: "Heart Rate",
                    value: "\(Int(hr)) bpm",
                    icon: "heart.fill",
                    color: .red,
                    subtitle: summary.heartRateMin != nil && summary.heartRateMax != nil
                        ? "\(Int(summary.heartRateMin!)) - \(Int(summary.heartRateMax!))"
                        : nil
                )
            }

            // Active Calories
            if let calories = summary.activeCalories {
                MetricCard(
                    title: "Active Cal",
                    value: "\(Int(calories))",
                    icon: "flame.fill",
                    color: .orange,
                    goal: "500"
                )
            }

            // Distance
            if let distance = summary.distanceMiles {
                MetricCard(
                    title: "Distance",
                    value: String(format: "%.1f mi", distance),
                    icon: "map.fill",
                    color: .blue
                )
            }

            // Weight
            if let weight = summary.bodyMass {
                MetricCard(
                    title: "Weight",
                    value: String(format: "%.1f lbs", weight),
                    icon: "scalemass.fill",
                    color: .cyan
                )
            }

            // Blood Pressure
            if let bp = summary.bloodPressure {
                MetricCard(
                    title: "Blood Pressure",
                    value: bp.formatted,
                    icon: "waveform.path.ecg",
                    color: .pink
                )
            }

            // Blood Glucose
            if let glucose = summary.bloodGlucose {
                MetricCard(
                    title: "Glucose",
                    value: "\(Int(glucose)) mg/dL",
                    icon: "drop.fill",
                    color: .indigo
                )
            }
        }
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "heart.slash")
                .font(.system(size: 48))
                .foregroundColor(.secondary)

            Text("No Health Data")
                .font(.headline)

            Text("Tap refresh to load your health data from HealthKit")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)

            Button("Load Data") {
                refreshData()
            }
            .buttonStyle(.bordered)
        }
        .padding()
    }

    private var syncStatusSection: some View {
        VStack(spacing: 8) {
            Divider()

            HStack {
                Image(systemName: "icloud.and.arrow.up")
                    .foregroundColor(.secondary)

                if let lastSync = healthKitService.lastSyncDate {
                    Text("Last synced: \(lastSync, style: .relative) ago")
                        .font(.caption)
                        .foregroundColor(.secondary)
                } else {
                    Text("Not synced to server yet")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                Button("Sync Now") {
                    syncToServer()
                }
                .buttonStyle(.bordered)
                .controlSize(.small)
            }
        }
        .padding(.top)
    }

    private func refreshData() {
        isLoading = true
        errorMessage = nil

        Task {
            do {
                _ = try await healthKitService.fetchTodaysSummary()
            } catch {
                errorMessage = error.localizedDescription
            }
            isLoading = false
        }
    }

    private func syncToServer() {
        guard let summary = healthKitService.todaysSummary else {
            errorMessage = "No data to sync"
            return
        }

        isLoading = true
        errorMessage = nil

        Task {
            do {
                try await healthKitService.syncToServer(summary)
            } catch {
                errorMessage = error.localizedDescription
            }
            isLoading = false
        }
    }
}

struct MetricCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    var goal: String? = nil
    var subtitle: String? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(color)
                Text(title)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Text(value)
                .font(.title2)
                .fontWeight(.bold)

            if let goal = goal {
                Text("Goal: \(goal)")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }

            if let subtitle = subtitle {
                Text(subtitle)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(color.opacity(0.1))
        .cornerRadius(12)
    }
}

#Preview {
    NavigationStack {
        HealthDashboardView()
    }
    .environmentObject(HealthKitService())
}
