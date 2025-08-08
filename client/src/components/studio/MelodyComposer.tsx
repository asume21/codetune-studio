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

const instrumentsConfig = [
  { id: 'piano', name: 'Piano', color: 'bg-blue-500' },
  { id: 'strings', name: 'Strings', color: 'bg-green-500' },
  { id: 'flute', name: 'Flute', color: 'bg-purple-500' },
  { id: 'synth', name: 'Synthesizer', color: 'bg-red-500' },
  { id: 'horns', name: 'Horns', color: 'bg-yellow-500' },
  { id: 'bass', name: 'Bass', color: 'bg-orange-500' },
  { id: 'lead', name: 'Lead', color: 'bg-pink-500' },
  { id: 'pad', name: 'Pad', color: 'bg-cyan-500' },
];

export default function MelodyComposer() {
  const [scale, setScale] = useState("C Major");
  const [tracks, setTracks] = useState<Track[]>([
    { id: 'track1', name: 'Piano', color: 'bg-blue-500', instrument: 'piano', visible: true, muted: false, volume: 80 },
    { id: 'track2', name: 'Strings', color: 'bg-green-500', instrument: 'strings', visible: true, muted: false, volume: 70 },
    { id: 'track3', name: 'Flute', color: 'bg-purple-500', instrument: 'flute', visible: true, muted: false, volume: 60 },
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
  const [zoom, setZoom] = useState(1);

  const { toast } = useToast();
  const { playNote, initialize, isInitialized } = useAudio();
  const { playMelody: playMelodySequence, stopMelody: stopMelodySequence } = useMelodyPlayer();
  const [isMelodyPlaying, setIsMelodyPlaying] = useState(false);
  const { playMelody, stopMelody } = useMelodyPlayer();

  const generateMelodyMutation = useMutation({
    mutationFn: async (data: { scale: string; style: string; complexity: number }) => {
      const response = await apiRequest("POST", "/api/melodies/generate", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.notes && data.notes.notes) {
        const generatedNotes = data.notes.notes.map((note: any) => ({
          ...note,
          track: selectedTrack
        }));
        setNotes(prev => [...prev.filter(n => n.track !== selectedTrack), ...generatedNotes]);
        toast({
          title: "Melody Generated",
          description: `AI has composed a new melody for ${tracks.find(t => t.id === selectedTrack)?.name}.`,
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

      playMelodySequence(activeNotes, bpm, tracks);
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

  const handlePianoRollClick = (e: React.MouseEvent<HTMLDivElement>) => {
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
    const currentTrack = tracks.find(t => t.id === selectedTrack);
    playNote(note, octave, gridSnapSize, currentTrack?.instrument || 'piano');
  };

  const removeNote = (index: number) => {
    setNotes(notes.filter((_, i) => i !== index));
  };

  const addTrack = () => {
    const availableInstruments = instrumentsConfig.filter(
      inst => !tracks.some(track => track.instrument === inst.id)
    );

    if (availableInstruments.length === 0) return;

    const newInstrument = availableInstruments[0];
    const newTrack: Track = {
      id: `track${tracks.length + 1}`,
      name: newInstrument.name,
      color: newInstrument.color,
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
    const instrument = instrumentsConfig.find(inst => inst.id === instrumentId);
    if (!instrument) return;

    setTracks(tracks.map(track => 
      track.id === trackId ? { 
        ...track, 
        instrument: instrumentId, 
        name: instrument.name,
        color: instrument.color 
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
      playMelody(notes, bpm, tracks);
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
                    {instrumentsConfig.map((inst) => (
                      <SelectItem key={inst.id} value={inst.id}>
                        {inst.name}
                      </SelectItem>
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
                  Click on the grid to add notes • Click existing notes to delete them
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
              className="h-80 bg-gray-900 rounded border border-gray-600 relative overflow-hidden cursor-crosshair"
              onClick={handlePianoRollClick}
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
                    className={`absolute rounded h-4 cursor-pointer hover:opacity-80 group z-10 ${track.color} ${track.muted ? 'opacity-50' : 'opacity-90'}`}
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
                    <div className="hidden group-hover:block absolute -top-8 left-0 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap z-30">
                      {track.name}: {note.note}{note.octave} - Click to delete
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
                      playNote(key.note, currentOctave, gridSnapSize, currentTrack?.instrument || 'piano');
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
                      playNote(key.note, currentOctave, gridSnapSize, currentTrack?.instrument || 'piano');
                    }}
                    className={`piano-key w-4 h-20 border border-gray-700 rounded-b ${key.color} text-white text-xs flex items-end justify-center pb-1 hover:bg-gray-600 ${
                      index === 1 || index === 4 ? "mr-6" : "mr-4"
                    }`}
                    title={`Play ${key.note}${currentOctave}`}
                  >
                    {key.note}
                  </button>
                ))}
              </div>
            </div>

            {/* Octave Controls */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-3">Piano Octave Range</label>
              <div className="flex items-center justify-between">
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => setCurrentOctave(Math.max(1, currentOctave - 1))}
                  title="Lower octave"
                >
                  <i className="fas fa-minus mr-1"></i>Lower
                </Button>
                <span className="text-lg font-mono font-bold text-studio-accent">Octave {currentOctave}</span>
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => setCurrentOctave(Math.min(7, currentOctave + 1))}
                  title="Higher octave"
                >
                  <i className="fas fa-plus mr-1"></i>Higher
                </Button>
              </div>
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