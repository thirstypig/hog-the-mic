//
//  DeviceConnection.swift
//  KTVSinger-Shared
//
//  Models for multi-device connectivity (tvOS ↔ iOS via Express server)
//

import Foundation

/// Represents a connected singer device
struct ConnectedDevice: Identifiable, Hashable, Sendable {
    let id: UUID
    let name: String
    let socketId: String
}

/// QR code payload for device pairing (simplified — server-centric)
struct PairingPayload: Codable, Sendable {
    let serverURL: String
    let sessionId: String
}
