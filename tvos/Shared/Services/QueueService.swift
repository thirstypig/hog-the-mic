//
//  QueueService.swift
//  KTVSinger-Shared
//
//  Manages the shared song queue, synced via Socket.IO
//

import Foundation
import Combine

@MainActor
final class QueueService: ObservableObject {

    // MARK: - Published State

    @Published var currentlyPlaying: QueueEntry?
    @Published var upcoming: [QueueEntry] = []

    // MARK: - Private

    private weak var socketService: SocketPairingService?
    private let decoder = JSONDecoder()

    init() {
        decoder.keyDecodingStrategy = .convertFromSnakeCase
    }

    // MARK: - Setup

    /// Wire up socket event listeners. Call after socket connects.
    func attach(to socketService: SocketPairingService) {
        self.socketService = socketService

        socketService.on("queue_updated") { [weak self] data in
            Task { @MainActor in
                self?.handleQueueUpdated(data: data)
            }
        }

        socketService.on("play_song") { [weak self] data in
            Task { @MainActor in
                self?.handlePlaySong(data: data)
            }
        }
    }

    // MARK: - Queue Actions

    func addToQueue(song: Song) {
        socketService?.emit("add_to_queue", [
            "songId": song.id,
            "videoId": song.videoId,
            "title": song.title,
            "artist": song.artist,
            "thumbnailUrl": song.thumbnailUrl ?? "",
        ])
    }

    func addToQueue(entry: QueueEntry) {
        socketService?.emit("add_to_queue", [
            "songId": entry.songId,
            "videoId": entry.videoId,
            "title": entry.title,
            "artist": entry.artist,
            "thumbnailUrl": entry.thumbnailUrl ?? "",
        ])
    }

    func removeFromQueue(queueId: String) {
        socketService?.emit("remove_from_queue", [
            "queueId": queueId,
        ])
    }

    func skipSong() {
        socketService?.emit("skip_song", [:])
    }

    func songFinished() {
        socketService?.emit("song_finished", [:])
    }

    // MARK: - Socket Event Handlers

    private func handleQueueUpdated(data: [Any]) {
        guard let dict = data.first as? [String: Any] else { return }

        // Parse currentlyPlaying
        if let cpDict = dict["currentlyPlaying"] as? [String: Any] {
            currentlyPlaying = parseQueueEntry(cpDict)
        } else {
            currentlyPlaying = nil
        }

        // Parse upcoming
        if let upcomingArray = dict["upcoming"] as? [[String: Any]] {
            upcoming = upcomingArray.compactMap { parseQueueEntry($0) }
        } else {
            upcoming = []
        }
    }

    private func handlePlaySong(data: [Any]) {
        guard let dict = data.first as? [String: Any],
              let entryDict = dict["entry"] as? [String: Any] else { return }
        currentlyPlaying = parseQueueEntry(entryDict)
    }

    private func parseQueueEntry(_ dict: [String: Any]) -> QueueEntry? {
        guard let queueId = dict["queueId"] as? String,
              let songId = dict["songId"] as? String,
              let videoId = dict["videoId"] as? String,
              let title = dict["title"] as? String,
              let artist = dict["artist"] as? String else { return nil }

        let thumbnailUrl = dict["thumbnailUrl"] as? String
        let addedBy = dict["addedBy"] as? String ?? "Unknown"
        let addedAt = dict["addedAt"] as? Double ?? Date().timeIntervalSince1970 * 1000

        return QueueEntry(
            queueId: queueId,
            songId: songId,
            videoId: videoId,
            title: title,
            artist: artist,
            thumbnailUrl: thumbnailUrl,
            addedBy: addedBy,
            addedAt: addedAt
        )
    }
}
