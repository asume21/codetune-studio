import { useEffect, useRef, useCallback, useState } from "react";
import { audioEngine, AudioEngine } from "@/lib/audio";
import { realisticAudio } from "@/lib/realisticAudio";
import { useToast } from "@/hooks/use-toast";

// Global audio state
let globalAudioInitialized = false;
const audioInitCallbacks: (() => void)[] = [];

// Note frequency calculation helper
function getNoteFrequency(note: string, octave: number = 4): number {
  const noteMap: { [key: string]: number } = {
    'C': 0, 'C#': 1, 'DB': 1, 'D': 2, 'D#': 3, 'EB': 3, 'E': 4, 'F': 5,
    'F#': 6, 'GB': 6, 'G': 7, 'G#': 8, 'AB': 8, 'A': 9, 'A#': 10, 'BB': 10, 'B': 11
  };
  
  const noteNumber = noteMap[note.toUpperCase()];
  if (noteNumber === undefined) {
    console.warn(`Unknown note: ${note}`);
    return 440; // Default to A4
  }
  
  return 440 * Math.pow(2, (octave - 4) + (noteNumber - 9) / 12);
}

interface UseAudioReturn {
  playNote: (note: string | number, octave?: number, duration?: number, instrument?: string, velocity?: number, sustainEnabled?: boolean) => void;
  playDrumSound: (type: string, volume?: number) => void;
  setMasterVolume: (volume: number) => void;
  isInitialized: boolean;
  initialize: () => Promise<void>;
  useRealisticSounds: boolean;
  toggleRealisticSounds: () => void;
}

// Sequencer hook for beat patterns
export function useSequencer() {
  const { playDrumSound } = useAudio();
  
  return {
    playPattern: (pattern: any[]) => {
      pattern.forEach((step, index) => {
        if (step.active) {
          setTimeout(() => {
            playDrumSound(step.sound || 'kick', step.velocity || 0.7);
          }, index * 125); // 125ms per step for 120 BPM
        }
      });
    }
  };
}

// Melody player hook for playing note sequences
export function useMelodyPlayer() {
  const { playNote } = useAudio();
  let melodyTimeouts: NodeJS.Timeout[] = [];
  let isPlaying = false;
  
  return {
    playMelody: (notes: any[], bpm: string = '120', tracks?: any[]) => {
      // Clear any existing timeouts first
      melodyTimeouts.forEach(timeout => clearTimeout(timeout));
      melodyTimeouts = [];
      isPlaying = true;
      
      // Group notes by start time for accurate playback
      const notesByTime = notes.reduce((acc: any, note) => {
        const startTime = note.start || 0;
        if (!acc[startTime]) acc[startTime] = [];
        acc[startTime].push(note);
        return acc;
      }, {});
      
      // Play notes at their scheduled times
      Object.entries(notesByTime).forEach(([startTime, notesAtTime]: [string, any]) => {
        const timeout = setTimeout(() => {
          if (!isPlaying) return; // Check if still playing
          
          (notesAtTime as any[]).forEach(note => {
            if (note && note.note && note.track) {
              // Find the correct instrument for this track
              const trackInfo = tracks?.find(t => t.id === note.track);
              const instrument = trackInfo?.instrument || 'piano';
              
              console.log(`Playing ${instrument}: ${note.note}${note.octave} for ${note.duration}s (track: ${note.track})`);
              playNote(note.note, note.octave || 4, note.duration || 0.5, instrument);
            }
          });
        }, parseFloat(startTime) * 1000);
        
        melodyTimeouts.push(timeout);
      });
    },
    playChord: (notes: any[], instrument: string = 'piano') => {
      notes.forEach(note => {
        if (note && note.note) {
          playNote(note.note, note.octave || 4, note.duration || 1.0, instrument);
        }
      });
    },
    stopMelody: () => {
      isPlaying = false;
      melodyTimeouts.forEach(timeout => clearTimeout(timeout));
      melodyTimeouts = [];
      audioEngine.stopAllInstruments();
      console.log("Melody stopped - all timeouts cleared");
    }
  };
}

