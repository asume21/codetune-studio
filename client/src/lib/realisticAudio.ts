import Soundfont from 'soundfont-player';

export class RealisticAudioEngine {
  private instruments: { [key: string]: any } = {};
  private audioContext: AudioContext | null = null;
  private isInitialized = false;
  private isLoading = false;

  // Map our instrument names to General MIDI soundfont names
  private instrumentLibrary: { [key: string]: string } = {
    piano: 'acoustic_grand_piano',
    guitar: 'acoustic_guitar_nylon',
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
      
      // Resume context if suspended (required for browser autoplay policies)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      console.log('Realistic audio context started');

      // Load essential instruments first (piano, guitar)
      await this.loadInstruments(['piano', 'guitar']);
      
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
        console.log(`Loading realistic ${name} instrument (${soundfontName})`);
        
        const instrument = await Soundfont.instrument(
          this.audioContext!, 
          soundfontName,
          {
            format: 'mp3', // Use MP3 for better browser compatibility
            soundfont: 'MusyngKite' // High-quality soundfont
          }
        );
        
        this.instruments[name] = instrument;
        console.log(`Loaded realistic ${name} instrument successfully`);
      } catch (error) {
        console.error(`Failed to load ${name} instrument:`, error);
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
        soundfontName,
        {
          format: 'mp3',
          soundfont: 'MusyngKite'
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

    // Map our instrument names to realistic instruments
    const instrumentMap: { [key: string]: string } = {
      'piano': 'piano',
      'guitar': 'guitar',
      'bass': 'bass',
      'violin': 'violin',
      'organ': 'organ',
      'synth': 'piano', // Fallback to piano for synth
      'lead': 'guitar', // Fallback to guitar for lead
      'strings': 'violin' // Use violin for strings
    };

    const realInstrument = instrumentMap[instrument] || 'piano';
    
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