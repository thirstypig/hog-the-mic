//
//  MicLevelIndicator.swift
//  KTVSinger-tvOS
//
//  Visual indicator showing microphone audio level on the TV screen.
//

import SwiftUI

struct MicLevelIndicator: View {
    let level: Float      // 0.0 – 1.0
    let isReceiving: Bool
    var chunksReceived: Int = 0
    var engineState: String = ""

    private let barCount = 5

    var body: some View {
        VStack(spacing: 4) {
            HStack(spacing: 6) {
                Image(systemName: "mic.fill")
                    .font(.system(size: 22))
                    .foregroundColor(isReceiving ? .red : .gray)

                ForEach(0..<barCount, id: \.self) { index in
                    RoundedRectangle(cornerRadius: 3)
                        .fill(barColor(for: index))
                        .frame(width: 6, height: barHeight(for: index))
                        .animation(.easeInOut(duration: 0.1), value: level)
                }
            }

            // Debug info (only shown when engineState is provided)
            if !engineState.isEmpty {
                Text("\(chunksReceived) chunks | \(engineState)")
                    .font(.system(size: 12, weight: .medium, design: .monospaced))
                    .foregroundColor(engineState == "error" ? .red : .white.opacity(0.6))
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(.ultraThinMaterial)
        .clipShape(Capsule())
    }

    private func barHeight(for index: Int) -> CGFloat {
        let threshold = Float(index) / Float(barCount)
        let active = isReceiving && level > threshold
        return active ? CGFloat(10 + index * 5) : 6
    }

    private func barColor(for index: Int) -> Color {
        let threshold = Float(index) / Float(barCount)
        guard isReceiving, level > threshold else {
            return .white.opacity(0.2)
        }
        if index >= barCount - 1 { return .red }
        if index >= barCount - 2 { return .yellow }
        return .green
    }
}
