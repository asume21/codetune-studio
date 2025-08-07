export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private tracks: Map<string, AudioTrack> = new Map();
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.isInitialized = true;
    } catch (error) {
      console.error("Failed to initialize audio context:", error);
      throw new Error("Audio initialization failed");
    }
  }

  async resumeContext(): Promise<void> {
    if (this.audioContext?.state === "suspended") {
      await this.audioContext.resume();
    }
  }

  createOscillator(frequency: number, type: OscillatorType = "sine"): OscillatorNode {
    if (!this.audioContext) throw new Error("Audio context not initialized");
    
    const oscillator = this.audioContext.createOscillator();
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = type;
    return oscillator;
  }

  createGain(initialValue: number = 1): GainNode {
    if (!this.audioContext) throw new Error("Audio context not initialized");
    
    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(initialValue, this.audioContext.currentTime);
    return gain;
  }

  playNote(frequency: number, duration: number = 0.5, volume: number = 0.3): void {
    if (!this.audioContext || !this.masterGain) return;

    const oscillator = this.createOscillator(frequency, "sawtooth");
    const gainNode = this.createGain(0);
    
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    const now = this.audioContext.currentTime;
    
    // ADSR envelope
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.01); // Attack
    gainNode.gain.exponentialRampToValueAtTime(volume * 0.7, now + 0.1); // Decay
    gainNode.gain.setValueAtTime(volume * 0.7, now + duration - 0.1); // Sustain
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration); // Release

    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  playDrumSound(type: string, volume: number = 0.5): void {
    if (!this.audioContext || !this.masterGain) return;

    const now = this.audioContext.currentTime;
    
    switch (type) {
      case "kick":
        this.playKick(now, volume);
        break;
      case "snare":
        this.playSnare(now, volume);
        break;
      case "hihat":
        this.playHiHat(now, volume);
        break;
      case "openhat":
        this.playOpenHat(now, volume);
        break;
    }
  }

  private playKick(time: number, volume: number): void {
    if (!this.audioContext || !this.masterGain) return;

    const oscillator = this.createOscillator(60, "sine");
    const gainNode = this.createGain(0);
    
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    gainNode.gain.setValueAtTime(volume, time);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.5);

    oscillator.frequency.setValueAtTime(60, time);
    oscillator.frequency.exponentialRampToValueAtTime(30, time + 0.1);

    oscillator.start(time);
    oscillator.stop(time + 0.5);
  }

  private playSnare(time: number, volume: number): void {
    if (!this.audioContext || !this.masterGain) return;

    // Create noise buffer
    const bufferSize = this.audioContext.sampleRate * 0.2;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(1000, time);

    const gainNode = this.createGain(0);

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);

    gainNode.gain.setValueAtTime(volume, time);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

    noise.start(time);
    noise.stop(time + 0.2);
  }

  private playHiHat(time: number, volume: number): void {
    if (!this.audioContext || !this.masterGain) return;

    const oscillator1 = this.createOscillator(8000, "square");
    const oscillator2 = this.createOscillator(10000, "square");
    
    const gainNode = this.createGain(0);
    
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(this.masterGain);

    gainNode.gain.setValueAtTime(volume * 0.3, time);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    oscillator1.start(time);
    oscillator1.stop(time + 0.1);
    oscillator2.start(time);
    oscillator2.stop(time + 0.1);
  }

  private playOpenHat(time: number, volume: number): void {
    if (!this.audioContext || !this.masterGain) return;

    const oscillator1 = this.createOscillator(8000, "square");
    const oscillator2 = this.createOscillator(10000, "square");
    
    const gainNode = this.createGain(0);
    
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(this.masterGain);

    gainNode.gain.setValueAtTime(volume * 0.2, time);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.5);

    oscillator1.start(time);
    oscillator1.stop(time + 0.5);
    oscillator2.start(time);
    oscillator2.stop(time + 0.5);
  }

  setMasterVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(volume, this.audioContext?.currentTime || 0);
    }
  }

  // Note frequency mapping
  static getNoteFrequency(note: string, octave: number = 4): number {
    const noteMap: { [key: string]: number } = {
      'C': 261.63,
      'C#': 277.18, 'Db': 277.18,
      'D': 293.66,
      'D#': 311.13, 'Eb': 311.13,
      'E': 329.63,
      'F': 349.23,
      'F#': 369.99, 'Gb': 369.99,
      'G': 392.00,
      'G#': 415.30, 'Ab': 415.30,
      'A': 440.00,
      'A#': 466.16, 'Bb': 466.16,
      'B': 493.88,
    };

    const baseFreq = noteMap[note.toUpperCase()];
    if (!baseFreq) return 440; // Default to A4

    // Adjust for octave (C4 is middle C)
    const octaveMultiplier = Math.pow(2, octave - 4);
    return baseFreq * octaveMultiplier;
  }

  destroy(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.masterGain = null;
      this.isInitialized = false;
    }
  }
}

interface AudioTrack {
  id: string;
  gainNode: GainNode;
  panNode: StereoPannerNode;
  effects: AudioNode[];
}

// Global audio engine instance
export const audioEngine = new AudioEngine();
