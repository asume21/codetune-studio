import { useEffect, useRef, useCallback, useState } from "react";
import { audioEngine, AudioEngine } from "@/lib/audio";
import { useToast } from "@/hooks/use-toast";

// Global audio state
let globalAudioInitialized = false;
const audioInitCallbacks: (() => void)[] = [];

interface UseAudioReturn {
  playNote: (note: string, octave?: number, duration?: number) => void;
  playDrumSound: (type: string, volume?: number) => void;
  setMasterVolume: (volume: number) => void;
  isInitialized: boolean;
  initialize: () => Promise<void>;
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

  const playNote = useCallback(async (note: string, octave: number = 4, duration: number = 0.5, instrument: string = 'piano', velocity: number = 0.7) => {
    try {
      if (!globalAudioInitialized) {
        await initialize();
      }
      
      await audioEngine.resumeContext();
      const frequency = AudioEngine.getNoteFrequency(note, octave);
      audioEngine.playNote(frequency, duration, instrument, velocity);
    } catch (error) {
      console.error("Failed to play note:", error);
    }
  }, [initialize]);

  const playDrumSound = useCallback(async (type: string, volume: number = 0.5) => {
    try {
      if (!globalAudioInitialized) {
        await initialize();
      }
      
      await audioEngine.resumeContext();
      audioEngine.playDrumSound(type, volume);
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

// Hook for sequencer/pattern playback
export function useSequencer() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentStepRef = useRef(0);
  const { playDrumSound } = useAudio();

  const playPattern = useCallback((pattern: any, bpm: number = 120) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const stepDuration = (60 / bpm / 4) * 1000; // 16th notes in milliseconds
    
    intervalRef.current = setInterval(() => {
      const step = currentStepRef.current % 16;
      
      // Play sounds for active steps
      Object.entries(pattern).forEach(([track, steps]: [string, any]) => {
        if (steps[step]) {
          playDrumSound(track);
        }
      });
      
      currentStepRef.current++;
    }, stepDuration);
  }, [playDrumSound]);

  const stopPattern = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    currentStepRef.current = 0;
  }, []);

  const isPlaying = intervalRef.current !== null;

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    playPattern,
    stopPattern,
    isPlaying,
    currentStep: currentStepRef.current % 16,
  };
}

// Hook for melody playback
export function useMelodyPlayer() {
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);
  const { playNote } = useAudio();

  const playMelody = useCallback((notes: any[], bpm: number = 120) => {
    // Clear any existing timeouts
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    timeoutRefs.current = [];

    const beatDuration = (60 / bpm) * 1000; // Beat duration in milliseconds

    notes.forEach(note => {
      const delay = note.start * beatDuration;
      const duration = note.duration * beatDuration / 1000; // Convert to seconds
      
      const timeout = setTimeout(() => {
        playNote(note.note, note.octave, duration);
      }, delay);
      
      timeoutRefs.current.push(timeout);
    });
  }, [playNote]);

  const stopMelody = useCallback(() => {
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    timeoutRefs.current = [];
  }, []);

  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  return {
    playMelody,
    stopMelody,
  };
}
