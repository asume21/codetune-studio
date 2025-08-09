import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAudio, useMelodyPlayer } from "@/hooks/use-audio";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Note {
  note: string;
  octave: number;
  duration: number;
  start: number;
  track: string;
}

interface Track {
  id: string;
  name: string;
  color: string;
  instrument: string;
  visible: boolean;
  muted: boolean;
  volume: number;
}

const instrumentCategories = {
  piano: {
    name: 'Piano',
    color: 'bg-blue-500',
    instruments: [
      { id: 'piano-keyboard', name: 'Keyboard' },
      { id: 'piano-grand', name: 'Grand Piano' },
      { id: 'piano-organ', name: 'Organ' }
    ]
  },
  strings: {
    name: 'Strings',
    color: 'bg-green-500',
    instruments: [
      { id: 'strings-guitar', name: 'Guitar' },
      { id: 'strings-violin', name: 'Violin' },
      { id: 'strings-ukulele', name: 'Ukulele' }
    ]
  },
  flute: {
    name: 'Flute',
    color: 'bg-purple-500',
    instruments: [
      { id: 'flute-recorder', name: 'Recorder' },
      { id: 'flute-indian', name: 'Indian Flute' },
      { id: 'flute-concert', name: 'Concert Flute' }
    ]
  },
  horns: {
    name: 'Horns',
    color: 'bg-yellow-500',
    instruments: [
      { id: 'horns-trumpet', name: 'Trumpet' },
      { id: 'horns- trombone', name: 'Trombone' },
      { id: 'horns-french', name: 'French Horn' }
    ]
  },
  synth: {
    name: 'Synthesizer',
    color: 'bg-red-500',
    instruments: [
      { id: 'synth-analog', name: 'Analog Synth' },
      { id: 'synth-digital', name: 'Digital Synth' },
      { id: 'synth-fm', name: 'FM Synth' }
    ]
  },
  bass: {
    name: 'Bass',
    color: 'bg-orange-500',
    instruments: [
      { id: 'bass-electric', name: 'Electric Bass' },
      { id: 'bass-upright', name: 'Upright Bass' },
      { id: 'bass-synth', name: 'Synth Bass' }
    ]
  },
  pads: {
    name: 'Pads',
    color: 'bg-cyan-500',
    instruments: [
      { id: 'pads-warm', name: 'Warm Pad' },
      { id: 'pads-strings', name: 'String Pad' },
      { id: 'pads-choir', name: 'Choir Pad' }
    ]
  },
  leads: {
    name: 'Leads',
    color: 'bg-pink-500',
    instruments: [
      { id: 'leads-square', name: 'Square Lead' },
      { id: 'leads-saw', name: 'Saw Lead' },
      { id: 'leads-pluck', name: 'Pluck Lead' }
    ]
  }
};

