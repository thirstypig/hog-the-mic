//
//  SongBrowserView.swift
//  KTVSinger-tvOS
//
//  View for browsing and searching songs
//

import SwiftUI

struct SongBrowserView: View {
    @StateObject private var viewModel = SongBrowserViewModel()
    @State private var selectedSong: Song?
    @State private var showingPlayer = false
    @FocusState private var focusedField: FocusableField?

    enum FocusableField {
        case search
        case genreFilter
        case sortOptions
    }

    var body: some View {
        NavigationStack {
            ZStack {
                // Background
                LinearGradient(
                    colors: [.black, .blue.opacity(0.3)],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .ignoresSafeArea()

                VStack(spacing: 0) {
                    // Header with search and filters
                    header
                        .padding(.horizontal, 48)
                        .padding(.top, 40)
                        .padding(.bottom, 20)

                    // Song grid
                    if viewModel.isLoading {
                        loadingView
                    } else if viewModel.filteredSongs.isEmpty {
                        emptyView
                    } else {
                        songGrid
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
        VStack(spacing: 20) {
            HStack {
                Text("KTV Singer")
                    .font(.system(size: 56, weight: .bold))
                    .foregroundColor(.white)

                Spacer()
            }

            HStack(spacing: 20) {
                // Search field
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.white.opacity(0.6))
                        .font(.title2)

                    TextField("Search songs or artists...", text: $viewModel.searchQuery)
                        .textFieldStyle(.plain)
                        .font(.title3)
                        .foregroundColor(.white)
                        .focused($focusedField, equals: .search)
                }
                .padding(20)
                .background(Color.white.opacity(0.1))
                .cornerRadius(12)
                .frame(maxWidth: 800)

                // Genre filter
                Menu {
                    Button("All Genres") {
                        viewModel.selectGenre(nil)
                    }

                    Divider()

                    ForEach(viewModel.availableGenres, id: \.self) { genre in
                        Button(genre) {
                            viewModel.selectGenre(genre)
                        }
                    }
                } label: {
                    HStack {
                        Image(systemName: "line.3.horizontal.decrease.circle")
                        Text(viewModel.selectedGenre ?? "Genre")
                    }
                    .font(.title3)
                    .foregroundColor(.white)
                    .padding(.horizontal, 24)
                    .padding(.vertical, 16)
                    .background(Color.white.opacity(0.1))
                    .cornerRadius(12)
                }
                .focused($focusedField, equals: .genreFilter)

                // Sort options
                Menu {
                    ForEach(SongBrowserViewModel.SortOption.allCases, id: \.self) { option in
                        Button {
                            viewModel.changeSortOption(option)
                        } label: {
                            HStack {
                                Image(systemName: option.systemImage)
                                Text(option.rawValue)
                                if viewModel.sortOption == option {
                                    Spacer()
                                    Image(systemName: "checkmark")
                                }
                            }
                        }
                    }
                } label: {
                    HStack {
                        Image(systemName: "arrow.up.arrow.down")
                        Text("Sort")
                    }
                    .font(.title3)
                    .foregroundColor(.white)
                    .padding(.horizontal, 24)
                    .padding(.vertical, 16)
                    .background(Color.white.opacity(0.1))
                    .cornerRadius(12)
                }
                .focused($focusedField, equals: .sortOptions)
            }
        }
    }

    // MARK: - Song Grid

    private var songGrid: some View {
        ScrollView {
            LazyVGrid(
                columns: [
                    GridItem(.adaptive(minimum: 400, maximum: 500), spacing: 30)
                ],
                spacing: 30
            ) {
                ForEach(viewModel.filteredSongs) { song in
                    Button {
                        selectedSong = song
                    } label: {
                        SongCard(song: song)
                    }
                    .buttonStyle(.card)
                }
            }
            .padding(.horizontal, 48)
            .padding(.bottom, 60)
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

            if !viewModel.searchQuery.isEmpty {
                Text("Try a different search term")
                    .font(.title3)
                    .foregroundColor(.white.opacity(0.6))
            }

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

// MARK: - Song Card

struct SongCard: View {
    let song: Song

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Thumbnail
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
                                .font(.system(size: 50))
                                .foregroundColor(.white.opacity(0.5))
                        )
                }
                .frame(height: 220)
                .clipShape(RoundedRectangle(cornerRadius: 16))
            } else {
                Rectangle()
                    .fill(
                        LinearGradient(
                            colors: [.blue.opacity(0.6), .purple.opacity(0.6)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(height: 220)
                    .overlay(
                        Image(systemName: "music.note")
                            .font(.system(size: 50))
                            .foregroundColor(.white.opacity(0.7))
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 16))
            }

            // Song info
            VStack(alignment: .leading, spacing: 6) {
                Text(song.title)
                    .font(.title3)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                    .lineLimit(2)

                Text(song.artist)
                    .font(.body)
                    .foregroundColor(.white.opacity(0.7))
                    .lineLimit(1)

                HStack {
                    Text(song.genre)
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.6))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.white.opacity(0.1))
                        .cornerRadius(6)

                    Spacer()

                    Text(String(song.year))
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.6))
                }
            }
            .padding(.horizontal, 8)
        }
        .padding(16)
        .background(Color.white.opacity(0.05))
        .cornerRadius(20)
        .shadow(color: .black.opacity(0.3), radius: 10, x: 0, y: 5)
    }
}

// MARK: - Preview

#Preview {
    SongBrowserView()
}
