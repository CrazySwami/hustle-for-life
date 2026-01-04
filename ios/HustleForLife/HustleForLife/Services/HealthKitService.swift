/**
 * HealthKitService.swift
 *
 * Manages HealthKit integration for reading and syncing health data.
 */

import Foundation
import HealthKit

enum HealthKitError: Error, LocalizedError {
    case notAvailable
    case notAuthorized
    case queryFailed(String)
    case syncFailed

    var errorDescription: String? {
        switch self {
        case .notAvailable:
            return "HealthKit is not available on this device"
        case .notAuthorized:
            return "HealthKit authorization not granted"
        case .queryFailed(let message):
            return "HealthKit query failed: \(message)"
        case .syncFailed:
            return "Failed to sync health data to server"
        }
    }
}

@MainActor
class HealthKitService: ObservableObject {
    private let healthStore = HKHealthStore()

    @Published var isAuthorized = false
    @Published var lastSyncDate: Date?
    @Published var todaysSummary: HealthSummary?

    // Server URL for syncing
    // Public URL via Cloudflare tunnel (works from anywhere)
    var serverURL: String = "https://life.hustletogether.com"

    // Types we want to read from HealthKit
    private let readTypes: Set<HKObjectType> = {
        var types: Set<HKObjectType> = []

        // Quantity types
        let quantityTypes: [HKQuantityTypeIdentifier] = [
            .stepCount,
            .heartRate,
            .bloodPressureSystolic,
            .bloodPressureDiastolic,
            .bloodGlucose,
            .oxygenSaturation,
            .bodyMass,
            .activeEnergyBurned,
            .distanceWalkingRunning,
            .flightsClimbed
        ]

        for identifier in quantityTypes {
            if let type = HKQuantityType.quantityType(forIdentifier: identifier) {
                types.insert(type)
            }
        }

        // Category types
        if let sleepType = HKCategoryType.categoryType(forIdentifier: .sleepAnalysis) {
            types.insert(sleepType)
        }

        return types
    }()

    // Types we can write (for manual logging)
    private let writeTypes: Set<HKSampleType> = {
        var types: Set<HKSampleType> = []

        let quantityTypes: [HKQuantityTypeIdentifier] = [
            .bloodPressureSystolic,
            .bloodPressureDiastolic,
            .bloodGlucose,
            .bodyMass
        ]

        for identifier in quantityTypes {
            if let type = HKQuantityType.quantityType(forIdentifier: identifier) {
                types.insert(type)
            }
        }

        return types
    }()

    // MARK: - Authorization

    func requestAuthorization() async throws {
        guard HKHealthStore.isHealthDataAvailable() else {
            throw HealthKitError.notAvailable
        }

        try await healthStore.requestAuthorization(toShare: writeTypes, read: readTypes)
        isAuthorized = true
    }

    // MARK: - Fetch Today's Summary

    func fetchTodaysSummary() async throws -> HealthSummary {
        let calendar = Calendar.current
        let now = Date()
        let startOfDay = calendar.startOfDay(for: now)

        // Fetch all metrics in parallel
        async let steps = fetchSum(.stepCount, from: startOfDay, to: now)
        async let heartRateStats = fetchHeartRateStats(from: startOfDay, to: now)
        async let sleep = fetchSleepData(from: calendar.date(byAdding: .day, value: -1, to: startOfDay)!, to: now)
        async let activeCalories = fetchSum(.activeEnergyBurned, from: startOfDay, to: now)
        async let distance = fetchSum(.distanceWalkingRunning, from: startOfDay, to: now)
        async let flights = fetchSum(.flightsClimbed, from: startOfDay, to: now)
        async let latestWeight = fetchLatestSample(.bodyMass)
        async let latestOxygen = fetchLatestSample(.oxygenSaturation)
        async let latestBP = fetchLatestBloodPressure()
        async let latestGlucose = fetchLatestSample(.bloodGlucose)

        let hrStats = try await heartRateStats
        let sleepData = try await sleep

        var summary = HealthSummary(
            date: now,
            steps: try await steps,
            heartRateAvg: hrStats.avg,
            heartRateMin: hrStats.min,
            heartRateMax: hrStats.max,
            sleepHours: sleepData.totalHours,
            sleepDeepMinutes: sleepData.deepMinutes,
            sleepRemMinutes: sleepData.remMinutes,
            sleepLightMinutes: sleepData.lightMinutes,
            activeCalories: try await activeCalories,
            distanceMiles: try await distance,
            flightsClimbed: try await flights,
            oxygenSaturation: try? await latestOxygen,
            bodyMass: try? await latestWeight,
            bloodPressure: try? await latestBP,
            bloodGlucose: try? await latestGlucose
        )

        // Convert distance from meters to miles
        if let distance = summary.distanceMiles {
            summary.distanceMiles = distance / 1609.34
        }

        self.todaysSummary = summary
        return summary
    }

    // MARK: - Fetch Methods

