//
//  SongBrowserViewModel.swift
//  KTVSinger-tvOS
//
//  ViewModel for browsing and searching songs
//

import Foundation
import Combine

@MainActor
final class SongBrowserViewModel: ObservableObject {

    // MARK: - Published Properties

    @Published var songs: [Song] = []
    @Published var filteredSongs: [Song] = []
    @Published var searchQuery: String = ""
    @Published var selectedGenre: String?
    @Published var isLoading = false
    @Published var error: Error?

    @Published var sortOption: SortOption = .playCount

    enum SortOption: String, CaseIterable {
        case playCount = "Most Played"
        case titleAZ = "Title (A-Z)"
        case titleZA = "Title (Z-A)"
        case artist = "Artist"
        case newest = "Newest"

        var systemImage: String {
            switch self {
            case .playCount: return "star.fill"
            case .titleAZ: return "textformat.abc"
            case .titleZA: return "textformat.abc"
            case .artist: return "person.fill"
            case .newest: return "clock.fill"
            }
        }
    }

    // MARK: - Private Properties

    private let api = APIClient.shared
    private var cancellables = Set<AnyCancellable>()

    // MARK: - Available Genres

    var availableGenres: [String] {
        let genres = Set(songs.map { $0.genre })
        return Array(genres).sorted()
    }

    // MARK: - Initialization

    init() {
        setupSearchObserver()
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
            applyFiltersAndSort()
            isLoading = false
        } catch {
            self.error = error
            isLoading = false
        }
    }

    func selectGenre(_ genre: String?) {
        selectedGenre = genre
        applyFiltersAndSort()
    }

    func changeSortOption(_ option: SortOption) {
        sortOption = option
        applyFiltersAndSort()
    }

    func refresh() async {
        await loadSongs()
    }

    // MARK: - Private Methods

    private func setupSearchObserver() {
        $searchQuery
            .debounce(for: .milliseconds(300), scheduler: DispatchQueue.main)
            .sink { [weak self] _ in
                self?.applyFiltersAndSort()
            }
            .store(in: &cancellables)
    }

    private func applyFiltersAndSort() {
        var result = songs

        // Apply genre filter
        if let genre = selectedGenre {
            result = result.filter { $0.genre == genre }
        }

        // Apply search filter (local)
        if !searchQuery.isEmpty {
            result = result.filter {
                $0.title.localizedCaseInsensitiveContains(searchQuery) ||
                $0.artist.localizedCaseInsensitiveContains(searchQuery)
            }
        }

        // Apply sorting
        switch sortOption {
        case .playCount:
            result.sort { $0.playCount > $1.playCount }
        case .titleAZ:
            result.sort { $0.title.localizedCompare($1.title) == .orderedAscending }
        case .titleZA:
            result.sort { $0.title.localizedCompare($1.title) == .orderedDescending }
        case .artist:
            result.sort { $0.artist.localizedCompare($1.artist) == .orderedAscending }
        case .newest:
            result.sort { $0.year > $1.year }
        }

        filteredSongs = result
    }
}

// MARK: - Preview

#if DEBUG
extension SongBrowserViewModel {
    static let preview: SongBrowserViewModel = {
        let vm = SongBrowserViewModel()
        vm.songs = Song.previewList
        vm.filteredSongs = Song.previewList
        return vm
    }()
}
#endif
