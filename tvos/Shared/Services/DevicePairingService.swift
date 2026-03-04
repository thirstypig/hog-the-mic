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
        // Sync socket singers → connectedDevices
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
            .assign(to: &$error)
    }

    // MARK: - Session Lifecycle

    /// Create a pairing session on the Express server, generate QR code, connect socket.io
    func createSession() async {
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
                  let sid = json["sessionId"] as? String else {
                error = .connectionFailed
                isLoading = false
                return
            }

            sessionId = sid

            // Generate QR code: { serverURL, sessionId }
            let payload: [String: String] = [
                "serverURL": apiClient.baseURL,
                "sessionId": sid
            ]
            if let payloadData = try? JSONSerialization.data(withJSONObject: payload),
               let payloadString = String(data: payloadData, encoding: .utf8) {
                qrCodeImage = generateQRCodeImage(from: payloadString)
            } else {
                error = .qrGenerationFailed
            }

            // Connect socket.io as the TV
            socketService.connect(serverURL: apiClient.baseURL, sessionId: sid)

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