    private func fetchSum(_ identifier: HKQuantityTypeIdentifier, from: Date, to: Date) async throws -> Double {
        guard let quantityType = HKQuantityType.quantityType(forIdentifier: identifier) else {
            return 0
        }

        let predicate = HKQuery.predicateForSamples(withStart: from, end: to)

        return try await withCheckedThrowingContinuation { continuation in
            let query = HKStatisticsQuery(
                quantityType: quantityType,
                quantitySamplePredicate: predicate,
                options: .cumulativeSum
            ) { _, result, error in
                if let error = error {
                    continuation.resume(throwing: HealthKitError.queryFailed(error.localizedDescription))
                    return
                }

                let unit = self.defaultUnit(for: identifier)
                let value = result?.sumQuantity()?.doubleValue(for: unit) ?? 0
                continuation.resume(returning: value)
            }
            healthStore.execute(query)
        }
    }

    private func fetchHeartRateStats(from: Date, to: Date) async throws -> (avg: Double?, min: Double?, max: Double?) {
        guard let quantityType = HKQuantityType.quantityType(forIdentifier: .heartRate) else {
            return (nil, nil, nil)
        }

        let predicate = HKQuery.predicateForSamples(withStart: from, end: to)
        let unit = HKUnit.count().unitDivided(by: .minute())

        return try await withCheckedThrowingContinuation { continuation in
            let query = HKStatisticsQuery(
                quantityType: quantityType,
                quantitySamplePredicate: predicate,
                options: [.discreteAverage, .discreteMin, .discreteMax]
            ) { _, result, error in
                if let error = error {
                    continuation.resume(throwing: HealthKitError.queryFailed(error.localizedDescription))
                    return
                }

                let avg = result?.averageQuantity()?.doubleValue(for: unit)
                let min = result?.minimumQuantity()?.doubleValue(for: unit)
                let max = result?.maximumQuantity()?.doubleValue(for: unit)

                continuation.resume(returning: (avg, min, max))
            }
            healthStore.execute(query)
        }
    }

    private func fetchSleepData(from: Date, to: Date) async throws -> (totalHours: Double?, deepMinutes: Double?, remMinutes: Double?, lightMinutes: Double?) {
        guard let sleepType = HKCategoryType.categoryType(forIdentifier: .sleepAnalysis) else {
            return (nil, nil, nil, nil)
        }

        let predicate = HKQuery.predicateForSamples(withStart: from, end: to)

        return try await withCheckedThrowingContinuation { continuation in
            let query = HKSampleQuery(
                sampleType: sleepType,
                predicate: predicate,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: nil
            ) { _, samples, error in
                if let error = error {
                    continuation.resume(throwing: HealthKitError.queryFailed(error.localizedDescription))
                    return
                }

                var totalSeconds: Double = 0
                var deepSeconds: Double = 0
                var remSeconds: Double = 0
                var lightSeconds: Double = 0

                for sample in (samples as? [HKCategorySample]) ?? [] {
                    let duration = sample.endDate.timeIntervalSince(sample.startDate)

                    switch sample.value {
                    case HKCategoryValueSleepAnalysis.asleepDeep.rawValue:
                        deepSeconds += duration
                        totalSeconds += duration
                    case HKCategoryValueSleepAnalysis.asleepREM.rawValue:
                        remSeconds += duration
                        totalSeconds += duration
                    case HKCategoryValueSleepAnalysis.asleepCore.rawValue:
                        lightSeconds += duration
                        totalSeconds += duration
                    case HKCategoryValueSleepAnalysis.asleepUnspecified.rawValue:
                        totalSeconds += duration
                    default:
                        break // inBed, awake
                    }
                }

                continuation.resume(returning: (
                    totalSeconds > 0 ? totalSeconds / 3600 : nil,
                    deepSeconds > 0 ? deepSeconds / 60 : nil,
                    remSeconds > 0 ? remSeconds / 60 : nil,
                    lightSeconds > 0 ? lightSeconds / 60 : nil
                ))
            }
            healthStore.execute(query)
        }
    }

    private func fetchLatestSample(_ identifier: HKQuantityTypeIdentifier) async throws -> Double? {
        guard let quantityType = HKQuantityType.quantityType(forIdentifier: identifier) else {
            return nil
        }

        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)

