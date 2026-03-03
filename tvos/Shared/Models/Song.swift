//
//  Song.swift
//  KTVSinger-Shared
//
//  Core song model aligned with Express server schema (shared/schema/songs.ts)
//

import Foundation

/// Represents a karaoke song — matches server `songs` table
struct Song: Identifiable, Codable, Hashable, Sendable {
    let id: String
    let videoId: String
    let title: String
    let artist: String
    let thumbnailUrl: String?
    let genre: String
    let gender: String
    let year: Int
    let lyrics: [LyricLine]
    let playCount: Int
    let instrumentalUrl: String?
    let lyricsOffset: Double

    /// Thumbnail as URL for AsyncImage
    var thumbnailImageURL: URL? {
        guard let thumbnailUrl else { return nil }
        return URL(string: thumbnailUrl)
    }
}

/// A single timed lyric line — matches server `{ time: number, text: string }`
struct LyricLine: Identifiable, Codable, Hashable, Sendable {
    var id: String { "\(time)-\(text.prefix(10))" }
    let time: Double   // seconds
    let text: String

    /// Check if this line is active at the given playback time.
    /// A line is active from its timestamp until the next line starts.
    func isActive(at currentTime: Double, nextLineTime: Double?) -> Bool {
        guard let next = nextLineTime else {
            return currentTime >= time
        }
        return currentTime >= time && currentTime < next
    }
}

// MARK: - Preview Helpers

#if DEBUG
extension Song {
    static let preview = Song(
        id: "preview-1",
        videoId: "fJ9rUzIMcZQ",
        title: "Bohemian Rhapsody",
        artist: "Queen",
        thumbnailUrl: "https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg",
        genre: "Rock",
        gender: "male",
        year: 1975,
        lyrics: [
            LyricLine(time: 0.5, text: "Is this the real life?"),
            LyricLine(time: 3.0, text: "Is this just fantasy?"),
            LyricLine(time: 5.5, text: "Caught in a landslide"),
            LyricLine(time: 8.0, text: "No escape from reality"),
        ],
        playCount: 42,
        instrumentalUrl: nil,
        lyricsOffset: 0
    )

    static let previewList = [
        Song(
            id: "preview-1",
            videoId: "fJ9rUzIMcZQ",
            title: "Bohemian Rhapsody",
            artist: "Queen",
            thumbnailUrl: nil,
            genre: "Rock",
            gender: "male",
            year: 1975,
            lyrics: [],
            playCount: 100,
            instrumentalUrl: nil,
            lyricsOffset: 0
        ),
        Song(
            id: "preview-2",
            videoId: "1k8craCGpgs",
            title: "Don't Stop Believin'",
            artist: "Journey",
            thumbnailUrl: nil,
            genre: "Rock",
            gender: "male",
            year: 1981,
            lyrics: [],
            playCount: 80,
            instrumentalUrl: nil,
            lyricsOffset: 0
        ),
        Song(
            id: "preview-3",
            videoId: "1w7OgIMMRc4",
            title: "Sweet Child O' Mine",
            artist: "Guns N' Roses",
            thumbnailUrl: nil,
            genre: "Rock",
            gender: "male",
            year: 1987,
            lyrics: [],
            playCount: 65,
            instrumentalUrl: nil,
            lyricsOffset: 0
        ),
    ]
}
#endif
