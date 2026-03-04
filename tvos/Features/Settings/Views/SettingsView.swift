//
//  SettingsView.swift
//  KTVSinger-tvOS
//
//  Settings and preferences screen
//

import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var supabase: AppSupabaseClient
    @EnvironmentObject var pairingService: DevicePairingService
    @StateObject private var apiClient = APIClient.shared
    @State private var showSignOutAlert = false

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [.black, .gray.opacity(0.3)],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            ScrollView {
                VStack(spacing: 40) {
                    // Header
                    HStack {
                        Text("Settings")
                            .font(.system(size: 56, weight: .bold))
                            .foregroundColor(.white)
                        Spacer()
                    }
                    .padding(.horizontal, 48)
                    .padding(.top, 40)

                    // Server section
                    SettingsSection(title: "Server") {
                        SettingsRow(
                            icon: "server.rack",
                            title: "API URL",
                            value: apiClient.baseURL
                        )
                    }

                    // Account section
                    SettingsSection(title: "Account") {
                        if let user = supabase.currentUser {
                            SettingsRow(
                                icon: "person.circle.fill",
                                title: "Email",
                                value: user.email ?? "No email"
                            )

                            Button {
                                showSignOutAlert = true
                            } label: {
                                HStack {
                                    Image(systemName: "rectangle.portrait.and.arrow.right")
                                        .font(.title3)
                                    Text("Sign Out")
                                        .font(.title3)
                                    Spacer()
                                }
                                .foregroundColor(.red)
                                .padding(20)
                                .background(Color.white.opacity(0.05))
                                .cornerRadius(12)
                            }
                        } else {
                            Text("Not signed in")
                                .font(.body)
                                .foregroundColor(.white.opacity(0.5))
                                .padding(20)
                        }
                    }

                    // Devices section
                    SettingsSection(title: "Connected Devices") {
                        if pairingService.connectedDevices.isEmpty {
                            Text("No devices connected")
                                .font(.body)
                                .foregroundColor(.white.opacity(0.5))
                                .padding(20)
                        } else {
                            ForEach(pairingService.connectedDevices) { device in
                                HStack {
                                    Image(systemName: "iphone")
                                        .font(.title3)
                                    Text(device.name)
                                        .font(.title3)
                                    Spacer()
                                    Button {
                                        pairingService.disconnectDevice(device)
                                    } label: {
                                        Text("Disconnect")
                                            .font(.body)
                                            .foregroundColor(.red)
                                    }
                                }
                                .foregroundColor(.white)
                                .padding(20)
                                .background(Color.white.opacity(0.05))
                                .cornerRadius(12)
                            }
                        }
                    }
                    
                    // App info section
                    SettingsSection(title: "About") {
                        SettingsRow(
                            icon: "info.circle.fill",
                            title: "Version",
                            value: "1.0.0"
                        )
                        
                        SettingsRow(
                            icon: "checkmark.seal.fill",
                            title: "Build",
                            value: "1"
                        )
                    }
                    
                    Spacer()
                }
                .padding(.horizontal, 48)
                .padding(.bottom, 60)
            }
        }
        .alert("Sign Out", isPresented: $showSignOutAlert) {
            Button("Cancel", role: .cancel) { }
            Button("Sign Out", role: .destructive) {
                Task {
                    try? await supabase.signOut()
                }
            }
        } message: {
            Text("Are you sure you want to sign out?")
        }
    }
    
}

struct SettingsSection<Content: View>: View {
    let title: String
    @ViewBuilder let content: () -> Content
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(title)
                .font(.title2)
                .fontWeight(.semibold)
                .foregroundColor(.white.opacity(0.9))
            
            VStack(spacing: 12) {
                content()
            }
        }
        .frame(maxWidth: 1000, alignment: .leading)
    }
}

struct SettingsRow: View {
    let icon: String
    let title: String
    let value: String
    
    var body: some View {
        HStack {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(.blue)
                .frame(width: 40)
            
            Text(title)
                .font(.title3)
                .foregroundColor(.white)
            
            Spacer()
            
            Text(value)
                .font(.title3)
                .foregroundColor(.white.opacity(0.6))
        }
        .padding(20)
        .background(Color.white.opacity(0.05))
        .cornerRadius(12)
    }
}

// MARK: - Preview

#Preview {
    SettingsView()
        .environmentObject(AppSupabaseClient.shared)
        .environmentObject(DevicePairingService())
}
