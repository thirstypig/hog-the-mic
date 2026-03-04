//
//  PlayerView.swift
//  KTVSinger-tvOS
//
//  Main player view with video and synchronized lyrics
//  Ported from React Native PlayerScreen.tsx
//

import SwiftUI
import AVKit

struct PlayerView: View {
    @EnvironmentObject var audioStreamService: AudioStreamService
    @StateObject private var viewModel: PlayerViewModel
    @Environment(\.dismiss) private var dismiss
    @FocusState private var focusedControl: FocusableControl?

    init(song: Song) {
        _viewModel = StateObject(wrappedValue: PlayerViewModel(song: song))
    }

    enum FocusableControl {
        case back
        case decreaseOffset
        case increaseOffset
        case playPause
        case retry
    }

    var body: some View {
        GeometryReader { geo in
            let w = geo.size.width
            let h = geo.size.height

            ZStack {
                Color.black.ignoresSafeArea()

                VStack(spacing: 0) {
                    // Top bar with controls
                    topBar
                        .padding(.horizontal, w * 0.025)
                        .padding(.vertical, h * 0.022)

                    // Main content: Video + Lyrics side-by-side
                    HStack(spacing: 0) {
                        // Video player
                        videoPlayer
                            .frame(maxWidth: .infinity)
                            .aspectRatio(16/9, contentMode: .fit)

                        // Lyrics panel
                        lyricsPanel(screenWidth: w, screenHeight: h)
                            .frame(width: w * 0.35)
                    }
                }
            }
        }
        .persistentSystemOverlays(.hidden)
    }

    // MARK: - Top Bar