export default function MelodyComposer() {
  const [scale, setScale] = useState("C Major");
  const [tracks, setTracks] = useState<Track[]>([
    { id: 'track1', name: 'Keyboard', color: 'bg-blue-500', instrument: 'piano-keyboard', visible: true, muted: false, volume: 80 },
    { id: 'track2', name: 'Guitar', color: 'bg-green-500', instrument: 'strings-guitar', visible: true, muted: false, volume: 70 },
    { id: 'track3', name: 'Recorder', color: 'bg-purple-500', instrument: 'flute-recorder', visible: true, muted: false, volume: 60 },
  ]);
  const [selectedTrack, setSelectedTrack] = useState('track1');
  const [notes, setNotes] = useState<Note[]>([
    { note: "C", octave: 4, duration: 0.5, start: 0, track: 'track1' },
    { note: "E", octave: 4, duration: 0.5, start: 0.5, track: 'track1' },
    { note: "G", octave: 4, duration: 0.5, start: 1, track: 'track2' },
    { note: "C", octave: 5, duration: 1, start: 1.5, track: 'track2' },
  ]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [bpm, setBpm] = useState(120);
  const [currentOctave, setCurrentOctave] = useState(4);
  const [gridSnapSize, setGridSnapSize] = useState(0.25); // 16th notes
  const [sustainEnabled, setSustainEnabled] = useState(true);
  const [isHoldingNote, setIsHoldingNote] = useState(false);
  const [holdStartTime, setHoldStartTime] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [arpeggioMode, setArpeggioMode] = useState(false);
  const [arpeggioPattern, setArpeggioPattern] = useState('up');
  
  // Note resizing state
  const [resizingNote, setResizingNote] = useState<{ index: number; startX: number; startDuration: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { toast } = useToast();
  const { playNote, initialize, isInitialized } = useAudio();
  const { playMelody: playMelodySequence, stopMelody: stopMelodySequence } = useMelodyPlayer();
  const [isMelodyPlaying, setIsMelodyPlaying] = useState(false);
  const { playMelody, stopMelody } = useMelodyPlayer();

  // Get appropriate note duration based on instrument type
  const getInstrumentDuration = (instrument: string = 'piano'): number => {
    if (instrument.includes('strings') || instrument.includes('violin') || instrument.includes('guitar')) {
      return Math.max(gridSnapSize * 2, 1.0); // Minimum 1 second for string instruments
    }
    if (instrument.includes('pads') || instrument.includes('choir')) {
      return Math.max(gridSnapSize * 3, 1.5); // Even longer for pads
    }
    if (instrument.includes('flute') || instrument.includes('horn')) {
      return Math.max(gridSnapSize * 1.5, 0.8); // Moderate sustain for wind instruments
    }
    return gridSnapSize; // Default duration for other instruments
  };

  // Play arpeggio pattern
  const playArpeggio = (baseNote: string, octave: number, instrument: string) => {
    const chordNotes = [
      { note: baseNote, octave },
      { note: getNextNote(baseNote, 2), octave }, // Third
      { note: getNextNote(baseNote, 4), octave }, // Fifth
      { note: baseNote, octave: octave + 1 }, // Octave
    ];

    let pattern = [...chordNotes];
    if (arpeggioPattern === 'down') {
      pattern = pattern.reverse();
    } else if (arpeggioPattern === 'updown') {
      pattern = [...chordNotes, ...chordNotes.slice(1, -1).reverse()];
    }

    const duration = getInstrumentDuration(instrument);
    const noteSpacing = 0.15; // Time between arpeggio notes

    pattern.forEach((noteData, index) => {
      setTimeout(() => {
        playNote(noteData.note, noteData.octave, duration * 0.7, instrument, 0.6, sustainEnabled);
      }, index * noteSpacing * 1000);
    });
  };

  // Helper function to convert note name and octave to frequency
  const getNoteFrequency = (note: string, octave: number): number => {
    const noteFrequencies: { [key: string]: number } = {
      'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13,
      'E': 329.63, 'F': 349.23, 'F#': 369.99, 'G': 392.00,
      'G#': 415.30, 'A': 440.00, 'A#': 466.16, 'B': 493.88
    };
    
    const baseFreq = noteFrequencies[note.toUpperCase()] || 440;
    return baseFreq * Math.pow(2, octave - 4); // A4 = 440Hz is reference
  };

  // Helper function to get next note in scale
  const getNextNote = (baseNote: string, steps: number): string => {
    const chromaticNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const majorScaleSteps = [0, 2, 4, 5, 7, 9, 11]; // Major scale intervals

    const baseIndex = chromaticNotes.indexOf(baseNote.toUpperCase());
    if (baseIndex === -1) return baseNote;

    const scaleStepIndex = Math.floor(steps / 2);
    const nextNoteIndex = (baseIndex + majorScaleSteps[scaleStepIndex % majorScaleSteps.length]) % 12;

    return chromaticNotes[nextNoteIndex];
  };

  const generateMelodyMutation = useMutation({
    mutationFn: async (data: { scale: string; style: string; complexity: number }) => {
      // Add randomization to prevent repetitive results
      const styles = ["classical", "jazz", "blues", "rock", "electronic", "folk", "ambient", "world", "cinematic", "experimental"];
      const complexities = [3, 4, 5, 6, 7, 8]; // Vary complexity
      
      const randomStyle = styles[Math.floor(Math.random() * styles.length)];
      const randomComplexity = complexities[Math.floor(Math.random() * complexities.length)];
      
      const response = await apiRequest("POST", "/api/melodies/generate", {
        ...data,
        style: randomStyle,
        complexity: randomComplexity
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.notes && data.notes.notes) {
        const currentTrack = tracks.find(t => t.id === selectedTrack);
        const instrument = currentTrack?.instrument || 'piano';

        const newNotes = data.notes.notes.map((note: any, index: number) => ({
          ...note,
          track: selectedTrack,
          start: note.start || index * 0.5,
          duration: note.duration || getInstrumentDuration(instrument),
        })) || [];
        setNotes(prev => [...prev.filter(n => n.track !== selectedTrack), ...newNotes]);
        toast({
          title: "Melody Generated",
          description: `AI has composed a unique melody!`,
        });
      }
    },
    onError: () => {
      toast({
        title: "Generation Failed",
        description: "Failed to generate melody. Please try again.",
        variant: "destructive",
      });
    },
  });

  const saveMelodyMutation = useMutation({
    mutationFn: async (data: { name: string; notes: Note[]; scale: string; tracks: Track[] }) => {
      const response = await apiRequest("POST", "/api/melodies", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Melody Saved",
        description: "Multi-track melody has been saved successfully.",
      });
    },
  });

  const handleGenerateAI = () => {
    const selectedTrackData = tracks.find(t => t.id === selectedTrack);
    generateMelodyMutation.mutate({
      scale,
      style: selectedTrackData?.instrument || 'electronic',
      complexity: 5,
    });
  };

  const handleSave = () => {
    saveMelodyMutation.mutate({
      name: `Multi-track Melody ${new Date().toLocaleTimeString()}`,
      notes,
      scale,
      tracks,
    });
  };

  const handlePlay = () => {
    if (isPlaying) {
      stopMelodySequence();
      setIsPlaying(false);
      setCurrentBeat(0);
    } else {
      const activeNotes = notes.filter(note => {
        const track = tracks.find(t => t.id === note.track);
        return track && !track.muted;
      });

      playMelodySequence(activeNotes, bpm);
      setIsPlaying(true);

      // Start beat counter
      const beatDuration = (60 / bpm) * 1000;
      const maxBeats = Math.max(...notes.map(n => n.start + n.duration), 8) * zoom;

      let beat = 0;
      const beatInterval = setInterval(() => {
        beat += 0.25;
        setCurrentBeat(beat);

        if (beat >= maxBeats) {
          clearInterval(beatInterval);
          setIsPlaying(false);
          setCurrentBeat(0);
        }
      }, beatDuration / 4);
    }
  };

  const handlePianoRollMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate beat position based on zoom
    const beatPosition = (x / rect.width) * (8 * zoom);

    // Calculate note from y position (4 octaves visible, 48 chromatic notes)
    const noteIndex = Math.floor((rect.height - y) / (rect.height / 48));
    const octave = Math.floor(noteIndex / 12) + 2; // Starting from octave 2
    const noteInOctave = noteIndex % 12;
    const note = pianoKeys[noteInOctave].note;

    // Snap to grid
    const snappedStart = Math.round(beatPosition / gridSnapSize) * gridSnapSize;

    // Add new note to selected track
    const newNote: Note = {
      note,
      octave,
      duration: gridSnapSize,
      start: snappedStart,
      track: selectedTrack,
    };

    setNotes([...notes, newNote]);
    
    // Start hold tracking for sustain
    setIsHoldingNote(true);
    setHoldStartTime(Date.now());
    
    // Play note immediately on mouse down (quick click = no sustain)
    const currentTrack = tracks.find(t => t.id === selectedTrack);
    playNote(note, octave, gridSnapSize, currentTrack?.instrument || 'piano', 0.7, false); // No sustain on initial click
  };

  const handlePianoRollMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isHoldingNote && holdStartTime) {
      const holdDuration = Date.now() - holdStartTime;
      
      // If held for more than 150ms, play with sustain
      if (holdDuration > 150) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Calculate note from y position
        const noteIndex = Math.floor((rect.height - y) / (rect.height / 48));
        const octave = Math.floor(noteIndex / 12) + 2;
        const noteInOctave = noteIndex % 12;
        const note = pianoKeys[noteInOctave].note;

        const currentTrack = tracks.find(t => t.id === selectedTrack);
        // Play with sustain for held notes
        playNote(note, octave, gridSnapSize * 2, currentTrack?.instrument || 'piano', 0.7, sustainEnabled);
      }
    }
    
    setIsHoldingNote(false);
    setHoldStartTime(null);
  };

  const removeNote = (index: number) => {
    setNotes(notes.filter((_, i) => i !== index));
  };

  // Note resizing handlers
  const handleResizeStart = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setResizingNote({
      index,
      startX: e.clientX,
      startDuration: notes[index].duration
    });
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!resizingNote || !isDragging) return;
    
    e.preventDefault();
    e.stopPropagation();

    const deltaX = e.clientX - resizingNote.startX;
    const pianoRollWidth = (e.currentTarget as HTMLElement).clientWidth;
    const deltaTime = (deltaX / pianoRollWidth) * (8 * zoom);
    
    let newDuration = Math.max(gridSnapSize, resizingNote.startDuration + deltaTime);
    // Snap to grid
    newDuration = Math.round(newDuration / gridSnapSize) * gridSnapSize;

    setNotes(prev => prev.map((note, i) => 
      i === resizingNote.index ? { ...note, duration: newDuration } : note
    ));
  };

  const handleMouseUp = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setResizingNote(null);
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        if (!resizingNote) return;
        
        const deltaX = e.clientX - resizingNote.startX;
        const pianoRollElement = document.querySelector('.piano-roll-container');
        if (!pianoRollElement) return;
        
        const pianoRollWidth = pianoRollElement.clientWidth;
        const deltaTime = (deltaX / pianoRollWidth) * (8 * zoom);
        
        let newDuration = Math.max(gridSnapSize, resizingNote.startDuration + deltaTime);
        newDuration = Math.round(newDuration / gridSnapSize) * gridSnapSize;

        setNotes(prev => prev.map((note, i) => 
          i === resizingNote.index ? { ...note, duration: newDuration } : note
        ));
      };
      
      const handleGlobalMouseUp = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setResizingNote(null);
        setIsDragging(false);
      };
      
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, resizingNote, gridSnapSize, zoom]);

  const addTrack = () => {
    // Get all available instruments from all categories
    const allInstruments = Object.values(instrumentCategories)
      .flatMap(category => category.instruments)
      .filter(inst => !tracks.some(track => track.instrument === inst.id));

    if (allInstruments.length === 0) return;

    const newInstrument = allInstruments[0];
    const category = Object.values(instrumentCategories)
      .find(cat => cat.instruments.some(i => i.id === newInstrument.id));

    const newTrack: Track = {
      id: `track${tracks.length + 1}`,
      name: newInstrument.name,
      color: category?.color || 'bg-gray-500',
      instrument: newInstrument.id,
      visible: true,
      muted: false,
      volume: 70,
    };

    setTracks([...tracks, newTrack]);
  };

  const toggleTrackMute = (trackId: string) => {
    setTracks(tracks.map(track => 
      track.id === trackId ? { ...track, muted: !track.muted } : track
    ));
  };

  const toggleTrackVisibility = (trackId: string) => {
    setTracks(tracks.map(track => 
      track.id === trackId ? { ...track, visible: !track.visible } : track
    ));
  };

  const updateTrackInstrument = (trackId: string, instrumentId: string) => {
    // Find the instrument and its category
    let foundInstrument = null;
    let foundCategory = null;

    for (const [categoryKey, category] of Object.entries(instrumentCategories)) {
      const instrument = category.instruments.find(inst => inst.id === instrumentId);
      if (instrument) {
        foundInstrument = instrument;
        foundCategory = category;
        break;
      }
    }

    if (!foundInstrument || !foundCategory) return;

    setTracks(tracks.map(track => 
      track.id === trackId ? { 
        ...track, 
        instrument: instrumentId, 
        name: foundInstrument.name,
        color: foundCategory.color 
      } : track
    ));
  };

  const pianoKeys = [
    { note: "C", type: "white", color: "bg-white" },
    { note: "C#", type: "black", color: "bg-gray-800" },
    { note: "D", type: "white", color: "bg-white" },
    { note: "D#", type: "black", color: "bg-gray-800" },
    { note: "E", type: "white", color: "bg-white" },
    { note: "F", type: "white", color: "bg-white" },
    { note: "F#", type: "black", color: "bg-gray-800" },
    { note: "G", type: "white", color: "bg-white" },
    { note: "G#", type: "black", color: "bg-gray-800" },
    { note: "A", type: "white", color: "bg-white" },
    { note: "A#", type: "black", color: "bg-gray-800" },
    { note: "B", type: "white", color: "bg-white" },
  ];

  const scales = [
    "C Major", "D Minor", "G Major", "A Minor", "E Major", "F# Minor",
    "Bb Major", "C# Minor", "F Major", "D# Minor"
  ];

  const snapSizes = [
    { value: 0.0625, label: "1/64" },
    { value: 0.125, label: "1/32" },
    { value: 0.25, label: "1/16" },
    { value: 0.5, label: "1/8" },
    { value: 1, label: "1/4" },
    { value: 2, label: "1/2" },
  ];

  const internalInstruments = [
    { value: "piano", label: "Piano", icon: "fas fa-music" },
    { value: "bass", label: "Bass", icon: "fas fa-guitar" },
    { value: "lead", label: "Lead", icon: "fas fa-bolt" },
    { value: "strings", label: "Strings", icon: "fas fa-violin" },
    { value: "flute", label: "Flute", icon: "fas fa-wind" },
    { value: "synth", label: "Synth", icon: "fas fa-wave-square" },
    { value: "horn", label: "Horn", icon: "fas fa-trumpet" },
  ];


  const clearAllNotes = () => {
    setNotes([]);
    setIsPlaying(false);
    setCurrentBeat(0);
  };

  const generateMelody = () => {
    generateMelodyMutation.mutate({
      scale,
      style: tracks.find(t => t.id === selectedTrack)?.instrument || 'electronic',
      complexity: 5,
    });
  };

  const handlePlayMelody = () => {
    if (isMelodyPlaying) {
      stopMelody();
      setIsMelodyPlaying(false);
    } else if (notes.length > 0) {
      playMelody(notes, bpm);
      setIsMelodyPlaying(true);
      // Stop after melody duration
      setTimeout(() => {
        setIsMelodyPlaying(false);
      }, notes.length * (60 / bpm) * 1000); // This duration calculation is a simplification
    } else {
      toast({
        title: "No Melody",
        description: "Generate a melody first to play it.",
        variant: "destructive",
      });
    }
  };


  return (
    <div className="h-full flex flex-col">
      {/* Transport and Controls */}
      <div className="p-6 border-b border-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-heading font-bold">Melody Composer</h2>

            <Button
              onClick={initialize}
              disabled={isInitialized}
              className="bg-studio-accent hover:bg-blue-500"
            >
              <i className="fas fa-power-off mr-2"></i>
              {isInitialized ? 'Audio Ready' : 'Start Audio'}
            </Button></div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-300">Musical Scale:</label>
              <Select value={scale} onValueChange={setScale}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {scales.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-300">Sustain:</label>
              <Button
                size="sm"
                variant={sustainEnabled ? "default" : "outline"}
                onClick={() => setSustainEnabled(!sustainEnabled)}
                className={`${sustainEnabled ? 'bg-studio-accent hover:bg-blue-500' : 'bg-gray-600 hover:bg-gray-500'} text-white`}
              >
                {sustainEnabled ? "ON" : "OFF"}
              </Button>
            </div>

            <Button onClick={handlePlayMelody} className="bg-studio-success hover:bg-green-500">
              <i className={`fas ${isMelodyPlaying ? "fa-pause" : "fa-play"} mr-2`}></i>
              {isMelodyPlaying ? "Stop Playback" : "Play All Tracks"}
            </Button>
            <Button
              onClick={generateMelody}
              disabled={generateMelodyMutation.isPending}
              className="bg-studio-accent hover:bg-blue-500"
            >
              {generateMelodyMutation.isPending ? (
                <>
                  <i className="fas fa-spinner animate-spin mr-2"></i>
                  Composing...
                </>
              ) : (
                <>
                  <i className="fas fa-magic mr-2"></i>
                  AI Compose
                </>
              )}
            </Button>

            <Button
              onClick={clearAllNotes}
              variant="outline"
              className="bg-red-600 hover:bg-red-700 text-white border-red-600"
            >
              <i className="fas fa-trash mr-2"></i>
              Clear All
            </Button>

            <Button
              onClick={() => {
                stopMelody();
                setIsMelodyPlaying(false);
                setIsPlaying(false);
                setCurrentBeat(0);
              }}
              variant="outline"
              className="bg-orange-600 hover:bg-orange-700 text-white border-orange-600"
            >
              <i className="fas fa-stop mr-2"></i>
              Stop All
            </Button>

            <Button
              onClick={handleSave}
              disabled={saveMelodyMutation.isPending}
              variant="secondary"
            >
              <i className="fas fa-save mr-2"></i>
              Save Project
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-6">
        <div className="flex space-x-4 h-full">
          {/* Track Controls */}
          <div className="w-64 bg-studio-panel border border-gray-600 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-200">Instrument Tracks</h3>
              <Button size="sm" onClick={addTrack} disabled={tracks.length >= 8}>
                <i className="fas fa-plus mr-1"></i>
                Add
              </Button>
            </div>

            {tracks.map((track) => (
              <div key={track.id} className={`p-3 rounded border ${selectedTrack === track.id ? 'border-studio-accent' : 'border-gray-600'} bg-gray-800`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded ${track.color}`}></div>
                    <span className="text-sm font-medium">{track.name}</span>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => toggleTrackVisibility(track.id)}
                      className={`w-6 h-6 rounded text-xs ${track.visible ? 'bg-green-600' : 'bg-gray-600'}`}
                      title={track.visible ? 'Hide track' : 'Show track'}
                    >
                      <i className={`fas ${track.visible ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                    </button>
                    <button
                      onClick={() => toggleTrackMute(track.id)}
                      className={`w-6 h-6 rounded text-xs ${track.muted ? 'bg-red-600' : 'bg-gray-600'}`}
                      title={track.muted ? 'Unmute track' : 'Mute track'}
                    >
                      <i className={`fas ${track.muted ? 'fa-volume-mute' : 'fa-volume-up'}`}></i>
                    </button>
                  </div>
                </div>

                <Select 
                  value={track.instrument} 
                  onValueChange={(val) => updateTrackInstrument(track.id, val)}
                >
                  <SelectTrigger className="w-full text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(instrumentCategories).map(([categoryKey, category]) => (
                      <div key={categoryKey}>
                        <div className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase">
                          {category.name}
                        </div>
                        {category.instruments.map((inst) => (
                          <SelectItem key={inst.id} value={inst.id}>
                            {inst.name}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>

                <button
                  onClick={() => setSelectedTrack(track.id)}
                  className={`w-full mt-2 px-2 py-1 text-xs rounded ${
                    selectedTrack === track.id ? 'bg-studio-accent' : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  Select for Edit
                </button>
              </div>
            ))}
          </div>

          {/* Piano Roll */}
          <div className="flex-1 bg-studio-panel border border-gray-600 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium text-gray-200">
                  Piano Roll Editor - {tracks.find(t => t.id === selectedTrack)?.name} 
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  Click grid to add notes (hold for sustain) • Click existing notes to delete • Drag note edges to resize
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">
                  Playback Position: Beat {currentBeat.toFixed(2)} / {8 * zoom}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Grid Snap: {snapSizes.find(s => s.value === gridSnapSize)?.label || gridSnapSize}
                </div>
              </div>
            </div>

            {/* Multi-track Piano Roll Grid */}
            <div 
              className="h-80 bg-gray-900 rounded border border-gray-600 relative overflow-hidden cursor-crosshair piano-roll-container"
              onMouseDown={handlePianoRollMouseDown}
              onMouseUp={handlePianoRollMouseUp}
              onMouseMove={handleMouseMove}
            >
              {/* Vertical grid lines (beats) */}
              <div className="absolute inset-0 pointer-events-none">
                {Array(Math.floor(32 * zoom)).fill(0).map((_, i) => (
                  <div
                    key={`beat-${i}`}
                    className={`absolute top-0 bottom-0 ${i % (4 / gridSnapSize) === 0 ? 'border-gray-500' : 'border-gray-700'} border-l`}
                    style={{ left: `${(i / (32 * zoom)) * 100}%` }}
                  />
                ))}
              </div>

              {/* Horizontal grid lines (notes) */}
              <div className="absolute inset-0 pointer-events-none">
                {Array(48).fill(0).map((_, i) => {
                  const isWhiteKey = ![1, 3, 6, 8, 10].includes(i % 12);
                  return (
                    <div 
                      key={`note-${i}`} 
                      className={`border-b ${isWhiteKey ? 'bg-gray-800' : 'bg-gray-850'} ${i % 12 === 0 ? 'border-gray-500' : 'border-gray-700'}`}
                      style={{ 
                        height: `${100 / 48}%`,
                        top: `${(47 - i) * (100 / 48)}%`,
                        position: 'absolute',
                        left: 0,
                        right: 0
                      }}
                    />
                  );
                })}
              </div>

              {/* Playback cursor */}
              {isPlaying && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
                  style={{
                    left: `${(currentBeat / (8 * zoom)) * 100}%`,
                  }}
                />
              )}

              {/* Notes for all tracks */}
              {notes.map((note, index) => {
                const track = tracks.find(t => t.id === note.track);
                if (!track || !track.visible) return null;

                const noteIndex = pianoKeys.findIndex(k => k.note === note.note);
                const yPosition = (47 - (noteIndex + (note.octave - 2) * 12)) * (100 / 48);

                return (
                  <div
                    key={index}
                    className={`absolute rounded cursor-pointer hover:opacity-80 group z-10 ${track.color} ${track.muted ? 'opacity-50' : 'opacity-90'} select-none`}
                    style={{
                      left: `${(note.start / (8 * zoom)) * 100}%`,
                      width: `${Math.max((note.duration / (8 * zoom)) * 100, 1)}%`,
                      top: `${Math.max(0, Math.min(yPosition, 95))}%`,
                      height: `${100 / 48}%`,
                    }}
                    title={`${note.note}${note.octave} - ${track.name} - Start: ${note.start}, Duration: ${note.duration}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNote(index);
                    }}
                  >
                    {/* Note content */}
                    <div className="w-full h-full rounded flex items-center justify-between px-1">
                      <span className="text-xs font-medium text-white opacity-80 truncate">
                        {note.note}{note.octave}
                      </span>
                      
                      {/* Resize handle */}
                      <div
                        className="w-2 h-full bg-white bg-opacity-30 cursor-ew-resize hover:bg-opacity-50 flex-shrink-0 group-hover:bg-opacity-70"
                        onMouseDown={(e) => handleResizeStart(e, index)}
                        title="Drag to resize note"
                      />
                    </div>

                    {/* Tooltip */}
                    <div className="hidden group-hover:block absolute -top-8 left-0 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap z-30">
                      {track.name}: {note.note}{note.octave} - Duration: {note.duration.toFixed(2)}s - Click to delete • Drag right edge to resize
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Beat markers */}
            <div className="mt-2 text-xs text-gray-400">
              <div className="grid gap-8 text-center" style={{ gridTemplateColumns: `repeat(${Math.ceil(8 * zoom)}, 1fr)` }}>
                {Array(Math.ceil(8 * zoom)).fill(0).map((_, i) => (
                  <div key={i}>Beat {i + 1}</div>
                ))}
              </div>
            </div>
          </div>

          {/* Virtual Piano */}
          <div className="w-80 bg-studio-panel border border-gray-600 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-200">Virtual Piano</h3>
              <span className="text-sm text-gray-400">Click keys to play notes</span>
            </div>

            <div className="relative mb-4">
              {/* White Keys */}
              <div className="flex">
                {pianoKeys.filter(key => key.type === "white").map((key, index) => (
                  <button
                    key={`white-${index}`}
                    onClick={() => {
                      const currentTrack = tracks.find(t => t.id === selectedTrack);
                      if (arpeggioMode) {
                        playArpeggio(key.note, currentOctave, currentTrack?.instrument || 'piano');
                      } else {
                        playNote(key.note, currentOctave, gridSnapSize, currentTrack?.instrument || 'piano');
                      }
                    }}
                    className={`piano-key w-8 h-32 border border-gray-400 rounded-b ${key.color} text-black text-xs flex items-end justify-center pb-2 hover:bg-gray-200`}
                    title={`Play ${key.note}${currentOctave}`}
                  >
                    {key.note}
                  </button>
                ))}
              </div>

              {/* Black Keys */}
              <div className="absolute top-0 flex">
                <div className="w-6"></div>
                {pianoKeys.filter(key => key.type === "black").map((key, index) => (
                  <button
                    key={`black-${index}`}
                    onClick={() => {
                      const currentTrack = tracks.find(t => t.id === selectedTrack);
                      if (arpeggioMode) {
                        playArpeggio(key.note, currentOctave, currentTrack?.instrument || 'piano');
                      } else {
                        playNote(key.note, currentOctave, gridSnapSize, currentTrack?.instrument || 'piano');
                      }
                    }}
                    className={`piano-key w-4 h-20 border border-gray-700 rounded-b ${key.color} text-white text-xs flex items-end justify-center pb-1 ${
                      index === 1 || index === 4 ? "mr-6" : "mr-4"
                    } hover:bg-gray-600`}
                    title={`Play ${key.note}${currentOctave}`}
                  >
                    {key.note}
                  </button>
                ))}
              </div>
            </div>

            {/* Octave Control */}
            <div className="bg-gray-800 rounded p-3">
              <label className="block text-sm font-medium mb-2">Octave: {currentOctave}</label>
              <input
                type="range"
                min="1"
                max="7"
                value={currentOctave}
                onChange={(e) => setCurrentOctave(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Arpeggio Controls */}
            <div className="bg-gray-800 rounded p-3 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Arpeggio Mode</label>
                <button
                  onClick={() => setArpeggioMode(!arpeggioMode)}
                  className={`px-3 py-1 text-xs rounded ${
                    arpeggioMode
                      ? "bg-blue-600 text-white"
                      : "bg-gray-600 text-gray-300"
                  }`}
                >
                  {arpeggioMode ? "ON" : "OFF"}
                </button>
              </div>

              {arpeggioMode && (
                <div className="space-y-2">
                  <label className="block text-xs text-gray-400">Pattern</label>
                  <div className="flex space-x-1">
                    {(['up', 'down', 'updown'] as const).map(pattern => (
                      <button
                        key={pattern}
                        onClick={() => setArpeggioPattern(pattern)}
                        className={`px-2 py-1 text-xs rounded capitalize ${
                          arpeggioPattern === pattern
                            ? "bg-blue-600 text-white"
                            : "bg-gray-600 text-gray-300"
                        }`}
                      >
                        {pattern}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Current Track Info */}
            <div className="bg-gray-800 rounded p-3 space-y-3">
              <h4 className="font-medium text-sm text-gray-200">Currently Editing Track</h4>
              <div className="flex items-center space-x-2">
                <div className={`w-4 h-4 rounded ${tracks.find(t => t.id === selectedTrack)?.color}`}></div>
                <span className="text-sm">{tracks.find(t => t.id === selectedTrack)?.name}</span>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Note Count</label>
                  <span className="text-sm">{notes.filter(n => n.track === selectedTrack).length} notes</span>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Instrument</label>
                  <span className="text-sm capitalize">{tracks.find(t => t.id === selectedTrack)?.instrument}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}