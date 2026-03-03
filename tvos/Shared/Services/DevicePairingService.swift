//
//  DevicePairingService.swift
//  KTVSinger-Shared
//
//  Service for pairing iOS devices with tvOS app
//

import Foundation
import CoreImage
import SwiftUI
import UIKit
import Network

/// Service that manages device pairing and connections
@MainActor
final class DevicePairingService: ObservableObject {
    
    // MARK: - Published Properties
    
    @Published var connectedDevices: [ConnectedDevice] = []
    @Published var sessionId: String?
    @Published var qrCodeImage: UIImage?
    @Published var isListening = false
    @Published var error: PairingError?
    
    // MARK: - Private Properties
    
    private var listener: NWListener?
    private var webSocketServer: WebSocketServer?
    private let port: NWEndpoint.Port = 8765
    
    // MARK: - Initialization
    
    init() {
        setupNotifications()
    }
    
    // Note: stopListening() should be called explicitly before deallocation.
    // deinit can't call MainActor-isolated methods.
    
    // MARK: - Public Methods (tvOS)
    
    /// Start listening for device connections (tvOS only)
    func startListening() async throws {
        guard !isListening else { return }
        
        // Generate session ID
        sessionId = UUID().uuidString
        
        // Start WebSocket server
        webSocketServer = WebSocketServer(port: port)
        try await webSocketServer?.start()
        
        // Start network listener for Bonjour
        try startBonjourAdvertising()
        
        // Generate QR code
        await generateQRCode()
        
        isListening = true
    }
    
    /// Stop listening for connections
    func stopListening() {
        listener?.cancel()
        listener = nil
        if let server = webSocketServer {
            Task { await server.stop() }
        }
        webSocketServer = nil
        isListening = false
        sessionId = nil
        qrCodeImage = nil
    }

    /// Disconnect a specific device
    func disconnectDevice(_ device: ConnectedDevice) {
        connectedDevices.removeAll { $0.id == device.id }
        if let server = webSocketServer {
            Task { await server.disconnectClient(deviceId: device.id) }
        }
    }
    
    // MARK: - Public Methods (iOS)
    
    /// Connect to tvOS device via QR code (iOS only)
    func connectViaQRCode(_ qrString: String) async throws {
        guard let payload = PairingPayload.from(qrString: qrString) else {
            throw PairingError.invalidQRCode
        }
        
        // Connect via WebSocket
        try await connectToServer(payload: payload)
    }
    
    /// Discover tvOS devices on local network (iOS only)
    func discoverDevices() async throws -> [DiscoveredDevice] {
        // Use Bonjour to discover devices
        return try await withCheckedThrowingContinuation { continuation in
            let browser = NWBrowser(for: .bonjourWithTXTRecord(type: NetworkServiceInfo.serviceType, domain: NetworkServiceInfo.serviceDomain), using: .tcp)
            
            var devices: [DiscoveredDevice] = []
            var resumed = false
            
            browser.stateUpdateHandler = { state in
                switch state {
                case .ready:
                    if !resumed {
                        resumed = true
                        continuation.resume(returning: devices)
                    }
                case .failed(let error):
                    if !resumed {
                        resumed = true
                        continuation.resume(throwing: error)
                    }
                default:
                    break
                }
            }
            
            browser.browseResultsChangedHandler = { results, changes in
                devices = results.map { result in
                    DiscoveredDevice(
                        name: result.endpoint.debugDescription,
                        endpoint: result.endpoint
                    )
                }
            }
            
            browser.start(queue: .main)
            
            // Timeout after 5 seconds
            Task {
                try? await Task.sleep(nanoseconds: 5_000_000_000)
                if !resumed {
                    resumed = true
                    browser.cancel()
                    continuation.resume(returning: devices)
                }
            }
        }
    }
    
    /// Send audio data to connected tvOS device (iOS only)
    func sendAudioData(_ data: Data) async throws {
        guard let server = webSocketServer else { return }
        await server.broadcast(message: .audioData(data))
    }
    
    // MARK: - Private Methods
    
    private func startBonjourAdvertising() throws {
        let parameters = NWParameters.tcp
        parameters.includePeerToPeer = true
        
        // Advertise via Bonjour
        let serviceName = UIDevice.current.name
        let service = NWListener.Service(
            name: serviceName,
            type: NetworkServiceInfo.serviceType
        )
        
        listener = try NWListener(using: parameters)
        listener?.service = service
        
        listener?.stateUpdateHandler = { [weak self] state in
            Task { @MainActor in
                switch state {
                case .ready:
                    print("Bonjour service advertising")
                case .failed(let error):
                    self?.error = .networkError(error.localizedDescription)
                default:
                    break
                }
            }
        }
        
        listener?.start(queue: .main)
    }
    
