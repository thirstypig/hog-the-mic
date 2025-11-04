export class VocalAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private dataArray: Uint8Array | null = null;
  private pitchHistory: number[] = [];
  private timingHistory: number[] = [];
  private isMonitoring: boolean = false;

  async initialize() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = 1.0;
      
      this.microphone = this.audioContext.createMediaStreamSource(stream);
      this.microphone.connect(this.analyser);
      this.analyser.connect(this.gainNode);
      
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
      
      return true;
    } catch (error) {
      console.error('Failed to initialize audio analyzer:', error);
      return false;
    }
  }

  enableMonitoring() {
    if (this.gainNode && this.audioContext && !this.isMonitoring) {
      this.gainNode.connect(this.audioContext.destination);
      this.isMonitoring = true;
    }
  }

  disableMonitoring() {
    if (this.gainNode && this.audioContext && this.isMonitoring) {
      this.gainNode.disconnect(this.audioContext.destination);
      this.isMonitoring = false;
    }
  }

  setMonitoringVolume(volume: number) {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  getIsMonitoring(): boolean {
    return this.isMonitoring;
  }

  detectPitch(): number {
    if (!this.analyser || !this.dataArray) return 0;

    this.analyser.getByteTimeDomainData(this.dataArray);
    
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      const value = (this.dataArray[i] - 128) / 128;
      sum += value * value;
    }
    
    const rms = Math.sqrt(sum / this.dataArray.length);
    const pitch = Math.min(100, rms * 200);
    
    this.pitchHistory.push(pitch);
    if (this.pitchHistory.length > 100) {
      this.pitchHistory.shift();
    }
    
    return pitch;
  }

  recordTiming(expectedTime: number, actualTime: number) {
    const timingAccuracy = Math.max(0, 100 - Math.abs(expectedTime - actualTime) * 10);
    this.timingHistory.push(timingAccuracy);
    if (this.timingHistory.length > 100) {
      this.timingHistory.shift();
    }
  }

  calculateScores(): {
    pitchScore: number;
    timingScore: number;
    rhythmScore: number;
    totalScore: number;
  } {
    const pitchScore = this.pitchHistory.length > 0
      ? Math.min(100, Math.round(
          this.pitchHistory.reduce((a, b) => a + b, 0) / this.pitchHistory.length
        ))
      : 70;

    const timingScore = this.timingHistory.length > 0
      ? Math.round(
          this.timingHistory.reduce((a, b) => a + b, 0) / this.timingHistory.length
        )
      : 75;

    const rhythmScore = Math.round((pitchScore + timingScore) / 2 + Math.random() * 10 - 5);

    const totalScore = Math.round((pitchScore + timingScore + rhythmScore) / 3);

    return {
      pitchScore: Math.min(100, Math.max(0, pitchScore)),
      timingScore: Math.min(100, Math.max(0, timingScore)),
      rhythmScore: Math.min(100, Math.max(0, rhythmScore)),
      totalScore: Math.min(100, Math.max(0, totalScore)),
    };
  }

  reset() {
    this.pitchHistory = [];
    this.timingHistory = [];
  }

  cleanup() {
    this.disableMonitoring();
    if (this.microphone) {
      this.microphone.disconnect();
    }
    if (this.gainNode) {
      this.gainNode.disconnect();
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}
