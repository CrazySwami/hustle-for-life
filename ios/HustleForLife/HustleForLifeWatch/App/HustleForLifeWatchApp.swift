/**
 * HustleForLifeWatchApp.swift
 *
 * Main entry point for the watchOS companion app.
 */

import SwiftUI
import WatchConnectivity

@main
struct HustleForLifeWatchApp: App {
    @StateObject private var connectivityManager = WatchConnectivityManager()

    var body: some Scene {
        WindowGroup {
            WatchContentView()
                .environmentObject(connectivityManager)
        }
    }
}

/**
 * Manages Watch <-> iPhone connectivity
 */
class WatchConnectivityManager: NSObject, ObservableObject, WCSessionDelegate {
    @Published var isConnected = false
    @Published var lastMessage: String?
    @Published var quickReplies: [String] = [
        "Feeling good!",
        "Need a break",
        "Ate healthy",
        "Had water",
        "Going to sleep"
    ]

    private var session: WCSession?

    override init() {
        super.init()

        if WCSession.isSupported() {
            session = WCSession.default
            session?.delegate = self
            session?.activate()
        }
    }

    // MARK: - Send Messages

    func sendQuickReply(_ message: String) {
        guard let session = session, session.isReachable else {
            lastMessage = "iPhone not reachable"
            return
        }

        session.sendMessage(
            ["type": "quickReply", "message": message],
            replyHandler: { response in
                DispatchQueue.main.async {
                    self.lastMessage = response["status"] as? String ?? "Sent!"
                }
            },
            errorHandler: { error in
                DispatchQueue.main.async {
                    self.lastMessage = "Error: \(error.localizedDescription)"
                }
            }
        )
    }

    func logMood(_ rating: Int) {
        sendCommand("/mood \(rating)")
    }

    func logWater() {
        sendCommand("/water 1")
    }

    func sendCommand(_ command: String) {
        guard let session = session, session.isReachable else {
            lastMessage = "iPhone not reachable"
            return
        }

        session.sendMessage(
            ["type": "command", "command": command],
            replyHandler: { response in
                DispatchQueue.main.async {
                    self.lastMessage = response["status"] as? String ?? "Command sent!"
                }
            },
            errorHandler: { error in
                DispatchQueue.main.async {
                    self.lastMessage = "Error: \(error.localizedDescription)"
                }
            }
        )
    }

    // MARK: - WCSessionDelegate

    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        DispatchQueue.main.async {
            self.isConnected = activationState == .activated
        }
    }

    func sessionReachabilityDidChange(_ session: WCSession) {
        DispatchQueue.main.async {
            self.isConnected = session.isReachable
        }
    }

    func session(_ session: WCSession, didReceiveMessage message: [String : Any]) {
        DispatchQueue.main.async {
            if let notification = message["notification"] as? String {
                self.lastMessage = notification
            }
        }
    }
}
