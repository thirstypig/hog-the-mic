//
//  QueuePlayerView.swift
//  KTVSinger-tvOS
//
//  Queue-driven player that auto-advances through songs.
//  Presented as fullScreenCover when queue starts playing.
//

import SwiftUI
import AVKit

struct QueuePlayerView: View {
    @EnvironmentObject var queueService: QueueService
    @EnvironmentObject var audioStreamService: AudioStreamService
    @StateObject private var viewModel: PlayerViewModel
    @Environment(\.dismiss) private var dismiss
    @FocusState private var focusedControl: FocusableControl?

    @State private var showControls = true
    @State private var controlsTimer: Timer?
    @State private var songTransitionOpacity: Double = 1.0

    init(initialEntry: QueueEntry) {
        let song = Song(
            id: initialEntry.songId,
            videoId: initialEntry.videoId,
            title: initialEntry.title,
            artist: initialEntry.artist,
            thumbnailUrl: initialEntry.thumbnailUrl,
            genre: "Unknown",
            gender: "unknown",
            year: 0,
            lyrics: [],
            playCount: 0,
            instrumentalUrl: nil,
            lyricsOffset: 0
        )
        _viewModel = StateObject(wrappedValue: PlayerViewModel(song: song))
    }

    enum FocusableControl {
        case back
        case skip
        case decreaseOffset
        case increaseOffset
        case retry
    }

    var body: some View {
        GeometryReader { geo in
            let w = geo.size.width
            let h = geo.size.height

            ZStack {
                // Layer 1: Full-bleed video
                Color.black.ignoresSafeArea()
                videoPlayer
                    .ignoresSafeArea()

                // Layer 2: Right-side gradient scrim
                HStack(spacing: 0) {
                    Spacer()
                    LinearGradient(
                        colors: [.clear, .black.opacity(0.85)],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                    .frame(width: w * 0.45)
                }
                .ignoresSafeArea()

                // Layer 3: Lyrics panel overlaid on right
                HStack(spacing: 0) {
                    Spacer()
                    lyricsPanel(screenWidth: w, screenHeight: h)
                        .frame(width: w * 0.35)
                        .opacity(songTransitionOpacity)
                }
                .ignoresSafeArea()

                // Layer 4: Auto-hiding controls overlay
                VStack {
                    // Top bar with gradient background
                    topBar(screenWidth: w)
                        .padding(.horizontal, w * 0.025)
                        .padding(.top, h * 0.03)
                        .background(
                            LinearGradient(
                                colors: [.black.opacity(0.7), .clear],
                                startPoint: .top,
                                endPoint: .bottom
                            )
                            .ignoresSafeArea()
                        )

                    Spacer()

                    // "Up Next" pill — bottom left
                    HStack {
                        if let next = queueService.upcoming.first {
                            upNextPill(next: next)
                                .padding(.leading, w * 0.03)
                                .padding(.bottom, h * 0.08)
                        }
                        Spacer()

                        // Time labels
                        if showControls {
                            HStack(spacing: 8) {
                                Text(viewModel.formattedCurrentTime)
                                    .font(.system(size: 16, weight: .medium, design: .monospaced))
                                Text("/")
                                Text(viewModel.formattedDuration)
                                    .font(.system(size: 16, weight: .medium, design: .monospaced))
                            }
                            .foregroundColor(.white.opacity(0.7))
                            .padding(.trailing, w * 0.03)
                            .padding(.bottom, h * 0.08)
                            .transition(.opacity)
                        }
                    }
                }
                .opacity(showControls ? 1 : 0)
                .animation(.easeInOut(duration: 0.4), value: showControls)

                // Layer 5: Thin progress bar at bottom (always visible)
                VStack {
                    Spacer()
                    progressBar(screenWidth: w)
                }
                .ignoresSafeArea()

                // Mic level indicator — top right, always visible when receiving
                VStack {
                    HStack {
                        Spacer()
                        if audioStreamService.isReceiving {
                            MicLevelIndicator(
                                level: audioStreamService.audioLevel,
                                isReceiving: true,
                                chunksReceived: audioStreamService.chunksReceived,
                                engineState: audioStreamService.engineState
                            )
                            .padding(.top, h * 0.03)
                            .padding(.trailing, w * 0.37)
                        }
                    }
                    Spacer()
                }
            }
        }
        .persistentSystemOverlays(.hidden)
        .onChange(of: focusedControl) { _, _ in
            showControlsTemporarily()
        }
        .onAppear {
            viewModel.attachQueueService(queueService)
            Task {
                await viewModel.loadSongFromAPI()
            }
            showControlsTemporarily()
        }
        .onChange(of: queueService.currentlyPlaying) { _, newValue in
            if newValue == nil {
                viewModel.stop()
                dismiss()
            } else {
                // Song transition animation
                withAnimation(.easeOut(duration: 0.3)) {
                    songTransitionOpacity = 0
                }
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
                    withAnimation(.easeIn(duration: 0.5)) {
                        songTransitionOpacity = 1
                    }
                }
            }
        }
    }

    // MARK: - Controls Timer

    private func showControlsTemporarily() {
        showControls = true
        controlsTimer?.invalidate()
        controlsTimer = Timer.scheduledTimer(withTimeInterval: 3.0, repeats: false) { _ in
            Task { @MainActor in
                withAnimation {
                    showControls = false
                }
            }
        }
    }