    private func generateQRCode() async {
        guard let sessionId = sessionId else { return }
        
        // Get local IP address
        let localIP = getLocalIPAddress() ?? "unknown"
        
        let payload = PairingPayload(
            sessionId: sessionId,
            serverURL: localIP,
            port: Int(port.rawValue) ?? 8765,
            deviceName: UIDevice.current.name,
            timestamp: Date()
        )
        
        guard let qrString = payload.toQRString() else {
            error = .qrGenerationFailed
            return
        }
        
        qrCodeImage = generateQRCodeImage(from: qrString)
    }
    
    private func generateQRCodeImage(from string: String) -> UIImage? {
        let data = string.data(using: .utf8)
        
        guard let filter = CIFilter(name: "CIQRCodeGenerator") else { return nil }
        filter.setValue(data, forKey: "inputMessage")
        filter.setValue("H", forKey: "inputCorrectionLevel")
        
        guard let ciImage = filter.outputImage else { return nil }
        
        // Scale up the image
        let transform = CGAffineTransform(scaleX: 10, y: 10)
        let scaledImage = ciImage.transformed(by: transform)
        
        let context = CIContext()
        guard let cgImage = context.createCGImage(scaledImage, from: scaledImage.extent) else {
            return nil
        }
        
        return UIImage(cgImage: cgImage)
    }
    
    private func getLocalIPAddress() -> String? {
        var address: String?
        var ifaddr: UnsafeMutablePointer<ifaddrs>?
        
        guard getifaddrs(&ifaddr) == 0 else { return nil }
        defer { freeifaddrs(ifaddr) }
        
        var ptr = ifaddr
        while ptr != nil {
            defer { ptr = ptr?.pointee.ifa_next }
            
            guard let interface = ptr?.pointee else { continue }
            let addrFamily = interface.ifa_addr.pointee.sa_family
            
            if addrFamily == UInt8(AF_INET) || addrFamily == UInt8(AF_INET6) {
                let name = String(cString: interface.ifa_name)
                if name == "en0" || name == "en1" { // WiFi interface
                    var hostname = [CChar](repeating: 0, count: Int(NI_MAXHOST))
                    getnameinfo(interface.ifa_addr, socklen_t(interface.ifa_addr.pointee.sa_len),
                               &hostname, socklen_t(hostname.count),
                               nil, socklen_t(0), NI_NUMERICHOST)
                    address = String(cString: hostname)
                    
                    // Prefer IPv4
                    if addrFamily == UInt8(AF_INET) {
                        return address
                    }
                }
            }
        }
        
        return address
    }
    
    private func connectToServer(payload: PairingPayload) async throws {
        // Connect to WebSocket server on tvOS device
        guard let url = URL(string: "ws://\(payload.serverURL):\(payload.port)") else {
            throw PairingError.invalidServerURL
        }
        
        // Implement WebSocket client connection
        // This would use URLSessionWebSocketTask or a WebSocket library
        // For now, this is a placeholder
        throw PairingError.notImplemented
    }
    
    private func setupNotifications() {
        NotificationCenter.default.addObserver(
            forName: UIApplication.willResignActiveNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            // Optionally pause listening when app goes to background
        }
    }
}

// MARK: - Supporting Types

struct DiscoveredDevice: Identifiable {
    let id = UUID()
    let name: String
    let endpoint: NWEndpoint
}

enum PairingError: LocalizedError {
    case invalidQRCode
    case invalidServerURL
    case networkError(String)
    case qrGenerationFailed
    case connectionFailed
    case notImplemented
    
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
        case .notImplemented:
            return "Feature not yet implemented"
        }
    }
}

// MARK: - WebSocket Server (Simplified)

private actor WebSocketServer {
    let port: NWEndpoint.Port
    private var connections: [UUID: NWConnection] = [:]
    
    init(port: NWEndpoint.Port) {
        self.port = port
    }
    
    func start() async throws {
        // Implement WebSocket server
        // This is a placeholder - you'd use a proper WebSocket library
    }
    
    func stop() {
        // Clean up connections
        connections.values.forEach { $0.cancel() }
        connections.removeAll()
    }
    
    func broadcast(message: DeviceMessage) {
        // Send message to all connected clients
    }
    
    func disconnectClient(deviceId: UUID) {
        connections[deviceId]?.cancel()
        connections.removeValue(forKey: deviceId)
    }
}
