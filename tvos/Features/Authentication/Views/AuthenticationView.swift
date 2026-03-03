//
//  AuthenticationView.swift
//  KTVSinger-Shared
//
//  Authentication screen with Supabase
//

import SwiftUI

struct AuthenticationView: View {
    @EnvironmentObject var supabase: AppSupabaseClient
    @State private var email = ""
    @State private var password = ""
    @State private var isSignUp = false
    @State private var isLoading = false
    @State private var errorMessage: String?
    
    var body: some View {
        ZStack {
            // Background
            LinearGradient(
                colors: [.black, .blue.opacity(0.5), .purple.opacity(0.5)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            
            VStack(spacing: 40) {
                // Logo and title
                VStack(spacing: 20) {
                    Text("🎤")
                        .font(.system(size: 100))
                    
                    Text("KTV Singer")
                        .font(.system(size: 60, weight: .bold))
                        .foregroundColor(.white)
                    
                    Text("Your personal karaoke experience")
                        .font(.title3)
                        .foregroundColor(.white.opacity(0.8))
                }
                
                // Auth form
                VStack(spacing: 24) {
                    TextField("Email", text: $email)
                        .textFieldStyle(.plain)
                        .textContentType(.emailAddress)
                        .autocapitalization(.none)
                        .font(.title3)
                        .padding(.horizontal, 40)
                        .frame(maxWidth: 600)
                    
                    SecureField("Password", text: $password)
                        .textFieldStyle(.plain)
                        .textContentType(isSignUp ? .newPassword : .password)
                        .font(.title3)
                        .padding(.horizontal, 40)
                        .frame(maxWidth: 600)
                    
                    if let error = errorMessage {
                        Text(error)
                            .font(.body)
                            .foregroundColor(.red)
                            .padding(.horizontal, 40)
                    }
                    
                    Button {
                        Task {
                            await authenticate()
                        }
                    } label: {
                        HStack {
                            if isLoading {
                                ProgressView()
                                    .tint(.white)
                            }
                            Text(isSignUp ? "Sign Up" : "Sign In")
                                .font(.title3)
                                .fontWeight(.semibold)
                        }
                        .foregroundColor(.white)
                        .frame(maxWidth: 400)
                        .padding(.vertical, 20)
                        .background(Color.blue)
                        .cornerRadius(15)
                    }
                    .disabled(isLoading || email.isEmpty || password.isEmpty)
                    
                    Button {
                        isSignUp.toggle()
                        errorMessage = nil
                    } label: {
                        Text(isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up")
                            .font(.body)
                            .foregroundColor(.white.opacity(0.8))
                    }
                }
                
                Spacer()
                
                // Continue as guest (optional)
                Button {
                    // Implement guest mode
                } label: {
                    Text("Continue as Guest")
                        .font(.body)
                        .foregroundColor(.white.opacity(0.6))
                        .underline()
                }
            }
            .padding(60)
        }
    }
    
    private func authenticate() async {
        isLoading = true
        errorMessage = nil
        
        do {
            if isSignUp {
                try await supabase.signUp(email: email, password: password)
            } else {
                try await supabase.signIn(email: email, password: password)
            }
        } catch {
            errorMessage = error.localizedDescription
        }
        
        isLoading = false
    }
}

// MARK: - Preview

#Preview {
    AuthenticationView()
        .environmentObject(AppSupabaseClient.shared)
}
