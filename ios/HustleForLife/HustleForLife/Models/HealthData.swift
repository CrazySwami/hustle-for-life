/**
 * HealthData.swift
 *
 * Models for health data synced from HealthKit and sent to the server.
 */

import Foundation

/// Summary of health data for a single day
struct HealthSummary: Codable {
    let date: Date
    var steps: Double
    var heartRateAvg: Double?
    var heartRateMin: Double?
    var heartRateMax: Double?
    var sleepHours: Double?
    var sleepDeepMinutes: Double?
    var sleepRemMinutes: Double?
    var sleepLightMinutes: Double?
    var activeCalories: Double?
    var distanceMiles: Double?
    var flightsClimbed: Double?
    var oxygenSaturation: Double?
    var bodyMass: Double?
    var bloodPressure: BloodPressure?
    var bloodGlucose: Double?

    var formattedDate: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: date)
    }

    /// Convert to payload for server
    func toServerPayload() -> [String: Any] {
        var metrics: [String: Any] = [
            "steps": steps
        ]

        if let heartRateAvg = heartRateAvg { metrics["heartRateAvg"] = heartRateAvg }
        if let heartRateMin = heartRateMin { metrics["heartRateMin"] = heartRateMin }
        if let heartRateMax = heartRateMax { metrics["heartRateMax"] = heartRateMax }
        if let sleepHours = sleepHours { metrics["sleepHours"] = sleepHours }
        if let sleepDeepMinutes = sleepDeepMinutes { metrics["sleepDeepMinutes"] = sleepDeepMinutes }
        if let sleepRemMinutes = sleepRemMinutes { metrics["sleepRemMinutes"] = sleepRemMinutes }
        if let sleepLightMinutes = sleepLightMinutes { metrics["sleepLightMinutes"] = sleepLightMinutes }
        if let activeCalories = activeCalories { metrics["activeCalories"] = activeCalories }
        if let distanceMiles = distanceMiles { metrics["distanceMiles"] = distanceMiles }
        if let flightsClimbed = flightsClimbed { metrics["flightsClimbed"] = flightsClimbed }
        if let oxygenSaturation = oxygenSaturation { metrics["oxygenSaturation"] = oxygenSaturation }
        if let bodyMass = bodyMass { metrics["bodyMass"] = bodyMass }
        if let bloodGlucose = bloodGlucose { metrics["bloodGlucose"] = bloodGlucose }
        if let bp = bloodPressure {
            metrics["bloodPressure"] = [
                "systolic": bp.systolic,
                "diastolic": bp.diastolic
            ]
        }

        return [
            "date": formattedDate,
            "metrics": metrics
        ]
    }
}

/// Blood pressure reading
struct BloodPressure: Codable {
    let systolic: Double
    let diastolic: Double
    let timestamp: Date?

    var formatted: String {
        "\(Int(systolic))/\(Int(diastolic))"
    }
}

/// Session metadata from the server
struct Session: Codable, Identifiable {
    let id: String
    let department: String
    let name: String
    let cwd: String
    let isActive: Bool
    let createdAt: String
    let lastActivityAt: String
    let messageCount: Int
}

/// Department information from the server
struct DepartmentInfo: Codable, Identifiable {
    var id: String { name }
    let name: String
    let path: String
    let hasClaudeMd: Bool
}
