export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private initialized = false;
  private currentlyPlaying: Map<string, OscillatorNode[]> = new Map();

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.initialized = true;
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

  get isInitialized(): boolean {
    return this.initialized;
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
    const gainNodes: GainNode[] = [];
    const filterNode = this.audioContext.createBiquadFilter();
    const finalGain = this.audioContext.createGain();
    
    // Configure instrument presets
    const presets = this.getInstrumentPreset(instrument);
    const currentTime = this.audioContext.currentTime;

    // Create complex harmonic structure
    presets.waveforms.forEach((waveform: OscillatorType, index: number) => {
      const osc = this.audioContext!.createOscillator();
      const oscGain = this.audioContext!.createGain();
      
      osc.type = waveform;
      const oscFreq = frequency * presets.detuning[index];
      osc.frequency.setValueAtTime(oscFreq, currentTime);
      
      // Add harmonic content
      if (presets.harmonics && presets.harmonics[index]) {
        oscGain.gain.setValueAtTime(presets.harmonics[index] * velocity * 0.3, currentTime);
      } else {
        oscGain.gain.setValueAtTime(velocity * 0.2, currentTime);
      }
      
      // Add modulation if specified
      if (presets.modulation) {
        const lfo = this.audioContext!.createOscillator();
        const lfoGain = this.audioContext!.createGain();
        
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(presets.modulation.rate, currentTime);
        lfoGain.gain.setValueAtTime(presets.modulation.depth * oscFreq, currentTime);
        
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        
        lfo.start(currentTime);
        lfo.stop(currentTime + duration);
      }
      
      osc.connect(oscGain);
      oscGain.connect(filterNode);
      oscillators.push(osc);
      gainNodes.push(oscGain);
    });

    // Multi-stage filter for more realistic timbre
    const filter2 = this.audioContext.createBiquadFilter();
    filterNode.type = presets.filterType;
    filterNode.frequency.setValueAtTime(presets.cutoff, currentTime);
    filterNode.Q.setValueAtTime(presets.resonance, currentTime);
    
    filter2.type = 'highpass';
    filter2.frequency.setValueAtTime(Math.max(20, presets.cutoff * 0.1), currentTime);
    
    // Add filter envelope
    const filterEnvelope = presets.cutoff * (1 + velocity * 0.5);
    filterNode.frequency.linearRampToValueAtTime(filterEnvelope, currentTime + presets.attack);
    filterNode.frequency.exponentialRampToValueAtTime(presets.cutoff, currentTime + presets.attack + presets.decay);

    // Advanced ADSR envelope with realistic curves
    const baseVolume = Math.max(0.001, velocity * presets.volume * 0.4);
    const sustainTime = Math.max(0.05, duration - presets.release);
    const sustainLevel = Math.max(0.001, baseVolume * presets.sustain);
    
    finalGain.gain.setValueAtTime(0.001, currentTime);
    
    // Attack with exponential curve for more natural sound
    finalGain.gain.exponentialRampToValueAtTime(baseVolume, currentTime + Math.max(0.005, presets.attack));
    
    // Decay with logarithmic curve
    finalGain.gain.setTargetAtTime(sustainLevel, currentTime + presets.attack, presets.decay / 3);
    
    // Release with exponential decay
    finalGain.gain.setTargetAtTime(0.001, currentTime + sustainTime, presets.release / 4);

    // Connect audio chain
    filterNode.connect(filter2);
    filter2.connect(finalGain);
    finalGain.connect(this.masterGain);

    // Start all oscillators with slight randomization for realism
    oscillators.forEach((osc, index) => {
      const startOffset = Math.random() * 0.002; // Small random offset
      osc.start(currentTime + startOffset);
      osc.stop(currentTime + duration + startOffset);
    });

    // Track playing notes
    const trackingKey = `${instrument}_${frequency}_${Date.now()}`;
    this.currentlyPlaying.set(trackingKey, oscillators);

    setTimeout(() => {
      this.currentlyPlaying.delete(trackingKey);
    }, (duration + 0.5) * 1000);
  }

  private getInstrumentPreset(instrument: string) {
    const presets: { [key: string]: any } = {
      // PIANO CATEGORY - Much more realistic piano sounds
      'piano-keyboard': {
        waveforms: ['triangle', 'sine', 'square'],
        detuning: [1, 1.002, 0.998],
        volume: 1.2,
        attack: 0.008,
        decay: 0.4,
        sustain: 0.3,
        release: 2.8,
        filterType: 'lowpass',
        cutoff: 4000,
        resonance: 2.5,
        harmonics: [1, 0.6, 0.4, 0.3, 0.2, 0.15, 0.1],
        modulation: {
          type: 'tremolo',
          rate: 0.8,
          depth: 0.05
        }
      },
      'piano-grand': {
        waveforms: ['sine', 'triangle', 'sawtooth'],
        detuning: [1, 1.001, 0.999],
        volume: 1.1,
        attack: 0.01,
        decay: 0.4,
        sustain: 0.6,
        release: 2.5,
        filterType: 'lowpass',
        cutoff: 4000,
        resonance: 0.8,
        harmonics: [1, 0.5, 0.2, 0.1]
      },
      'piano-organ': {
        waveforms: ['sine', 'square'],
        detuning: [1, 2, 3],
        volume: 0.9,
        attack: 0.02,
        decay: 0.1,
        sustain: 0.9,
        release: 0.8,
        filterType: 'lowpass',
        cutoff: 2500,
        resonance: 2,
        harmonics: [1, 0.8, 0.4, 0.3]
      },

      // STRINGS CATEGORY - Much more realistic string instruments
      'strings-guitar': {
        waveforms: ['sawtooth', 'triangle', 'sine'],
        detuning: [1, 1.005, 0.995, 2.01],
        volume: 1.1,
        attack: 0.02,
        decay: 0.6,
        sustain: 0.4,
        release: 3.5,
        filterType: 'lowpass',
        cutoff: 3200,
        resonance: 8,
        harmonics: [1, 0.8, 0.6, 0.4, 0.3, 0.25, 0.2, 0.15, 0.1],
        modulation: {
          type: 'vibrato',
          rate: 4.2,
          depth: 0.02
        },
        pluck: {
          enabled: true,
          decay: 0.8
        }
      },
      'strings-violin': {
        waveforms: ['sawtooth', 'triangle', 'sine'],
        detuning: [1, 1.002, 0.998, 2.005],
        volume: 0.9,
        attack: 0.25,
        decay: 0.1,
        sustain: 0.95,
        release: 2.8,
        filterType: 'bandpass',
        cutoff: 2800,
        resonance: 12,
        harmonics: [1, 0.9, 0.7, 0.5, 0.4, 0.35, 0.3, 0.25, 0.2, 0.15],
        modulation: {
          type: 'vibrato',
          rate: 5.8,
          depth: 0.08
        },
        bow: {
          enabled: true,
          pressure: 0.7
        }
      },
      'strings-ukulele': {
        waveforms: ['triangle', 'sine'],
        detuning: [1, 1.005],
        volume: 0.6,
        attack: 0.02,
        decay: 0.4,
        sustain: 0.5,
        release: 1.0,
        filterType: 'lowpass',
        cutoff: 3200,
        resonance: 2,
        harmonics: [1, 0.4, 0.2]
      },

      // FLUTE CATEGORY
      'flute-recorder': {
        waveforms: ['sine', 'triangle'],
        detuning: [1, 2],
        volume: 0.6,
        attack: 0.08,
        decay: 0.1,
        sustain: 0.8,
        release: 0.6,
        filterType: 'highpass',
        cutoff: 600,
        resonance: 1,
        harmonics: [1, 0.3, 0.1]
      },
      'flute-indian': {
        waveforms: ['sine'],
        detuning: [1, 1.5],
        volume: 0.7,
        attack: 0.12,
        decay: 0.15,
        sustain: 0.9,
        release: 1.2,
        filterType: 'bandpass',
        cutoff: 1200,
        resonance: 3,
        harmonics: [1, 0.5, 0.2]
      },
      'flute-concert': {
        waveforms: ['sine', 'triangle'],
        detuning: [1, 1.001],
        volume: 0.8,
        attack: 0.1,
        decay: 0.2,
        sustain: 0.85,
        release: 1.0,
        filterType: 'highpass',
        cutoff: 800,
        resonance: 1.5,
        harmonics: [1, 0.4, 0.15, 0.05]
      },

      // HORNS CATEGORY
      'horns-trumpet': {
        waveforms: ['sawtooth', 'square'],
        detuning: [1, 1.01],
        volume: 0.9,
        attack: 0.1,
        decay: 0.15,
        sustain: 0.8,
        release: 1.2,
        filterType: 'bandpass',
        cutoff: 1800,
        resonance: 5,
        harmonics: [1, 0.8, 0.5, 0.3]
      },
      'horns-trombone': {
        waveforms: ['sawtooth', 'triangle'],
        detuning: [1, 1.005],
        volume: 1.0,
        attack: 0.15,
        decay: 0.2,
        sustain: 0.9,
        release: 1.8,
        filterType: 'bandpass',
        cutoff: 1200,
        resonance: 4,
        harmonics: [1, 0.7, 0.4, 0.2]
      },
      'horns-french': {
        waveforms: ['triangle', 'sine'],
        detuning: [1, 1.002],
        volume: 0.8,
        attack: 0.12,
        decay: 0.18,
        sustain: 0.85,
        release: 1.5,
        filterType: 'bandpass',
        cutoff: 1500,
        resonance: 3,
        harmonics: [1, 0.6, 0.3, 0.15]
      },

      // SYNTH CATEGORY
      'synth-analog': {
        waveforms: ['sawtooth', 'square'],
        detuning: [1, 0.995],
        volume: 0.8,
        attack: 0.05,
        decay: 0.3,
        sustain: 0.5,
        release: 0.4,
        filterType: 'lowpass',
        cutoff: 1800,
        resonance: 8,
        harmonics: [1, 0.6, 0.3]
      },
      'synth-digital': {
        waveforms: ['square', 'triangle'],
        detuning: [1, 1.01, 0.99],
        volume: 0.7,
        attack: 0.01,
        decay: 0.2,
        sustain: 0.4,
        release: 0.3,
        filterType: 'lowpass',
        cutoff: 2200,
        resonance: 12,
        harmonics: [1, 0.8, 0.4, 0.2]
      },
      'synth-fm': {
        waveforms: ['sine', 'triangle'],
        detuning: [1, 3.14, 7.1],
        volume: 0.6,
        attack: 0.02,
        decay: 0.25,
        sustain: 0.3,
        release: 0.5,
        filterType: 'lowpass',
        cutoff: 2000,
        resonance: 6,
        harmonics: [1, 0.5, 0.8, 0.3, 0.1]
      },

      // BASS CATEGORY
      'bass-electric': {
        waveforms: ['sawtooth', 'square'],
        detuning: [0.5, 0.501],
        volume: 1.3,
        attack: 0.01,
        decay: 0.1,
        sustain: 0.8,
        release: 0.3,
        filterType: 'lowpass',
        cutoff: 400,
        resonance: 6,
        harmonics: [1, 0.7, 0.3]
      },
      'bass-upright': {
        waveforms: ['triangle', 'sine'],
        detuning: [0.5, 0.502],
        volume: 1.1,
        attack: 0.03,
        decay: 0.2,
        sustain: 0.6,
        release: 0.8,
        filterType: 'lowpass',
        cutoff: 350,
        resonance: 3,
        harmonics: [1, 0.5, 0.2]
      },
      'bass-synth': {
        waveforms: ['square', 'sawtooth'],
        detuning: [0.5, 0.499],
        volume: 1.4,
        attack: 0.005,
        decay: 0.05,
        sustain: 0.9,
        release: 0.2,
        filterType: 'lowpass',
        cutoff: 500,
        resonance: 10,
        harmonics: [1, 0.8, 0.4]
      },

      // PADS CATEGORY
      'pads-warm': {
        waveforms: ['sine', 'triangle', 'sawtooth'],
        detuning: [1, 1.003, 0.997],
        volume: 0.5,
        attack: 0.8,
        decay: 0.5,
        sustain: 0.9,
        release: 3.0,
        filterType: 'lowpass',
        cutoff: 1500,
        resonance: 2,
        harmonics: [1, 0.6, 0.3, 0.1]
      },
      'pads-strings': {
        waveforms: ['sawtooth', 'triangle'],
        detuning: [1, 1.002, 1.005],
        volume: 0.6,
        attack: 1.0,
        decay: 0.3,
        sustain: 0.85,
        release: 2.5,
        filterType: 'lowpass',
        cutoff: 2000,
        resonance: 3,
        harmonics: [1, 0.7, 0.4, 0.2]
      },
      'pads-choir': {
        waveforms: ['sine', 'triangle'],
        detuning: [1, 1.001, 0.999, 1.004],
        volume: 0.4,
        attack: 1.2,
        decay: 0.4,
        sustain: 0.9,
        release: 2.8,
        filterType: 'bandpass',
        cutoff: 1800,
        resonance: 4,
        harmonics: [1, 0.8, 0.5, 0.3, 0.1]
      },

      // LEADS CATEGORY
      'leads-square': {
        waveforms: ['square'],
        detuning: [1],
        volume: 0.8,
        attack: 0.02,
        decay: 0.2,
        sustain: 0.6,
        release: 0.5,
        filterType: 'lowpass',
        cutoff: 2500,
        resonance: 8,
        harmonics: [1, 0.3, 0.1]
      },
      'leads-saw': {
        waveforms: ['sawtooth'],
        detuning: [1, 1.002],
        volume: 0.7,
        attack: 0.01,
        decay: 0.15,
        sustain: 0.5,
        release: 0.4,
        filterType: 'lowpass',
        cutoff: 2800,
        resonance: 10,
        harmonics: [1, 0.6, 0.3, 0.1]
      },
      'leads-pluck': {
        waveforms: ['sawtooth', 'triangle'],
        detuning: [1, 1.001],
        volume: 0.9,
        attack: 0.005,
        decay: 0.1,
        sustain: 0.3,
        release: 0.3,
        filterType: 'lowpass',
        cutoff: 3000,
        resonance: 6,
        harmonics: [1, 0.4, 0.2]
      }
    };

    return presets[instrument] || presets['piano-keyboard'];
  }

  playDrumSound(type: string, volume: number = 0.5) {
    if (!this.audioContext || !this.masterGain) return;
    
    const currentTime = this.audioContext.currentTime;

    switch (type) {
      case 'kick':
        // Layered kick drum with punch and sub
        const kickOsc1 = this.audioContext.createOscillator();
        const kickOsc2 = this.audioContext.createOscillator();
        const kickGain1 = this.audioContext.createGain();
        const kickGain2 = this.audioContext.createGain();
        const kickFilter = this.audioContext.createBiquadFilter();
        const kickCompressor = this.audioContext.createDynamicsCompressor();

        // Main kick frequency
        kickOsc1.type = 'sine';
        kickOsc1.frequency.setValueAtTime(65, currentTime);
        kickOsc1.frequency.exponentialRampToValueAtTime(25, currentTime + 0.08);
        
        // Sub layer
        kickOsc2.type = 'triangle';
        kickOsc2.frequency.setValueAtTime(40, currentTime);
        kickOsc2.frequency.exponentialRampToValueAtTime(20, currentTime + 0.12);
        
        // Envelope with punch
        kickGain1.gain.setValueAtTime(Math.max(0.001, volume * 1.8), currentTime);
        kickGain1.gain.exponentialRampToValueAtTime(Math.max(0.001, volume * 0.8), currentTime + 0.02);
        kickGain1.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.4);
        
        kickGain2.gain.setValueAtTime(Math.max(0.001, volume * 1.2), currentTime);
        kickGain2.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.6);
        
        kickFilter.type = 'lowpass';
        kickFilter.frequency.setValueAtTime(120, currentTime);
        kickFilter.Q.setValueAtTime(2, currentTime);
        
        // Compression for punch
        kickCompressor.threshold.setValueAtTime(-20, currentTime);
        kickCompressor.ratio.setValueAtTime(8, currentTime);
        kickCompressor.attack.setValueAtTime(0.001, currentTime);
        kickCompressor.release.setValueAtTime(0.1, currentTime);

        kickOsc1.connect(kickGain1);
        kickOsc2.connect(kickGain2);
        kickGain1.connect(kickFilter);
        kickGain2.connect(kickFilter);
        kickFilter.connect(kickCompressor);
        kickCompressor.connect(this.masterGain);
        
        kickOsc1.start(currentTime);
        kickOsc1.stop(currentTime + 0.5);
        kickOsc2.start(currentTime);
        kickOsc2.stop(currentTime + 0.7);
        break;

      case 'bass':
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(45, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(25, this.audioContext.currentTime + 0.15);
        gainNode.gain.setValueAtTime(Math.max(0.001, volume * 1.5), this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.8);
        filterNode.type = 'lowpass';
        filterNode.frequency.setValueAtTime(80, this.audioContext.currentTime);
        break;

      case 'snare':
        // Realistic snare with body, crack, and rattle
        const snareOsc = this.audioContext.createOscillator();
        const snareGain1 = this.audioContext.createGain();
        const snareGain2 = this.audioContext.createGain();
        const snareFilter1 = this.audioContext.createBiquadFilter();
        const snareFilter2 = this.audioContext.createBiquadFilter();

        // Body tone
        snareOsc.type = 'triangle';
        snareOsc.frequency.setValueAtTime(200, currentTime);
        snareOsc.frequency.exponentialRampToValueAtTime(80, currentTime + 0.05);
        
        // Crack/noise component
        const snareNoiseDuration = 0.15;
        const snareNoiseBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * snareNoiseDuration, this.audioContext.sampleRate);
        const snareNoiseOutput = snareNoiseBuffer.getChannelData(0);
        
        for (let i = 0; i < snareNoiseBuffer.length; i++) {
          // Pink noise for more realistic snare crack
          const white = Math.random() * 2 - 1;
          const pink = white * Math.pow(0.5, i / snareNoiseBuffer.length);
          snareNoiseOutput[i] = pink * (1 - i / snareNoiseBuffer.length);
        }
        
        const snareNoise = this.audioContext.createBufferSource();
        snareNoise.buffer = snareNoiseBuffer;
        
        // Body envelope
        snareGain1.gain.setValueAtTime(Math.max(0.001, volume * 0.6), currentTime);
        snareGain1.gain.exponentialRampToValueAtTime(Math.max(0.001, volume * 0.2), currentTime + 0.02);
        snareGain1.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.12);
        
        // Crack envelope
        snareGain2.gain.setValueAtTime(Math.max(0.001, volume * 0.8), currentTime);
        snareGain2.gain.exponentialRampToValueAtTime(0.001, currentTime + snareNoiseDuration);
        
        // Multi-band filtering
        snareFilter1.type = 'highpass';
        snareFilter1.frequency.setValueAtTime(150, currentTime);
        snareFilter1.Q.setValueAtTime(1, currentTime);
        
        snareFilter2.type = 'bandpass';
        snareFilter2.frequency.setValueAtTime(2500, currentTime);
        snareFilter2.Q.setValueAtTime(3, currentTime);
        
        snareOsc.connect(snareGain1);
        snareGain1.connect(snareFilter1);
        snareFilter1.connect(this.masterGain);
        
        snareNoise.connect(snareGain2);
        snareGain2.connect(snareFilter2);
        snareFilter2.connect(this.masterGain);
        
        snareOsc.start(currentTime);
        snareOsc.stop(currentTime + 0.15);
        snareNoise.start(currentTime);
        snareNoise.stop(currentTime + snareNoiseDuration);
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
        gainNode.gain.setValueAtTime(Math.max(0.001, volume * (type === 'openhat' ? 0.15 : 0.1)), this.audioContext.currentTime);
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
          clapGain.gain.setValueAtTime(Math.max(0.001, volume * 0.2), this.audioContext.currentTime + i * 0.01);
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
        gainNode.gain.setValueAtTime(Math.max(0.001, volume * 0.3), this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 1.5);
        filterNode.type = 'highpass';
        filterNode.frequency.setValueAtTime(3000, this.audioContext.currentTime);
        crashNoise.connect(gainNode);
        crashNoise.start();
        crashNoise.stop(this.audioContext.currentTime + 1.5);
        break;

      default:
        oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
        gainNode.gain.setValueAtTime(Math.max(0.001, volume * 0.2), this.audioContext.currentTime);
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
      this.initialized = false;
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