//
//  PairingView.swift
//  KTVSinger-tvOS
//
//  View for pairing iOS devices with tvOS app via Express server
//

import SwiftUI

struct PairingView: View {
    @EnvironmentObject var pairingService: DevicePairingService
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ZStack {
            // Background
            LinearGradient(
                colors: [.black, .blue.opacity(0.4)],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            VStack(spacing: 50) {
                // Header
                VStack(spacing: 16) {
                    Image(systemName: "iphone.and.arrow.forward")
                        .font(.system(size: 80))
                        .foregroundColor(.white)

                    Text("Connect Your Phone")
                        .font(.system(size: 48, weight: .bold))
                        .foregroundColor(.white)

                    Text("Scan this QR code with the KTV Singer app on your iPhone to use it as a microphone")
                        .font(.title3)
                        .foregroundColor(.white.opacity(0.8))
                        .multilineTextAlignment(.center)
                        .frame(maxWidth: 800)
                }

                // QR Code
                if let qrCodeImage = pairingService.qrCodeImage {
                    Image(uiImage: qrCodeImage)
                        .interpolation(.none)
                        .resizable()
                        .scaledToFit()
                        .frame(width: 400, height: 400)
                        .padding(40)
                        .background(Color.white)
                        .cornerRadius(30)
                        .shadow(color: .black.opacity(0.3), radius: 20)
                } else if pairingService.isLoading {
                    VStack(spacing: 20) {
                        ProgressView()
                            .scaleEffect(2)
                            .tint(.white)
                        Text("Creating session...")
                            .font(.title3)
                            .foregroundColor(.white.opacity(0.7))
                    }
                    .frame(width: 400, height: 400)
                } else if let error = pairingService.error {
                    VStack(spacing: 20) {
                        Image(systemName: "exclamationmark.triangle")
                            .font(.system(size: 60))
                            .foregroundColor(.red.opacity(0.8))
                        Text(error.localizedDescription)
                            .font(.title3)
                            .foregroundColor(.white.opacity(0.7))
                        Button("Retry") {
                            Task { await pairingService.createSession() }
                        }
                    }
                    .frame(width: 400, height: 400)
                } else {
                    VStack(spacing: 20) {
                        ProgressView()
                            .scaleEffect(2)
                            .tint(.white)
                        Text("Generating QR code...")
                            .font(.title3)
                            .foregroundColor(.white.opacity(0.7))
                    }
                    .frame(width: 400, height: 400)
                }

                // Instructions
                VStack(alignment: .leading, spacing: 16) {
                    InstructionRow(number: 1, text: "Open KTV Singer on your iPhone or iPad")
                    InstructionRow(number: 2, text: "Tap the 'Connect to TV' button")
                    InstructionRow(number: 3, text: "Scan this QR code with your camera")
                    InstructionRow(number: 4, text: "Start singing!")
                }
                .padding(40)
                .background(Color.white.opacity(0.05))
                .cornerRadius(20)

                // Connected singers
                if !pairingService.connectedDevices.isEmpty {
                    VStack(spacing: 16) {
                        Text("Connected Singers")
                            .font(.title2)
                            .foregroundColor(.white)

                        ForEach(pairingService.connectedDevices) { device in
                            HStack {
                                Image(systemName: "iphone")
                                    .font(.title3)
                                Text(device.name)
                                    .font(.title3)
                                Spacer()
                                Image(systemName: "checkmark.circle.fill")
                                    .font(.title3)
                                    .foregroundColor(.green)
                            }
                            .foregroundColor(.white)
                            .padding(16)
                            .background(Color.white.opacity(0.1))
                            .cornerRadius(12)
                        }
                    }
                    .frame(maxWidth: 600)
                }

                Spacer()

                // Close button
                Button {
                    dismiss()
                } label: {
                    Text("Close")
                        .font(.title3)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                        .padding(.horizontal, 60)
                        .padding(.vertical, 20)
                        .background(Color.white.opacity(0.2))
                        .cornerRadius(15)
                }
            }
            .padding(60)
        }
        .onAppear {
            Task { await pairingService.createSession() }
        }
        .onDisappear {
            // Don't end session on dismiss — keep the connection alive
            // so singers stay connected while browsing/playing
        }
    }
}

struct InstructionRow: View {
    let number: Int
    let text: String

    var body: some View {
        HStack(spacing: 20) {
            ZStack {
                Circle()
                    .fill(Color.blue)
                    .frame(width: 50, height: 50)
                Text("\(number)")
                    .font(.title3)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
            }

            Text(text)
                .font(.title3)
                .foregroundColor(.white)

            Spacer()
        }
    }
}

// MARK: - Preview

#Preview {
    PairingView()
        .environmentObject(DevicePairingService())
}
