//
//  SocketPairingService.swift
//  KTVSinger-tvOS
//
//  Socket.IO client for pairing with the Express server
//

import Foundation
import SocketIO

/// Low-level socket.io wrapper for the /pairing namespace
@MainActor
final class SocketPairingService: ObservableObject {

    // MARK: - Published state

    @Published var isConnected = false
    @Published var singers: [Singer] = []
    @Published var error: String?

    struct Singer: Identifiable, Hashable {
        let id: String   // socketId
        let deviceName: String
    }

    // MARK: - Private

    private var manager: SocketManager?
    private var socket: SocketIOClient?
    private(set) var currentSessionId: String?
    private var currentTvSecret: String?

    /// Handlers registered before socket exists — replayed on connect()
    private var pendingHandlers: [(event: String, callback: ([Any]) -> Void)] = []

    // MARK: - Public API

    /// Connect to the Express server and join a session as the TV
    func connect(serverURL: String, sessionId: String, tvSecret: String) {
        disconnect()

        guard let url = URL(string: serverURL) else {
            error = "Invalid server URL"
            return
        }

        currentSessionId = sessionId
        currentTvSecret = tvSecret

        manager = SocketManager(socketURL: url, config: [
            .forceWebsockets(true),
            .reconnects(true),
            .reconnectAttempts(-1),
            .reconnectWait(1),
            .log(false)
        ])

        socket = manager?.socket(forNamespace: "/pairing")
        guard let socket = socket else { return }

        // Replay any handlers that were registered before connect()
        for pending in pendingHandlers {
            let event = pending.event
            let callback = pending.callback
            socket.on(event) { data, _ in
                callback(data)
            }
        }
        pendingHandlers.removeAll()

        socket.on(clientEvent: .connect) { [weak self] _, _ in
            Task { @MainActor in
                guard let self = self else { return }
                self.isConnected = true
                self.error = nil

                // Join the session as TV (with secret for auth)
                socket.emit("join_session", [
                    "sessionId": sessionId,
                    "role": "tv",
                    "deviceName": "Apple TV",
                    "tvSecret": tvSecret
                ])
            }
        }

        socket.on(clientEvent: .reconnect) { [weak self] _, _ in
            Task { @MainActor in
                guard let self = self,
                      let sid = self.currentSessionId,
                      let secret = self.currentTvSecret else { return }
                // Re-join the session room after reconnect
                socket.emit("join_session", [
                    "sessionId": sid,
                    "role": "tv",
                    "deviceName": "Apple TV",
                    "tvSecret": secret
                ])
            }
        }

        socket.on(clientEvent: .disconnect) { [weak self] _, _ in
            Task { @MainActor in
                self?.isConnected = false
            }
        }

        socket.on(clientEvent: .error) { [weak self] data, _ in
            Task { @MainActor in
                self?.error = "Socket error: \(data)"
            }
        }

        socket.on("paired") { [weak self] _, _ in
            Task { @MainActor in
                self?.isConnected = true
            }
        }

        socket.on("singer_joined") { [weak self] data, _ in
            Task { @MainActor in
                guard let self = self,
                      let dict = data.first as? [String: Any],
                      let socketId = dict["socketId"] as? String,
                      let deviceName = dict["deviceName"] as? String else { return }
                if !self.singers.contains(where: { $0.id == socketId }) {
                    self.singers.append(Singer(id: socketId, deviceName: deviceName))
                }
            }
        }

        socket.on("singer_left") { [weak self] data, _ in
            Task { @MainActor in
                guard let self = self,
                      let dict = data.first as? [String: Any],
                      let socketId = dict["socketId"] as? String else { return }
                self.singers.removeAll { $0.id == socketId }
            }
        }

        socket.on("session_state") { [weak self] data, _ in
            Task { @MainActor in
                guard let self = self,
                      let dict = data.first as? [String: Any],
                      let singerArray = dict["singers"] as? [[String: Any]] else { return }
                self.singers = singerArray.compactMap { entry in
                    guard let socketId = entry["socketId"] as? String,
                          let deviceName = entry["deviceName"] as? String else { return nil }
                    return Singer(id: socketId, deviceName: deviceName)
                }
            }
        }

        socket.on("error") { [weak self] data, _ in
            Task { @MainActor in
                if let dict = data.first as? [String: Any],
                   let message = dict["message"] as? String {
                    self?.error = message
                }
            }
        }

        socket.connect()
    }

    /// Emit an event on the socket
    func emit(_ event: String, _ items: [Any]) {
        socket?.emit(event, items)
    }

    /// Emit an event with a single dictionary payload
    func emit(_ event: String, _ payload: [String: Any]) {
        socket?.emit(event, payload)
    }

    /// Register a handler for a custom event.
    /// If socket doesn't exist yet (before connect()), the handler is deferred and replayed on connect().
    func on(_ event: String, callback: @escaping ([Any]) -> Void) {
        if let socket = socket {
            socket.on(event) { data, _ in
                callback(data)
            }
        } else {
            pendingHandlers.append((event: event, callback: callback))
        }
    }

    /// Disconnect from the server
    func disconnect() {
        socket?.disconnect()
        socket = nil
        manager?.disconnect()
        manager = nil
        isConnected = false
        singers = []
        currentSessionId = nil
        currentTvSecret = nil
        error = nil
        pendingHandlers.removeAll()
    }
}
