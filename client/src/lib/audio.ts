export interface OscillatorData {
  oscillator: OscillatorNode;
  gain: GainNode;
  instrument: string;
  frequency: number;
  startTime: number;
}

export class AudioEngine {
  public audioContext: AudioContext | null = null;
  public masterGain: GainNode | null = null;
  private activeOscillators: Map<string, OscillatorData[]> = new Map();
  private reverbConvolver: ConvolverNode | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      this.audioContext = new AudioContext();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.audioContext.destination);
      
      await this.createReverb();
      this.isInitialized = true;
    } catch (error) {
      console.error("Failed to initialize audio:", error);
      throw error;
    }
  }

  private async createReverb(): Promise<void> {
    if (!this.audioContext) return;
    
    this.reverbConvolver = this.audioContext.createConvolver();
    const length = this.audioContext.sampleRate * 2;
    const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      }
    }
    
    this.reverbConvolver.buffer = impulse;
  }

  private addReverb(source: GainNode, amount: number): void {
    if (!this.audioContext || !this.reverbConvolver || !this.masterGain) return;
    
    const wetGain = this.audioContext.createGain();
    const dryGain = this.audioContext.createGain();
    
    wetGain.gain.value = amount;
    dryGain.gain.value = 1 - amount;
    
    source.connect(dryGain);
    source.connect(this.reverbConvolver);
    
    this.reverbConvolver.connect(wetGain);
    
    wetGain.connect(this.masterGain);
    dryGain.connect(this.masterGain);
  }

  async playNote(frequency: number, duration: number, velocity: number = 0.7, instrument: string = 'piano'): Promise<void> {
    if (!this.audioContext || !this.masterGain) {
      await this.initialize();
    }
    
    try {
      const currentTime = this.audioContext!.currentTime;

      // Route to completely different synthesis methods for each instrument
      if (instrument.includes('piano') && !instrument.includes('organ')) {
        this.playPianoNote(frequency, duration, velocity, currentTime);
      } else if (instrument.includes('grand')) {
        this.playGrandPianoNote(frequency, duration, velocity, currentTime);
      } else if (instrument.includes('organ')) {
        this.playOrganNote(frequency, duration, velocity, currentTime);
      } else if (instrument.includes('guitar')) {
        this.playGuitarNote(frequency, duration, velocity, currentTime);
      } else if (instrument.includes('violin')) {
        this.playViolinNote(frequency, duration, velocity, currentTime);
      } else if (instrument.includes('ukulele')) {
        this.playUkuleleNote(frequency, duration, velocity, currentTime);
      } else if (instrument.includes('flute') && !instrument.includes('pan')) {
        this.playFluteNote(frequency, duration, velocity, currentTime);
      } else if (instrument.includes('panflute')) {
        this.playPanFluteNote(frequency, duration, velocity, currentTime);
      } else if (instrument.includes('recorder')) {
        this.playRecorderNote(frequency, duration, velocity, currentTime);
      } else {
        this.playGenericNote(frequency, duration, velocity, currentTime);
      }
    } catch (error) {
      console.error("Failed to play note:", error);
    }
  }

  // PIANO: Quick attack, bell-like with metallic harmonics
  private playPianoNote(frequency: number, duration: number, velocity: number, currentTime: number) {
    if (!this.audioContext || !this.masterGain) return;

    const oscillators: OscillatorNode[] = [];
    const masterGain = this.audioContext.createGain();
    
    // Piano hammer strike - metallic bell sound
    const fundamental = this.audioContext.createOscillator();
    const metallic1 = this.audioContext.createOscillator();
    const metallic2 = this.audioContext.createOscillator();
    const hammer = this.audioContext.createOscillator();
    
    const fundGain = this.audioContext.createGain();
    const met1Gain = this.audioContext.createGain();
    const met2Gain = this.audioContext.createGain();
    const hammerGain = this.audioContext.createGain();
    
    const pianoFilter = this.audioContext.createBiquadFilter();
    
    // Bell-like fundamental
    fundamental.type = 'triangle';
    fundamental.frequency.setValueAtTime(frequency, currentTime);
    
    // Metallic harmonics
    metallic1.type = 'sine';
    metallic1.frequency.setValueAtTime(frequency * 3.14, currentTime); // Non-harmonic ratio
    
    metallic2.type = 'sine';
    metallic2.frequency.setValueAtTime(frequency * 7.2, currentTime); // Bell-like overtone
    
    // Hammer attack noise
    hammer.type = 'square';
    hammer.frequency.setValueAtTime(frequency * 15, currentTime);
    
    pianoFilter.type = 'lowpass';
    pianoFilter.frequency.setValueAtTime(frequency * 8, currentTime);
    pianoFilter.Q.setValueAtTime(2, currentTime);
    
    // Piano envelope: INSTANT attack, quick decay
    const fundVol = Math.max(0.001, velocity * 0.8);
    fundGain.gain.setValueAtTime(fundVol, currentTime);
    fundGain.gain.exponentialRampToValueAtTime(fundVol * 0.4, currentTime + 0.1);
    fundGain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
    
    const met1Vol = Math.max(0.001, velocity * 0.3);
    met1Gain.gain.setValueAtTime(met1Vol, currentTime);
    met1Gain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration * 0.6);
    
    const met2Vol = Math.max(0.001, velocity * 0.2);
    met2Gain.gain.setValueAtTime(met2Vol, currentTime);
    met2Gain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration * 0.4);
    
    const hammerVol = Math.max(0.001, velocity * 0.4);
    hammerGain.gain.setValueAtTime(hammerVol, currentTime);
    hammerGain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.02);
    
    // Connect
    fundamental.connect(pianoFilter);
    pianoFilter.connect(fundGain);
    fundGain.connect(masterGain);
    
    metallic1.connect(met1Gain);
    met1Gain.connect(masterGain);
    
    metallic2.connect(met2Gain);
    met2Gain.connect(masterGain);
    
    hammer.connect(hammerGain);
    hammerGain.connect(masterGain);
    
    // Start/stop
    fundamental.start(currentTime);
    metallic1.start(currentTime);
    metallic2.start(currentTime);
    hammer.start(currentTime);
    
    fundamental.stop(currentTime + duration);
    metallic1.stop(currentTime + duration);
    metallic2.stop(currentTime + duration);
    hammer.stop(currentTime + duration);
    
    oscillators.push(fundamental, metallic1, metallic2, hammer);

    this.addReverb(masterGain, 0.2);
    masterGain.connect(this.masterGain);
    this.trackOscillators(oscillators, 'piano', frequency);
  }

  // GRAND PIANO: Deep, rich, warm with long sustain - TOTALLY different
  private playGrandPianoNote(frequency: number, duration: number, velocity: number, currentTime: number) {
    if (!this.audioContext || !this.masterGain) return;

    const oscillators: OscillatorNode[] = [];
    const masterGain = this.audioContext.createGain();
    
    // Rich harmonic series - warm and woody
    const fund = this.audioContext.createOscillator();
    const harm2 = this.audioContext.createOscillator();
    const harm3 = this.audioContext.createOscillator();
    const harm5 = this.audioContext.createOscillator();
    const body = this.audioContext.createOscillator();
    
    const fundGain = this.audioContext.createGain();
    const harm2Gain = this.audioContext.createGain();
    const harm3Gain = this.audioContext.createGain();
    const harm5Gain = this.audioContext.createGain();
    const bodyGain = this.audioContext.createGain();
    
    const warmFilter = this.audioContext.createBiquadFilter();
    
    // Warm sine waves
    fund.type = 'sine';
    fund.frequency.setValueAtTime(frequency, currentTime);
    
    harm2.type = 'sine';
    harm2.frequency.setValueAtTime(frequency * 2, currentTime);
    
    harm3.type = 'sine';
    harm3.frequency.setValueAtTime(frequency * 3, currentTime);
    
    harm5.type = 'sine';
    harm5.frequency.setValueAtTime(frequency * 5, currentTime);
    
    // Body resonance
    body.type = 'triangle';
    body.frequency.setValueAtTime(frequency * 0.5, currentTime);
    
    warmFilter.type = 'lowpass';
    warmFilter.frequency.setValueAtTime(frequency * 4, currentTime);
    warmFilter.Q.setValueAtTime(0.7, currentTime);
    
    // GRAND envelope: Medium attack, LONG sustain
    const fundVol = Math.max(0.001, velocity * 1.0);
    fundGain.gain.setValueAtTime(0.001, currentTime);
    fundGain.gain.exponentialRampToValueAtTime(fundVol, currentTime + 0.1);
    if (duration > 0.5) {
      fundGain.gain.setValueAtTime(fundVol * 0.8, currentTime + duration - 0.3);
    }
    fundGain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
    
    const harm2Vol = Math.max(0.001, velocity * 0.6);
    harm2Gain.gain.setValueAtTime(harm2Vol, currentTime);
    harm2Gain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
    
    const harm3Vol = Math.max(0.001, velocity * 0.4);
    harm3Gain.gain.setValueAtTime(harm3Vol, currentTime);
    harm3Gain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
    
    const harm5Vol = Math.max(0.001, velocity * 0.3);
    harm5Gain.gain.setValueAtTime(harm5Vol, currentTime);
    harm5Gain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
    
    const bodyVol = Math.max(0.001, velocity * 0.5);
    bodyGain.gain.setValueAtTime(0.001, currentTime);
    bodyGain.gain.exponentialRampToValueAtTime(bodyVol, currentTime + 0.05);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
    
    // Connect through warm filter
    fund.connect(warmFilter);
    warmFilter.connect(fundGain);
    fundGain.connect(masterGain);
    
    harm2.connect(harm2Gain);
    harm2Gain.connect(masterGain);
    
    harm3.connect(harm3Gain);
    harm3Gain.connect(masterGain);
    
    harm5.connect(harm5Gain);
    harm5Gain.connect(masterGain);
    
    body.connect(bodyGain);
    bodyGain.connect(masterGain);
    
    // Start/stop
    fund.start(currentTime);
    harm2.start(currentTime);
    harm3.start(currentTime);
    harm5.start(currentTime);
    body.start(currentTime);
    
    fund.stop(currentTime + duration);
    harm2.stop(currentTime + duration);
    harm3.stop(currentTime + duration);
    harm5.stop(currentTime + duration);
    body.stop(currentTime + duration);
    
    oscillators.push(fund, harm2, harm3, harm5, body);

    this.addReverb(masterGain, 0.4); // More reverb than piano
    masterGain.connect(this.masterGain);
    this.trackOscillators(oscillators, 'grand', frequency);
  }

  // ORGAN: Pure sustained sine waves - COMPLETELY different
  private playOrganNote(frequency: number, duration: number, velocity: number, currentTime: number) {
    if (!this.audioContext || !this.masterGain) return;

    const oscillators: OscillatorNode[] = [];
    const masterGain = this.audioContext.createGain();
    
    // Hammond organ drawbar simulation - pure sines
    const drawbar1 = this.audioContext.createOscillator();
    const drawbar2 = this.audioContext.createOscillator();
    const drawbar3 = this.audioContext.createOscillator();
    const drawbar4 = this.audioContext.createOscillator();
    const drawbar5 = this.audioContext.createOscillator();
    
    const gain1 = this.audioContext.createGain();
    const gain2 = this.audioContext.createGain();
    const gain3 = this.audioContext.createGain();
    const gain4 = this.audioContext.createGain();
    const gain5 = this.audioContext.createGain();
    
    // Pure sine waves at organ ratios
    drawbar1.type = 'sine';
    drawbar1.frequency.setValueAtTime(frequency, currentTime);
    
    drawbar2.type = 'sine';
    drawbar2.frequency.setValueAtTime(frequency * 2, currentTime);
    
    drawbar3.type = 'sine';
    drawbar3.frequency.setValueAtTime(frequency * 3, currentTime);
    
    drawbar4.type = 'sine';
    drawbar4.frequency.setValueAtTime(frequency * 4, currentTime);
    
    drawbar5.type = 'sine';
    drawbar5.frequency.setValueAtTime(frequency * 6, currentTime);
    
    // ORGAN envelope: NO attack, INSTANT on, sustained until off
    const vol1 = Math.max(0.001, velocity * 0.9);
    gain1.gain.setValueAtTime(vol1, currentTime);
    gain1.gain.setValueAtTime(vol1, currentTime + duration - 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
    
    const vol2 = Math.max(0.001, velocity * 0.7);
    gain2.gain.setValueAtTime(vol2, currentTime);
    gain2.gain.setValueAtTime(vol2, currentTime + duration - 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
    
    const vol3 = Math.max(0.001, velocity * 0.5);
    gain3.gain.setValueAtTime(vol3, currentTime);
    gain3.gain.setValueAtTime(vol3, currentTime + duration - 0.05);
    gain3.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
    
    const vol4 = Math.max(0.001, velocity * 0.4);
    gain4.gain.setValueAtTime(vol4, currentTime);
    gain4.gain.setValueAtTime(vol4, currentTime + duration - 0.05);
    gain4.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
    
    const vol5 = Math.max(0.001, velocity * 0.3);
    gain5.gain.setValueAtTime(vol5, currentTime);
    gain5.gain.setValueAtTime(vol5, currentTime + duration - 0.05);
    gain5.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
    
    // Connect directly - no filtering
    drawbar1.connect(gain1);
    gain1.connect(masterGain);
    
    drawbar2.connect(gain2);
    gain2.connect(masterGain);
    
    drawbar3.connect(gain3);
    gain3.connect(masterGain);
    
    drawbar4.connect(gain4);
    gain4.connect(masterGain);
    
    drawbar5.connect(gain5);
    gain5.connect(masterGain);
    
    // Start/stop
    drawbar1.start(currentTime);
    drawbar2.start(currentTime);
    drawbar3.start(currentTime);
    drawbar4.start(currentTime);
    drawbar5.start(currentTime);
    
    drawbar1.stop(currentTime + duration);
    drawbar2.stop(currentTime + duration);
    drawbar3.stop(currentTime + duration);
    drawbar4.stop(currentTime + duration);
    drawbar5.stop(currentTime + duration);
    
    oscillators.push(drawbar1, drawbar2, drawbar3, drawbar4, drawbar5);

    this.addReverb(masterGain, 0.6); // Cathedral reverb
    masterGain.connect(this.masterGain);
    this.trackOscillators(oscillators, 'organ', frequency);
  }

  // GUITAR: Sharp percussive attack - completely different from violin
  private playGuitarNote(frequency: number, duration: number, velocity: number, currentTime: number) {
    if (!this.audioContext || !this.masterGain) return;

    const oscillators: OscillatorNode[] = [];
    const masterGain = this.audioContext.createGain();
    
    const pluckOsc = this.audioContext.createOscillator();
    const sustainOsc = this.audioContext.createOscillator();
    const pluckNoise = this.audioContext.createOscillator();
    
    const pluckGain = this.audioContext.createGain();
    const sustainGain = this.audioContext.createGain();
    const noiseGain = this.audioContext.createGain();
    
    const guitarFilter = this.audioContext.createBiquadFilter();
    const pluckFilter = this.audioContext.createBiquadFilter();
    
    // Sharp pluck attack
    pluckOsc.type = 'square';
    pluckOsc.frequency.setValueAtTime(frequency, currentTime);
    
    sustainOsc.type = 'triangle';
    sustainOsc.frequency.setValueAtTime(frequency, currentTime);
    
    pluckNoise.type = 'sawtooth';
    pluckNoise.frequency.setValueAtTime(frequency * 20, currentTime);
    
    guitarFilter.type = 'lowpass';
    guitarFilter.frequency.setValueAtTime(frequency * 6, currentTime);
    guitarFilter.frequency.exponentialRampToValueAtTime(frequency * 2, currentTime + duration);
    guitarFilter.Q.setValueAtTime(3, currentTime);
    
    pluckFilter.type = 'highpass';
    pluckFilter.frequency.setValueAtTime(2000, currentTime);
    pluckFilter.Q.setValueAtTime(5, currentTime);
    
    // INSTANT attack, quick decay
    const pluckVolume = Math.max(0.001, velocity * 1.2);
    pluckGain.gain.setValueAtTime(pluckVolume, currentTime);
    pluckGain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.05);
    
    const sustainVolume = Math.max(0.001, velocity * 0.6);
    sustainGain.gain.setValueAtTime(sustainVolume * 0.8, currentTime);
    sustainGain.gain.exponentialRampToValueAtTime(sustainVolume * 0.3, currentTime + duration * 0.3);
    sustainGain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
    
    const noiseVolume = Math.max(0.001, velocity * 0.3);
    noiseGain.gain.setValueAtTime(noiseVolume, currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.02);
    
    pluckOsc.connect(pluckFilter);
    pluckFilter.connect(pluckGain);
    pluckGain.connect(masterGain);
    
    sustainOsc.connect(guitarFilter);
    guitarFilter.connect(sustainGain);
    sustainGain.connect(masterGain);
    
    pluckNoise.connect(noiseGain);
    noiseGain.connect(masterGain);
    
    pluckOsc.start(currentTime);
    sustainOsc.start(currentTime);
    pluckNoise.start(currentTime);
    
    pluckOsc.stop(currentTime + duration);
    sustainOsc.stop(currentTime + duration);
    pluckNoise.stop(currentTime + duration);
    
    oscillators.push(pluckOsc, sustainOsc, pluckNoise);

    this.addReverb(masterGain, 0.1);
    masterGain.connect(this.masterGain);
    this.trackOscillators(oscillators, 'guitar', frequency);
  }

  // VIOLIN: Pure sine with deep vibrato and VERY slow attack
  private playViolinNote(frequency: number, duration: number, velocity: number, currentTime: number) {
    if (!this.audioContext || !this.masterGain) return;

    const oscillators: OscillatorNode[] = [];
    const masterGain = this.audioContext.createGain();
    
    const pureOsc = this.audioContext.createOscillator();
    const vibrato = this.audioContext.createOscillator();
    const tremolo = this.audioContext.createOscillator();
    
    const mainGain = this.audioContext.createGain();
    const vibratoGain = this.audioContext.createGain();
    const tremoloGain = this.audioContext.createGain();
    
    const smoothFilter = this.audioContext.createBiquadFilter();
    
    pureOsc.type = 'sine';
    pureOsc.frequency.setValueAtTime(frequency, currentTime);
    
    vibrato.type = 'sine';
    vibrato.frequency.setValueAtTime(5.8, currentTime);
    vibratoGain.gain.setValueAtTime(frequency * 0.15, currentTime);
    
    tremolo.type = 'sine';
    tremolo.frequency.setValueAtTime(4.2, currentTime);
    tremoloGain.gain.setValueAtTime(0.3, currentTime);
    
    smoothFilter.type = 'lowpass';
    smoothFilter.frequency.setValueAtTime(frequency * 12, currentTime);
    smoothFilter.Q.setValueAtTime(0.5, currentTime);
    
    // VERY slow attack, long sustain
    const maxVolume = Math.max(0.001, velocity * 1.5);
    mainGain.gain.setValueAtTime(0.001, currentTime);
    mainGain.gain.exponentialRampToValueAtTime(maxVolume * 0.1, currentTime + 0.3);
    mainGain.gain.exponentialRampToValueAtTime(maxVolume, currentTime + 0.8);
    if (duration > 1.0) {
      mainGain.gain.setValueAtTime(maxVolume, currentTime + duration - 0.5);
    }
    mainGain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
    
    vibrato.connect(vibratoGain);
    vibratoGain.connect(pureOsc.frequency);
    
    tremolo.connect(tremoloGain);
    tremoloGain.connect(mainGain.gain);
    
    pureOsc.connect(smoothFilter);
    smoothFilter.connect(mainGain);
    mainGain.connect(masterGain);
    
    pureOsc.start(currentTime);
    vibrato.start(currentTime);
    tremolo.start(currentTime);
    
    pureOsc.stop(currentTime + duration);
    vibrato.stop(currentTime + duration);
    tremolo.stop(currentTime + duration);
    
    oscillators.push(pureOsc, vibrato, tremolo);

    this.addReverb(masterGain, 0.4);
    masterGain.connect(this.masterGain);
    this.trackOscillators(oscillators, 'violin', frequency);
  }

  // UKULELE: Bright, bouncy, multiple detuned triangles
  private playUkuleleNote(frequency: number, duration: number, velocity: number, currentTime: number) {
    if (!this.audioContext || !this.masterGain) return;

    const oscillators: OscillatorNode[] = [];
    const masterGain = this.audioContext.createGain();
    
    const brightOsc1 = this.audioContext.createOscillator();
    const brightOsc2 = this.audioContext.createOscillator();
    const brightOsc3 = this.audioContext.createOscillator();
    const sparkleOsc = this.audioContext.createOscillator();
    
    const osc1Gain = this.audioContext.createGain();
    const osc2Gain = this.audioContext.createGain();
    const osc3Gain = this.audioContext.createGain();
    const sparkleGain = this.audioContext.createGain();
    
    const brightFilter = this.audioContext.createBiquadFilter();
    const sparkleFilter = this.audioContext.createBiquadFilter();
    
    brightOsc1.type = 'triangle';
    brightOsc1.frequency.setValueAtTime(frequency, currentTime);
    
    brightOsc2.type = 'triangle';
    brightOsc2.frequency.setValueAtTime(frequency * 2.01, currentTime);
    
    brightOsc3.type = 'triangle';
    brightOsc3.frequency.setValueAtTime(frequency * 3.02, currentTime);
    
    sparkleOsc.type = 'sine';
    sparkleOsc.frequency.setValueAtTime(frequency * 8, currentTime);
    
    brightFilter.type = 'highpass';
    brightFilter.frequency.setValueAtTime(frequency * 0.8, currentTime);
    brightFilter.Q.setValueAtTime(2, currentTime);
    
    sparkleFilter.type = 'bandpass';
    sparkleFilter.frequency.setValueAtTime(frequency * 6, currentTime);
    sparkleFilter.Q.setValueAtTime(8, currentTime);
    
    // Quick bounce, medium decay
    const vol1 = Math.max(0.001, velocity * 1.3);
    osc1Gain.gain.setValueAtTime(vol1, currentTime);
    osc1Gain.gain.exponentialRampToValueAtTime(vol1 * 0.8, currentTime + 0.08);
    osc1Gain.gain.exponentialRampToValueAtTime(vol1 * 0.4, currentTime + duration * 0.5);
    osc1Gain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
    
    const vol2 = Math.max(0.001, velocity * 0.8);
    osc2Gain.gain.setValueAtTime(vol2, currentTime);
    osc2Gain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration * 0.7);
    
    const vol3 = Math.max(0.001, velocity * 0.6);
    osc3Gain.gain.setValueAtTime(vol3, currentTime);
    osc3Gain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration * 0.5);
    
    const sparkleVol = Math.max(0.001, velocity * 0.4);
    sparkleGain.gain.setValueAtTime(sparkleVol, currentTime);
    sparkleGain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration * 0.3);
    
    brightOsc1.connect(brightFilter);
    brightFilter.connect(osc1Gain);
    osc1Gain.connect(masterGain);
    
    brightOsc2.connect(osc2Gain);
    osc2Gain.connect(masterGain);
    
    brightOsc3.connect(osc3Gain);
    osc3Gain.connect(masterGain);
    
    sparkleOsc.connect(sparkleFilter);
    sparkleFilter.connect(sparkleGain);
    sparkleGain.connect(masterGain);
    
    brightOsc1.start(currentTime);
    brightOsc2.start(currentTime);
    brightOsc3.start(currentTime);
    sparkleOsc.start(currentTime);
    
    brightOsc1.stop(currentTime + duration);
    brightOsc2.stop(currentTime + duration);
    brightOsc3.stop(currentTime + duration);
    sparkleOsc.stop(currentTime + duration);
    
    oscillators.push(brightOsc1, brightOsc2, brightOsc3, sparkleOsc);

    this.addReverb(masterGain, 0.05);
    masterGain.connect(this.masterGain);
    this.trackOscillators(oscillators, 'ukulele', frequency);
  }

  // FLUTE: Breathy, airy with noise component
  private playFluteNote(frequency: number, duration: number, velocity: number, currentTime: number) {
    if (!this.audioContext || !this.masterGain) return;

    const oscillators: OscillatorNode[] = [];
    const masterGain = this.audioContext.createGain();
    
    const fluteOsc = this.audioContext.createOscillator();
    const breathNoise = this.audioContext.createOscillator();
    const airTone = this.audioContext.createOscillator();
    
    const fluteGain = this.audioContext.createGain();
    const breathGain = this.audioContext.createGain();
    const airGain = this.audioContext.createGain();
    
    const fluteFilter = this.audioContext.createBiquadFilter();
    const breathFilter = this.audioContext.createBiquadFilter();
    
    // Pure flute tone
    fluteOsc.type = 'sine';
    fluteOsc.frequency.setValueAtTime(frequency, currentTime);
    
    // Breath noise
    breathNoise.type = 'sawtooth';
    breathNoise.frequency.setValueAtTime(frequency * 6.5, currentTime);
    
    // Air tone
    airTone.type = 'triangle';
    airTone.frequency.setValueAtTime(frequency * 2.1, currentTime);
    
    // Smooth flute filtering
    fluteFilter.type = 'lowpass';
    fluteFilter.frequency.setValueAtTime(frequency * 4, currentTime);
    fluteFilter.Q.setValueAtTime(1.5, currentTime);
    
    // Breath filtering
    breathFilter.type = 'bandpass';
    breathFilter.frequency.setValueAtTime(frequency * 8, currentTime);
    breathFilter.Q.setValueAtTime(12, currentTime);
    
    // Gentle flute envelope
    const fluteVol = Math.max(0.001, velocity * 0.9);
    fluteGain.gain.setValueAtTime(0.001, currentTime);
    fluteGain.gain.exponentialRampToValueAtTime(fluteVol, currentTime + 0.15);
    if (duration > 0.3) {
      fluteGain.gain.setValueAtTime(fluteVol * 0.8, currentTime + duration - 0.2);
    }
    fluteGain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
    
    const breathVol = Math.max(0.001, velocity * 0.15);
    breathGain.gain.setValueAtTime(breathVol, currentTime);
    breathGain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration * 0.8);
    
    const airVol = Math.max(0.001, velocity * 0.3);
    airGain.gain.setValueAtTime(airVol, currentTime);
    airGain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
    
    fluteOsc.connect(fluteFilter);
    fluteFilter.connect(fluteGain);
    fluteGain.connect(masterGain);
    
    breathNoise.connect(breathFilter);
    breathFilter.connect(breathGain);
    breathGain.connect(masterGain);
    
    airTone.connect(airGain);
    airGain.connect(masterGain);
    
    fluteOsc.start(currentTime);
    breathNoise.start(currentTime);
    airTone.start(currentTime);
    
    fluteOsc.stop(currentTime + duration);
    breathNoise.stop(currentTime + duration);
    airTone.stop(currentTime + duration);
    
    oscillators.push(fluteOsc, breathNoise, airTone);

    this.addReverb(masterGain, 0.3);
    masterGain.connect(this.masterGain);
    this.trackOscillators(oscillators, 'flute', frequency);
  }

  // PAN FLUTE: Hollow, woody, different from regular flute
  private playPanFluteNote(frequency: number, duration: number, velocity: number, currentTime: number) {
    if (!this.audioContext || !this.masterGain) return;

    const oscillators: OscillatorNode[] = [];
    const masterGain = this.audioContext.createGain();
    
    // Hollow tube resonance - totally different from flute
    const tube1 = this.audioContext.createOscillator();
    const tube2 = this.audioContext.createOscillator();
    const hollow = this.audioContext.createOscillator();
    const woodAir = this.audioContext.createOscillator();
    
    const tube1Gain = this.audioContext.createGain();
    const tube2Gain = this.audioContext.createGain();
    const hollowGain = this.audioContext.createGain();
    const woodGain = this.audioContext.createGain();
    
    const tubeFilter = this.audioContext.createBiquadFilter();
    const hollowFilter = this.audioContext.createBiquadFilter();
    
    // Multiple tube resonances
    tube1.type = 'square';
    tube1.frequency.setValueAtTime(frequency, currentTime);
    
    tube2.type = 'square';
    tube2.frequency.setValueAtTime(frequency * 0.99, currentTime); // Slight detune
    
    // Hollow resonance
    hollow.type = 'triangle';
    hollow.frequency.setValueAtTime(frequency * 0.5, currentTime);
    
    // Wood/air interaction
    woodAir.type = 'sawtooth';
    woodAir.frequency.setValueAtTime(frequency * 4, currentTime);
    
    // Tube filtering
    tubeFilter.type = 'bandpass';
    tubeFilter.frequency.setValueAtTime(frequency * 2, currentTime);
    tubeFilter.Q.setValueAtTime(6, currentTime);
    
    // Hollow filtering
    hollowFilter.type = 'lowpass';
    hollowFilter.frequency.setValueAtTime(frequency * 3, currentTime);
    hollowFilter.Q.setValueAtTime(3, currentTime);
    
    // Pan flute envelope: Medium attack, woody sustain
    const tube1Vol = Math.max(0.001, velocity * 0.7);
    tube1Gain.gain.setValueAtTime(0.001, currentTime);
    tube1Gain.gain.exponentialRampToValueAtTime(tube1Vol, currentTime + 0.1);
    tube1Gain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
    
    const tube2Vol = Math.max(0.001, velocity * 0.65);
    tube2Gain.gain.setValueAtTime(0.001, currentTime);
    tube2Gain.gain.exponentialRampToValueAtTime(tube2Vol, currentTime + 0.12);
    tube2Gain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
    
    const hollowVol = Math.max(0.001, velocity * 0.4);
    hollowGain.gain.setValueAtTime(0.001, currentTime);
    hollowGain.gain.exponentialRampToValueAtTime(hollowVol, currentTime + 0.05);
    hollowGain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
    
    const woodVol = Math.max(0.001, velocity * 0.2);
    woodGain.gain.setValueAtTime(woodVol, currentTime);
    woodGain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration * 0.6);
    
    tube1.connect(tubeFilter);
    tubeFilter.connect(tube1Gain);
    tube1Gain.connect(masterGain);
    
    tube2.connect(tube2Gain);
    tube2Gain.connect(masterGain);
    
    hollow.connect(hollowFilter);
    hollowFilter.connect(hollowGain);
    hollowGain.connect(masterGain);
    
    woodAir.connect(woodGain);
    woodGain.connect(masterGain);
    
    tube1.start(currentTime);
    tube2.start(currentTime);
    hollow.start(currentTime);
    woodAir.start(currentTime);
    
    tube1.stop(currentTime + duration);
    tube2.stop(currentTime + duration);
    hollow.stop(currentTime + duration);
    woodAir.stop(currentTime + duration);
    
    oscillators.push(tube1, tube2, hollow, woodAir);

    this.addReverb(masterGain, 0.5); // More reverb than flute
    masterGain.connect(this.masterGain);
    this.trackOscillators(oscillators, 'panflute', frequency);
  }

  // RECORDER: Sharp, piercing, schoolroom sound - different from both flutes
  private playRecorderNote(frequency: number, duration: number, velocity: number, currentTime: number) {
    if (!this.audioContext || !this.masterGain) return;

    const oscillators: OscillatorNode[] = [];
    const masterGain = this.audioContext.createGain();
    
    // Sharp, piercing tone
    const sharp1 = this.audioContext.createOscillator();
    const sharp2 = this.audioContext.createOscillator();
    const sharp3 = this.audioContext.createOscillator();
    const edge = this.audioContext.createOscillator();
    
    const sharp1Gain = this.audioContext.createGain();
    const sharp2Gain = this.audioContext.createGain();
    const sharp3Gain = this.audioContext.createGain();
    const edgeGain = this.audioContext.createGain();
    
    const sharpFilter = this.audioContext.createBiquadFilter();
    const edgeFilter = this.audioContext.createBiquadFilter();
    
    // Sharp harmonics
    sharp1.type = 'sawtooth';
    sharp1.frequency.setValueAtTime(frequency, currentTime);
    
    sharp2.type = 'sawtooth';
    sharp2.frequency.setValueAtTime(frequency * 2, currentTime);
    
    sharp3.type = 'sawtooth';
    sharp3.frequency.setValueAtTime(frequency * 3, currentTime);
    
    // Edge tone
    edge.type = 'square';
    edge.frequency.setValueAtTime(frequency * 8, currentTime);
    
    // Sharp filtering
    sharpFilter.type = 'bandpass';
    sharpFilter.frequency.setValueAtTime(frequency * 5, currentTime);
    sharpFilter.Q.setValueAtTime(4, currentTime);
    
    // Edge filtering
    edgeFilter.type = 'highpass';
    edgeFilter.frequency.setValueAtTime(frequency * 6, currentTime);
    edgeFilter.Q.setValueAtTime(8, currentTime);
    
    // Recorder envelope: Sharp attack, quick to full volume
    const sharp1Vol = Math.max(0.001, velocity * 1.0);
    sharp1Gain.gain.setValueAtTime(0.001, currentTime);
    sharp1Gain.gain.exponentialRampToValueAtTime(sharp1Vol, currentTime + 0.05);
    sharp1Gain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
    
    const sharp2Vol = Math.max(0.001, velocity * 0.6);
    sharp2Gain.gain.setValueAtTime(sharp2Vol, currentTime);
    sharp2Gain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
    
    const sharp3Vol = Math.max(0.001, velocity * 0.4);
    sharp3Gain.gain.setValueAtTime(sharp3Vol, currentTime);
    sharp3Gain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
    
    const edgeVol = Math.max(0.001, velocity * 0.3);
    edgeGain.gain.setValueAtTime(edgeVol, currentTime);
    edgeGain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration * 0.5);
    
    sharp1.connect(sharpFilter);
    sharpFilter.connect(sharp1Gain);
    sharp1Gain.connect(masterGain);
    
    sharp2.connect(sharp2Gain);
    sharp2Gain.connect(masterGain);
    
    sharp3.connect(sharp3Gain);
    sharp3Gain.connect(masterGain);
    
    edge.connect(edgeFilter);
    edgeFilter.connect(edgeGain);
    edgeGain.connect(masterGain);
    
    sharp1.start(currentTime);
    sharp2.start(currentTime);
    sharp3.start(currentTime);
    edge.start(currentTime);
    
    sharp1.stop(currentTime + duration);
    sharp2.stop(currentTime + duration);
    sharp3.stop(currentTime + duration);
    edge.stop(currentTime + duration);
    
    oscillators.push(sharp1, sharp2, sharp3, edge);

    this.addReverb(masterGain, 0.1); // Very little reverb - dry classroom sound
    masterGain.connect(this.masterGain);
    this.trackOscillators(oscillators, 'recorder', frequency);
  }

  // Generic fallback
  private playGenericNote(frequency: number, duration: number, velocity: number, currentTime: number) {
    if (!this.audioContext || !this.masterGain) return;

    const oscillators: OscillatorNode[] = [];
    const masterGain = this.audioContext.createGain();
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(frequency, currentTime);
    
    const volume = Math.max(0.001, velocity * 0.5);
    gain.gain.setValueAtTime(volume, currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
    
    osc.connect(gain);
    gain.connect(masterGain);
    
    osc.start(currentTime);
    osc.stop(currentTime + duration);
    
    oscillators.push(osc);

    this.addReverb(masterGain, 0.2);
    masterGain.connect(this.masterGain);
    this.trackOscillators(oscillators, 'generic', frequency);
  }

  playFrequency(frequency: number, duration: number = 0.5, velocity: number = 0.7): void {
    this.playNote(frequency, duration, velocity, 'piano');
  }

  private trackOscillators(oscillators: OscillatorNode[], instrument: string, frequency: number): void {
    const data: OscillatorData[] = oscillators.map(osc => ({
      oscillator: osc,
      gain: this.audioContext!.createGain(),
      instrument,
      frequency,
      startTime: this.audioContext!.currentTime
    }));

    if (!this.activeOscillators.has(instrument)) {
      this.activeOscillators.set(instrument, []);
    }
    this.activeOscillators.get(instrument)!.push(...data);
  }

  // Drum methods remain the same
  playDrum(type: 'kick' | 'snare' | 'hihat' | 'openhat' | 'crash' | 'ride' | 'clap' | 'tom', velocity: number = 0.7): void {
    if (!this.audioContext || !this.masterGain) return;

    const currentTime = this.audioContext.currentTime;

    switch (type) {
      case 'kick':
        this.playKick(currentTime, velocity);
        break;
      case 'snare':
        this.playSnare(currentTime, velocity);
        break;
      case 'hihat':
        this.playHihat(currentTime, velocity, false);
        break;
      case 'openhat':
        this.playHihat(currentTime, velocity, true);
        break;
      case 'crash':
        this.playCrash(currentTime, velocity);
        break;
      case 'ride':
        this.playRide(currentTime, velocity);
        break;
      case 'clap':
        this.playClap(currentTime, velocity);
        break;
      case 'tom':
        this.playTom(currentTime, velocity);
        break;
    }
  }

  private playKick(currentTime: number, velocity: number): void {
    if (!this.audioContext || !this.masterGain) return;

    const osc1 = this.audioContext.createOscillator();
    const osc2 = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(80, currentTime);
    osc1.frequency.exponentialRampToValueAtTime(0.01, currentTime + 0.5);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(60, currentTime);
    osc2.frequency.exponentialRampToValueAtTime(0.01, currentTime + 0.3);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(120, currentTime);
    filter.Q.setValueAtTime(10, currentTime);

    const maxGain = Math.max(0.001, velocity * 2.0);
    gain.gain.setValueAtTime(maxGain, currentTime);
    gain.gain.exponentialRampToValueAtTime(maxGain * 0.3, currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 1.2);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(currentTime);
    osc2.start(currentTime);
    osc1.stop(currentTime + 1.2);
    osc2.stop(currentTime + 1.2);
  }

  private playSnare(currentTime: number, velocity: number): void {
    if (!this.audioContext || !this.masterGain) return;

    const noise = this.audioContext.createBufferSource();
    const tone = this.audioContext.createOscillator();
    const noiseGain = this.audioContext.createGain();
    const toneGain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    const rattleFilter = this.audioContext.createBiquadFilter();

    const bufferSize = this.audioContext.sampleRate * 0.4;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize) * 0.8;
    }

    noise.buffer = buffer;

    tone.type = 'triangle';
    tone.frequency.setValueAtTime(250, currentTime);

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(8000, currentTime);
    filter.Q.setValueAtTime(25, currentTime);

    rattleFilter.type = 'bandpass';
    rattleFilter.frequency.setValueAtTime(6000, currentTime);
    rattleFilter.Q.setValueAtTime(8, currentTime);

    const noiseVol = Math.max(0.001, velocity * 1.5);
    noiseGain.gain.setValueAtTime(noiseVol, currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.4);

    const toneVol = Math.max(0.001, velocity * 0.8);
    toneGain.gain.setValueAtTime(toneVol, currentTime);
    toneGain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.25);

    noise.connect(filter);
    filter.connect(rattleFilter);
    rattleFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    tone.connect(toneGain);
    toneGain.connect(this.masterGain);

    noise.start(currentTime);
    tone.start(currentTime);
    tone.stop(currentTime + 0.4);
  }

  private playHihat(currentTime: number, velocity: number, open: boolean = false): void {
    if (!this.audioContext || !this.masterGain) return;

    const noise = this.audioContext.createBufferSource();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    const shimmerFilter = this.audioContext.createBiquadFilter();

    const duration = open ? 0.6 : 0.12;
    const bufferSize = this.audioContext.sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const decay = 1 - (i / bufferSize);
      data[i] = (Math.random() * 2 - 1) * decay * (open ? 0.6 : 0.8);
      
      if (open && i % 4 === 0) {
        data[i] *= 1.2;
      }
    }

    noise.buffer = buffer;

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(12000, currentTime);
    filter.Q.setValueAtTime(12, currentTime);

    shimmerFilter.type = 'bandpass';
    shimmerFilter.frequency.setValueAtTime(open ? 18000 : 16000, currentTime);
    shimmerFilter.Q.setValueAtTime(open ? 6 : 10, currentTime);

    const maxGain = Math.max(0.001, velocity * (open ? 0.8 : 1.2));
    gain.gain.setValueAtTime(maxGain, currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);

    noise.connect(filter);
    filter.connect(shimmerFilter);
    shimmerFilter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(currentTime);
  }

  private playCrash(currentTime: number, velocity: number): void {
    if (!this.audioContext || !this.masterGain) return;

    const noise = this.audioContext.createBufferSource();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    const bufferSize = this.audioContext.sampleRate * 2;
    const buffer = this.audioContext.createBuffer(2, bufferSize, this.audioContext.sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize) * 0.5;
      }
    }

    noise.buffer = buffer;

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(5000, currentTime);
    filter.Q.setValueAtTime(1, currentTime);

    const maxGain = Math.max(0.001, velocity * 0.8);
    gain.gain.setValueAtTime(maxGain, currentTime);
    gain.gain.exponentialRampToValueAtTime(maxGain * 0.3, currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(currentTime);
  }

  private playRide(currentTime: number, velocity: number): void {
    if (!this.audioContext || !this.masterGain) return;

    const osc1 = this.audioContext.createOscillator();
    const osc2 = this.audioContext.createOscillator();
    const noise = this.audioContext.createBufferSource();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(800, currentTime);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1200, currentTime);

    const bufferSize = this.audioContext.sampleRate * 0.3;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize) * 0.1;
    }

    noise.buffer = buffer;

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(3000, currentTime);
    filter.Q.setValueAtTime(2, currentTime);

    const maxGain = Math.max(0.001, velocity * 0.6);
    gain.gain.setValueAtTime(maxGain, currentTime);
    gain.gain.exponentialRampToValueAtTime(maxGain * 0.5, currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 1.5);

    osc1.connect(filter);
    osc2.connect(filter);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(currentTime);
    osc2.start(currentTime);
    noise.start(currentTime);
    osc1.stop(currentTime + 1.5);
    osc2.stop(currentTime + 1.5);
  }

  private playClap(currentTime: number, velocity: number): void {
    if (!this.audioContext || !this.masterGain) return;

    for (let i = 0; i < 4; i++) {
      const delay = i * 0.01;
      const noise = this.audioContext.createBufferSource();
      const gain = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();

      const bufferSize = this.audioContext.sampleRate * 0.15;
      const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
      const data = buffer.getChannelData(0);

      for (let j = 0; j < bufferSize; j++) {
        data[j] = (Math.random() * 2 - 1) * (1 - j / bufferSize) * 0.8;
      }

      noise.buffer = buffer;

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1500 + (i * 200), currentTime);
      filter.Q.setValueAtTime(8, currentTime);

      const burstGain = Math.max(0.001, velocity * (0.8 - i * 0.15));
      gain.gain.setValueAtTime(burstGain, currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, currentTime + delay + 0.12);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noise.start(currentTime + delay);
    }
  }

  private playTom(currentTime: number, velocity: number): void {
    if (!this.audioContext || !this.masterGain) return;

    const osc1 = this.audioContext.createOscillator();
    const osc2 = this.audioContext.createOscillator();
    const noise = this.audioContext.createBufferSource();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(120, currentTime);
    osc1.frequency.exponentialRampToValueAtTime(80, currentTime + 0.8);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(180, currentTime);
    osc2.frequency.exponentialRampToValueAtTime(100, currentTime + 0.6);

    const bufferSize = this.audioContext.sampleRate * 0.2;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize) * 0.2;
    }

    noise.buffer = buffer;

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, currentTime);
    filter.frequency.exponentialRampToValueAtTime(300, currentTime + 0.8);
    filter.Q.setValueAtTime(4, currentTime);

    const maxGain = Math.max(0.001, velocity * 1.2);
    gain.gain.setValueAtTime(maxGain, currentTime);
    gain.gain.exponentialRampToValueAtTime(maxGain * 0.6, currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.8);

    osc1.connect(filter);
    osc2.connect(filter);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(currentTime);
    osc2.start(currentTime);
    noise.start(currentTime);
    osc1.stop(currentTime + 0.8);
    osc2.stop(currentTime + 0.8);
  }

  stopAllInstruments(): void {
    this.activeOscillators.forEach((oscillators, instrument) => {
      oscillators.forEach(oscData => {
        try {
          oscData.oscillator.stop();
        } catch (error) {
          // Oscillator may already be stopped
        }
      });
    });
    this.activeOscillators.clear();
  }

  setMasterVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.audioContext!.currentTime);
    }
  }
}

// Export singleton instance
export const audioEngine = new AudioEngine();