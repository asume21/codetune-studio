import Soundfont from 'soundfont-player';

export class RealisticAudioEngine {
  private instruments: { [key: string]: any } = {};
  private audioContext: AudioContext | null = null;
  private isInitialized = false;
  private isLoading = false;

  // Map our instrument names to General MIDI soundfont names
  private instrumentLibrary: { [key: string]: string } = {
    // Piano instruments
    piano: 'acoustic_grand_piano',
    'piano-keyboard': 'acoustic_grand_piano',
    'piano-grand': 'acoustic_grand_piano', 
    'piano-organ': 'church_organ',
    
    // String instruments
    guitar: 'acoustic_guitar_steel',
    'strings-guitar': 'acoustic_guitar_steel',
    'guitar-acoustic': 'acoustic_guitar_steel',
    'guitar-electric': 'electric_guitar_clean',
    'guitar-distorted': 'distortion_guitar',
    'guitar-nylon': 'acoustic_guitar_nylon',
    'strings-violin': 'violin',
    'strings-ukulele': 'acoustic_guitar_nylon',
    
    // Flute instruments
    'flute-recorder': 'recorder',
    'flute-indian': 'flute',
    'flute-concert': 'flute',
    
    // Horn instruments
    'horns-trumpet': 'trumpet',
    'horns-trombone': 'trombone',
    'horns-french': 'french_horn',
    
    // Synthesizer (fallback to electric piano)
    'synth-analog': 'electric_piano_1',
    'synth-digital': 'electric_piano_2',
    'synth-fm': 'electric_piano_1',
    
    // Bass instruments
    'bass-electric': 'electric_bass_finger',
    'bass-upright': 'acoustic_bass',
    'bass-synth': 'synth_bass_1',
    
    // Pads (use warm synth sounds)
    'pads-warm': 'pad_2_warm',
    'pads-strings': 'string_ensemble_1',
    'pads-choir': 'choir_aahs',
    
    // Leads (use bright synth sounds)
    'leads-square': 'lead_1_square',
    'leads-saw': 'lead_2_sawtooth',
    'leads-pluck': 'lead_6_voice',
    
    // Legacy mappings for backwards compatibility
    bass: 'electric_bass_finger',
    violin: 'violin',
    organ: 'church_organ',
    synth: 'lead_1_square',
    strings: 'string_ensemble_1',
    flute: 'flute',
    trumpet: 'trumpet'
  };

  async initialize(): Promise<void> {
    if (this.isInitialized || this.isLoading) return;
    this.isLoading = true;

    try {
      // Create Web Audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      console.log('🎵 Realistic audio context created, state:', this.audioContext.state);
      console.log('🎵 Environment:', process.env.NODE_ENV || 'development');
      
      // Handle suspended context (required for browser autoplay policies)
      if (this.audioContext.state === 'suspended') {
        console.log('🎵 Audio context suspended, attempting to resume...');
        
        // Add a click listener to resume context on next user interaction
        const resumeAudio = async () => {
          if (this.audioContext && this.audioContext.state === 'suspended') {
            try {
              await this.audioContext.resume();
              console.log('🎵 Audio context resumed successfully');
            } catch (error) {
              console.error('🎵 Failed to resume audio context:', error);
            }
          }
          document.removeEventListener('click', resumeAudio, true);
          document.removeEventListener('keydown', resumeAudio, true);
          document.removeEventListener('touchstart', resumeAudio, true);
        };
        
        // Listen for user interactions to resume audio
        document.addEventListener('click', resumeAudio, true);
        document.addEventListener('keydown', resumeAudio, true);
        document.addEventListener('touchstart', resumeAudio, true);
        
        // Try to resume immediately in case we already have permission
        try {
          await this.audioContext.resume();
          console.log('🎵 Audio context resumed immediately');
        } catch (error) {
          console.log('🎵 Audio context needs user interaction to resume');
        }
      }

      console.log('🎵 Realistic audio context started, final state:', this.audioContext.state);

      // Load essential instruments first (piano, guitar, and a few more)
      await this.loadInstruments([
        'piano', 'guitar', 'strings-guitar', 'violin', 'flute', 'trumpet', 
        'piano-organ', 'bass-electric', 'strings-violin'
      ]);
      
      this.isInitialized = true;
      this.isLoading = false;
      console.log('Realistic audio engine initialized with sampled instruments');
    } catch (error) {
      console.error('Failed to initialize realistic audio engine:', error);
      this.isLoading = false;
      throw error;
    }
  }

