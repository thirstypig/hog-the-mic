//
//  AudioStreamService.swift
//  KTVSinger-Shared
//
//  Receives audio chunks via Socket.IO and plays them through AVAudioEngine
//

import Foundation
import AVFoundation

@MainActor
final class AudioStreamService: ObservableObject {

    // MARK: - Published State

    @Published var isReceiving = false
    @Published var audioLevel: Float = 0.0  // 0.0 – 1.0 normalized peak

    // MARK: - Private

    private let audioEngine = AVAudioEngine()
    private let playerNode = AVAudioPlayerNode()
    private let audioFormat: AVAudioFormat
    private weak var socketService: SocketPairingService?
    private var activeSenders = Set<String>()

    init() {
        // Must match mobile recording format: 16kHz, mono, 16-bit PCM
        audioFormat = AVAudioFormat(
            commonFormat: .pcmFormatInt16,
            sampleRate: 16000,
            channels: 1,
            interleaved: true
        )!

        setupEngine()
    }

    // MARK: - Setup

    private func setupEngine() {
        audioEngine.attach(playerNode)

        // Connect player → mixer with our format
        let mixer = audioEngine.mainMixerNode
        audioEngine.connect(playerNode, to: mixer, format: audioFormat)

        // Set mixer volume (mic audio alongside video)
        mixer.outputVolume = 1.0
    }

    /// Wire up socket event listeners. Call after socket connects.
    func attach(to socketService: SocketPairingService) {
        self.socketService = socketService

        socketService.on("audio_start") { [weak self] data in
            Task { @MainActor in
                guard let self = self,
                      let dict = data.first as? [String: Any],
                      let socketId = dict["socketId"] as? String else { return }
                self.activeSenders.insert(socketId)
                self.isReceiving = true
                self.startEngineIfNeeded()
            }
        }

        socketService.on("audio_stop") { [weak self] data in
            Task { @MainActor in
                guard let self = self,
                      let dict = data.first as? [String: Any],
                      let socketId = dict["socketId"] as? String else { return }
                self.activeSenders.remove(socketId)
                if self.activeSenders.isEmpty {
                    self.isReceiving = false
                    self.audioLevel = 0
                    self.stopEngine()
                }
            }
        }

        socketService.on("audio_chunk") { [weak self] data in
            Task { @MainActor in
                guard let self = self,
                      let base64String = data.first as? String else { return }
                self.playChunk(base64: base64String)
            }
        }
    }

    // MARK: - Playback

    private func startEngineIfNeeded() {
        guard !audioEngine.isRunning else { return }
        do {
            try audioEngine.start()
            playerNode.play()
        } catch {
            print("[AudioStream] Failed to start engine: \(error)")
        }
    }

    private func stopEngine() {
        playerNode.stop()
        if audioEngine.isRunning {
            audioEngine.stop()
        }
    }

    private func playChunk(base64: String) {
        guard let rawData = Data(base64Encoded: base64) else { return }

        startEngineIfNeeded()

        // WAV files have a 44-byte header; skip it to get raw PCM
        let headerSize = 44
        let pcmData: Data
        if rawData.count > headerSize {
            pcmData = rawData.subdata(in: headerSize..<rawData.count)
        } else {
            pcmData = rawData
        }

        let frameCount = UInt32(pcmData.count) / audioFormat.streamDescription.pointee.mBytesPerFrame
        guard frameCount > 0,
              let buffer = AVAudioPCMBuffer(pcmFormat: audioFormat, frameCapacity: frameCount) else { return }

        buffer.frameLength = frameCount

        // Copy PCM data into the buffer
        pcmData.withUnsafeBytes { rawBuf in
            if let baseAddr = rawBuf.baseAddress,
               let dest = buffer.int16ChannelData?[0] {
                memcpy(dest, baseAddr, Int(pcmData.count))
            }
        }

        // Calculate peak audio level from PCM samples
        if let int16Data = buffer.int16ChannelData?[0] {
            var maxAmplitude: Int16 = 0
            for i in 0..<Int(frameCount) {
                let sample = abs(int16Data[i])
                if sample > maxAmplitude { maxAmplitude = sample }
            }
            let normalized = Float(maxAmplitude) / 32767.0
            // Smooth with exponential moving average
            self.audioLevel = 0.6 * self.audioLevel + 0.4 * normalized
        }

        playerNode.scheduleBuffer(buffer, completionHandler: nil)
    }

    // MARK: - Cleanup

    func detach() {
        stopEngine()
        activeSenders.removeAll()
        isReceiving = false
        audioLevel = 0
        socketService = nil
    }
}
