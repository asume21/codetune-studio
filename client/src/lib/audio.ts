
export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private initialized = false;
  private currentlyPlaying: Map<string, OscillatorNode[]> = new Map();
  private reverbBuffer: AudioBuffer | null = null;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      
      // Create reverb impulse response for more realistic sound
      await this.createReverbBuffer();
      
      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize audio context:", error);
      throw new Error("Audio initialization failed");
    }
  }

  private async createReverbBuffer(): Promise<void> {
    if (!this.audioContext) return;
    
    const length = this.audioContext.sampleRate * 3; // 3 second reverb
    this.reverbBuffer = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = this.reverbBuffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const decay = Math.pow(1 - i / length, 2);
        channelData[i] = (Math.random() * 2 - 1) * decay * 0.1;
      }
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
    if (!this.audioContext || !this.masterGain) {
      console.error("Audio context not initialized");
      return;
    }

    try {
      const preset = this.getInstrumentPreset(instrument);
      const currentTime = this.audioContext.currentTime;

      // Use specialized synthesis based on instrument type
      if (instrument.includes('piano') || instrument.includes('grand') || instrument.includes('keyboard') || instrument.includes('organ')) {
        this.playPianoNote(frequency, duration, preset, velocity, currentTime, instrument);
      } else if (instrument.includes('strings')) {
        this.playStringNote(frequency, duration, preset, velocity, currentTime);
      } else if (instrument.includes('flute')) {
        this.playFluteNote(frequency, duration, preset, velocity, currentTime);
      } else if (instrument.includes('horns')) {
        this.playHornNote(frequency, duration, preset, velocity, currentTime);
      } else if (instrument.includes('guitar')) {
        this.playGuitarNote(frequency, duration, preset, velocity, currentTime);
      } else if (instrument.includes('violin')) {
        this.playViolinNote(frequency, duration, preset, velocity, currentTime);
      } else {
        this.playGenericNote(frequency, duration, preset, velocity, currentTime);
      }
    } catch (error) {
      console.error("Failed to play note:", error);
    }
  }

  private playPianoNote(frequency: number, duration: number, preset: any, velocity: number, currentTime: number, instrument: string = 'piano') {
    if (!this.audioContext || !this.masterGain) return;
    
    // Validate input parameters
    if (!isFinite(frequency) || frequency <= 0) {
      console.warn('Invalid frequency for piano note:', frequency);
      return;
    }
    if (!isFinite(duration) || duration <= 0) {
      console.warn('Invalid duration for piano note:', duration);
      return;
    }
    if (!isFinite(velocity) || velocity < 0 || velocity > 1) {
      console.warn('Invalid velocity for piano note:', velocity);
      velocity = Math.max(0, Math.min(1, velocity || 0.7));
    }

    const oscillators: OscillatorNode[] = [];
    const masterGain = this.audioContext.createGain();
    
    // Different piano types with unique harmonic structures
    let harmonics;
    let reverbAmount = 0.15;
    let filterCutoff = frequency * 8;
    
    if (instrument.includes('grand')) {
      // Grand Piano: Rich harmonics, long sustain, warm tone
      harmonics = [
        { freq: frequency, amp: 1.0, wave: 'triangle' as OscillatorType },
        { freq: frequency * 2, amp: 0.5, wave: 'sine' as OscillatorType },
        { freq: frequency * 3, amp: 0.4, wave: 'sine' as OscillatorType },
        { freq: frequency * 4, amp: 0.3, wave: 'triangle' as OscillatorType },
        { freq: frequency * 5, amp: 0.2, wave: 'sine' as OscillatorType },
        { freq: frequency * 6, amp: 0.15, wave: 'sine' as OscillatorType },
        { freq: frequency * 7, amp: 0.1, wave: 'sine' as OscillatorType },
      ];
      reverbAmount = 0.25; // More reverb for concert hall feel
      filterCutoff = frequency * 10;
    } else if (instrument.includes('keyboard') || instrument.includes('electric')) {
      // Electric Keyboard: Brighter, more digital sound
      harmonics = [
        { freq: frequency, amp: 1.0, wave: 'sawtooth' as OscillatorType },
        { freq: frequency * 2, amp: 0.3, wave: 'square' as OscillatorType },
        { freq: frequency * 3, amp: 0.2, wave: 'sine' as OscillatorType },
        { freq: frequency * 4, amp: 0.15, wave: 'triangle' as OscillatorType },
        { freq: frequency * 0.5, amp: 0.1, wave: 'sine' as OscillatorType }, // Sub-harmonic
      ];
      reverbAmount = 0.05; // Less reverb for electric sound
      filterCutoff = frequency * 12; // Brighter
    } else if (instrument.includes('organ')) {
      // Organ: Sustained, church-like sound with drawbar harmonics
      harmonics = [
        { freq: frequency, amp: 1.0, wave: 'sine' as OscillatorType },
        { freq: frequency * 2, amp: 0.8, wave: 'sine' as OscillatorType },
        { freq: frequency * 3, amp: 0.6, wave: 'sine' as OscillatorType },
        { freq: frequency * 4, amp: 0.5, wave: 'sine' as OscillatorType },
        { freq: frequency * 5, amp: 0.4, wave: 'sine' as OscillatorType },
        { freq: frequency * 6, amp: 0.3, wave: 'sine' as OscillatorType },
        { freq: frequency * 8, amp: 0.2, wave: 'sine' as OscillatorType },
      ];
      reverbAmount = 0.35; // Cathedral reverb
      filterCutoff = frequency * 6; // Warmer tone
    } else {
      // Default acoustic piano
      harmonics = [
        { freq: frequency, amp: 1.0, wave: 'triangle' as OscillatorType },
        { freq: frequency * 2, amp: 0.4, wave: 'sine' as OscillatorType },
        { freq: frequency * 3, amp: 0.3, wave: 'sine' as OscillatorType },
        { freq: frequency * 4, amp: 0.2, wave: 'triangle' as OscillatorType },
        { freq: frequency * 5, amp: 0.15, wave: 'sine' as OscillatorType },
        { freq: frequency * 6, amp: 0.1, wave: 'sine' as OscillatorType },
      ];
    }

    harmonics.forEach((harmonic, index) => {
      const osc = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();
      const filter = this.audioContext!.createBiquadFilter();
      
      // Validate harmonic frequency
      const safeFreq = isFinite(harmonic.freq) && harmonic.freq > 0 ? harmonic.freq : frequency;
      
      osc.type = harmonic.wave;
      osc.frequency.setValueAtTime(Math.min(safeFreq, 20000), currentTime); // Cap at 20kHz
      
      // Add slight detuning for realism
      const detune = (Math.random() - 0.5) * 10;
      osc.detune.setValueAtTime(isFinite(detune) ? detune : 0, currentTime);
      
      // Piano hammer strike simulation
      const attack = 0.002 + Math.random() * 0.003;
      const initialVolume = Math.max(0.001, harmonic.amp * velocity * 0.15);
      
      // Ensure all values are finite and valid
      const safeInitialVolume = isFinite(initialVolume) && initialVolume > 0 ? Math.max(0.001, initialVolume) : 0.001;
      const safeAttackTime = isFinite(attack) && attack > 0 ? attack : 0.005;
      const safeDuration = isFinite(duration) && duration > 0 ? duration : 0.5;
      const sustainVolume = Math.max(0.001, safeInitialVolume * 0.3);
      
      gain.gain.setValueAtTime(0.001, currentTime);
      if (safeInitialVolume > 0.001) {
        gain.gain.exponentialRampToValueAtTime(safeInitialVolume, currentTime + safeAttackTime);
        gain.gain.exponentialRampToValueAtTime(sustainVolume, currentTime + 0.1);
      }
      gain.gain.exponentialRampToValueAtTime(0.001, currentTime + safeDuration);
      
      // Filter to simulate piano string resonance
      filter.type = 'lowpass';
      const safeFilterCutoff = isFinite(filterCutoff) && filterCutoff > 0 ? Math.min(8000, filterCutoff) : 2000;
      filter.frequency.setValueAtTime(safeFilterCutoff, currentTime);
      filter.Q.setValueAtTime(instrument.includes('organ') ? 1 : 2, currentTime);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      
      osc.start(currentTime);
      osc.stop(currentTime + duration);
      oscillators.push(osc);
    });

    // Add reverb based on instrument type
    this.addReverb(masterGain, reverbAmount);
    masterGain.connect(this.masterGain);

    this.trackOscillators(oscillators, 'piano', frequency);
  }

  private playStringNote(frequency: number, duration: number, preset: any, velocity: number, currentTime: number) {
    if (!this.audioContext || !this.masterGain) return;

    const oscillators: OscillatorNode[] = [];
    const masterGain = this.audioContext.createGain();
    
    // String synthesis with bow simulation
    const fundamentalOsc = this.audioContext.createOscillator();
    const noiseOsc = this.audioContext.createOscillator();
    const bowNoiseGain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    const lfo = this.audioContext.createOscillator();
    const lfoGain = this.audioContext.createGain();
    
    // Main string tone
    fundamentalOsc.type = 'sawtooth';
    fundamentalOsc.frequency.setValueAtTime(frequency, currentTime);
    
    // Bow noise simulation
    noiseOsc.type = 'sawtooth';
    noiseOsc.frequency.setValueAtTime(frequency * 4, currentTime);
    bowNoiseGain.gain.setValueAtTime(Math.max(0.001, velocity * 0.05), currentTime);
    bowNoiseGain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.1);
    
    // String vibrato
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(5.5, currentTime);
    lfoGain.gain.setValueAtTime(frequency * 0.02, currentTime);
    
    // String formant filter
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(frequency * 2.5, currentTime);
    filter.Q.setValueAtTime(8, currentTime);
    
    // Envelope with bow attack
    const stringGain = this.audioContext.createGain();
    const attackTime = 0.2 + (Math.random() * 0.1);
    const sustainLevel = Math.max(0.001, velocity * 0.4);
    
    stringGain.gain.setValueAtTime(0.001, currentTime);
    if (sustainLevel > 0.001) {
      stringGain.gain.exponentialRampToValueAtTime(sustainLevel, currentTime + attackTime);
      if (duration > 0.5) {
        stringGain.gain.setValueAtTime(sustainLevel, currentTime + duration - 0.5);
      }
    }
    stringGain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
    
    // Connect audio graph
    lfo.connect(lfoGain);
    lfoGain.connect(fundamentalOsc.frequency);
    
    fundamentalOsc.connect(filter);
    noiseOsc.connect(bowNoiseGain);
    bowNoiseGain.connect(filter);
    filter.connect(stringGain);
    stringGain.connect(masterGain);
    
    // Start oscillators
    fundamentalOsc.start(currentTime);
    noiseOsc.start(currentTime);
    lfo.start(currentTime);
    
    fundamentalOsc.stop(currentTime + duration);
    noiseOsc.stop(currentTime + duration);
    lfo.stop(currentTime + duration);
    
    oscillators.push(fundamentalOsc, noiseOsc, lfo);
    
    // Add harmonic series for richness
    for (let i = 2; i <= 6; i++) {
      const harmonicOsc = this.audioContext.createOscillator();
      const harmonicGain = this.audioContext.createGain();
      
      harmonicOsc.type = 'sine';
      harmonicOsc.frequency.setValueAtTime(frequency * i, currentTime);
      const harmonicVolume = Math.max(0.001, velocity * 0.2 / i);
      harmonicGain.gain.setValueAtTime(harmonicVolume, currentTime);
      if (harmonicVolume > 0.001) {
        harmonicGain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
      }
      
      harmonicOsc.connect(harmonicGain);
      harmonicGain.connect(masterGain);
      
      harmonicOsc.start(currentTime);
      harmonicOsc.stop(currentTime + duration);
      oscillators.push(harmonicOsc);
    }

    this.addReverb(masterGain, 0.25);
    masterGain.connect(this.masterGain);
    this.trackOscillators(oscillators, 'strings', frequency);
  }

  private playGuitarNote(frequency: number, duration: number, preset: any, velocity: number, currentTime: number) {
    if (!this.audioContext || !this.masterGain) return;

    const oscillators: OscillatorNode[] = [];
    const masterGain = this.audioContext.createGain();
    
    // More realistic guitar simulation with multiple string harmonics
    const fundamentalOsc = this.audioContext.createOscillator();
    const harmonic2 = this.audioContext.createOscillator();
    const harmonic3 = this.audioContext.createOscillator();
    const bodyResonance = this.audioContext.createOscillator();
    
    const fundamentalGain = this.audioContext.createGain();
    const harmonic2Gain = this.audioContext.createGain();
    const harmonic3Gain = this.audioContext.createGain();
    const bodyGain = this.audioContext.createGain();
    
    const stringFilter = this.audioContext.createBiquadFilter();
    const bodyFilter = this.audioContext.createBiquadFilter();
    const attackFilter = this.audioContext.createBiquadFilter();
    
    // Fundamental frequency - clean plucked string
    fundamentalOsc.type = 'triangle';
    fundamentalOsc.frequency.setValueAtTime(frequency, currentTime);
    
    // Harmonics for string complexity
    harmonic2.type = 'sine';
    harmonic2.frequency.setValueAtTime(frequency * 2, currentTime);
    
    harmonic3.type = 'sine';
    harmonic3.frequency.setValueAtTime(frequency * 3, currentTime);
    
    // Body resonance for woody sound
    bodyResonance.type = 'triangle';
    bodyResonance.frequency.setValueAtTime(frequency * 0.7, currentTime);
    
    // String filtering - more open sound
    stringFilter.type = 'lowpass';
    stringFilter.frequency.setValueAtTime(Math.min(8000, frequency * 8), currentTime);
    stringFilter.frequency.exponentialRampToValueAtTime(Math.min(4000, frequency * 4), currentTime + duration * 0.3);
    stringFilter.Q.setValueAtTime(2, currentTime);
    
    // Body filtering for wooden resonance
    bodyFilter.type = 'bandpass';
    bodyFilter.frequency.setValueAtTime(150, currentTime);
    bodyFilter.Q.setValueAtTime(4, currentTime);
    
    // Attack filter for pluck transient
    attackFilter.type = 'highpass';
    attackFilter.frequency.setValueAtTime(1000, currentTime);
    attackFilter.frequency.exponentialRampToValueAtTime(200, currentTime + 0.1);
    attackFilter.Q.setValueAtTime(1, currentTime);
    
    // More realistic guitar envelope - quick attack, natural decay
    const fundamentalVolume = Math.max(0.001, velocity * 0.7);
    fundamentalGain.gain.setValueAtTime(fundamentalVolume, currentTime);
    fundamentalGain.gain.exponentialRampToValueAtTime(Math.max(0.001, fundamentalVolume * 0.6), currentTime + 0.05);
    fundamentalGain.gain.exponentialRampToValueAtTime(Math.max(0.001, fundamentalVolume * 0.2), currentTime + duration * 0.3);
    fundamentalGain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
    
    const harmonic2Volume = Math.max(0.001, velocity * 0.3);
    harmonic2Gain.gain.setValueAtTime(harmonic2Volume, currentTime);
    harmonic2Gain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration * 0.7);
    
    const harmonic3Volume = Math.max(0.001, velocity * 0.15);
    harmonic3Gain.gain.setValueAtTime(harmonic3Volume, currentTime);
    harmonic3Gain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration * 0.5);
    
    const bodyVolume = Math.max(0.001, velocity * 0.4);
    bodyGain.gain.setValueAtTime(0.001, currentTime);
    bodyGain.gain.exponentialRampToValueAtTime(bodyVolume, currentTime + 0.02);
    bodyGain.gain.exponentialRampToValueAtTime(Math.max(0.001, bodyVolume * 0.5), currentTime + duration * 0.2);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
    
    // Connect the audio graph
    fundamentalOsc.connect(attackFilter);
    attackFilter.connect(stringFilter);
    stringFilter.connect(fundamentalGain);
    fundamentalGain.connect(masterGain);
    
    harmonic2.connect(stringFilter);
    stringFilter.connect(harmonic2Gain);
    harmonic2Gain.connect(masterGain);
    
    harmonic3.connect(stringFilter);
    stringFilter.connect(harmonic3Gain);
    harmonic3Gain.connect(masterGain);
    
    bodyResonance.connect(bodyFilter);
    bodyFilter.connect(bodyGain);
    bodyGain.connect(masterGain);
    
    // Start all oscillators
    fundamentalOsc.start(currentTime);
    harmonic2.start(currentTime);
    harmonic3.start(currentTime);
    bodyResonance.start(currentTime);
    
    fundamentalOsc.stop(currentTime + duration);
    harmonic2.stop(currentTime + duration);
    harmonic3.stop(currentTime + duration);
    bodyResonance.stop(currentTime + duration);
    
    oscillators.push(fundamentalOsc, harmonic2, harmonic3, bodyResonance);

    this.addReverb(masterGain, 0.15);
    masterGain.connect(this.masterGain);
    this.trackOscillators(oscillators, 'guitar', frequency);
  }

  private playViolinNote(frequency: number, duration: number, preset: any, velocity: number, currentTime: number) {
    if (!this.audioContext || !this.masterGain) return;

    const oscillators: OscillatorNode[] = [];
    const masterGain = this.audioContext.createGain();
    
    // Violin bow simulation with formants
    const mainOsc = this.audioContext.createOscillator();
    const formant1 = this.audioContext.createBiquadFilter();
    const formant2 = this.audioContext.createBiquadFilter();
    const formant3 = this.audioContext.createBiquadFilter();
    const bowNoise = this.audioContext.createOscillator();
    const noiseGain = this.audioContext.createGain();
    const vibrato = this.audioContext.createOscillator();
    const vibratoGain = this.audioContext.createGain();
    
    // Main violin tone
    mainOsc.type = 'sawtooth';
    mainOsc.frequency.setValueAtTime(frequency, currentTime);
    
    // Bow noise
    bowNoise.type = 'sawtooth';
    bowNoise.frequency.setValueAtTime(frequency * 8, currentTime);
    noiseGain.gain.setValueAtTime(Math.max(0.001, velocity * 0.03), currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.15);
    
    // Vibrato
    vibrato.type = 'sine';
    vibrato.frequency.setValueAtTime(6.5, currentTime);
    vibratoGain.gain.setValueAtTime(frequency * 0.03, currentTime);
    
    // Violin formants for realistic timbre
    formant1.type = 'bandpass';
    formant1.frequency.setValueAtTime(Math.min(800, frequency * 2), currentTime);
    formant1.Q.setValueAtTime(8, currentTime);
    
    formant2.type = 'bandpass';
    formant2.frequency.setValueAtTime(Math.min(1600, frequency * 4), currentTime);
    formant2.Q.setValueAtTime(6, currentTime);
    
    formant3.type = 'bandpass';
    formant3.frequency.setValueAtTime(Math.min(3200, frequency * 8), currentTime);
    formant3.Q.setValueAtTime(4, currentTime);
    
    // Violin envelope - slow attack, sustained
    const violinGain = this.audioContext.createGain();
    const attackTime = 0.25;
    const sustainLevel = Math.max(0.001, velocity * 0.4);
    
    violinGain.gain.setValueAtTime(0.001, currentTime);
    if (sustainLevel > 0.001) {
      violinGain.gain.exponentialRampToValueAtTime(sustainLevel, currentTime + attackTime);
      if (duration > 0.3) {
        violinGain.gain.setValueAtTime(sustainLevel, currentTime + duration - 0.3);
      }
    }
    violinGain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
    
    // Connect audio graph
    vibrato.connect(vibratoGain);
    vibratoGain.connect(mainOsc.frequency);
    
    mainOsc.connect(formant1);
    formant1.connect(formant2);
    formant2.connect(formant3);
    formant3.connect(violinGain);
    
    bowNoise.connect(noiseGain);
    noiseGain.connect(violinGain);
    
    violinGain.connect(masterGain);
    
    // Start all oscillators
    mainOsc.start(currentTime);
    bowNoise.start(currentTime);
    vibrato.start(currentTime);
    
    mainOsc.stop(currentTime + duration);
    bowNoise.stop(currentTime + duration);
    vibrato.stop(currentTime + duration);
    
    oscillators.push(mainOsc, bowNoise, vibrato);

    this.addReverb(masterGain, 0.3);
    masterGain.connect(this.masterGain);
    this.trackOscillators(oscillators, 'violin', frequency);
  }

  private playFluteNote(frequency: number, duration: number, preset: any, velocity: number, currentTime: number) {
    if (!this.audioContext || !this.masterGain) return;

    const oscillators: OscillatorNode[] = [];
    const masterGain = this.audioContext.createGain();
    
    // Flute breath simulation
    const fluteOsc = this.audioContext.createOscillator();
    const breathNoise = this.audioContext.createOscillator();
    const breathGain = this.audioContext.createGain();
    const fluteFilter = this.audioContext.createBiquadFilter();
    const breathFilter = this.audioContext.createBiquadFilter();
    
    // Main flute tone - mostly sine with slight triangle
    fluteOsc.type = 'sine';
    fluteOsc.frequency.setValueAtTime(frequency, currentTime);
    
    // Breath noise
    breathNoise.type = 'sawtooth';
    breathNoise.frequency.setValueAtTime(frequency * 16, currentTime);
    breathGain.gain.setValueAtTime(Math.max(0.001, velocity * 0.02), currentTime);
    
    // Flute filtering - emphasize higher harmonics
    fluteFilter.type = 'highpass';
    fluteFilter.frequency.setValueAtTime(frequency * 0.8, currentTime);
    fluteFilter.Q.setValueAtTime(1.5, currentTime);
    
    breathFilter.type = 'highpass';
    breathFilter.frequency.setValueAtTime(frequency * 8, currentTime);
    breathFilter.Q.setValueAtTime(0.5, currentTime);
    
    // Flute envelope - gradual attack
    const fluteGain = this.audioContext.createGain();
    const attackTime = 0.08;
    const sustainLevel = Math.max(0.001, velocity * 0.5);
    
    fluteGain.gain.setValueAtTime(0.001, currentTime);
    if (sustainLevel > 0.001) {
      fluteGain.gain.exponentialRampToValueAtTime(sustainLevel, currentTime + attackTime);
      if (duration > 0.2) {
        fluteGain.gain.setValueAtTime(sustainLevel, currentTime + duration - 0.2);
      }
    }
    fluteGain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
    
    // Connect audio graph
    fluteOsc.connect(fluteFilter);
    fluteFilter.connect(fluteGain);
    
    breathNoise.connect(breathFilter);
    breathFilter.connect(breathGain);
    breathGain.connect(fluteGain);
    
    fluteGain.connect(masterGain);
    
    fluteOsc.start(currentTime);
    breathNoise.start(currentTime);
    
    fluteOsc.stop(currentTime + duration);
    breathNoise.stop(currentTime + duration);
    
    oscillators.push(fluteOsc, breathNoise);

    this.addReverb(masterGain, 0.2);
    masterGain.connect(this.masterGain);
    this.trackOscillators(oscillators, 'flute', frequency);
  }

  private playHornNote(frequency: number, duration: number, preset: any, velocity: number, currentTime: number) {
    if (!this.audioContext || !this.masterGain) return;

    const oscillators: OscillatorNode[] = [];
    const masterGain = this.audioContext.createGain();
    
    // Horn synthesis with brass characteristics
    const hornOsc = this.audioContext.createOscillator();
    const hornFilter = this.audioContext.createBiquadFilter();
    const hornGain = this.audioContext.createGain();
    
    // Brass instruments have strong odd harmonics
    hornOsc.type = 'square'; // Square wave has strong odd harmonics
    hornOsc.frequency.setValueAtTime(frequency, currentTime);
    
    // Horn formant
    hornFilter.type = 'bandpass';
    hornFilter.frequency.setValueAtTime(frequency * 3, currentTime);
    hornFilter.Q.setValueAtTime(5, currentTime);
    
    // Horn envelope - quick attack, sustained
    const attackTime = 0.1;
    const sustainLevel = Math.max(0.001, velocity * 0.6);
    
    hornGain.gain.setValueAtTime(0.001, currentTime);
    if (sustainLevel > 0.001) {
      hornGain.gain.exponentialRampToValueAtTime(sustainLevel, currentTime + attackTime);
      if (duration > 0.3) {
        hornGain.gain.setValueAtTime(sustainLevel, currentTime + duration - 0.3);
      }
    }
    hornGain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
    
    // Add harmonics for brass character
    for (let i = 3; i <= 9; i += 2) { // Odd harmonics
      const harmonicOsc = this.audioContext.createOscillator();
      const harmonicGain = this.audioContext.createGain();
      
      harmonicOsc.type = 'sine';
      harmonicOsc.frequency.setValueAtTime(frequency * i, currentTime);
      const harmonicVolume = Math.max(0.001, velocity * 0.3 / i);
      harmonicGain.gain.setValueAtTime(harmonicVolume, currentTime);
      if (harmonicVolume > 0.001) {
        harmonicGain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
      }
      
      harmonicOsc.connect(harmonicGain);
      harmonicGain.connect(masterGain);
      
      harmonicOsc.start(currentTime);
      harmonicOsc.stop(currentTime + duration);
      oscillators.push(harmonicOsc);
    }
    
    hornOsc.connect(hornFilter);
    hornFilter.connect(hornGain);
    hornGain.connect(masterGain);
    
    hornOsc.start(currentTime);
    hornOsc.stop(currentTime + duration);
    oscillators.push(hornOsc);

    this.addReverb(masterGain, 0.15);
    masterGain.connect(this.masterGain);
    this.trackOscillators(oscillators, 'horn', frequency);
  }

  private playGenericNote(frequency: number, duration: number, preset: any, velocity: number, currentTime: number) {
    if (!this.audioContext || !this.masterGain) return;

    const oscillators: OscillatorNode[] = [];
    const masterGain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    // Basic synthesis for other instruments
    const mainOsc = this.audioContext.createOscillator();
    mainOsc.type = preset.waveform || 'sine';
    mainOsc.frequency.setValueAtTime(frequency, currentTime);
    
    filter.type = preset.filterType || 'lowpass';
    filter.frequency.setValueAtTime(preset.cutoff || frequency * 4, currentTime);
    filter.Q.setValueAtTime(preset.resonance || 1, currentTime);
    
    const envelope = this.audioContext.createGain();
    const sustainLevel = Math.max(0.001, velocity * preset.volume * 0.3);
    
    envelope.gain.setValueAtTime(0.001, currentTime);
    envelope.gain.exponentialRampToValueAtTime(sustainLevel, currentTime + preset.attack);
    envelope.gain.setTargetAtTime(sustainLevel * preset.sustain, currentTime + preset.attack, preset.decay);
    envelope.gain.setTargetAtTime(0.001, currentTime + duration - preset.release, preset.release);
    
    mainOsc.connect(filter);
    filter.connect(envelope);
    envelope.connect(masterGain);
    
    mainOsc.start(currentTime);
    mainOsc.stop(currentTime + duration);
    oscillators.push(mainOsc);

    masterGain.connect(this.masterGain);
    this.trackOscillators(oscillators, preset.name || 'generic', frequency);
  }

  private addReverb(source: AudioNode, amount: number = 0.2) {
    if (!this.audioContext || !this.reverbBuffer) return;

    const convolver = this.audioContext.createConvolver();
    const wetGain = this.audioContext.createGain();
    const dryGain = this.audioContext.createGain();
    const output = this.audioContext.createGain();

    convolver.buffer = this.reverbBuffer;
    wetGain.gain.setValueAtTime(amount, this.audioContext.currentTime);
    dryGain.gain.setValueAtTime(1 - amount, this.audioContext.currentTime);

    source.connect(dryGain);
    source.connect(convolver);
    convolver.connect(wetGain);

    dryGain.connect(output);
    wetGain.connect(output);

    return output;
  }

  private trackOscillators(oscillators: OscillatorNode[], instrument: string, frequency: number) {
    const trackingKey = `${instrument}_${frequency}_${Date.now()}`;
    this.currentlyPlaying.set(trackingKey, oscillators);

    setTimeout(() => {
      this.currentlyPlaying.delete(trackingKey);
    }, 5000);
  }

  private getInstrumentPreset(instrument: string) {
    const presets: { [key: string]: any } = {
      'piano-keyboard': { name: 'piano', waveform: 'triangle', attack: 0.01, decay: 0.3, sustain: 0.7, release: 1.0, filterType: 'lowpass', cutoff: 4000, resonance: 2, volume: 0.8 },
      'piano-grand': { name: 'piano', waveform: 'triangle', attack: 0.01, decay: 0.3, sustain: 0.7, release: 1.2, filterType: 'lowpass', cutoff: 4000, resonance: 2, volume: 0.8 },
      'piano-organ': { name: 'organ', waveform: 'sine', attack: 0.02, decay: 0.1, sustain: 0.9, release: 0.8, filterType: 'lowpass', cutoff: 2500, resonance: 2, volume: 0.7 },
      'strings-guitar': { name: 'guitar', waveform: 'sawtooth', attack: 0.02, decay: 0.3, sustain: 0.5, release: 1.0, filterType: 'lowpass', cutoff: 3000, resonance: 4, volume: 0.8 },
      'strings-violin': { name: 'violin', waveform: 'sawtooth', attack: 0.2, decay: 0.1, sustain: 0.9, release: 1.5, filterType: 'bandpass', cutoff: 2800, resonance: 8, volume: 0.7 },
      'strings-ukulele': { name: 'ukulele', waveform: 'triangle', attack: 0.02, decay: 0.2, sustain: 0.6, release: 0.8, filterType: 'lowpass', cutoff: 3200, resonance: 2, volume: 0.6 },
      'flute-recorder': { name: 'flute', waveform: 'sine', attack: 0.08, decay: 0.1, sustain: 0.8, release: 0.6, filterType: 'highpass', cutoff: 600, resonance: 1, volume: 0.6 },
      'flute-indian': { name: 'flute', waveform: 'sine', attack: 0.12, decay: 0.15, sustain: 0.9, release: 1.2, filterType: 'bandpass', cutoff: 1200, resonance: 3, volume: 0.7 },
      'flute-concert': { name: 'flute', waveform: 'sine', attack: 0.1, decay: 0.2, sustain: 0.85, release: 1.0, filterType: 'highpass', cutoff: 800, resonance: 1.5, volume: 0.8 },
      'horns-trumpet': { name: 'horn', waveform: 'square', attack: 0.1, decay: 0.15, sustain: 0.8, release: 1.2, filterType: 'bandpass', cutoff: 1800, resonance: 5, volume: 0.9 },
      'horns-trombone': { name: 'horn', waveform: 'square', attack: 0.15, decay: 0.2, sustain: 0.9, release: 1.8, filterType: 'bandpass', cutoff: 1200, resonance: 4, volume: 1.0 },
      'horns-french': { name: 'horn', waveform: 'triangle', attack: 0.12, decay: 0.18, sustain: 0.85, release: 1.5, filterType: 'bandpass', cutoff: 1500, resonance: 3, volume: 0.8 },
      'synth-analog': { name: 'synth', waveform: 'sawtooth', attack: 0.05, decay: 0.3, sustain: 0.5, release: 0.4, filterType: 'lowpass', cutoff: 1800, resonance: 8, volume: 0.8 },
      'synth-digital': { name: 'synth', waveform: 'square', attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.3, filterType: 'lowpass', cutoff: 2200, resonance: 12, volume: 0.7 },
      'synth-fm': { name: 'synth', waveform: 'sine', attack: 0.02, decay: 0.25, sustain: 0.3, release: 0.5, filterType: 'lowpass', cutoff: 2000, resonance: 6, volume: 0.6 },
      'bass-electric': { name: 'bass', waveform: 'square', attack: 0.01, decay: 0.1, sustain: 0.8, release: 0.3, filterType: 'lowpass', cutoff: 400, resonance: 6, volume: 1.0 },
      'bass-upright': { name: 'bass', waveform: 'triangle', attack: 0.03, decay: 0.2, sustain: 0.6, release: 0.8, filterType: 'lowpass', cutoff: 350, resonance: 3, volume: 0.9 },
      'bass-synth': { name: 'bass', waveform: 'square', attack: 0.005, decay: 0.05, sustain: 0.9, release: 0.2, filterType: 'lowpass', cutoff: 500, resonance: 10, volume: 1.0 },
      'pads-warm': { name: 'pad', waveform: 'sine', attack: 0.8, decay: 0.5, sustain: 0.9, release: 3.0, filterType: 'lowpass', cutoff: 1500, resonance: 2, volume: 0.5 },
      'pads-strings': { name: 'pad', waveform: 'sawtooth', attack: 1.0, decay: 0.3, sustain: 0.85, release: 2.5, filterType: 'lowpass', cutoff: 2000, resonance: 3, volume: 0.6 },
      'pads-choir': { name: 'pad', waveform: 'sine', attack: 1.2, decay: 0.4, sustain: 0.9, release: 2.8, filterType: 'bandpass', cutoff: 1800, resonance: 4, volume: 0.4 },
      'leads-square': { name: 'lead', waveform: 'square', attack: 0.02, decay: 0.2, sustain: 0.6, release: 0.5, filterType: 'lowpass', cutoff: 2500, resonance: 8, volume: 0.8 },
      'leads-saw': { name: 'lead', waveform: 'sawtooth', attack: 0.01, decay: 0.15, sustain: 0.5, release: 0.4, filterType: 'lowpass', cutoff: 2800, resonance: 10, volume: 0.7 },
      'leads-pluck': { name: 'lead', waveform: 'triangle', attack: 0.005, decay: 0.1, sustain: 0.3, release: 0.3, filterType: 'lowpass', cutoff: 3000, resonance: 6, volume: 0.9 }
    };

    return presets[instrument] || presets['piano-keyboard'];
  }

  playDrumSound(type: string, volume: number = 0.5) {
    if (!this.audioContext || !this.masterGain) {
      console.error("Audio context not initialized");
      return;
    }
    
    try {
      const currentTime = this.audioContext.currentTime;
      
      switch (type) {
        case 'kick':
          this.playKickDrum(volume, currentTime);
          break;
        case 'tom':
          this.playTom(volume, currentTime);
          break;
        case 'snare':
          this.playSnare(volume, currentTime);
          break;
        case 'hihat':
        case 'openhat':
          this.playHiHat(type, volume, currentTime);
          break;
        case 'clap':
          this.playClap(volume, currentTime);
          break;
        case 'crash':
          this.playCrash(volume, currentTime);
          break;
        case 'bass':
          this.playBassDrum(volume, currentTime);
          break;
        default:
          this.playGenericDrum(volume, currentTime);
      }
    } catch (error) {
      console.error("Failed to play drum sound:", error);
    }
  }

  private playBassDrum(volume: number, currentTime: number) {
    if (!this.audioContext || !this.masterGain) return;

    const duration = 1.8; // Longer sustain for bass drum
    
    // Deep bass oscillator (40Hz fundamental) 
    const osc1 = this.audioContext.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(40, currentTime);
    osc1.frequency.exponentialRampToValueAtTime(20, currentTime + 0.1);
    
    // Sub-bass layer (20Hz)
    const osc2 = this.audioContext.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(20, currentTime);
    osc2.frequency.exponentialRampToValueAtTime(15, currentTime + 0.15);
    
    // Harmonic layer for punch
    const osc3 = this.audioContext.createOscillator();
    osc3.type = 'triangle';
    osc3.frequency.setValueAtTime(80, currentTime);
    osc3.frequency.exponentialRampToValueAtTime(40, currentTime + 0.05);

    // Bass drum envelope (longer sustain)
    const envelope = this.audioContext.createGain();
    envelope.gain.setValueAtTime(0, currentTime);
    envelope.gain.setValueAtTime(volume * 0.9, currentTime + 0.001);
    envelope.gain.exponentialRampToValueAtTime(volume * 0.5, currentTime + 0.1);
    envelope.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);

    // EQ for bass drum
    const lowpass = this.audioContext.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(200, currentTime);

    // Connect bass drum
    [osc1, osc2, osc3].forEach(osc => {
      osc.connect(envelope);
      osc.start(currentTime);
      osc.stop(currentTime + duration);
    });
    envelope.connect(lowpass);
    lowpass.connect(this.masterGain);
  }

  private playKickDrum(volume: number, currentTime: number) {
    if (!this.audioContext || !this.masterGain) return;

    const duration = 1.2;

    // Low frequency fundamental
    const kickOsc1 = this.audioContext.createOscillator();
    const kickGain1 = this.audioContext.createGain();
    
    // Mid frequency body
    const kickOsc2 = this.audioContext.createOscillator();
    const kickGain2 = this.audioContext.createGain();
    
    // Click attack
    const clickOsc = this.audioContext.createOscillator();
    const clickGain = this.audioContext.createGain();
    
    const kickFilter = this.audioContext.createBiquadFilter();
    const clickFilter = this.audioContext.createBiquadFilter();

    // Deep fundamental - longer decay
    kickOsc1.type = 'sine';
    kickOsc1.frequency.setValueAtTime(65, currentTime);
    kickOsc1.frequency.exponentialRampToValueAtTime(25, currentTime + 0.2);
    kickOsc1.frequency.exponentialRampToValueAtTime(20, currentTime + duration);

    // Body tone
    kickOsc2.type = 'triangle';
    kickOsc2.frequency.setValueAtTime(45, currentTime);
    kickOsc2.frequency.exponentialRampToValueAtTime(30, currentTime + 0.15);

    // Attack click for punch
    clickOsc.type = 'square';
    clickOsc.frequency.setValueAtTime(200, currentTime);
    clickOsc.frequency.exponentialRampToValueAtTime(80, currentTime + 0.02);

    // Envelopes with longer sustain
    const initialVolume1 = Math.max(0.001, volume * 0.9);
    kickGain1.gain.setValueAtTime(initialVolume1, currentTime);
    kickGain1.gain.exponentialRampToValueAtTime(Math.max(0.001, initialVolume1 * 0.7), currentTime + 0.1);
    kickGain1.gain.exponentialRampToValueAtTime(Math.max(0.001, initialVolume1 * 0.3), currentTime + 0.4);
    kickGain1.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);

    const initialVolume2 = Math.max(0.001, volume * 0.5);
    kickGain2.gain.setValueAtTime(initialVolume2, currentTime);
    kickGain2.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.3);

    const clickVolume = Math.max(0.001, volume * 0.3);
    clickGain.gain.setValueAtTime(clickVolume, currentTime);
    clickGain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.05);

    // Filtering
    kickFilter.type = 'lowpass';
    kickFilter.frequency.setValueAtTime(120, currentTime);
    kickFilter.Q.setValueAtTime(1.5, currentTime);

    clickFilter.type = 'highpass';
    clickFilter.frequency.setValueAtTime(100, currentTime);
    clickFilter.Q.setValueAtTime(1, currentTime);

    // Connect everything
    kickOsc1.connect(kickGain1);
    kickOsc2.connect(kickGain2);
    clickOsc.connect(clickFilter);
    clickFilter.connect(clickGain);
    
    kickGain1.connect(kickFilter);
    kickGain2.connect(kickFilter);
    kickFilter.connect(this.masterGain);
    clickGain.connect(this.masterGain);

    // Start and stop
    kickOsc1.start(currentTime);
    kickOsc1.stop(currentTime + duration);
    kickOsc2.start(currentTime);
    kickOsc2.stop(currentTime + 0.4);
    clickOsc.start(currentTime);
    clickOsc.stop(currentTime + 0.06);
  }

  private playSnare(volume: number, currentTime: number) {
    if (!this.audioContext || !this.masterGain) return;

    const duration = 0.4;

    // Body tone with multiple oscillators
    const snareOsc1 = this.audioContext.createOscillator();
    const snareOsc2 = this.audioContext.createOscillator();
    const snareGain1 = this.audioContext.createGain();
    const snareGain2 = this.audioContext.createGain();
    const snareFilter1 = this.audioContext.createBiquadFilter();
    const snareFilter2 = this.audioContext.createBiquadFilter();

    // Low frequency body
    snareOsc1.type = 'triangle';
    snareOsc1.frequency.setValueAtTime(220, currentTime);
    snareOsc1.frequency.exponentialRampToValueAtTime(120, currentTime + 0.08);

    // Mid frequency punch
    snareOsc2.type = 'square';
    snareOsc2.frequency.setValueAtTime(160, currentTime);
    snareOsc2.frequency.exponentialRampToValueAtTime(90, currentTime + 0.06);

    // Enhanced noise component - longer and more complex
    const noiseBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * duration, this.audioContext.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    
    for (let i = 0; i < noiseBuffer.length; i++) {
      const decay = Math.pow(1 - i / noiseBuffer.length, 1.5);
      // Add some colored noise for snare rattle
      const noise = (Math.random() * 2 - 1) * decay;
      const rattle = Math.sin(i * 0.01) * decay * 0.3;
      noiseData[i] = noise + rattle;
    }

    const noiseSource = this.audioContext.createBufferSource();
    const noiseGain = this.audioContext.createGain();
    const noiseFilter = this.audioContext.createBiquadFilter();

    noiseSource.buffer = noiseBuffer;
    
    // Snare body envelopes
    const bodyVolume1 = Math.max(0.001, volume * 0.4);
    snareGain1.gain.setValueAtTime(bodyVolume1, currentTime);
    snareGain1.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.2);

    const bodyVolume2 = Math.max(0.001, volume * 0.3);
    snareGain2.gain.setValueAtTime(bodyVolume2, currentTime);
    snareGain2.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.15);

    // Noise envelope - longer tail
    const noiseVolume = Math.max(0.001, volume * 0.6);
    noiseGain.gain.setValueAtTime(noiseVolume, currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(Math.max(0.001, noiseVolume * 0.3), currentTime + 0.1);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);

    // Better filtering
    snareFilter1.type = 'bandpass';
    snareFilter1.frequency.setValueAtTime(180, currentTime);
    snareFilter1.Q.setValueAtTime(2, currentTime);

    snareFilter2.type = 'bandpass';
    snareFilter2.frequency.setValueAtTime(250, currentTime);
    snareFilter2.Q.setValueAtTime(1.5, currentTime);

    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(800, currentTime);
    noiseFilter.Q.setValueAtTime(0.7, currentTime);

    // Connect everything
    snareOsc1.connect(snareFilter1);
    snareFilter1.connect(snareGain1);
    snareGain1.connect(this.masterGain);

    snareOsc2.connect(snareFilter2);
    snareFilter2.connect(snareGain2);
    snareGain2.connect(this.masterGain);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    // Start everything
    snareOsc1.start(currentTime);
    snareOsc1.stop(currentTime + 0.25);
    snareOsc2.start(currentTime);
    snareOsc2.stop(currentTime + 0.18);
    noiseSource.start(currentTime);
  }

  private playHiHat(type: string, volume: number, currentTime: number) {
    if (!this.audioContext || !this.masterGain) return;

    const duration = type === 'openhat' ? 0.6 : 0.12;
    
    // Create multiple noise layers for realistic hi-hat
    const mainBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * duration, this.audioContext.sampleRate);
    const shimmerBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * duration, this.audioContext.sampleRate);
    
    const mainData = mainBuffer.getChannelData(0);
    const shimmerData = shimmerBuffer.getChannelData(0);

    for (let i = 0; i < mainBuffer.length; i++) {
      const progress = i / mainBuffer.length;
      const mainDecay = type === 'openhat' ? Math.pow(1 - progress, 0.8) : Math.pow(1 - progress, 4);
      const shimmerDecay = Math.pow(1 - progress, 0.3);
      
      // Main metallic noise
      mainData[i] = (Math.random() * 2 - 1) * mainDecay;
      
      // Shimmer layer for metallic sound
      shimmerData[i] = (Math.random() * 2 - 1) * shimmerDecay * 0.5;
    }

    // Main hi-hat sound
    const mainSource = this.audioContext.createBufferSource();
    const mainGain = this.audioContext.createGain();
    const mainFilter = this.audioContext.createBiquadFilter();

    mainSource.buffer = mainBuffer;
    mainGain.gain.setValueAtTime(Math.max(0.001, volume * 0.25), currentTime);
    mainGain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);

    mainFilter.type = 'highpass';
    mainFilter.frequency.setValueAtTime(6000, currentTime);
    mainFilter.Q.setValueAtTime(1, currentTime);

    // Shimmer layer
    const shimmerSource = this.audioContext.createBufferSource();
    const shimmerGain = this.audioContext.createGain();
    const shimmerFilter = this.audioContext.createBiquadFilter();

    shimmerSource.buffer = shimmerBuffer;
    shimmerGain.gain.setValueAtTime(Math.max(0.001, volume * 0.15), currentTime);
    shimmerGain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration * 1.2);

    shimmerFilter.type = 'highpass';
    shimmerFilter.frequency.setValueAtTime(10000, currentTime);
    shimmerFilter.Q.setValueAtTime(0.5, currentTime);

    // Connect both layers
    mainSource.connect(mainFilter);
    mainFilter.connect(mainGain);
    mainGain.connect(this.masterGain);

    shimmerSource.connect(shimmerFilter);
    shimmerFilter.connect(shimmerGain);
    shimmerGain.connect(this.masterGain);

    mainSource.start(currentTime);
    shimmerSource.start(currentTime);
  }

  private playClap(volume: number, currentTime: number) {
    if (!this.audioContext || !this.masterGain) return;

    // Create a more realistic clap with multiple layers
    const duration = 0.15;
    
    // Main clap sound - filtered noise burst
    const mainBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * duration, this.audioContext.sampleRate);
    const mainData = mainBuffer.getChannelData(0);
    
    for (let i = 0; i < mainBuffer.length; i++) {
      const envelope = Math.exp(-i / mainBuffer.length * 8); // Sharp decay
      mainData[i] = (Math.random() * 2 - 1) * envelope;
    }

    const mainSource = this.audioContext.createBufferSource();
    const mainGain = this.audioContext.createGain();
    const mainFilter = this.audioContext.createBiquadFilter();

    mainSource.buffer = mainBuffer;
    mainGain.gain.setValueAtTime(Math.max(0.001, volume * 0.4), currentTime);
    mainGain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);

    // High-pass filter to make it crispy
    mainFilter.type = 'highpass';
    mainFilter.frequency.setValueAtTime(800, currentTime);
    mainFilter.Q.setValueAtTime(2, currentTime);

    mainSource.connect(mainFilter);
    mainFilter.connect(mainGain);
    mainGain.connect(this.masterGain);

    mainSource.start(currentTime);

    // Add multiple quick bursts for realistic hand clap
    for (let i = 0; i < 3; i++) {
      const burstBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 0.02, this.audioContext.sampleRate);
      const burstData = burstBuffer.getChannelData(0);
      
      for (let j = 0; j < burstBuffer.length; j++) {
        const env = Math.exp(-j / burstBuffer.length * 15);
        burstData[j] = (Math.random() * 2 - 1) * env;
      }

      const burstSource = this.audioContext.createBufferSource();
      const burstGain = this.audioContext.createGain();
      const burstFilter = this.audioContext.createBiquadFilter();

      burstSource.buffer = burstBuffer;
      burstGain.gain.setValueAtTime(Math.max(0.001, volume * 0.15), currentTime + i * 0.008);

      burstFilter.type = 'bandpass';
      burstFilter.frequency.setValueAtTime(1500 + i * 200, currentTime);
      burstFilter.Q.setValueAtTime(3, currentTime);

      burstSource.connect(burstFilter);
      burstFilter.connect(burstGain);
      burstGain.connect(this.masterGain);

      burstSource.start(currentTime + i * 0.008);
    }
  }

  private playCrash(volume: number, currentTime: number) {
    if (!this.audioContext || !this.masterGain) return;

    const duration = 2.0;
    const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * duration, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / buffer.length, 0.3);
    }

    const source = this.audioContext.createBufferSource();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    source.buffer = buffer;
    gain.gain.setValueAtTime(Math.max(0.001, volume * 0.3), currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(3000, currentTime);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start(currentTime);
  }

  private playTom(volume: number, currentTime: number) {
    if (!this.audioContext || !this.masterGain) return;

    const duration = 0.8;

    // Multiple oscillators for fuller tom sound
    const tomOsc1 = this.audioContext.createOscillator();
    const tomOsc2 = this.audioContext.createOscillator();
    const tomOsc3 = this.audioContext.createOscillator();
    const tomGain1 = this.audioContext.createGain();
    const tomGain2 = this.audioContext.createGain();
    const tomGain3 = this.audioContext.createGain();
    const tomFilter = this.audioContext.createBiquadFilter();

    // Low fundamental
    tomOsc1.type = 'sine';
    tomOsc1.frequency.setValueAtTime(140, currentTime);
    tomOsc1.frequency.exponentialRampToValueAtTime(80, currentTime + 0.3);
    tomOsc1.frequency.exponentialRampToValueAtTime(70, currentTime + duration);

    // Mid body tone
    tomOsc2.type = 'triangle';
    tomOsc2.frequency.setValueAtTime(110, currentTime);
    tomOsc2.frequency.exponentialRampToValueAtTime(65, currentTime + 0.25);

    // Attack punch
    tomOsc3.type = 'square';
    tomOsc3.frequency.setValueAtTime(200, currentTime);
    tomOsc3.frequency.exponentialRampToValueAtTime(100, currentTime + 0.05);

    // Envelopes with longer sustain for tom character
    const volume1 = Math.max(0.001, volume * 0.8);
    tomGain1.gain.setValueAtTime(volume1, currentTime);
    tomGain1.gain.exponentialRampToValueAtTime(Math.max(0.001, volume1 * 0.6), currentTime + 0.1);
    tomGain1.gain.exponentialRampToValueAtTime(Math.max(0.001, volume1 * 0.2), currentTime + 0.4);
    tomGain1.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);

    const volume2 = Math.max(0.001, volume * 0.5);
    tomGain2.gain.setValueAtTime(volume2, currentTime);
    tomGain2.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.5);

    const volume3 = Math.max(0.001, volume * 0.3);
    tomGain3.gain.setValueAtTime(volume3, currentTime);
    tomGain3.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.08);

    // Filtering for tom character
    tomFilter.type = 'lowpass';
    tomFilter.frequency.setValueAtTime(600, currentTime);
    tomFilter.frequency.exponentialRampToValueAtTime(300, currentTime + 0.2);
    tomFilter.Q.setValueAtTime(2, currentTime);

    // Connect everything
    tomOsc1.connect(tomGain1);
    tomOsc2.connect(tomGain2);
    tomOsc3.connect(tomGain3);
    
    tomGain1.connect(tomFilter);
    tomGain2.connect(tomFilter);
    tomGain3.connect(tomFilter);
    tomFilter.connect(this.masterGain);

    // Start and stop
    tomOsc1.start(currentTime);
    tomOsc1.stop(currentTime + duration);
    tomOsc2.start(currentTime);
    tomOsc2.stop(currentTime + 0.6);
    tomOsc3.start(currentTime);
    tomOsc3.stop(currentTime + 0.1);
  }

  private playGenericDrum(volume: number, currentTime: number) {
    if (!this.audioContext || !this.masterGain) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, currentTime);

    gain.gain.setValueAtTime(Math.max(0.001, volume * 0.3), currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(currentTime);
    osc.stop(currentTime + 0.3);
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

  static getNoteFrequency(note: string | number, octave: number = 4): number {
    // If note is already a number (frequency), return it directly
    if (typeof note === 'number') {
      return note;
    }

    // Ensure note is a string
    if (typeof note !== 'string') {
      console.warn('Invalid note type:', typeof note, note);
      return 440; // Default to A4
    }

    const noteMap: { [key: string]: number } = {
      'C': 261.63, 'C#': 277.18, 'Db': 277.18,
      'D': 293.66, 'D#': 311.13, 'Eb': 311.13,
      'E': 329.63, 'F': 349.23, 'F#': 369.99, 'Gb': 369.99,
      'G': 392.00, 'G#': 415.30, 'Ab': 415.30,
      'A': 440.00, 'A#': 466.16, 'Bb': 466.16,
      'B': 493.88,
    };

    const baseFreq = noteMap[note.toUpperCase()];
    if (!baseFreq) return 440;

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

export const audioEngine = new AudioEngine();
