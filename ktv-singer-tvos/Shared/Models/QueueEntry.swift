//
//  QueueEntry.swift
//  KTVSinger-Shared
//
//  Model for a song in the shared queue
//

import Foundation

struct QueueEntry: Identifiable, Codable, Hashable, Sendable {
    let queueId: String
    let songId: String
    let videoId: String
    let title: String
    let artist: String
    let thumbnailUrl: String?
    let addedBy: String
    let addedAt: Double

    var id: String { queueId }

    var thumbnailImageURL: URL? {
        guard let thumbnailUrl else { return nil }
        return URL(string: thumbnailUrl)
    }
}
