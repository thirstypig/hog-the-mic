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

    init() {
        do {
            let audioSession = AVAudioSession.sharedInstance()
            try audioSession.setCategory(.playback, mode: .default)
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
        }
    }
}

struct ContentView: View {
    @EnvironmentObject var supabase: AppSupabaseClient
    @State private var showPairingSheet = false

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
                        Image(systemName: "iphone.and.arrow.forward")
                            .font(.title)
                            .foregroundColor(.white)
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
    }
}

// MARK: - Preview

#Preview {
    ContentView()
        .environmentObject(AppSupabaseClient.shared)
        .environmentObject(DevicePairingService())
}