        return try await withCheckedThrowingContinuation { continuation in
            let query = HKSampleQuery(
                sampleType: quantityType,
                predicate: nil,
                limit: 1,
                sortDescriptors: [sortDescriptor]
            ) { _, samples, error in
                if let error = error {
                    continuation.resume(throwing: HealthKitError.queryFailed(error.localizedDescription))
                    return
                }

                guard let sample = samples?.first as? HKQuantitySample else {
                    continuation.resume(returning: nil)
                    return
                }

                let unit = self.defaultUnit(for: identifier)
                let value = sample.quantity.doubleValue(for: unit)
                continuation.resume(returning: value)
            }
            healthStore.execute(query)
        }
    }

    private func fetchLatestBloodPressure() async throws -> BloodPressure? {
        guard let systolicType = HKQuantityType.quantityType(forIdentifier: .bloodPressureSystolic),
              let diastolicType = HKQuantityType.quantityType(forIdentifier: .bloodPressureDiastolic) else {
            return nil
        }

        // Fetch systolic
        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)
        let mmHg = HKUnit.millimeterOfMercury()

        return try await withCheckedThrowingContinuation { continuation in
            let query = HKSampleQuery(
                sampleType: systolicType,
                predicate: nil,
                limit: 1,
                sortDescriptors: [sortDescriptor]
            ) { [weak self] _, samples, error in
                guard let self = self else {
                    continuation.resume(returning: nil)
                    return
                }

                if let error = error {
                    continuation.resume(throwing: HealthKitError.queryFailed(error.localizedDescription))
                    return
                }

                guard let systolicSample = samples?.first as? HKQuantitySample else {
                    continuation.resume(returning: nil)
                    return
                }

                // Fetch corresponding diastolic
                let predicate = HKQuery.predicateForSamples(
                    withStart: systolicSample.startDate,
                    end: systolicSample.endDate
                )

                let diastolicQuery = HKSampleQuery(
                    sampleType: diastolicType,
                    predicate: predicate,
                    limit: 1,
                    sortDescriptors: nil
                ) { _, diastolicSamples, _ in
                    guard let diastolicSample = diastolicSamples?.first as? HKQuantitySample else {
                        continuation.resume(returning: nil)
                        return
                    }

                    let bp = BloodPressure(
                        systolic: systolicSample.quantity.doubleValue(for: mmHg),
                        diastolic: diastolicSample.quantity.doubleValue(for: mmHg),
                        timestamp: systolicSample.startDate
                    )
                    continuation.resume(returning: bp)
                }

                self.healthStore.execute(diastolicQuery)
            }
            healthStore.execute(query)
        }
    }

    // MARK: - Sync to Server

    func syncToServer(_ summary: HealthSummary) async throws {
        guard let url = URL(string: "\(serverURL)/api/health-data") else {
            throw HealthKitError.syncFailed
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let payload = summary.toServerPayload()
        request.httpBody = try JSONSerialization.data(withJSONObject: payload)

        let (_, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw HealthKitError.syncFailed
        }

        lastSyncDate = Date()
    }

    func fetchAndSync() async throws {
        let summary = try await fetchTodaysSummary()
        try await syncToServer(summary)
    }

    // MARK: - Write Methods

    func logBloodPressure(systolic: Double, diastolic: Double) async throws {
        guard let systolicType = HKQuantityType.quantityType(forIdentifier: .bloodPressureSystolic),
              let diastolicType = HKQuantityType.quantityType(forIdentifier: .bloodPressureDiastolic) else {
            throw HealthKitError.notAvailable
        }

        let now = Date()
        let mmHg = HKUnit.millimeterOfMercury()

        let systolicQuantity = HKQuantity(unit: mmHg, doubleValue: systolic)
        let diastolicQuantity = HKQuantity(unit: mmHg, doubleValue: diastolic)

        let systolicSample = HKQuantitySample(type: systolicType, quantity: systolicQuantity, start: now, end: now)
        let diastolicSample = HKQuantitySample(type: diastolicType, quantity: diastolicQuantity, start: now, end: now)

        try await healthStore.save([systolicSample, diastolicSample])
    }

    func logWeight(pounds: Double) async throws {
        guard let weightType = HKQuantityType.quantityType(forIdentifier: .bodyMass) else {
            throw HealthKitError.notAvailable
        }

        let now = Date()
        let lbs = HKUnit.pound()
        let quantity = HKQuantity(unit: lbs, doubleValue: pounds)
        let sample = HKQuantitySample(type: weightType, quantity: quantity, start: now, end: now)

        try await healthStore.save(sample)
    }

    func logGlucose(mgDL: Double) async throws {
        guard let glucoseType = HKQuantityType.quantityType(forIdentifier: .bloodGlucose) else {
            throw HealthKitError.notAvailable
        }

        let now = Date()
        let unit = HKUnit.gramUnit(with: .milli).unitDivided(by: HKUnit.literUnit(with: .deci))
        let quantity = HKQuantity(unit: unit, doubleValue: mgDL)
        let sample = HKQuantitySample(type: glucoseType, quantity: quantity, start: now, end: now)

        try await healthStore.save(sample)
    }

    // MARK: - Helpers

    private func defaultUnit(for identifier: HKQuantityTypeIdentifier) -> HKUnit {
        switch identifier {
        case .stepCount:
            return .count()
        case .heartRate:
            return .count().unitDivided(by: .minute())
        case .bloodPressureSystolic, .bloodPressureDiastolic:
            return .millimeterOfMercury()
        case .bloodGlucose:
            return .gramUnit(with: .milli).unitDivided(by: .literUnit(with: .deci))
        case .oxygenSaturation:
            return .percent()
        case .bodyMass:
            return .pound()
        case .activeEnergyBurned:
            return .kilocalorie()
        case .distanceWalkingRunning:
            return .meter()
        case .flightsClimbed:
            return .count()
        default:
            return .count()
        }
    }
}
