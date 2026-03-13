//
//  SongBrowserView.swift
//  KTVSinger-tvOS
//
//  Home dashboard with queue status and song rails
//

import SwiftUI

struct SongBrowserView: View {
    @StateObject private var viewModel = SongBrowserViewModel()
    @EnvironmentObject var queueService: QueueService
    @State private var selectedSong: Song?

    var body: some View {
        NavigationStack {
            ZStack {
                // Background
                LinearGradient(
                    colors: [.black, .blue.opacity(0.15)],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .ignoresSafeArea()

                VStack(spacing: 0) {
                    // Header
                    header
                        .padding(.horizontal, 48)
                        .padding(.top, 40)
                        .padding(.bottom, 20)

                    // Content
                    if viewModel.isLoading {
                        loadingView
                    } else if viewModel.songs.isEmpty {
                        emptyView
                    } else {
                        dashboardView
                    }
                }
            }
            .fullScreenCover(item: $selectedSong) { song in
                PlayerView(song: song)
            }
        }
    }

    // MARK: - Header

    private var header: some View {
        HStack {
            Text("KTV Singer")
                .font(.system(size: 56, weight: .bold))
                .foregroundColor(.white)
            Spacer()
        }
    }

    // MARK: - Dashboard View

    private var dashboardView: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 40) {
                // Now Playing hero
                if let entry = queueService.currentlyPlaying {
                    nowPlayingHero(entry: entry)
                        .padding(.horizontal, 48)
                }

                // Up Next rail
                if !queueService.upcoming.isEmpty {
                    upNextRail
                }

                // Most Played rail
                if !viewModel.mostPlayed.isEmpty {
                    songRail(title: "Most Played", songs: viewModel.mostPlayed)
                }

                // Recently Added rail
                if !viewModel.recentlyAdded.isEmpty {
                    songRail(title: "Recently Added", songs: viewModel.recentlyAdded)
                }
            }
            .padding(.bottom, 60)
        }
    }

    // MARK: - Now Playing Hero

    private func nowPlayingHero(entry: QueueEntry) -> some View {
        ZStack(alignment: .bottomLeading) {
            // Thumbnail
            if let url = entry.thumbnailImageURL {
                AsyncImage(url: url) { image in
                    image
                        .resizable()
                        .aspectRatio(16/9, contentMode: .fill)
                } placeholder: {
                    Rectangle()
                        .fill(Color.gray.opacity(0.2))
                }
            } else {
                Rectangle()
                    .fill(
                        LinearGradient(
                            colors: [.blue.opacity(0.5), .purple.opacity(0.5)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
            }

            // Gradient overlay
            LinearGradient(
                colors: [.clear, .clear, .black.opacity(0.9)],
                startPoint: .top,
                endPoint: .bottom
            )

            // Text overlay
            VStack(alignment: .leading, spacing: 8) {
                Text("NOW PLAYING")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(.green)
                    .tracking(2)

                Text(entry.title)
                    .font(.system(size: 42, weight: .bold))
                    .foregroundColor(.white)
                    .lineLimit(2)

                Text(entry.artist)
                    .font(.title2)
                    .foregroundColor(.white.opacity(0.8))
            }
            .padding(40)
        }
        .frame(height: 400)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    // MARK: - Up Next Rail

    private var upNextRail: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Up Next")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.white)
                .padding(.horizontal, 48)

            ScrollView(.horizontal, showsIndicators: false) {
                LazyHStack(spacing: 24) {
                    ForEach(queueService.upcoming) { entry in
                        queueEntryCard(entry: entry)
                            .frame(width: 320)
                    }
                }
                .padding(.horizontal, 48)
            }
        }
    }

    // MARK: - Queue Entry Card

    private func queueEntryCard(entry: QueueEntry) -> some View {
        ZStack(alignment: .bottomLeading) {
            if let url = entry.thumbnailImageURL {
                AsyncImage(url: url) { image in
                    image
                        .resizable()
                        .aspectRatio(16/9, contentMode: .fill)
                } placeholder: {
                    Rectangle()
                        .fill(Color.gray.opacity(0.3))
                        .overlay(
                            Image(systemName: "music.note")
                                .font(.system(size: 40))
                                .foregroundColor(.white.opacity(0.5))
                        )
                }
            } else {
                Rectangle()
                    .fill(
                        LinearGradient(
                            colors: [.blue.opacity(0.6), .purple.opacity(0.6)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .overlay(
                        Image(systemName: "music.note")
                            .font(.system(size: 40))
                            .foregroundColor(.white.opacity(0.7))
                    )
            }

            LinearGradient(
                colors: [.clear, .black.opacity(0.85)],
                startPoint: .center,
                endPoint: .bottom
            )

            VStack(alignment: .leading, spacing: 4) {
                Text(entry.title)
                    .font(.headline)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                    .lineLimit(2)

                Text(entry.artist)
                    .font(.subheadline)
                    .foregroundColor(.white.opacity(0.8))
                    .lineLimit(1)
            }
            .padding(16)
        }
        .aspectRatio(16/9, contentMode: .fit)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - Song Rail

    private func songRail(title: String, songs: [Song]) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(title)
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.white)
                .padding(.horizontal, 48)

            ScrollView(.horizontal, showsIndicators: false) {
                LazyHStack(spacing: 24) {
                    ForEach(songs) { song in
                        Button {
                            selectedSong = song
                        } label: {
                            SongCard(song: song)
                                .frame(width: 320)
                        }
                        .buttonStyle(.card)
                    }
                }
                .padding(.horizontal, 48)
            }
        }
    }

    // MARK: - Loading View

    private var loadingView: some View {
        VStack(spacing: 30) {
            ProgressView()
                .scaleEffect(2)
            Text("Loading songs...")
                .font(.title2)
                .foregroundColor(.white.opacity(0.7))
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    // MARK: - Empty View

    private var emptyView: some View {
        VStack(spacing: 30) {
            Image(systemName: "music.note.list")
                .font(.system(size: 100))
                .foregroundColor(.white.opacity(0.3))

            Text("No songs found")
                .font(.title)
                .foregroundColor(.white)

            Button("Refresh") {
                Task {
                    await viewModel.refresh()
                }
            }
            .buttonStyle(.bordered)
            .font(.title3)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Song Card (overlay design)

struct SongCard: View {
    let song: Song

    var body: some View {
        ZStack(alignment: .bottomLeading) {
            // Thumbnail fills card
            if let thumbnailURL = song.thumbnailImageURL {
                AsyncImage(url: thumbnailURL) { image in
                    image
                        .resizable()
                        .aspectRatio(16/9, contentMode: .fill)
                } placeholder: {
                    Rectangle()
                        .fill(Color.gray.opacity(0.3))
                        .overlay(
                            Image(systemName: "music.note")
                                .font(.system(size: 40))
                                .foregroundColor(.white.opacity(0.5))
                        )
                }
            } else {
                Rectangle()
                    .fill(
                        LinearGradient(
                            colors: [.blue.opacity(0.6), .purple.opacity(0.6)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .overlay(
                        Image(systemName: "music.note")
                            .font(.system(size: 40))
                            .foregroundColor(.white.opacity(0.7))
                    )
            }

            // Gradient overlay at bottom for text
            LinearGradient(
                colors: [.clear, .black.opacity(0.85)],
                startPoint: .center,
                endPoint: .bottom
            )

            // Song info overlaid at bottom
            VStack(alignment: .leading, spacing: 4) {
                Text(song.title)
                    .font(.headline)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                    .lineLimit(2)

                HStack {
                    Text(song.artist)
                        .font(.subheadline)
                        .foregroundColor(.white.opacity(0.8))
                        .lineLimit(1)

                    Spacer()

                    Text(song.genre)
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.6))
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color.white.opacity(0.15))
                        .cornerRadius(4)
                }
            }
            .padding(16)
        }
        .aspectRatio(16/9, contentMode: .fit)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

// MARK: - Preview

#Preview {
    SongBrowserView()
        .environmentObject(QueueService())
}
