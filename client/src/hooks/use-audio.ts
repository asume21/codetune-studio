import { useEffect, useRef, useCallback, useState } from "react";
import { audioEngine, AudioEngine } from "@/lib/audio";
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
  playNote: (note: string | number, octave?: number, duration?: number, instrument?: string) => void;
  playDrumSound: (type: string, volume?: number) => void;
  setMasterVolume: (volume: number) => void;
  isInitialized: boolean;
  initialize: () => Promise<void>;
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
  
  return {
    playMelody: (notes: any[], instrument: string = 'piano') => {
      notes.forEach((note, index) => {
        setTimeout(() => {
          if (note && note.note) {
            playNote(note.note, note.octave || 4, note.duration || 0.5, instrument);
          }
        }, index * (note?.duration || 0.5) * 1000);
      });
    },
    playChord: (notes: any[], instrument: string = 'piano') => {
      notes.forEach(note => {
        if (note && note.note) {
          playNote(note.note, note.octave || 4, note.duration || 1.0, instrument);
        }
      });
    }
  };
}

export function useAudio(): UseAudioReturn {
  const [isInitialized, setIsInitialized] = useState(globalAudioInitialized);
  const { toast } = useToast();

  const initialize = useCallback(async () => {
    if (globalAudioInitialized) return;

    try {
      await audioEngine.initialize();
      globalAudioInitialized = true;
      setIsInitialized(true);
      
      // Notify all components
      audioInitCallbacks.forEach(callback => callback());
      
      toast({
        title: "Audio System Ready",
        description: "Audio engine initialized successfully.",
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

  const playNote = useCallback(async (note: string | number, octave: number = 4, duration: number = 0.5, instrument: string = 'piano') => {
    try {
      if (!globalAudioInitialized) {
        await initialize();
      }
      
      // Resume audio context if needed
      if (audioEngine.audioContext?.state === 'suspended') {
        await audioEngine.audioContext.resume();
      }
      
      const frequency = typeof note === 'string' ? getNoteFrequency(note, octave) : note;
      await audioEngine.playNote(frequency, duration, 0.7, instrument);
    } catch (error) {
      console.error("Failed to play note:", error);
    }
  }, [initialize]);

  const playDrumSound = useCallback(async (type: string, volume: number = 0.5) => {
    try {
      if (!globalAudioInitialized) {
        await initialize();
      }
      
      // Resume audio context if needed
      if (audioEngine.audioContext?.state === 'suspended') {
        await audioEngine.audioContext.resume();
      }
      
      audioEngine.playDrum(type as any, volume);
    } catch (error) {
      console.error("Failed to play drum sound:", error);
    }
  }, [initialize]);

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

  return {
    playNote,
    playDrumSound,
    setMasterVolume,
    isInitialized,
    initialize,
  };
}