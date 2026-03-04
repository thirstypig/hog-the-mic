//
//  YouTubePlayerService.swift
//  KTVSinger-tvOS
//
//  Service for playing YouTube videos using AVPlayer.
//  Uses the Express server's /api/youtube/stream endpoint
//  to extract playable stream URLs.
//

import Foundation
import AVFoundation
import Combine

/// Service that manages YouTube video playback
@MainActor
final class YouTubePlayerService: ObservableObject {

    // MARK: - Published Properties

    @Published var player: AVPlayer?
    @Published var currentTime: TimeInterval = 0
    @Published var duration: TimeInterval = 0
    @Published var isPlaying = false
    @Published var isLoading = false
    @Published var error: PlayerError?
    @Published var rate: Float = 1.0
    @Published var didFinishPlaying = false

    // MARK: - Private Properties

    private var timeObserver: Any?
    private var cancellables = Set<AnyCancellable>()
    private var statusObservation: NSKeyValueObservation?
    private var currentVideoId: String?
    private var endOfPlayObserver: NSObjectProtocol?

    // MARK: - Public Methods

    /// Load and play a YouTube video
    func loadVideo(videoId: String) async {
        currentVideoId = videoId
        isLoading = true
        error = nil

        do {
            let streamInfo = try await APIClient.shared.getStreamURL(videoId: videoId)

            guard let streamURL = URL(string: streamInfo.url) else {
                throw PlayerError.urlExtractionFailed("Invalid stream URL returned")
            }

            let playerItem = AVPlayerItem(url: streamURL)
            let newPlayer = AVPlayer(playerItem: playerItem)

            statusObservation = playerItem.observe(\.status) { [weak self] item, _ in
                Task { @MainActor in
                    switch item.status {
                    case .readyToPlay:
                        self?.isLoading = false
                        self?.duration = item.duration.seconds
                        self?.play()
                    case .failed:
                        self?.error = .playbackFailed(item.error?.localizedDescription ?? "Unknown error")
                        self?.isLoading = false
                    default:
                        break
                    }
                }
            }

            self.player = newPlayer
            self.didFinishPlaying = false
            setupTimeObserver()
            setupEndOfPlayObserver(for: playerItem)

        } catch let playerError as PlayerError {
            self.error = playerError
            self.isLoading = false
        } catch {
            self.error = .urlExtractionFailed(error.localizedDescription)
            self.isLoading = false
        }
    }

    /// Play the video
    func play() {
        player?.play()
        isPlaying = true
    }

    /// Pause the video
    func pause() {
        player?.pause()
        isPlaying = false
    }

    /// Toggle play/pause
    func togglePlayPause() {
        if isPlaying {
            pause()
        } else {
            play()
        }
    }

    /// Seek to specific time
    func seek(to time: TimeInterval) {
        let cmTime = CMTime(seconds: time, preferredTimescale: 600)
        player?.seek(to: cmTime, toleranceBefore: .zero, toleranceAfter: .zero)
    }

    /// Seek forward by seconds
    func seekForward(by seconds: TimeInterval = 10) {
        seek(to: currentTime + seconds)
    }

    /// Seek backward by seconds
    func seekBackward(by seconds: TimeInterval = 10) {
        seek(to: max(0, currentTime - seconds))
    }

    /// Set playback rate
    func setRate(_ rate: Float) {
        self.rate = rate
        player?.rate = rate
    }

    /// Stop and cleanup
    func stop() {
        cleanup()
        currentVideoId = nil
    }

    // MARK: - Private Methods

    private func setupTimeObserver() {
        if let observer = timeObserver {
            player?.removeTimeObserver(observer)
        }

        let interval = CMTime(seconds: 0.1, preferredTimescale: 600)
        timeObserver = player?.addPeriodicTimeObserver(forInterval: interval, queue: .main) { [weak self] time in
            self?.currentTime = time.seconds
        }
    }

    private func setupEndOfPlayObserver(for item: AVPlayerItem) {
        // Remove previous observer if any
        if let obs = endOfPlayObserver {
            NotificationCenter.default.removeObserver(obs)
        }

        endOfPlayObserver = NotificationCenter.default.addObserver(
            forName: .AVPlayerItemDidPlayToEndTime,
            object: item,
            queue: .main
        ) { [weak self] _ in
            Task { @MainActor in
                self?.isPlaying = false
                self?.didFinishPlaying = true
            }
        }
    }

    private func cleanup() {
        if let observer = timeObserver {
            player?.removeTimeObserver(observer)
            timeObserver = nil
        }
        if let obs = endOfPlayObserver {
            NotificationCenter.default.removeObserver(obs)
            endOfPlayObserver = nil
        }
        statusObservation?.invalidate()
        statusObservation = nil
        player?.pause()
        player = nil
        isPlaying = false
    }
}

// MARK: - Errors

enum PlayerError: LocalizedError {
    case urlExtractionFailed(String)
    case playbackFailed(String)
    case networkError

    var errorDescription: String? {
        switch self {
        case .urlExtractionFailed(let message):
            return "Failed to extract video URL: \(message)"
        case .playbackFailed(let message):
            return "Playback failed: \(message)"
        case .networkError:
            return "Network error occurred"
        }
    }
}

// MARK: - Preview Helpers

#if DEBUG
extension YouTubePlayerService {
    static let preview: YouTubePlayerService = {
        let service = YouTubePlayerService()
        service.duration = 354.0
        service.currentTime = 45.0
        service.isPlaying = true
        return service
    }()
}
#endif