  private async loadInstruments(instrumentNames: string[]): Promise<void> {
    if (!this.audioContext) {
      throw new Error('Audio context not initialized');
    }

    const loadPromises = instrumentNames.map(async (name) => {
      if (this.instruments[name] || !(name in this.instrumentLibrary)) {
        return;
      }

      try {
        const soundfontName = this.instrumentLibrary[name];
        console.log(`🎵 Loading realistic ${name} instrument (${soundfontName})`);
        
        const instrument = await Soundfont.instrument(
          this.audioContext!, 
          soundfontName as any, // Type assertion for soundfont-player compatibility
          {
            format: 'mp3', // Use MP3 for better browser compatibility
            soundfont: 'MusyngKite', // High-quality soundfont
            nameToUrl: (name: string, soundfont: string, format: string) => {
              // Ensure HTTPS URLs for production compatibility
              const baseUrl = `https://gleitz.github.io/midi-js-soundfonts/${soundfont}`;
              return `${baseUrl}/${name}-${format}.js`;
            }
          }
        );
        
        this.instruments[name] = instrument;
        console.log(`🎵 Loaded realistic ${name} instrument successfully`);
      } catch (error) {
        console.error(`🎵 Failed to load ${name} instrument:`, error);
      }
    });

    await Promise.all(loadPromises);
  }

  async loadAdditionalInstrument(instrumentName: string): Promise<void> {
    if (this.instruments[instrumentName] || !(instrumentName in this.instrumentLibrary) || !this.audioContext) {
      return;
    }

    try {
      console.log(`Loading additional realistic ${instrumentName} instrument`);
      
      const soundfontName = this.instrumentLibrary[instrumentName];
      const instrument = await Soundfont.instrument(
        this.audioContext, 
        soundfontName as any, // Type assertion for soundfont-player compatibility
        {
          format: 'mp3',
          soundfont: 'MusyngKite',
          nameToUrl: (name: string, soundfont: string, format: string) => {
            // Ensure HTTPS URLs for production compatibility
            const baseUrl = `https://gleitz.github.io/midi-js-soundfonts/${soundfont}`;
            return `${baseUrl}/${name}-${format}.js`;
          }
        }
      );
      
      this.instruments[instrumentName] = instrument;
      console.log(`Loaded additional realistic ${instrumentName} instrument successfully`);
    } catch (error) {
      console.error(`Failed to load additional ${instrumentName} instrument:`, error);
    }
  }

  async playNote(
    note: string, 
    octave: number, 
    duration: number, 
    instrument: string = 'piano', 
    velocity: number = 0.7,
    sustainEnabled: boolean = true
  ): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Use the instrument key directly, or fallback to legacy mapping
    let realInstrument = instrument;
    
    // If instrument not in library, try fallback mapping
    if (!(realInstrument in this.instrumentLibrary)) {
      if (instrument.includes('piano') || instrument.includes('keyboard')) {
        realInstrument = 'piano';
      } else if (instrument.includes('guitar') || instrument.includes('string')) {
        realInstrument = 'guitar';
      } else if (instrument.includes('violin')) {
        realInstrument = 'strings-violin';
      } else if (instrument.includes('flute')) {
        realInstrument = 'flute-concert';
      } else if (instrument.includes('trumpet') || instrument.includes('horn')) {
        realInstrument = 'horns-trumpet';
      } else if (instrument.includes('bass')) {
        realInstrument = 'bass-electric';
      } else if (instrument.includes('organ')) {
        realInstrument = 'piano-organ';
      } else if (instrument.includes('synth')) {
        realInstrument = 'synth-analog';
      } else if (instrument.includes('lead')) {
        realInstrument = 'leads-square';
      } else if (instrument.includes('pad')) {
        realInstrument = 'pads-warm';
      } else {
        realInstrument = 'piano'; // Ultimate fallback
      }
    }
    
    // Load instrument if not already loaded
    if (!this.instruments[realInstrument]) {
      await this.loadAdditionalInstrument(realInstrument);
    }

