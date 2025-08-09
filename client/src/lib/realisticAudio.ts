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

  async playDrumSound(drumType: string): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Load synth_drum soundfont for drums if not loaded
    if (!this.instruments['drums']) {
      try {
        const drumKit = await Soundfont.instrument(
          this.audioContext!, 
          'synth_drum',
          {
            format: 'mp3',
            soundfont: 'MusyngKite'
          }
        );
        this.instruments['drums'] = drumKit;
        console.log('Loaded realistic drum kit');
      } catch (error) {
        console.error('Failed to load drum kit:', error);
        return;
      }
    }

    // Map drum types to MIDI note numbers for drum kit
    const drumMap: { [key: string]: { note: number, duration: number } } = {
      'kick': { note: 36, duration: 0.3 }, // Bass Drum 1
      'bass': { note: 35, duration: 0.4 }, // Bass Drum 2  
      'snare': { note: 38, duration: 0.2 }, // Acoustic Snare
      'hihat': { note: 42, duration: 0.1 }, // Closed Hi-Hat
      'openhat': { note: 46, duration: 0.3 }, // Open Hi-Hat
      'clap': { note: 39, duration: 0.15 }, // Hand Clap
      'crash': { note: 49, duration: 1.0 }, // Crash Cymbal 1
      'tom': { note: 41, duration: 0.4 }, // Low Floor Tom
      'ride': { note: 51, duration: 0.6 } // Ride Cymbal 1
    };

    const drumInfo = drumMap[drumType];
    if (!drumInfo) {
      console.warn(`Unknown drum type: ${drumType}`);
      return;
    }

    const drumKit = this.instruments['drums'];
    if (drumKit) {
      try {
        drumKit.play(drumInfo.note, this.audioContext!.currentTime, {
          duration: drumInfo.duration,
          gain: 0.8
        });
        console.log(`Playing realistic drum: ${drumType} (MIDI ${drumInfo.note})`);
      } catch (error) {
        console.error(`Error playing drum ${drumType}:`, error);
      }
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
}

// Export singleton instance
export const realisticAudio = new RealisticAudioEngine();