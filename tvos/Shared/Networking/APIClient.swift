//
//  APIClient.swift
//  KTVSinger-Shared
//
//  HTTP client for the Express REST API
//

import Foundation

/// Response from the YouTube stream endpoint
struct StreamInfo: Codable, Sendable {
    let url: String
    let mimeType: String
    let quality: String
    let expiresAt: Int?
}

/// Thin HTTP client for the Express server API
@MainActor
final class APIClient: ObservableObject {
    static let shared = APIClient()

    /// Base URL for the Express server.
    /// Defaults to localhost:3000 for development.
    /// On tvOS Simulator this reaches the Mac host.
    @Published var baseURL: String {
        didSet {
            UserDefaults.standard.set(baseURL, forKey: "api_base_url")
        }
    }

    private let session: URLSession
    private let decoder: JSONDecoder

    private init() {
        self.baseURL = UserDefaults.standard.string(forKey: "api_base_url")
            ?? "http://192.168.6.12:3000"

        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        self.session = URLSession(configuration: config)

        self.decoder = JSONDecoder()
        self.decoder.keyDecodingStrategy = .convertFromSnakeCase
    }

    // MARK: - Songs

    func fetchSongs() async throws -> [Song] {
        return try await get("/api/songs")
    }

    func fetchSong(id: String) async throws -> Song {
        return try await get("/api/songs/\(id)")
    }

    // MARK: - YouTube Search

    func searchYouTube(query: String) async throws -> [YouTubeSearchResult] {
        let encoded = query.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? query
        return try await get("/api/youtube/search?q=\(encoded)")
    }

    // MARK: - Streaming

    func getStreamURL(videoId: String) async throws -> StreamInfo {
        return try await get("/api/youtube/stream/\(videoId)?type=video&quality=highest")
    }

    // MARK: - Generic HTTP

    private func get<T: Decodable>(_ path: String) async throws -> T {
        guard let url = URL(string: "\(baseURL)\(path)") else {
            throw APIError.invalidURL
        }

        let (data, response): (Data, URLResponse)
        do {
            (data, response) = try await session.data(from: url)
        } catch {
            throw APIError.networkError(error)
        }

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.noData
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            let body = String(data: data, encoding: .utf8)
            throw APIError.httpError(statusCode: httpResponse.statusCode, body: body)
        }

        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw APIError.decodingError(error)
        }
    }
}

// MARK: - YouTube Search Result

struct YouTubeSearchResult: Identifiable, Codable, Sendable {
    let id: String
    let title: String
    let channelTitle: String
    let thumbnailUrl: String?
}
