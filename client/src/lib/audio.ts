export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private initialized = false;
  private currentlyPlaying: Map<string, OscillatorNode[]> = new Map();

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

  playNote(frequency: number, duration: number = 0.5, instrument: string = 'piano', velocity: number = 0.7) {
    if (!this.audioContext || !this.masterGain) return;

    const oscillators: OscillatorNode[] = [];
    const gainNode = this.audioContext.createGain();
    const filterNode = this.audioContext.createBiquad2Filter();

    // Configure instrument presets
    const presets = this.getInstrumentPreset(instrument);

    // Create oscillators based on instrument type
    presets.waveforms.forEach((waveform, index) => {
      const osc = this.audioContext!.createOscillator();
      osc.type = waveform;
      osc.frequency.setValueAtTime(frequency * presets.detuning[index], this.audioContext!.currentTime);
      oscillators.push(osc);
      osc.connect(gainNode);
    });

    // Configure filter
    filterNode.type = presets.filterType;
    filterNode.frequency.setValueAtTime(presets.cutoff, this.audioContext.currentTime);
    filterNode.Q.setValueAtTime(presets.resonance, this.audioContext.currentTime);

    // ADSR Envelope
    const baseVolume = velocity * presets.volume * 0.3;
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(baseVolume, this.audioContext.currentTime + presets.attack);
    gainNode.gain.exponentialRampToValueAtTime(baseVolume * presets.sustain, this.audioContext.currentTime + presets.attack + presets.decay);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration - presets.release);

    gainNode.connect(filterNode);
    filterNode.connect(this.masterGain);

    // Start oscillators
    oscillators.forEach(osc => {
      osc.start(this.audioContext!.currentTime);
      osc.stop(this.audioContext!.currentTime + duration);
    });

    // Track playing notes for stopping
    const trackingKey = `${instrument}_${frequency}`;
    this.currentlyPlaying.set(trackingKey, oscillators);

    setTimeout(() => {
      this.currentlyPlaying.delete(trackingKey);
    }, duration * 1000);
  }

  private getInstrumentPreset(instrument: string) {
    const presets: { [key: string]: any } = {
      piano: {
        waveforms: ['sine', 'triangle'],
        detuning: [1, 1.001],
        volume: 1.0,
        attack: 0.01,
        decay: 0.3,
        sustain: 0.7,
        release: 1.0,
        filterType: 'lowpass',
        cutoff: 2000,
        resonance: 1
      },
      bass: {
        waveforms: ['sawtooth', 'square'],
        detuning: [0.5, 0.501],
        volume: 1.2,
        attack: 0.01,
        decay: 0.1,
        sustain: 0.8,
        release: 0.3,
        filterType: 'lowpass',
        cutoff: 400,
        resonance: 4
      },
      lead: {
        waveforms: ['sawtooth'],
        detuning: [1],
        volume: 0.8,
        attack: 0.02,
        decay: 0.2,
        sustain: 0.6,
        release: 0.5,
        filterType: 'lowpass',
        cutoff: 2500,
        resonance: 6
      },
      strings: {
        waveforms: ['sawtooth', 'triangle'],
        detuning: [1, 1.002],
        volume: 0.6,
        attack: 0.2,
        decay: 0.1,
        sustain: 0.9,
        release: 2.0,
        filterType: 'lowpass',
        cutoff: 3000,
        resonance: 2
      },
      flute: {
        waveforms: ['sine'],
        detuning: [1],
        volume: 0.7,
        attack: 0.1,
        decay: 0.2,
        sustain: 0.8,
        release: 0.8,
        filterType: 'highpass',
        cutoff: 800,
        resonance: 1
      },
      synth: {
        waveforms: ['square', 'sawtooth'],
        detuning: [1, 0.99],
        volume: 0.8,
        attack: 0.05,
        decay: 0.3,
        sustain: 0.5,
        release: 0.4,
        filterType: 'lowpass',
        cutoff: 1800,
        resonance: 8
      },
      horn: {
        waveforms: ['triangle', 'sawtooth'],
        detuning: [1, 1.01],
        volume: 0.9,
        attack: 0.1,
        decay: 0.2,
        sustain: 0.7,
        release: 1.5,
        filterType: 'bandpass',
        cutoff: 1500,
        resonance: 3
      }
    };

    return presets[instrument] || presets.piano;
  }

  playDrumSound(type: string, volume: number = 0.5) {
    if (!this.audioContext || !this.masterGain) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filterNode = this.audioContext.createBiquadFilter();

    switch (type) {
      case 'kick':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(60, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(20, this.audioContext.currentTime + 0.1);
        gainNode.gain.setValueAtTime(volume * 1.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.5);
        filterNode.type = 'lowpass';
        filterNode.frequency.setValueAtTime(150, this.audioContext.currentTime);
        break;

      case 'bass':
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(45, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(25, this.audioContext.currentTime + 0.15);
        gainNode.gain.setValueAtTime(volume * 1.5, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.8);
        filterNode.type = 'lowpass';
        filterNode.frequency.setValueAtTime(80, this.audioContext.currentTime);
        break;

      case 'snare':
        const noiseBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 0.1, this.audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseBuffer.length; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        const noise = this.audioContext.createBufferSource();
        noise.buffer = noiseBuffer;
        gainNode.gain.setValueAtTime(volume * 0.4, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.2);
        filterNode.type = 'bandpass';
        filterNode.frequency.setValueAtTime(2000, this.audioContext.currentTime);
        filterNode.Q.setValueAtTime(1, this.audioContext.currentTime);
        noise.connect(gainNode);
        noise.start();
        noise.stop(this.audioContext.currentTime + 0.2);
        break;

      case 'hihat':
      case 'openhat':
        const duration = type === 'openhat' ? 0.3 : 0.05;
        const hihatBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * duration, this.audioContext.sampleRate);
        const hihatOutput = hihatBuffer.getChannelData(0);
        for (let i = 0; i < hihatBuffer.length; i++) {
          hihatOutput[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / hihatBuffer.length, type === 'openhat' ? 0.5 : 2);
        }
        const hihatNoise = this.audioContext.createBufferSource();
        hihatNoise.buffer = hihatBuffer;
        gainNode.gain.setValueAtTime(volume * (type === 'openhat' ? 0.15 : 0.1), this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        filterNode.type = 'highpass';
        filterNode.frequency.setValueAtTime(8000, this.audioContext.currentTime);
        hihatNoise.connect(gainNode);
        hihatNoise.start();
        hihatNoise.stop(this.audioContext.currentTime + duration);
        break;

      case 'clap':
        // Create multiple short bursts for clap sound
        for (let i = 0; i < 3; i++) {
          const clapBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 0.01, this.audioContext.sampleRate);
          const clapOutput = clapBuffer.getChannelData(0);
          for (let j = 0; j < clapBuffer.length; j++) {
            clapOutput[j] = Math.random() * 2 - 1;
          }
          const clapNoise = this.audioContext.createBufferSource();
          clapNoise.buffer = clapBuffer;
          const clapGain = this.audioContext.createGain();
          clapGain.gain.setValueAtTime(volume * 0.2, this.audioContext.currentTime + i * 0.01);
          clapNoise.connect(clapGain);
          clapGain.connect(this.masterGain);
          clapNoise.start(this.audioContext.currentTime + i * 0.01);
        }
        return;

      case 'crash':
        const crashBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 1.5, this.audioContext.sampleRate);
        const crashOutput = crashBuffer.getChannelData(0);
        for (let i = 0; i < crashBuffer.length; i++) {
          crashOutput[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / crashBuffer.length, 0.1);
        }
        const crashNoise = this.audioContext.createBufferSource();
        crashNoise.buffer = crashBuffer;
        gainNode.gain.setValueAtTime(volume * 0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 1.5);
        filterNode.type = 'highpass';
        filterNode.frequency.setValueAtTime(3000, this.audioContext.currentTime);
        crashNoise.connect(gainNode);
        crashNoise.start();
        crashNoise.stop(this.audioContext.currentTime + 1.5);
        break;

      default:
        oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
        gainNode.gain.setValueAtTime(volume * 0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
    }

    if (type !== 'snare' && type !== 'hihat' && type !== 'openhat' && type !== 'clap' && type !== 'crash') {
      oscillator.connect(filterNode);
      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + 0.8);
    }

    if (type !== 'clap') {
      filterNode.connect(gainNode);
      gainNode.connect(this.masterGain);
    }
  }

  stopAllSounds() {
    this.currentlyPlaying.forEach((oscillators, key) => {
      oscillators.forEach(osc => {
        try {
          osc.stop();
        } catch (e) {
          // Oscillator may already be stopped
        }
      });
    });
    this.currentlyPlaying.clear();
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