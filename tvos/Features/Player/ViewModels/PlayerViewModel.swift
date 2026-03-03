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
    
    // MARK: - Services
    
    let playerService: YouTubePlayerService
    let lyricsService: LyricsSyncService
    
    // MARK: - Private Properties
    
    private var cancellables = Set<AnyCancellable>()
    
    // MARK: - Initialization
    
    init(song: Song) {
        self.song = song
        self.playerService = YouTubePlayerService()
        self.lyricsService = LyricsSyncService()
        
        setupBindings()
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
    
    private func loadSong() {
        // Load lyrics with per-song offset from server
        lyricsService.loadLyrics(song.lyrics)
        lyricsService.setOffset(song.lyricsOffset)

        // Load video
        Task {
            await playerService.loadVideo(videoId: song.videoId)
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
        playerService.stop()
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