    // MARK: - Progress Bar

    private func progressBar(screenWidth: CGFloat) -> some View {
        ZStack(alignment: .leading) {
            Rectangle()
                .fill(Color.white.opacity(0.15))
                .frame(height: 3)

            Rectangle()
                .fill(
                    LinearGradient(
                        colors: [.cyan, .blue],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .frame(width: screenWidth * viewModel.progress, height: 3)
                .animation(.linear(duration: 0.5), value: viewModel.progress)
        }
        .frame(height: 3)
    }

    // MARK: - Up Next Pill

    private func upNextPill(next: QueueEntry) -> some View {
        HStack(spacing: 8) {
            Image(systemName: "forward.fill")
                .font(.system(size: 14))
            Text("Up Next: \(next.title)")
                .font(.system(size: 16, weight: .medium))
                .lineLimit(1)
        }
        .foregroundColor(.white.opacity(0.8))
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(.ultraThinMaterial)
        .clipShape(Capsule())
    }

    // MARK: - Top Bar

    private func topBar(screenWidth: CGFloat) -> some View {
        HStack(spacing: 20) {
            Button {
                viewModel.stop()
                dismiss()
            } label: {
                HStack(spacing: 6) {
                    Image(systemName: "chevron.left")
                        .font(.title3)
                    Text("Back")
                        .font(.headline)
                }
                .foregroundColor(.white)
                .padding(.horizontal, 20)
                .padding(.vertical, 12)
                .background(.ultraThinMaterial)
                .clipShape(RoundedRectangle(cornerRadius: 10))
            }
            .focused($focusedControl, equals: .back)

            VStack(alignment: .leading, spacing: 2) {
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
            .opacity(songTransitionOpacity)

            Spacer()

            // Skip button
            Button {
                viewModel.skipSong()
            } label: {
                HStack(spacing: 6) {
                    Image(systemName: "forward.fill")
                    Text("Skip")
                }
                .font(.body)
                .foregroundColor(.white)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(.ultraThinMaterial)
                .clipShape(RoundedRectangle(cornerRadius: 8))
            }
            .focused($focusedControl, equals: .skip)

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
                        .background(.ultraThinMaterial)
                        .clipShape(RoundedRectangle(cornerRadius: 8))
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
                        .background(.ultraThinMaterial)
                        .clipShape(RoundedRectangle(cornerRadius: 8))
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
                    .ignoresSafeArea()
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
    }

    // MARK: - Lyrics Panel

    private func lyricsPanel(screenWidth: CGFloat, screenHeight: CGFloat) -> some View {
        let hPad = max(20, screenWidth * 0.02)
        let topPad = max(100, screenHeight * 0.28)
        let bottomPad = max(150, screenHeight * 0.37)
        let activeFontSize = max(30, screenWidth * 0.024)
        let nextFontSize = max(24, screenWidth * 0.019)
        let inactiveFontSize = max(22, screenWidth * 0.017)

        return ScrollViewReader { proxy in
            ScrollView(.vertical, showsIndicators: false) {
                VStack(alignment: .leading, spacing: 14) {
                    Color.clear.frame(height: topPad)

                    if viewModel.song.lyrics.isEmpty {
                        noLyricsView
                    } else {
                        lyricsContent(
                            activeFontSize: activeFontSize,
                            nextFontSize: nextFontSize,
                            inactiveFontSize: inactiveFontSize
                        )
                    }

                    Color.clear.frame(height: bottomPad)
                }
                .padding(.horizontal, hPad)
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .onChange(of: viewModel.lyricsService.activeLineIndex) { _, newIndex in
                if let index = newIndex {
                    withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                        proxy.scrollTo(index, anchor: .center)
                    }
                }
            }
        }
    }

    private func lyricsContent(activeFontSize: CGFloat, nextFontSize: CGFloat, inactiveFontSize: CGFloat) -> some View {
        ForEach(Array(viewModel.song.lyrics.enumerated()), id: \.element.id) { index, line in
            let activeIndex = viewModel.lyricsService.activeLineIndex ?? -1
            let isActive = activeIndex == index
            let isNext = activeIndex + 1 == index
            let isPast = activeIndex > index

            let fontSize = isActive ? activeFontSize : (isNext ? nextFontSize : inactiveFontSize)
            let weight: Font.Weight = isActive ? .heavy : (isNext ? .medium : .regular)

            Text(line.text.isEmpty ? " " : line.text)
                .font(.system(size: fontSize, weight: weight))
                .foregroundColor(lyricColor(isActive: isActive, isNext: isNext, isPast: isPast))
                .scaleEffect(isActive ? 1.05 : 1.0, anchor: .leading)
                .shadow(color: isActive ? .cyan.opacity(0.6) : .clear, radius: 8, x: 0, y: 0)
                .padding(.vertical, 8)
                .id(index)
                .animation(.spring(response: 0.3, dampingFraction: 0.7), value: isActive)
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

    private func lyricColor(isActive: Bool, isNext: Bool, isPast: Bool) -> Color {
        if isActive {
            return .white
        } else if isNext {
            return .white.opacity(0.7)
        } else if isPast {
            return .white.opacity(0.25)
        } else {
            return .white.opacity(0.5)
        }
    }
}