export function useAudio(): UseAudioReturn {
  const [isInitialized, setIsInitialized] = useState(globalAudioInitialized);
  const [useRealisticSounds, setUseRealisticSounds] = useState(true);
  const { toast } = useToast();

  const initialize = useCallback(async () => {
    if (globalAudioInitialized) return;

    try {
      // Initialize both audio engines
      await audioEngine.initialize();
      await realisticAudio.initialize();
      
      // Make synthetic engine globally available for realistic mode fallback
      if (typeof window !== 'undefined') {
        (window as any).syntheticAudioEngine = audioEngine;
      }
      
      globalAudioInitialized = true;
      setIsInitialized(true);
      
      // Notify all components
      audioInitCallbacks.forEach(callback => callback());
      
      toast({
        title: "Audio System Ready",
        description: "Realistic and synthetic audio engines initialized successfully.",
      });
    } catch (error) {
      console.error("Failed to initialize audio:", error);
      toast({
        title: "Audio Initialization Failed",
        description: "Could not initialize audio system. Some features may not work.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Listen for global audio initialization
  useEffect(() => {
    const callback = () => setIsInitialized(true);
    audioInitCallbacks.push(callback);
    
    return () => {
      const index = audioInitCallbacks.indexOf(callback);
      if (index > -1) {
        audioInitCallbacks.splice(index, 1);
      }
    };
  }, []);

  const playNote = useCallback(async (note: string | number, octave: number = 4, duration: number = 0.5, instrument: string = 'piano', velocity: number = 0.7, sustainEnabled: boolean = true) => {
    try {
      if (!globalAudioInitialized) {
        await initialize();
      }
      
      let noteString: string;
      if (typeof note === 'number') {
        // Convert MIDI number to note
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const midiOctave = Math.floor(note / 12) - 1;
        const noteIndex = note % 12;
        noteString = noteNames[noteIndex];
        octave = midiOctave;
      } else {
        noteString = note;
      }

      console.log(`Audio Mode Check: useRealisticSounds=${useRealisticSounds}, realisticAudio.isReady()=${realisticAudio.isReady()}`);
      
      if (useRealisticSounds && realisticAudio.isReady()) {
        // Use realistic sampled instruments
        console.log(`Playing REALISTIC ${instrument}: ${noteString}${octave}`);
        await realisticAudio.playNote(noteString, octave, duration, instrument, velocity, sustainEnabled);
      } else {
        // Fallback to synthetic Web Audio API
        console.log(`Playing SYNTHETIC ${instrument}: ${noteString}${octave}`);
        const frequency = getNoteFrequency(noteString, octave);
        await audioEngine.playNote(frequency, duration, velocity, instrument, sustainEnabled);
      }
    } catch (error) {
      console.error("Failed to play note:", error);
    }
  }, [initialize, useRealisticSounds]);

  const playDrumSound = useCallback(async (type: string, volume: number = 0.5) => {
    try {
      if (!globalAudioInitialized) {
        await initialize();
      }
      
      if (useRealisticSounds && realisticAudio.isReady()) {
        // Use realistic drum samples
        await realisticAudio.playDrumSound(type);
      } else {
        // Fallback to synthetic drums
        audioEngine.playDrum(type as any, volume);
      }
    } catch (error) {
      console.error("Failed to play drum sound:", error);
    }
  }, [initialize, useRealisticSounds]);

  const setMasterVolume = useCallback((volume: number) => {
    try {
      audioEngine.setMasterVolume(volume / 100); // Convert percentage to 0-1 range
    } catch (error) {
      console.error("Failed to set master volume:", error);
    }
  }, []);

  // Initialize audio on first user interaction
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!globalAudioInitialized) {
        initialize();
      }
      document.removeEventListener("click", handleFirstInteraction);
      document.removeEventListener("keydown", handleFirstInteraction);
    };

    document.addEventListener("click", handleFirstInteraction);
    document.addEventListener("keydown", handleFirstInteraction);

    return () => {
      document.removeEventListener("click", handleFirstInteraction);
      document.removeEventListener("keydown", handleFirstInteraction);
    };
  }, [initialize]);

  const toggleRealisticSounds = useCallback(() => {
    setUseRealisticSounds(prev => {
      const newValue = !prev;
      console.log(`🎵 Audio Mode Toggled: ${prev ? 'REALISTIC' : 'SYNTHETIC'} → ${newValue ? 'REALISTIC' : 'SYNTHETIC'}`);
      return newValue;
    });
  }, []);

  return {
    playNote,
    playDrumSound,
    setMasterVolume,
    isInitialized,
    initialize,
    useRealisticSounds,
    toggleRealisticSounds,
  };
}