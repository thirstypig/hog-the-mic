//
//  SongBrowserViewModel.swift
//  KTVSinger-tvOS
//
//  ViewModel for the Home dashboard
//

import Foundation

@MainActor
final class SongBrowserViewModel: ObservableObject {

    // MARK: - Published Properties

    @Published var songs: [Song] = []
    @Published var isLoading = false
    @Published var error: Error?

    // MARK: - Computed Properties

    /// Top 10 songs by play count
    var mostPlayed: [Song] {
        Array(songs.sorted { $0.playCount > $1.playCount }.prefix(10))
    }

    /// Top 10 newest songs by year
    var recentlyAdded: [Song] {
        Array(songs.sorted { $0.year > $1.year }.prefix(10))
    }

    // MARK: - Private Properties

    private let api = APIClient.shared

    // MARK: - Initialization

    init() {
        Task {
            await loadSongs()
        }
    }

    // MARK: - Public Methods

    func loadSongs() async {
        isLoading = true
        error = nil

        do {
            songs = try await api.fetchSongs()
            isLoading = false
        } catch {
            self.error = error
            isLoading = false
        }
    }

    func refresh() async {
        await loadSongs()
    }
}

// MARK: - Preview

#if DEBUG
extension SongBrowserViewModel {
    static let preview: SongBrowserViewModel = {
        let vm = SongBrowserViewModel()
        vm.songs = Song.previewList
        return vm
    }()
}
#endif
