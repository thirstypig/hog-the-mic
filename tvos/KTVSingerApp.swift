//
//  KTVSingerApp.swift
//  KTVSinger-tvOS
//
//  Main app entry point for tvOS
//

import SwiftUI
import AVFoundation

@main
struct KTVSingerApp: App {
    @StateObject private var supabase = AppSupabaseClient.shared
    @StateObject private var pairingService = DevicePairingService()
    @StateObject private var queueService = QueueService()
    @StateObject private var audioStreamService = AudioStreamService()

    init() {
        do {
            let audioSession = AVAudioSession.sharedInstance()
            try audioSession.setCategory(.playback, mode: .default, options: [.mixWithOthers])
            try audioSession.setActive(true)
        } catch {
            print("AVAudioSession setup failed: \(error)")
        }
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(supabase)
                .environmentObject(pairingService)
                .environmentObject(queueService)
                .environmentObject(audioStreamService)
        }
    }
}

struct ContentView: View {
    @EnvironmentObject var supabase: AppSupabaseClient
    @EnvironmentObject var pairingService: DevicePairingService
    @EnvironmentObject var queueService: QueueService
    @EnvironmentObject var audioStreamService: AudioStreamService
    @State private var showPairingSheet = false
    @State private var showQueuePlayer = false

    var body: some View {
        ZStack {
            // Always show main app content (no auth gate)
            TabView {
                SongBrowserView()
                    .tabItem {
                        Label("Browse", systemImage: "music.note.list")
                    }

                FavoritesView()
                    .tabItem {
                        Label("Favorites", systemImage: "heart.fill")
                    }

                SettingsView()
                    .tabItem {
                        Label("Settings", systemImage: "gearshape.fill")
                    }
            }

            // Floating button to show pairing QR code
            VStack {
                HStack {
                    Spacer()
                    Button {
                        showPairingSheet = true
                    } label: {
                        HStack(spacing: 8) {
                            Image(systemName: "iphone.and.arrow.forward")
                                .font(.title)
                                .foregroundColor(.white)
                            if !pairingService.connectedDevices.isEmpty {
                                Text("\(pairingService.connectedDevices.count)")
                                    .font(.caption)
                                    .fontWeight(.bold)
                                    .foregroundColor(.white)
                                    .frame(width: 22, height: 22)
                                    .background(Color.green)
                                    .clipShape(Circle())
                            }
                        }
                        .padding(20)
                        .background(Color.blue)
                        .clipShape(Circle())
                        .shadow(radius: 10)
                    }
                    .padding(.top, 60)
                    .padding(.trailing, 60)
                }
                Spacer()
            }
            .sheet(isPresented: $showPairingSheet) {
                PairingView()
            }
        }
        .onChange(of: queueService.currentlyPlaying) { _, newValue in
            // Auto-open player when queue starts playing
            if newValue != nil && !showQueuePlayer {
                showQueuePlayer = true
            }
        }
        .fullScreenCover(isPresented: $showQueuePlayer) {
            if let entry = queueService.currentlyPlaying {
                QueuePlayerView(initialEntry: entry)
            }
        }
        .onAppear {
            // Wire queue service and audio stream to socket service
            queueService.attach(to: pairingService.socketService)
            audioStreamService.attach(to: pairingService.socketService)
        }
    }
}

// MARK: - Preview

#Preview {
    ContentView()
        .environmentObject(AppSupabaseClient.shared)
        .environmentObject(DevicePairingService())
        .environmentObject(QueueService())
        .environmentObject(AudioStreamService())
}
