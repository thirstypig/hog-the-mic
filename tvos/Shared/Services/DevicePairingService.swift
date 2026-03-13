//
//  DevicePairingService.swift
//  KTVSinger-Shared
//
//  App-level service for device pairing via Express server + socket.io.
//  Injected as @EnvironmentObject at the app level.
//

import Foundation
import SwiftUI
import CoreImage
import Combine

@MainActor
final class DevicePairingService: ObservableObject {

    // MARK: - Published Properties

    @Published var connectedDevices: [ConnectedDevice] = []
    @Published var sessionId: String?
    @Published var qrCodeImage: UIImage?
    @Published var isLoading = false
    @Published var isConnected = false
    @Published var error: PairingError?

    // MARK: - Child service

    let socketService = SocketPairingService()

    // MARK: - Private

    private let apiClient = APIClient.shared
    private var cancellables = Set<AnyCancellable>()

    init() {
        // Sync socket singers -> connectedDevices
        socketService.$singers
            .map { singers in
                singers.map { singer in
                    ConnectedDevice(
                        id: UUID(uuidString: singer.id) ?? UUID(),
                        name: singer.deviceName,
                        socketId: singer.id
                    )
                }
            }
            .assign(to: &$connectedDevices)

        socketService.$isConnected
            .assign(to: &$isConnected)

        socketService.$error
            .compactMap { msg in msg.map { PairingError.networkError($0) } }
            .sink { [weak self] pairingError in
                guard let self = self else { return }
                self.error = pairingError
                // Auto-recreate session if "Session not found"
                if case .networkError(let message) = pairingError,
                   message.lowercased().contains("session not found") {
                    Task { await self.createSession() }
                }
            }
            .store(in: &cancellables)
    }

    // MARK: - Session Lifecycle

    /// Create a pairing session on the Express server, generate QR code, connect socket.io
    func createSession() async {
        guard !isLoading else { return }

        isLoading = true
        error = nil
        qrCodeImage = nil
        sessionId = nil

        do {
            guard let url = URL(string: "\(apiClient.baseURL)/api/pairing/sessions") else {
                error = .invalidServerURL
                isLoading = false
                return
            }

            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")

            let (data, response) = try await URLSession.shared.data(for: request)

            guard let httpResp = response as? HTTPURLResponse,
                  (200...299).contains(httpResp.statusCode) else {
                error = .connectionFailed
                isLoading = false
                return
            }

            guard let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let sid = json["sessionId"] as? String,
                  let secret = json["tvSecret"] as? String else {
                error = .connectionFailed
                isLoading = false
                return
            }

            sessionId = sid

            // Generate QR code: { serverURL, sessionId }
            // Note: tvSecret is NOT included in QR code — singers don't need it
            // Replace localhost with LAN IP so physical phones can connect
            let serverURL = Self.resolveServerURL(apiClient.baseURL)
            let payload: [String: String] = [
                "serverURL": serverURL,
                "sessionId": sid
            ]
            if let payloadData = try? JSONSerialization.data(withJSONObject: payload),
               let payloadString = String(data: payloadData, encoding: .utf8) {
                qrCodeImage = generateQRCodeImage(from: payloadString)
            } else {
                error = .qrGenerationFailed
            }

            // Connect socket.io as the TV (with secret for TV role auth)
            socketService.connect(serverURL: apiClient.baseURL, sessionId: sid, tvSecret: secret)

            isLoading = false
        } catch {
            self.error = .networkError(error.localizedDescription)
            isLoading = false
        }
    }

    /// End the current session and disconnect
    func endSession() {
        socketService.disconnect()
        sessionId = nil
        qrCodeImage = nil
        connectedDevices = []
    }

    /// Disconnect a specific device (local removal; server handles socket cleanup)
    func disconnectDevice(_ device: ConnectedDevice) {
        connectedDevices.removeAll { $0.id == device.id }
    }

    // MARK: - Network Helpers

    /// Replace localhost with the device's LAN IP so phones on the same network can connect.
    private static func resolveServerURL(_ url: String) -> String {
        guard url.contains("localhost") || url.contains("127.0.0.1") else { return url }
        guard let lanIP = Self.getWiFiAddress() else { return url }
        return url
            .replacingOccurrences(of: "localhost", with: lanIP)
            .replacingOccurrences(of: "127.0.0.1", with: lanIP)
    }

    /// Get the device's WiFi/LAN IP address
    private static func getWiFiAddress() -> String? {
        var address: String?
        var ifaddr: UnsafeMutablePointer<ifaddrs>?
        guard getifaddrs(&ifaddr) == 0, let firstAddr = ifaddr else { return nil }
        defer { freeifaddrs(ifaddr) }

        for ptr in sequence(first: firstAddr, next: { $0.pointee.ifa_next }) {
            let interface = ptr.pointee
            let addrFamily = interface.ifa_addr.pointee.sa_family
            guard addrFamily == UInt8(AF_INET) else { continue }

            let name = String(cString: interface.ifa_name)
            // en0 = WiFi on real devices; en0/en1 on simulator (bridged network)
            guard name == "en0" || name == "en1" else { continue }

            var hostname = [CChar](repeating: 0, count: Int(NI_MAXHOST))
            getnameinfo(
                interface.ifa_addr, socklen_t(interface.ifa_addr.pointee.sa_len),
                &hostname, socklen_t(hostname.count),
                nil, 0, NI_NUMERICHOST
            )
            address = String(cString: hostname)
            if name == "en0" { break } // prefer en0
        }
        return address
    }

    // MARK: - QR Code Generation

    private func generateQRCodeImage(from string: String) -> UIImage? {
        let data = string.data(using: .utf8)

        guard let filter = CIFilter(name: "CIQRCodeGenerator") else { return nil }
        filter.setValue(data, forKey: "inputMessage")
        filter.setValue("H", forKey: "inputCorrectionLevel")

        guard let ciImage = filter.outputImage else { return nil }

        let transform = CGAffineTransform(scaleX: 10, y: 10)
        let scaledImage = ciImage.transformed(by: transform)

        let context = CIContext()
        guard let cgImage = context.createCGImage(scaledImage, from: scaledImage.extent) else {
            return nil
        }

        return UIImage(cgImage: cgImage)
    }
}

// MARK: - Supporting Types

enum PairingError: LocalizedError {
    case invalidQRCode
    case invalidServerURL
    case networkError(String)
    case qrGenerationFailed
    case connectionFailed

    var errorDescription: String? {
        switch self {
        case .invalidQRCode:
            return "Invalid QR code format"
        case .invalidServerURL:
            return "Invalid server URL"
        case .networkError(let message):
            return "Network error: \(message)"
        case .qrGenerationFailed:
            return "Failed to generate QR code"
        case .connectionFailed:
            return "Failed to connect to device"
        }
    }
}
