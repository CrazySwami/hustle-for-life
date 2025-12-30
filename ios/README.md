# Hustle For Life - iOS App

Native iOS/watchOS app for the Hustle For Life well-being system.

## Architecture

```
iPhone App <--WebSocket--> Backend Server <--> Claude Code CLI
    |
    +-- HealthKit (read health data)
    +-- watchOS (companion app)
```

## Project Structure

```
HustleForLife/
├── HustleForLife/
│   ├── App/
│   │   ├── HustleForLifeApp.swift    # App entry point
│   │   └── ContentView.swift          # Main navigation
│   ├── Models/
│   │   ├── ChatMessage.swift          # Message model
│   │   └── HealthData.swift           # Health data models
│   ├── Services/
│   │   ├── WebSocketService.swift     # Server communication
│   │   └── HealthKitService.swift     # HealthKit integration
│   ├── Views/
│   │   ├── DepartmentListView.swift   # Sidebar navigation
│   │   ├── ChatView.swift             # Chat interface
│   │   ├── MessageBubble.swift        # Message display
│   │   ├── ToolUseView.swift          # Tool usage display
│   │   └── HealthDashboardView.swift  # Health overview
│   └── Utilities/
├── HustleForLifeWatch/
│   ├── App/
│   │   └── HustleForLifeWatchApp.swift
│   └── Views/
│       └── WatchContentView.swift
└── Shared/
```

## Setup Instructions

### 1. Open in Xcode

Open `HustleForLife.xcodeproj` in Xcode 15+.

### 2. Configure Signing

1. Select the project in the navigator
2. Go to "Signing & Capabilities"
3. Select your development team
4. Ensure bundle identifiers are unique

### 3. Add HealthKit Capability

1. Select the iOS target
2. Go to "Signing & Capabilities"
3. Click "+ Capability"
4. Add "HealthKit"
5. Enable "Clinical Health Records" if needed

### 4. Configure Info.plist

Add these keys to your Info.plist:

```xml
<key>NSHealthShareUsageDescription</key>
<string>Hustle For Life syncs your health data to provide personalized insights and track your wellness goals.</string>

<key>NSHealthUpdateUsageDescription</key>
<string>Hustle For Life can log health measurements like blood pressure and weight that you manually enter.</string>

<key>UIBackgroundModes</key>
<array>
    <string>fetch</string>
    <string>processing</string>
    <string>remote-notification</string>
</array>
```

### 5. Configure Server URL

Update the server URL in `AppState.swift`:

```swift
@AppStorage("serverURL") var serverURL = "ws://YOUR-TAILSCALE-IP:3000/ws"
```

### 6. Build and Run

1. Select your iOS device or simulator
2. Click Run (Cmd+R)

## Requirements

- iOS 17.0+
- watchOS 10.0+
- Xcode 15.0+
- Swift 5.9+

## Features

### Chat Interface
- Real-time communication with Claude Code
- Slash command quick access
- Tool usage visualization
- Markdown rendering

### Departments
- Life Agent (CEO) - Life coordination
- Health - Health tracking and insights
- ROI Amplified - Work management
- Mirror Factory - Personal projects

### HealthKit Integration
- Steps and distance
- Heart rate
- Sleep analysis
- Blood pressure
- Blood glucose
- Weight
- Active calories

### Apple Watch
- Quick logging (water, mood)
- Quick replies
- Connection to iPhone

## Server Connection

The app connects to a self-hosted backend server via WebSocket. Ensure:

1. Backend server is running
2. Tailscale VPN is connected
3. Server URL is correctly configured

## Privacy

All health data stays on YOUR infrastructure:
- No cloud services required
- Data syncs to your self-hosted server
- Full data ownership
