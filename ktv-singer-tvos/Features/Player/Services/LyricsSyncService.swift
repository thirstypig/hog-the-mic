//
//  LyricsSyncService.swift
//  KTVSinger-Shared
//
//  Service for synchronizing lyrics with video playback
//  Ported from React Native useLyricsSync hook
//

import Foundation
import Combine

/// Service that manages lyrics synchronization with video playback
@MainActor
final class LyricsSyncService: ObservableObject {

    // MARK: - Published Properties

    @Published var currentTime: TimeInterval = 0
    @Published var lyricsOffset: TimeInterval = 0
    @Published var activeLine: LyricLine?
    @Published var activeLineIndex: Int?

    // MARK: - Private Properties

    private var lyrics: [LyricLine] = []
    private var estimatedWords: [EstimatedWord] = []
    private var cancellables = Set<AnyCancellable>()

    // MARK: - Persistence

    private let offsetKey = "lyrics_offset"

    init() {
        lyricsOffset = UserDefaults.standard.double(forKey: offsetKey)

        $lyricsOffset
            .dropFirst()
            .sink { [weak self] offset in
                guard let self else { return }
                UserDefaults.standard.set(offset, forKey: self.offsetKey)
            }
            .store(in: &cancellables)

        Publishers.CombineLatest($currentTime, $lyricsOffset)
            .sink { [weak self] time, offset in
                self?.updateActiveLyrics(at: time + offset)
            }
            .store(in: &cancellables)
    }

    // MARK: - Public Methods

    /// Load lyrics for synchronization
    func loadLyrics(_ lyrics: [LyricLine]) {
        self.lyrics = lyrics
        self.estimatedWords = estimateWordTiming(from: lyrics)
        updateActiveLyrics(at: currentTime + lyricsOffset)
    }

    /// Update current playback time
    func updateTime(_ time: TimeInterval) {
        self.currentTime = time
    }

    /// Adjust lyrics offset
    func adjustOffset(by delta: TimeInterval) {
        lyricsOffset += delta
    }

    /// Reset offset to zero
    func resetOffset() {
        lyricsOffset = 0
    }

    /// Set offset to specific value
    func setOffset(_ offset: TimeInterval) {
        lyricsOffset = offset
    }

    // MARK: - Private Methods

    private func updateActiveLyrics(at adjustedTime: TimeInterval) {
        // Find the last line whose timestamp is <= adjustedTime
        var foundIndex: Int?
        for (index, line) in lyrics.enumerated() {
            if line.time <= adjustedTime {
                foundIndex = index
            } else {
                break
            }
        }

        activeLineIndex = foundIndex
        activeLine = foundIndex.map { lyrics[$0] }
    }

    // MARK: - Word Timing Estimation

    /// Estimates word-level timing from line-level lyrics
    private func estimateWordTiming(from lyrics: [LyricLine]) -> [EstimatedWord] {
        var words: [EstimatedWord] = []

        for (lineIndex, line) in lyrics.enumerated() {
            let startTime = line.time

            let endTime: TimeInterval
            if lineIndex < lyrics.count - 1 {
                endTime = lyrics[lineIndex + 1].time
            } else {
                endTime = startTime + 5.0
            }

            let duration = endTime - startTime
            let lineWords = line.text.split(separator: " ").map { String($0) }

            guard !lineWords.isEmpty else { continue }

            let wordDuration = duration / TimeInterval(lineWords.count)

            for (wordIndex, word) in lineWords.enumerated() {
                let wordStart = startTime + (wordDuration * TimeInterval(wordIndex))
                let wordEnd = wordStart + wordDuration

                words.append(EstimatedWord(
                    text: word,
                    startTime: wordStart,
                    endTime: wordEnd,
                    lineIndex: lineIndex
                ))
            }
        }

        return words
    }
}

// MARK: - Supporting Types

private struct EstimatedWord {
    let text: String
    let startTime: TimeInterval
    let endTime: TimeInterval
    let lineIndex: Int
}

// MARK: - Preview Helpers

#if DEBUG
extension LyricsSyncService {
    static let preview: LyricsSyncService = {
        let service = LyricsSyncService()
        service.loadLyrics([
            LyricLine(time: 0.5, text: "Is this the real life?"),
            LyricLine(time: 3.0, text: "Is this just fantasy?"),
            LyricLine(time: 5.5, text: "Caught in a landslide"),
            LyricLine(time: 8.0, text: "No escape from reality"),
        ])
        service.updateTime(3.5)
        return service
    }()
}
#endif