    private var topBar: some View {
        HStack(spacing: 20) {
            // Back button
            Button {
                viewModel.stop()
                dismiss()
            } label: {
                HStack {
                    Image(systemName: "chevron.left")
                        .font(.title2)
                    Text("Back")
                        .font(.headline)
                }
                .foregroundColor(.white)
                .padding(.horizontal, 20)
                .padding(.vertical, 12)
                .background(Color.white.opacity(0.2))
                .cornerRadius(10)
            }
            .focused($focusedControl, equals: .back)

            // Song info
            VStack(alignment: .leading, spacing: 4) {
                Text(viewModel.song.title)
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                    .lineLimit(1)

                Text(viewModel.song.artist)
                    .font(.title3)
                    .foregroundColor(.white.opacity(0.8))
                    .lineLimit(1)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            Spacer()

            // Mic level indicator
            if audioStreamService.isReceiving {
                MicLevelIndicator(
                    level: audioStreamService.audioLevel,
                    isReceiving: true
                )
            }

            // Lyrics offset controls
            HStack(spacing: 16) {
                Button {
                    viewModel.adjustLyricsOffset(by: -0.5)
                } label: {
                    Text("-0.5s")
                        .font(.body)
                        .foregroundColor(.white)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                        .background(Color.white.opacity(0.2))
                        .cornerRadius(8)
                }
                .focused($focusedControl, equals: .decreaseOffset)

                Text(offsetText)
                    .font(.body)
                    .foregroundColor(.white.opacity(0.7))
                    .frame(minWidth: 80)

                Button {
                    viewModel.adjustLyricsOffset(by: 0.5)
                } label: {
                    Text("+0.5s")
                        .font(.body)
                        .foregroundColor(.white)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                        .background(Color.white.opacity(0.2))
                        .cornerRadius(8)
                }
                .focused($focusedControl, equals: .increaseOffset)
            }
        }
    }

    private var offsetText: String {
        let offset = viewModel.lyricsService.lyricsOffset
        if offset == 0 {
            return "sync"
        } else {
            return String(format: "%+.1fs", offset)
        }
    }

    // MARK: - Video Player

    private var videoPlayer: some View {
        Group {
            if let player = viewModel.playerService.player {
                VideoPlayer(player: player)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if viewModel.playerService.isLoading {
                VStack(spacing: 20) {
                    ProgressView()
                        .scaleEffect(2)
                    Text("Loading video...")
                        .font(.title3)
                        .foregroundColor(.white.opacity(0.7))
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if let error = viewModel.error {
                VStack(spacing: 20) {
                    Image(systemName: "exclamationmark.triangle")
                        .font(.system(size: 60))
                        .foregroundColor(.red.opacity(0.8))
                    Text("Error")
                        .font(.title)
                        .foregroundColor(.white)
                    Text(error.localizedDescription)
                        .font(.body)
                        .foregroundColor(.white.opacity(0.7))
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 40)

                    Button {
                        Task {
                            await viewModel.playerService.loadVideo(videoId: viewModel.song.videoId)
                        }
                    } label: {
                        HStack {
                            Image(systemName: "arrow.clockwise")
                            Text("Try Again")
                        }
                        .font(.title3)
                        .foregroundColor(.white)
                        .padding(.horizontal, 24)
                        .padding(.vertical, 12)
                        .background(Color.blue)
                        .cornerRadius(10)
                    }
                    .focused($focusedControl, equals: .retry)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                VStack(spacing: 20) {
                    Image(systemName: "play.rectangle")
                        .font(.system(size: 60))
                        .foregroundColor(.white.opacity(0.5))
                    Text("Video ID: \(viewModel.song.videoId)")
                        .font(.body)
                        .foregroundColor(.white.opacity(0.7))
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .background(Color.black)
    }

    // MARK: - Lyrics Panel

    private func lyricsPanel(screenWidth: CGFloat, screenHeight: CGFloat) -> some View {
        let hPad = max(20, screenWidth * 0.02)
        let topPad = max(100, screenHeight * 0.28)
        let bottomPad = max(150, screenHeight * 0.37)
        let activeFontSize = max(28, screenWidth * 0.022)
        let inactiveFontSize = max(22, screenWidth * 0.017)

        return ScrollViewReader { proxy in
            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    // Top padding for centering
                    Color.clear.frame(height: topPad)

                    if viewModel.song.lyrics.isEmpty {
                        noLyricsView
                    } else {
                        lyricsContent(activeFontSize: activeFontSize, inactiveFontSize: inactiveFontSize)
                    }

                    // Bottom padding
                    Color.clear.frame(height: bottomPad)
                }
                .padding(.horizontal, hPad)
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .onChange(of: viewModel.lyricsService.activeLineIndex) { _, newIndex in
                if let index = newIndex {
                    withAnimation(.easeInOut(duration: 0.3)) {
                        proxy.scrollTo(index, anchor: .center)
                    }
                }
            }
        }
        .background(Color.black.opacity(0.3))
    }

    private func lyricsContent(activeFontSize: CGFloat, inactiveFontSize: CGFloat) -> some View {
        ForEach(Array(viewModel.song.lyrics.enumerated()), id: \.element.id) { index, line in
            let isActive = viewModel.lyricsService.activeLineIndex == index
            let isPast = (viewModel.lyricsService.activeLineIndex ?? -1) > index

            Text(line.text.isEmpty ? "~" : line.text)
                .font(.system(size: isActive ? activeFontSize : inactiveFontSize))
                .fontWeight(isActive ? .bold : .regular)
                .foregroundColor(lyricColor(isActive: isActive, isPast: isPast))
                .padding(.vertical, 8)
                .id(index)
                .animation(.easeInOut(duration: 0.2), value: isActive)
        }
    }

    private var noLyricsView: some View {
        VStack(spacing: 20) {
            Image(systemName: "music.note")
                .font(.system(size: 60))
                .foregroundColor(.white.opacity(0.3))
            Text("No lyrics available for this song")
                .font(.title3)
                .foregroundColor(.white.opacity(0.5))
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
        .padding(.vertical, 100)
    }

    private func lyricColor(isActive: Bool, isPast: Bool) -> Color {
        if isActive {
            return .cyan
        } else if isPast {
            return .white.opacity(0.4)
        } else {
            return .white.opacity(0.6)
        }
    }
}

// MARK: - Preview

#Preview {
    PlayerView(song: .preview)
}
