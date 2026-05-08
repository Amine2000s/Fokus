# FOKUS — High-Performance Focus Tracker

FOKUS is a premium, local-first focus tracking application designed for deep work and high-performance workflows. Inspired by the minimalist aesthetics of Claude AI and macOS, FOKUS provides a frictionless transition from planning to action.

![FOKUS App](https://cdn-icons-png.flaticon.com/512/2972/2972531.png)

## 🚀 Key Features

### 1. The Cockpit (Dashboard)
*   **Speedometer Timer**: A sleek, arc-based visual gauge that tracks your focus in real-time.
*   **Quick Start Bar**: Type your task and hit Enter. FOKUS handles the rest—automatic task creation and timer ignition.
*   **Cold Start Mode**: Start working instantly without categorizing. Unassigned tasks are automatically grouped under the "Others" category.
*   **Pomodoro Presets**: One-tap toggles for 5m, 10m, and 25m sessions, with support for custom durations.
*   **Heat Map**: A GitHub-style contribution graph showing your focus consistency over the last 20 weeks.

### 2. The Backlog
*   **Unified Task Management**: A single, clean list of all pending work across every activity.
*   **Rapid Entry**: Add multiple tasks quickly with activity tagging chips.
*   **One-Click Focus**: Every task features a "Focus Now" button that instantly transports you to the Dashboard and starts the timer.

### 3. Activity Analytics
*   **Vertical Bar Charts**: Visualize your focus distribution across different categories.
*   **Timeframe Filtering**: Filter statistics by Day, Week, or Month.
*   **Full CRUD**: Create, edit, and organize activities with a custom library of over 40 Apple-style icons.

### 4. Sync & Resilience
*   **JSON Portability**: Export your entire local database to a JSON file for backup or cross-device migration.
*   **Manual Restore**: Import backup files to recover your history on new browsers or devices.
*   **Last Backup Indicator**: Smart tracking of your data safety status.

## 🎨 Premium Theming System
FOKUS features three hand-crafted environments tailored to your vibe:
*   **Obsidian (Default)**: Pure OLED Black with high-contrast white accents and deep glassmorphism. Designed for macOS enthusiasts.
*   **Midnight**: A professional "Studio" Dark Navy with soft indigo highlights.
*   **Paper**: A Claude-inspired warm light mode featuring serif typography and organic terracotta tones.

## 🛠 Technical Architecture

### Local-First Data
FOKUS is built on a **Local-First** philosophy.
*   **IndexedDB Storage**: Uses a robust browser-based database for persistence. Data survives browser restarts and system reboots.
*   **Timestamp-Based Timing**: The timer calculates elapsed time based on system clock differences, meaning it remains 100% accurate even if you close the tab or your computer goes to sleep.
*   **Privacy by Design**: No data ever leaves your device. There are no trackers, no accounts, and no cloud-side processing.

### PWA (Progressive Web App)
FOKUS is fully PWA-ready.
*   **Installable**: "Add to Home Screen" on iOS, Android, or Desktop for a native standalone window.
*   **Resilient Storage**: Installed PWAs are prioritized by operating systems, making your focus data less likely to be cleared by automatic cache cleanup tools.

## ⌨️ Shortcuts & UX
*   **Enter**: Start Quick Start / Save Task.
*   **Escape**: Cancel Custom Duration / Close Modals.
*   **Theme Toggle**: Switch between High-Performance Dark and Intellectual Light modes in Settings.

---

*FOKUS is designed for those who value their time and their privacy.*
