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

    // Ambient blob animation
    @State private var animateBlobs = false
    // QR pulse animation
    @State private var pulseScale: CGFloat = 1.0
    @State private var pulseOpacity: Double = 0.8

    var body: some View {
        ZStack {
            // Animated ambient background
            ambientBackground

            // Single non-scrollable layout sized for TV screen
            VStack(spacing: 30) {
                // Header
                VStack(spacing: 10) {
                    Image(systemName: "tv.and.mediabox")
                        .font(.system(size: 50))
                        .foregroundColor(.white)

                    Text("Connect Your Phone")
                        .font(.system(size: 40, weight: .bold))
                        .foregroundColor(.white)

                    Text("Scan the QR code with the KTV Singer app to start singing")
                        .font(.body)
                        .foregroundColor(.white.opacity(0.7))
                        .multilineTextAlignment(.center)
                        .frame(maxWidth: 600)
                }

                // Main content: QR + instructions side by side
                HStack(spacing: 60) {
                    // QR Code with pulsing ring
                    qrCodeSection

                    // Right side: instructions + connected devices
                    VStack(spacing: 30) {
                        instructionSteps
                        connectedDevicesSection
                    }
                    .frame(maxWidth: 500)
                }

                Spacer(minLength: 0)

                // Close button — always visible at bottom
                Button {
                    dismiss()
                } label: {
                    Text("Close")
                        .font(.title3)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                        .padding(.horizontal, 60)
                        .padding(.vertical, 16)
                        .background(.ultraThinMaterial)
                        .clipShape(RoundedRectangle(cornerRadius: 15))
                }
                .padding(.bottom, 20)
            }
            .padding(.horizontal, 60)
            .padding(.top, 50)
        }
        .onExitCommand {
            dismiss()
        }
        .onAppear {
            Task { await pairingService.createSession() }
            withAnimation(.easeInOut(duration: 8).repeatForever(autoreverses: true)) {
                animateBlobs = true
            }
            withAnimation(.easeInOut(duration: 2).repeatForever(autoreverses: false)) {
                pulseScale = 1.5
                pulseOpacity = 0
            }
        }
        .onDisappear {
            // Don't end session on dismiss — keep the connection alive
        }
        // Auto-dismiss when a singer connects
        .onChange(of: pairingService.connectedDevices.count) { oldCount, newCount in
            if newCount > oldCount {
                // Brief delay so user sees the "connected" confirmation
                DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                    dismiss()
                }
            }
        }
    }

    // MARK: - Ambient Background

    private var ambientBackground: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            Circle()
                .fill(Color.blue.opacity(0.3))
                .frame(width: 600, height: 600)
                .blur(radius: 150)
                .offset(
                    x: animateBlobs ? 200 : -200,
                    y: animateBlobs ? -100 : 100
                )

            Circle()
                .fill(Color.purple.opacity(0.25))
                .frame(width: 500, height: 500)
                .blur(radius: 120)
                .offset(
                    x: animateBlobs ? -150 : 150,
                    y: animateBlobs ? 150 : -150
                )
        }
        .ignoresSafeArea()
    }

    // MARK: - QR Code Section

    private var qrCodeSection: some View {
        Group {
            if let qrCodeImage = pairingService.qrCodeImage {
                ZStack {
                    // Pulsing ring
                    Circle()
                        .stroke(Color.cyan.opacity(0.4), lineWidth: 2)
                        .frame(width: 380, height: 380)
                        .scaleEffect(pulseScale)
                        .opacity(pulseOpacity)

                    // QR code
                    Image(uiImage: qrCodeImage)
                        .interpolation(.none)
                        .resizable()
                        .scaledToFit()
                        .frame(width: 260, height: 260)
                        .padding(30)
                        .background(Color.white)
                        .clipShape(RoundedRectangle(cornerRadius: 20))
                        .shadow(color: .cyan.opacity(0.3), radius: 20)
                }
                .frame(width: 400, height: 400)
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
        }
    }

    // MARK: - Instruction Steps (vertical for side layout)

    private var instructionSteps: some View {
        VStack(alignment: .leading, spacing: 20) {
            stepRow(icon: "iphone", label: "Open KTV Singer app")
            stepRow(icon: "qrcode.viewfinder", label: "Scan this QR code")
            stepRow(icon: "mic.fill", label: "Start singing!")
        }
        .padding(30)
        .background(.ultraThinMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private func stepRow(icon: String, label: String) -> some View {
        HStack(spacing: 16) {
            Image(systemName: icon)
                .font(.system(size: 24))
                .foregroundColor(.cyan)
                .frame(width: 36)
            Text(label)
                .font(.body)
                .foregroundColor(.white)
                .lineLimit(1)
                .minimumScaleFactor(0.8)
        }
    }

    // MARK: - Connected Devices

    private var connectedDevicesSection: some View {
        Group {
            if !pairingService.connectedDevices.isEmpty {
                VStack(spacing: 12) {
                    Text("Connected Singers")
                        .font(.headline)
                        .foregroundColor(.white)

                    ForEach(pairingService.connectedDevices) { device in
                        HStack {
                            Image(systemName: "iphone")
                                .font(.body)
                            Text(device.name)
                                .font(.body)
                            Spacer()
                            Image(systemName: "checkmark.circle.fill")
                                .font(.body)
                                .foregroundColor(.green)
                        }
                        .foregroundColor(.white)
                        .padding(12)
                        .background(.ultraThinMaterial)
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                        .transition(.scale.combined(with: .opacity))
                    }
                }
                .animation(.spring(response: 0.4, dampingFraction: 0.8), value: pairingService.connectedDevices.count)
            }
        }
    }
}

// MARK: - Preview

#Preview {
    PairingView()
        .environmentObject(DevicePairingService())
}
