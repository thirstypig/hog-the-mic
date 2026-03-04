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

    private let barCount = 5

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: "mic.fill")
                .font(.system(size: 18))
                .foregroundColor(isReceiving ? .red : .gray)

            ForEach(0..<barCount, id: \.self) { index in
                RoundedRectangle(cornerRadius: 2)
                    .fill(barColor(for: index))
                    .frame(width: 4, height: barHeight(for: index))
                    .animation(.easeInOut(duration: 0.1), value: level)
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(Color.black.opacity(0.5))
        .cornerRadius(8)
    }

    private func barHeight(for index: Int) -> CGFloat {
        let threshold = Float(index) / Float(barCount)
        let active = isReceiving && level > threshold
        return active ? CGFloat(8 + index * 4) : 4
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