    const instrumentSampler = this.instruments[realInstrument];
    if (!instrumentSampler) {
      console.warn(`Realistic instrument ${realInstrument} not available, skipping playback`);
      return;
    }

    try {
      const noteName = `${note}${octave}`;
      const finalDuration = sustainEnabled ? duration : Math.min(duration, 0.5);
      const adjustedVelocity = Math.max(0.1, Math.min(1.0, velocity));

      // Use soundfont-player to play realistic sampled note
      const playedNote = instrumentSampler.play(noteName, this.audioContext!.currentTime, {
        duration: finalDuration,
        gain: adjustedVelocity
      });
      
      console.log(`Playing realistic ${realInstrument}: ${noteName} for ${finalDuration}s`);
    } catch (error) {
      console.error(`Error playing realistic note ${note}${octave} on ${realInstrument}:`, error);
    }
  }

  async playDrumSound(drumType: string, velocity: number = 0.7): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Load drum kit - use the synthetic engine instead of broken soundfont
    if (!this.instruments['drums']) {
      console.log('🎵 Using synthetic drums for realistic mode (soundfont drums are broken)');
      // Don't load any drum soundfont - we'll use the synthetic engine
    }

    // Use synthetic drum engine for "realistic" mode since soundfonts are broken
    console.log(`🎵 Playing synthetic drum in realistic mode: ${drumType}`);
    
    // Use the same synthetic drum implementation directly here to avoid circular imports
    if (!this.audioContext) {
      console.error('🎵 AudioContext not available for synthetic drums');
      return;
    }

    const currentTime = this.audioContext.currentTime;
    
    try {
      // Recreate the professional drum synthesis here
      switch (drumType) {
        case 'kick':
          this.playSyntheticKick(currentTime, velocity);
          break;
        case 'bass': // Deeper, sub-bass drum
          this.playSyntheticBassDrum(currentTime, velocity);
          break;
        case 'snare':
          this.playSyntheticSnare(currentTime, velocity);
          break;
        case 'hihat':
          this.playSyntheticHihat(currentTime, velocity);
          break;
        case 'openhat':
          this.playSyntheticOpenHat(currentTime, velocity);
          break;
        case 'tom':
          this.playSyntheticTom(currentTime, velocity);
          break;
        case 'clap':
          this.playSyntheticClap(currentTime, velocity);
          break;
        case 'crash':
          this.playSyntheticCrash(currentTime, velocity);
          break;
        default:
          console.warn(`🎵 Unknown drum type: ${drumType}`);
      }
    } catch (error) {
      console.error('🎵 Failed to play synthetic drum:', error);
    }
  }

  // Stop all currently playing sounds
  stopAllSounds(): void {
    Object.values(this.instruments).forEach(instrument => {
      if (instrument && instrument.stop) {
        instrument.stop();
      }
    });
  }

  // Set master volume
  setMasterVolume(volume: number): void {
    if (this.audioContext) {
      const clampedVolume = Math.max(0, Math.min(1, volume));
      // Note: soundfont-player manages volume per instrument
      console.log(`Setting master volume to ${clampedVolume}`);
    }
  }

  // Get list of available instruments
  getAvailableInstruments(): string[] {
    return Object.keys(this.instrumentLibrary);
  }

  // Check if engine is ready
  isReady(): boolean {
    return this.isInitialized && !this.isLoading;
  }
  // Professional synthetic drum implementations (to avoid circular imports)
  private playSyntheticKick(currentTime: number, velocity: number): void {
    if (!this.audioContext) return;

    try {
      const kickOsc = this.audioContext.createOscillator();
      const kickClickOsc = this.audioContext.createOscillator();
      const kickGain = this.audioContext.createGain();
      const kickClickGain = this.audioContext.createGain();
      const kickFilter = this.audioContext.createBiquadFilter();

      // Main kick - deep sine wave
      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(65, currentTime);
      kickOsc.frequency.exponentialRampToValueAtTime(35, currentTime + 0.15);

      // Click/beater attack
      kickClickOsc.type = 'triangle';
      kickClickOsc.frequency.setValueAtTime(1200, currentTime);
      kickClickOsc.frequency.exponentialRampToValueAtTime(800, currentTime + 0.01);

      // Tight filter for definition
      kickFilter.type = 'lowpass';
      kickFilter.frequency.setValueAtTime(120, currentTime);
      kickFilter.Q.setValueAtTime(8, currentTime);

      // Main kick envelope - punchy decay
      const kickVol = Math.max(0.001, velocity * 1.2);
      kickGain.gain.setValueAtTime(kickVol, currentTime);
      kickGain.gain.exponentialRampToValueAtTime(kickVol * 0.6, currentTime + 0.08);
      kickGain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.4);

      // Click envelope - very short attack
      const clickVol = Math.max(0.001, velocity * 0.3);
      kickClickGain.gain.setValueAtTime(clickVol, currentTime);
      kickClickGain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.015);

      // Connect
      kickOsc.connect(kickFilter);
      kickFilter.connect(kickGain);
      kickGain.connect(this.audioContext.destination);

      kickClickOsc.connect(kickClickGain);
      kickClickGain.connect(this.audioContext.destination);

      kickOsc.start(currentTime);
      kickClickOsc.start(currentTime);
      kickOsc.stop(currentTime + 0.4);
      kickClickOsc.stop(currentTime + 0.015);
    } catch (error) {
      console.error('🎵 Kick drum error:', error);
    }
  }

  private playSyntheticSnare(currentTime: number, velocity: number): void {
    if (!this.audioContext) return;

    try {
      const snareNoise = this.audioContext.createBufferSource();
      const snareTone = this.audioContext.createOscillator();
      const snareGain = this.audioContext.createGain();
      const snareToneGain = this.audioContext.createGain();
      const snareFilter = this.audioContext.createBiquadFilter();

      // Generate proper snare noise
      const bufferSize = this.audioContext.sampleRate * 0.12;
      const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        const envelope = Math.pow(1 - (i / bufferSize), 2);
        data[i] = (Math.random() * 2 - 1) * envelope;
      }

      snareNoise.buffer = buffer;

      // Snare fundamental
      snareTone.type = 'triangle';
      snareTone.frequency.setValueAtTime(240, currentTime);
      snareTone.frequency.exponentialRampToValueAtTime(180, currentTime + 0.08);

      // Bandpass for snare character
      snareFilter.type = 'bandpass';
      snareFilter.frequency.setValueAtTime(2500, currentTime);
      snareFilter.Q.setValueAtTime(2.5, currentTime);

      // Snare crack envelope
      const snareVol = Math.max(0.001, velocity * 0.9);
      snareGain.gain.setValueAtTime(snareVol, currentTime);
      snareGain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.12);

      const toneVol = Math.max(0.001, velocity * 0.4);
      snareToneGain.gain.setValueAtTime(toneVol, currentTime);
      snareToneGain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.08);

      // Connect
      snareNoise.connect(snareFilter);
      snareFilter.connect(snareGain);
      snareGain.connect(this.audioContext.destination);

      snareTone.connect(snareToneGain);
      snareToneGain.connect(this.audioContext.destination);

      snareNoise.start(currentTime);
      snareTone.start(currentTime);
      snareTone.stop(currentTime + 0.08);
    } catch (error) {
      console.error('🎵 Snare drum error:', error);
    }
  }

  private playSyntheticHihat(currentTime: number, velocity: number): void {
    if (!this.audioContext) return;

    try {
      const hihatNoise = this.audioContext.createBufferSource();
      const hihatGain = this.audioContext.createGain();
      const hihatFilter = this.audioContext.createBiquadFilter();

      const duration = 0.05;
      const bufferSize = this.audioContext.sampleRate * duration;
      const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
      const data = buffer.getChannelData(0);

      // Generate hi-hat noise with proper envelope
      for (let i = 0; i < bufferSize; i++) {
        const envelope = Math.pow(1 - (i / bufferSize), 4);
        data[i] = (Math.random() * 2 - 1) * envelope;
      }

      hihatNoise.buffer = buffer;

      // High-pass for metallic character
      hihatFilter.type = 'highpass';
      hihatFilter.frequency.setValueAtTime(10000, currentTime);
      hihatFilter.Q.setValueAtTime(1, currentTime);

      const hihatVol = Math.max(0.001, velocity * 0.7);
      hihatGain.gain.setValueAtTime(hihatVol, currentTime);
      hihatGain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);

      // Connect
      hihatNoise.connect(hihatFilter);
      hihatFilter.connect(hihatGain);
      hihatGain.connect(this.audioContext.destination);

      hihatNoise.start(currentTime);
    } catch (error) {
      console.error('🎵 Hi-hat error:', error);
    }
  }

  private playSyntheticTom(currentTime: number, velocity: number): void {
    if (!this.audioContext) return;

    try {
      const tomOsc = this.audioContext.createOscillator();
      const tomGain = this.audioContext.createGain();
      const tomFilter = this.audioContext.createBiquadFilter();

      // Tom fundamental frequency
      tomOsc.type = 'sine';
      tomOsc.frequency.setValueAtTime(120, currentTime);
      tomOsc.frequency.exponentialRampToValueAtTime(80, currentTime + 0.3);

      // Mid-focused filter
      tomFilter.type = 'lowpass';
      tomFilter.frequency.setValueAtTime(600, currentTime);
      tomFilter.Q.setValueAtTime(3, currentTime);

      // Punchy envelope
      const tomVol = Math.max(0.001, velocity * 0.8);
      tomGain.gain.setValueAtTime(tomVol, currentTime);
      tomGain.gain.exponentialRampToValueAtTime(tomVol * 0.5, currentTime + 0.1);
      tomGain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.4);

      // Connect
      tomOsc.connect(tomFilter);
      tomFilter.connect(tomGain);
      tomGain.connect(this.audioContext.destination);

      tomOsc.start(currentTime);
      tomOsc.stop(currentTime + 0.4);
    } catch (error) {
      console.error('🎵 Tom drum error:', error);
    }
  }

  private playSyntheticOpenHat(currentTime: number, velocity: number): void {
    if (!this.audioContext) return;

    try {
      const openhatNoise = this.audioContext.createBufferSource();
      const openhatGain = this.audioContext.createGain();
      const openhatFilter = this.audioContext.createBiquadFilter();

      const duration = 0.25; // Longer than closed hi-hat
      const bufferSize = this.audioContext.sampleRate * duration;
      const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
      const data = buffer.getChannelData(0);

      // Generate open hi-hat noise with slower envelope
      for (let i = 0; i < bufferSize; i++) {
        const envelope = Math.pow(1 - (i / bufferSize), 2); // Slower decay than closed hat
        data[i] = (Math.random() * 2 - 1) * envelope;
      }

      openhatNoise.buffer = buffer;

      // High-pass for metallic character
      openhatFilter.type = 'highpass';
      openhatFilter.frequency.setValueAtTime(8000, currentTime);
      openhatFilter.Q.setValueAtTime(1, currentTime);

      const openhatVol = Math.max(0.001, velocity * 0.8);
      openhatGain.gain.setValueAtTime(openhatVol, currentTime);
      openhatGain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);

      // Connect
      openhatNoise.connect(openhatFilter);
      openhatFilter.connect(openhatGain);
      openhatGain.connect(this.audioContext.destination);

      openhatNoise.start(currentTime);
    } catch (error) {
      console.error('🎵 Open hi-hat error:', error);
    }
  }

  private playSyntheticClap(currentTime: number, velocity: number): void {
    if (!this.audioContext) return;

    try {
      // Create a sharp, punchy clap using filtered white noise with tight envelope
      const clapNoise = this.audioContext.createBufferSource();
      const clapGain = this.audioContext.createGain();
      const clapFilter = this.audioContext.createBiquadFilter();
      const clapFilter2 = this.audioContext.createBiquadFilter();

      const duration = 0.08;
      const bufferSize = this.audioContext.sampleRate * duration;
      const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
      const data = buffer.getChannelData(0);

      // Generate tight clap noise with sharp attack
      for (let i = 0; i < bufferSize; i++) {
        const envelope = i < bufferSize * 0.1 ? 1 : Math.pow(1 - ((i - bufferSize * 0.1) / (bufferSize * 0.9)), 4);
        data[i] = (Math.random() * 2 - 1) * envelope;
      }

      clapNoise.buffer = buffer;

      // Two-stage filtering for crisp clap sound
      clapFilter.type = 'highpass';
      clapFilter.frequency.setValueAtTime(800, currentTime);
      clapFilter.Q.setValueAtTime(1, currentTime);

      clapFilter2.type = 'bandpass';
      clapFilter2.frequency.setValueAtTime(2200, currentTime);
      clapFilter2.Q.setValueAtTime(3, currentTime);

      // Sharp attack, quick decay
      const clapVol = Math.max(0.001, velocity * 0.8);
      clapGain.gain.setValueAtTime(clapVol, currentTime);
      clapGain.gain.exponentialRampToValueAtTime(clapVol * 0.3, currentTime + 0.01);
      clapGain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);

      // Connect through both filters
      clapNoise.connect(clapFilter);
      clapFilter.connect(clapFilter2);
      clapFilter2.connect(clapGain);
      clapGain.connect(this.audioContext.destination);

      clapNoise.start(currentTime);
    } catch (error) {
      console.error('🎵 Clap error:', error);
    }
  }

  private playSyntheticCrash(currentTime: number, velocity: number): void {
    if (!this.audioContext) return;

    try {
      // Create a realistic crash using filtered white noise (like the hi-hat but longer)
      const crashNoise = this.audioContext.createBufferSource();
      const crashGain = this.audioContext.createGain();
      const crashFilter = this.audioContext.createBiquadFilter();

      const duration = 1.2; // Shorter than UFO version but still long crash
      const bufferSize = this.audioContext.sampleRate * duration;
      const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
      const data = buffer.getChannelData(0);

      // Generate crash noise with natural decay
      for (let i = 0; i < bufferSize; i++) {
        const envelope = Math.pow(1 - (i / bufferSize), 0.3); // Natural crash decay
        data[i] = (Math.random() * 2 - 1) * envelope;
      }

      crashNoise.buffer = buffer;

      // High-pass filter for bright metallic crash
      crashFilter.type = 'highpass';
      crashFilter.frequency.setValueAtTime(4000, currentTime);
      crashFilter.Q.setValueAtTime(0.3, currentTime);

      // Crash envelope
      const crashVol = Math.max(0.001, velocity * 1.0);
      crashGain.gain.setValueAtTime(crashVol, currentTime);
      crashGain.gain.exponentialRampToValueAtTime(crashVol * 0.4, currentTime + 0.2);
      crashGain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);

      // Connect
      crashNoise.connect(crashFilter);
      crashFilter.connect(crashGain);
      crashGain.connect(this.audioContext.destination);

      crashNoise.start(currentTime);
    } catch (error) {
      console.error('🎵 Crash cymbal error:', error);
    }
  }

  private playSyntheticBassDrum(currentTime: number, velocity: number): void {
    if (!this.audioContext) return;

    try {
      const bassOsc = this.audioContext.createOscillator();
      const bassGain = this.audioContext.createGain();
      const bassFilter = this.audioContext.createBiquadFilter();

      // Much lower frequency than kick for sub-bass feel
      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(45, currentTime); // Lower than kick
      bassOsc.frequency.exponentialRampToValueAtTime(25, currentTime + 0.4);

      // Very tight low-pass filter for pure sub-bass
      bassFilter.type = 'lowpass';
      bassFilter.frequency.setValueAtTime(80, currentTime);
      bassFilter.Q.setValueAtTime(10, currentTime);

      // MUCH longer, deeper envelope than kick - extended duration
      const bassVol = Math.max(0.001, velocity * 1.4);
      bassGain.gain.setValueAtTime(bassVol, currentTime);
      bassGain.gain.exponentialRampToValueAtTime(bassVol * 0.8, currentTime + 0.15);
      bassGain.gain.exponentialRampToValueAtTime(bassVol * 0.5, currentTime + 0.5);
      bassGain.gain.exponentialRampToValueAtTime(0.001, currentTime + 1.2); // Much longer - 1.2 seconds

      // Connect
      bassOsc.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(this.audioContext.destination);

      bassOsc.start(currentTime);
      bassOsc.stop(currentTime + 1.2); // Extended duration
    } catch (error) {
      console.error('🎵 Bass drum error:', error);
    }
  }
}

// Export singleton instance
export const realisticAudio = new RealisticAudioEngine();