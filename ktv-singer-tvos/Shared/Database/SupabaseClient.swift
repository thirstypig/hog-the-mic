//
//  SupabaseClient.swift
//  KTVSinger-Shared
//
//  Supabase client configuration and initialization
//

import Foundation
import Supabase
import Auth

/// Alias to avoid naming conflict with our wrapper class
private typealias SDKClient = Supabase.SupabaseClient

/// Centralized Supabase client for the app.
/// Works in two modes:
/// - With Supabase credentials: full auth + favorites support
/// - Without credentials: app runs in server-only mode (songs from Express API)
@MainActor
final class AppSupabaseClient: ObservableObject {
    static let shared = AppSupabaseClient()

    private var client: SDKClient?

    @Published var isAuthenticated = false
    @Published var currentUser: Auth.User?

    /// Whether Supabase is configured and available
    var isConfigured: Bool { client != nil }

    private init() {
        let url = Configuration.supabaseURL
        let key = Configuration.supabaseAnonKey

        guard !url.isEmpty, !key.isEmpty, let supabaseURL = URL(string: url) else {
            print("[SupabaseClient] No Supabase credentials configured. Running in server-only mode.")
            return
        }

        client = SDKClient(
            supabaseURL: supabaseURL,
            supabaseKey: key,
            options: SupabaseClientOptions(
                db: .init(schema: "public"),
                auth: .init(autoRefreshToken: true)
            )
        )

        Task {
            await observeAuthChanges()
        }
    }

    private func observeAuthChanges() async {
        guard let client else { return }

        for await (event, session) in client.auth.authStateChanges {
            switch event {
            case .signedIn, .tokenRefreshed, .initialSession:
                self.isAuthenticated = session != nil
                self.currentUser = session?.user
            case .signedOut:
                self.isAuthenticated = false
                self.currentUser = nil
            case .userUpdated:
                self.currentUser = session?.user
            @unknown default:
                break
            }
        }
    }

    // MARK: - Authentication

    func signUp(email: String, password: String) async throws {
        guard let client else { throw SupabaseError.notConfigured }
        try await client.auth.signUp(email: email, password: password)
    }

    func signIn(email: String, password: String) async throws {
        guard let client else { throw SupabaseError.notConfigured }
        try await client.auth.signIn(email: email, password: password)
    }

    func signInWithApple() async throws {
        throw SupabaseError.notImplemented
    }

    func signOut() async throws {
        guard let client else { throw SupabaseError.notConfigured }
        try await client.auth.signOut()
    }

    func resetPassword(email: String) async throws {
        guard let client else { throw SupabaseError.notConfigured }
        try await client.auth.resetPasswordForEmail(email)
    }

    // MARK: - User Favorites

    func fetchFavorites() async throws -> [Song] {
        guard let client else { throw SupabaseError.notConfigured }
        guard let userId = currentUser?.id else {
            throw SupabaseError.notAuthenticated
        }

        let response: [Song] = try await client
            .from("user_favorites")
            .select("*, songs(*)")
            .eq("user_id", value: userId.uuidString)
            .execute()
            .value

        return response
    }

    func addFavorite(songId: String) async throws {
        guard let client else { throw SupabaseError.notConfigured }
        guard let userId = currentUser?.id else {
            throw SupabaseError.notAuthenticated
        }

        try await client
            .from("user_favorites")
            .insert([
                "user_id": userId.uuidString,
                "song_id": songId,
                "created_at": ISO8601DateFormatter().string(from: Date())
            ])
            .execute()
    }

    func removeFavorite(songId: String) async throws {
        guard let client else { throw SupabaseError.notConfigured }
        guard let userId = currentUser?.id else {
            throw SupabaseError.notAuthenticated
        }

        try await client
            .from("user_favorites")
            .delete()
            .eq("user_id", value: userId.uuidString)
            .eq("song_id", value: songId)
            .execute()
    }
}

// MARK: - Configuration

private enum Configuration {
    static var supabaseURL: String {
        ProcessInfo.processInfo.environment["SUPABASE_URL"] ?? ""
    }

    static var supabaseAnonKey: String {
        ProcessInfo.processInfo.environment["SUPABASE_ANON_KEY"] ?? ""
    }
}

// MARK: - Errors

enum SupabaseError: LocalizedError {
    case notAuthenticated
    case notConfigured
    case notImplemented
    case networkError
    case decodingError

    var errorDescription: String? {
        switch self {
        case .notAuthenticated:
            return "User is not authenticated"
        case .notConfigured:
            return "Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY."
        case .notImplemented:
            return "Feature not yet implemented"
        case .networkError:
            return "Network error occurred"
        case .decodingError:
            return "Failed to decode response"
        }
    }
}
