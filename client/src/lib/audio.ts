
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
    if (!this.audioContext || !this.masterGain) return;

    const preset = this.getInstrumentPreset(instrument);
    const currentTime = this.audioContext.currentTime;

    // Use specialized synthesis based on instrument type
    if (instrument.includes('piano')) {
      this.playPianoNote(frequency, duration, preset, velocity, currentTime);
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
  }

  private playPianoNote(frequency: number, duration: number, preset: any, velocity: number, currentTime: number) {
    if (!this.audioContext || !this.masterGain) return;

    const oscillators: OscillatorNode[] = [];
    const masterGain = this.audioContext.createGain();
    
    // Piano has complex harmonic structure - simulate with multiple oscillators
    const harmonics = [
      { freq: frequency, amp: 1.0, wave: 'triangle' as OscillatorType },
      { freq: frequency * 2, amp: 0.4, wave: 'sine' as OscillatorType },
      { freq: frequency * 3, amp: 0.3, wave: 'sine' as OscillatorType },
      { freq: frequency * 4, amp: 0.2, wave: 'triangle' as OscillatorType },
      { freq: frequency * 5, amp: 0.15, wave: 'sine' as OscillatorType },
      { freq: frequency * 6, amp: 0.1, wave: 'sine' as OscillatorType },
    ];

    harmonics.forEach((harmonic, index) => {
      const osc = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();
      const filter = this.audioContext!.createBiquadFilter();
      
      osc.type = harmonic.wave;
      osc.frequency.setValueAtTime(harmonic.freq, currentTime);
      
      // Add slight detuning for realism
      const detune = (Math.random() - 0.5) * 10;
      osc.detune.setValueAtTime(detune, currentTime);
      
      // Piano hammer strike simulation
      const attack = 0.002 + Math.random() * 0.003;
      const initialVolume = Math.max(0.001, harmonic.amp * velocity * 0.15);
      
      gain.gain.setValueAtTime(0.001, currentTime);
      gain.gain.exponentialRampToValueAtTime(initialVolume, currentTime + attack);
      gain.gain.exponentialRampToValueAtTime(initialVolume * 0.3, currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
      
      // Filter to simulate piano string resonance
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(Math.min(8000, frequency * 8), currentTime);
      filter.Q.setValueAtTime(2, currentTime);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      
      osc.start(currentTime);
      osc.stop(currentTime + duration);
      oscillators.push(osc);
    });

    // Add reverb for piano
    this.addReverb(masterGain, 0.15);
    masterGain.connect(this.masterGain);

    this.trackOscillators(oscillators, instrument, frequency);
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
    stringGain.gain.exponentialRampToValueAtTime(sustainLevel, currentTime + attackTime);
    stringGain.gain.setValueAtTime(sustainLevel, currentTime + duration - 0.5);
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
      harmonicGain.gain.setValueAtTime(Math.max(0.001, velocity * 0.2 / i), currentTime);
      harmonicGain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
      
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
    
    // Guitar pluck simulation with multiple decay stages
    const pluckOsc = this.audioContext.createOscillator();
    const bodyResonance = this.audioContext.createOscillator();
    const stringFilter = this.audioContext.createBiquadFilter();
    const bodyFilter = this.audioContext.createBiquadFilter();
    const pluckGain = this.audioContext.createGain();
    const bodyGain = this.audioContext.createGain();
    
    // Main string oscillator
    pluckOsc.type = 'sawtooth';
    pluckOsc.frequency.setValueAtTime(frequency, currentTime);
    
    // Guitar body resonance
    bodyResonance.type = 'triangle';
    bodyResonance.frequency.setValueAtTime(frequency * 0.5, currentTime);
    
    // String filtering
    stringFilter.type = 'lowpass';
    stringFilter.frequency.setValueAtTime(frequency * 6, currentTime);
    stringFilter.Q.setValueAtTime(4, currentTime);
    
    // Body filtering
    bodyFilter.type = 'bandpass';
    bodyFilter.frequency.setValueAtTime(200, currentTime);
    bodyFilter.Q.setValueAtTime(3, currentTime);
    
    // Pluck envelope - fast attack, complex decay
    const pluckVolume = Math.max(0.001, velocity * 0.6);
    pluckGain.gain.setValueAtTime(pluckVolume, currentTime);
    pluckGain.gain.exponentialRampToValueAtTime(pluckVolume * 0.3, currentTime + 0.05);
    pluckGain.gain.exponentialRampToValueAtTime(pluckVolume * 0.1, currentTime + 0.2);
    pluckGain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
    
    // Body resonance envelope
    const bodyVolume = Math.max(0.001, velocity * 0.2);
    bodyGain.gain.setValueAtTime(0.001, currentTime);
    bodyGain.gain.exponentialRampToValueAtTime(bodyVolume, currentTime + 0.01);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
    
    // Connect audio graph
    pluckOsc.connect(stringFilter);
    stringFilter.connect(pluckGain);
    pluckGain.connect(masterGain);
    
    bodyResonance.connect(bodyFilter);
    bodyFilter.connect(bodyGain);
    bodyGain.connect(masterGain);
    
    pluckOsc.start(currentTime);
    bodyResonance.start(currentTime);
    
    pluckOsc.stop(currentTime + duration);
    bodyResonance.stop(currentTime + duration);
    
    oscillators.push(pluckOsc, bodyResonance);

    this.addReverb(masterGain, 0.1);
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
    violinGain.gain.exponentialRampToValueAtTime(sustainLevel, currentTime + attackTime);
    violinGain.gain.setValueAtTime(sustainLevel, currentTime + duration - 0.3);
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
    fluteGain.gain.exponentialRampToValueAtTime(sustainLevel, currentTime + attackTime);
    fluteGain.gain.setValueAtTime(sustainLevel, currentTime + duration - 0.2);
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
    hornGain.gain.exponentialRampToValueAtTime(sustainLevel, currentTime + attackTime);
    hornGain.gain.setValueAtTime(sustainLevel, currentTime + duration - 0.3);
    hornGain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
    
    // Add harmonics for brass character
    for (let i = 3; i <= 9; i += 2) { // Odd harmonics
      const harmonicOsc = this.audioContext.createOscillator();
      const harmonicGain = this.audioContext.createGain();
      
      harmonicOsc.type = 'sine';
      harmonicOsc.frequency.setValueAtTime(frequency * i, currentTime);
      harmonicGain.gain.setValueAtTime(Math.max(0.001, velocity * 0.3 / i), currentTime);
      harmonicGain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
      
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
    if (!this.audioContext || !this.masterGain) return;
    
    const currentTime = this.audioContext.currentTime;
    
    switch (type) {
      case 'kick':
        this.playKickDrum(volume, currentTime);
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
      default:
        this.playGenericDrum(volume, currentTime);
    }
  }

  private playKickDrum(volume: number, currentTime: number) {
    if (!this.audioContext || !this.masterGain) return;

    const kickOsc1 = this.audioContext.createOscillator();
    const kickOsc2 = this.audioContext.createOscillator();
    const kickGain1 = this.audioContext.createGain();
    const kickGain2 = this.audioContext.createGain();
    const kickFilter = this.audioContext.createBiquadFilter();

    kickOsc1.type = 'sine';
    kickOsc1.frequency.setValueAtTime(60, currentTime);
    kickOsc1.frequency.exponentialRampToValueAtTime(30, currentTime + 0.1);

    kickOsc2.type = 'triangle';
    kickOsc2.frequency.setValueAtTime(40, currentTime);
    kickOsc2.frequency.exponentialRampToValueAtTime(20, currentTime + 0.15);

    kickGain1.gain.setValueAtTime(Math.max(0.001, volume * 0.8), currentTime);
    kickGain1.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.5);

    kickGain2.gain.setValueAtTime(Math.max(0.001, volume * 0.6), currentTime);
    kickGain2.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.7);

    kickFilter.type = 'lowpass';
    kickFilter.frequency.setValueAtTime(150, currentTime);
    kickFilter.Q.setValueAtTime(2, currentTime);

    kickOsc1.connect(kickGain1);
    kickOsc2.connect(kickGain2);
    kickGain1.connect(kickFilter);
    kickGain2.connect(kickFilter);
    kickFilter.connect(this.masterGain);

    kickOsc1.start(currentTime);
    kickOsc1.stop(currentTime + 0.6);
    kickOsc2.start(currentTime);
    kickOsc2.stop(currentTime + 0.8);
  }

  private playSnare(volume: number, currentTime: number) {
    if (!this.audioContext || !this.masterGain) return;

    // Body tone
    const snareOsc = this.audioContext.createOscillator();
    const snareGain = this.audioContext.createGain();
    const snareFilter = this.audioContext.createBiquadFilter();

    snareOsc.type = 'triangle';
    snareOsc.frequency.setValueAtTime(200, currentTime);
    snareOsc.frequency.exponentialRampToValueAtTime(100, currentTime + 0.05);

    // Noise component
    const noiseBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 0.2, this.audioContext.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / noiseBuffer.length, 2);
    }

    const noiseSource = this.audioContext.createBufferSource();
    const noiseGain = this.audioContext.createGain();
    const noiseFilter = this.audioContext.createBiquadFilter();

    noiseSource.buffer = noiseBuffer;
    noiseGain.gain.setValueAtTime(Math.max(0.001, volume * 0.4), currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.2);

    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(1000, currentTime);

    snareGain.gain.setValueAtTime(Math.max(0.001, volume * 0.3), currentTime);
    snareGain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.15);

    snareFilter.type = 'bandpass';
    snareFilter.frequency.setValueAtTime(150, currentTime);
    snareFilter.Q.setValueAtTime(1, currentTime);

    snareOsc.connect(snareFilter);
    snareFilter.connect(snareGain);
    snareGain.connect(this.masterGain);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    snareOsc.start(currentTime);
    snareOsc.stop(currentTime + 0.2);
    noiseSource.start(currentTime);
  }

  private playHiHat(type: string, volume: number, currentTime: number) {
    if (!this.audioContext || !this.masterGain) return;

    const duration = type === 'openhat' ? 0.4 : 0.08;
    const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * duration, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const decay = type === 'openhat' ? Math.pow(1 - i / buffer.length, 0.5) : Math.pow(1 - i / buffer.length, 3);
      data[i] = (Math.random() * 2 - 1) * decay;
    }

    const source = this.audioContext.createBufferSource();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    source.buffer = buffer;
    gain.gain.setValueAtTime(Math.max(0.001, volume * 0.15), currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(8000, currentTime);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start(currentTime);
  }

  private playClap(volume: number, currentTime: number) {
    if (!this.audioContext || !this.masterGain) return;

    for (let i = 0; i < 4; i++) {
      const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 0.01, this.audioContext.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let j = 0; j < buffer.length; j++) {
        data[j] = Math.random() * 2 - 1;
      }

      const source = this.audioContext.createBufferSource();
      const gain = this.audioContext.createGain();

      source.buffer = buffer;
      gain.gain.setValueAtTime(Math.max(0.001, volume * 0.2), currentTime + i * 0.01);

      source.connect(gain);
      gain.connect(this.masterGain);

      source.start(currentTime + i * 0.01);
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

  static getNoteFrequency(note: string, octave: number = 4): number {
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
