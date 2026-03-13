//
//  PlayerViewModel.swift
//  KTVSinger-tvOS
//
//  ViewModel for the player screen
//

import Foundation
import Combine
import AVFoundation

@MainActor
final class PlayerViewModel: ObservableObject {

    // MARK: - Published Properties

    @Published var song: Song
    @Published var isPlaying = false
    @Published var currentTime: TimeInterval = 0
    @Published var duration: TimeInterval = 0
    @Published var error: Error?
    @Published var isInstrumentalActive = false

    // MARK: - Services

    let playerService: YouTubePlayerService
    let lyricsService: LyricsSyncService
    private weak var queueService: QueueService?
    private var instrumentalPlayer: AVPlayer?

    // MARK: - Private Properties

    private var cancellables = Set<AnyCancellable>()

    // MARK: - Initialization

    /// Standard init for standalone playback (e.g., from song browser)
    init(song: Song) {
        self.song = song
        self.playerService = YouTubePlayerService()
        self.lyricsService = LyricsSyncService()

        setupBindings()
        loadSong()
    }

    /// Init for queue-driven playback
    init(song: Song, queueService: QueueService) {
        self.song = song
        self.queueService = queueService
        self.playerService = YouTubePlayerService()
        self.lyricsService = LyricsSyncService()

        setupBindings()
        setupQueueBindings()
        loadSong()
    }

    // MARK: - Private Setup

    private func setupBindings() {
        // Sync player time with lyrics service
        playerService.$currentTime
            .sink { [weak self] time in
                self?.currentTime = time
                self?.lyricsService.updateTime(time)
            }
            .store(in: &cancellables)

        // Sync playing state
        playerService.$isPlaying
            .sink { [weak self] isPlaying in
                self?.isPlaying = isPlaying
            }
            .store(in: &cancellables)

        // Sync duration
        playerService.$duration
            .sink { [weak self] duration in
                self?.duration = duration
            }
            .store(in: &cancellables)

        // Sync errors
        playerService.$error
            .sink { [weak self] error in
                self?.error = error
            }
            .store(in: &cancellables)
    }

    private func setupQueueBindings() {
        // When song finishes, notify queue service
        playerService.$didFinishPlaying
            .filter { $0 }
            .sink { [weak self] _ in
                self?.queueService?.songFinished()
            }
            .store(in: &cancellables)

        // When queue advances, load new song
        queueService?.$currentlyPlaying
            .dropFirst() // Skip initial value
            .compactMap { $0 }
            .sink { [weak self] entry in
                self?.loadFromQueueEntry(entry)
            }
            .store(in: &cancellables)

        // Handle audio source switching (instrumental toggle)
        queueService?.$useInstrumental
            .dropFirst()
            .sink { [weak self] useInstrumental in
                guard let self else { return }
                if useInstrumental, let url = self.queueService?.instrumentalUrl {
                    self.switchToInstrumental(url: url)
                } else {
                    self.switchToOriginal()
                }
            }
            .store(in: &cancellables)
    }

    private func loadSong() {
        // Load lyrics with per-song offset from server
        lyricsService.loadLyrics(song.lyrics)
        lyricsService.setOffset(song.lyricsOffset)

        // Load video
        Task {
            await playerService.loadVideo(videoId: song.videoId)
        }
    }

    /// Load a new song from a queue entry (fetches full Song from API)
    private func loadFromQueueEntry(_ entry: QueueEntry) {
        switchToOriginal()
        playerService.stop()

        Task {
            do {
                let fullSong = try await APIClient.shared.fetchSong(id: entry.songId)
                self.song = fullSong
                lyricsService.loadLyrics(fullSong.lyrics)
                lyricsService.setOffset(fullSong.lyricsOffset)
                await playerService.loadVideo(videoId: fullSong.videoId)
            } catch {
                // Fallback: play with just videoId and no lyrics
                self.song = Song(
                    id: entry.songId,
                    videoId: entry.videoId,
                    title: entry.title,
                    artist: entry.artist,
                    thumbnailUrl: entry.thumbnailUrl,
                    genre: "Unknown",
                    gender: "unknown",
                    year: 0,
                    lyrics: [],
                    playCount: 0,
                    instrumentalUrl: nil,
                    lyricsOffset: 0
                )
                lyricsService.loadLyrics([])
                await playerService.loadVideo(videoId: entry.videoId)
            }
        }
    }

    // MARK: - Public Methods

    func play() {
        playerService.play()
    }

    func pause() {
        playerService.pause()
    }

    func togglePlayPause() {
        playerService.togglePlayPause()
    }

    func seekForward() {
        playerService.seekForward(by: 10)
    }

    func seekBackward() {
        playerService.seekBackward(by: 10)
    }

    func adjustLyricsOffset(by delta: TimeInterval) {
        lyricsService.adjustOffset(by: delta)
    }

    func resetLyricsOffset() {
        lyricsService.resetOffset()
    }

    func seek(to time: TimeInterval) {
        playerService.seek(to: time)
    }

    func stop() {
        switchToOriginal()
        playerService.stop()
    }

    func skipSong() {
        queueService?.skipSong()
    }

    // MARK: - Instrumental Audio

    private func switchToInstrumental(url: String) {
        guard let audioURL = URL(string: url) else { return }
        // Mute video player, play instrumental track
        playerService.player?.isMuted = true
        let player = AVPlayer(url: audioURL)
        // Sync instrumental to current playback position
        let cmTime = CMTime(seconds: currentTime, preferredTimescale: 600)
        player.seek(to: cmTime, toleranceBefore: .zero, toleranceAfter: .zero)
        player.play()
        instrumentalPlayer = player
        isInstrumentalActive = true
    }

    private func switchToOriginal() {
        // Unmute video, stop instrumental
        playerService.player?.isMuted = false
        instrumentalPlayer?.pause()
        instrumentalPlayer = nil
        isInstrumentalActive = false
    }

    /// Attach queue service after init (for QueuePlayerView where environmentObject isn't available at init)
    func attachQueueService(_ service: QueueService) {
        self.queueService = service
        setupQueueBindings()
    }

    /// Fetch the full Song from the API and reload lyrics/video
    func loadSongFromAPI() async {
        do {
            let fullSong = try await APIClient.shared.fetchSong(id: song.id)
            self.song = fullSong
            lyricsService.loadLyrics(fullSong.lyrics)
            lyricsService.setOffset(fullSong.lyricsOffset)
            await playerService.loadVideo(videoId: fullSong.videoId)
        } catch {
            // Fallback: play with just videoId
            await playerService.loadVideo(videoId: song.videoId)
        }
    }

    // MARK: - Computed Properties

    var formattedCurrentTime: String {
        formatTime(currentTime)
    }

    var formattedDuration: String {
        formatTime(duration)
    }

    var progress: Double {
        guard duration > 0 else { return 0 }
        return currentTime / duration
    }

    // MARK: - Helpers

    private func formatTime(_ time: TimeInterval) -> String {
        let minutes = Int(time) / 60
        let seconds = Int(time) % 60
        return String(format: "%d:%02d", minutes, seconds)
    }
}

// MARK: - Preview Helpers

#if DEBUG
extension PlayerViewModel {
    static let preview = PlayerViewModel(song: .preview)
}
#endif
