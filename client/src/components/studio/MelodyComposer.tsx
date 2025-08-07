import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAudio, useMelodyPlayer } from "@/hooks/use-audio";

interface Note {
  note: string;
  octave: number;
  duration: number;
  start: number;
}

export default function MelodyComposer() {
  const [scale, setScale] = useState("C Major");
  const [notes, setNotes] = useState<Note[]>([
    { note: "C", octave: 4, duration: 0.5, start: 0 },
    { note: "E", octave: 4, duration: 0.5, start: 0.5 },
    { note: "G", octave: 4, duration: 0.5, start: 1 },
    { note: "C", octave: 5, duration: 1, start: 1.5 },
  ]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [bpm, setBpm] = useState(120);
  const [currentOctave, setCurrentOctave] = useState(4);
  
  const { toast } = useToast();
  const { playNote } = useAudio();
  const { playMelody, stopMelody } = useMelodyPlayer();

  const generateMelodyMutation = useMutation({
    mutationFn: async (data: { scale: string; style: string; complexity: number }) => {
      const response = await apiRequest("POST", "/api/melodies/generate", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.notes && data.notes.notes) {
        setNotes(data.notes.notes);
        toast({
          title: "Melody Generated",
          description: "AI has composed a new melody.",
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
    mutationFn: async (data: { name: string; notes: Note[]; scale: string }) => {
      const response = await apiRequest("POST", "/api/melodies", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Melody Saved",
        description: "Melody has been saved successfully.",
      });
    },
  });

  const handleGenerateAI = () => {
    generateMelodyMutation.mutate({
      scale,
      style: "electronic",
      complexity: 5,
    });
  };

  const handleSave = () => {
    saveMelodyMutation.mutate({
      name: `Melody ${new Date().toLocaleTimeString()}`,
      notes,
      scale,
    });
  };

  const handlePlay = () => {
    if (isPlaying) {
      stopMelody();
      setIsPlaying(false);
      setCurrentBeat(0);
    } else {
      playMelody(notes, bpm);
      setIsPlaying(true);
      
      // Start beat counter
      const beatDuration = (60 / bpm) * 1000;
      const maxBeats = Math.max(...notes.map(n => n.start + n.duration), 4);
      
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
    
    // Calculate beat position (0-4 beats across the width)
    const beatPosition = (x / rect.width) * 4;
    
    // Calculate note from y position (simplified - assuming 4 octaves visible)
    const noteIndex = Math.floor((rect.height - y) / (rect.height / 48)); // 4 octaves * 12 notes
    const octave = Math.floor(noteIndex / 12) + 3; // Starting from octave 3
    const noteInOctave = noteIndex % 12;
    const note = pianoKeys[noteInOctave].note;
    
    // Add new note
    const newNote: Note = {
      note,
      octave,
      duration: 0.5,
      start: Math.round(beatPosition * 4) / 4, // Snap to 16th notes
    };
    
    setNotes([...notes, newNote]);
    playNote(note, octave, 0.5);
  };

  const removeNote = (index: number) => {
    setNotes(notes.filter((_, i) => i !== index));
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
    "C Major",
    "D Minor",
    "G Major",
    "A Minor",
    "E Major",
    "F# Minor",
  ];

  return (
    <div className="h-full p-6 flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-heading font-bold">Melody Composer</h2>
          
          {/* Transport Controls */}
          <Button
            onClick={handlePlay}
            className={`${isPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
          >
            <i className={`fas ${isPlaying ? 'fa-stop' : 'fa-play'} mr-2`}></i>
            {isPlaying ? 'Stop' : 'Play'}
          </Button>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">BPM:</label>
            <input
              type="number"
              value={bpm}
              onChange={(e) => setBpm(Math.max(60, Math.min(200, parseInt(e.target.value) || 120)))}
              className="w-16 px-2 py-1 text-sm bg-gray-800 border border-gray-600 rounded"
              min="60"
              max="200"
            />
          </div>
          
          <Button
            onClick={() => setNotes([])}
            variant="outline"
            size="sm"
          >
            <i className="fas fa-trash mr-2"></i>
            Clear
          </Button>
        </div>
        
        <div className="flex items-center space-x-4">
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
          
          <Button
            onClick={handleGenerateAI}
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
            onClick={handleSave}
            disabled={saveMelodyMutation.isPending}
            variant="secondary"
          >
            <i className="fas fa-save mr-2"></i>
            Save
          </Button>
        </div>
      </div>
      
      <div className="flex-1 flex space-x-6">
        {/* Piano Roll */}
        <div className="flex-1 bg-studio-panel border border-gray-600 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Piano Roll - Click to add notes</h3>
            <div className="text-sm text-gray-400">
              Beat: {currentBeat.toFixed(1)} / 4.0
            </div>
          </div>
          
          {/* Note Grid */}
          <div 
            className="h-64 bg-gray-800 rounded border border-gray-600 relative overflow-hidden cursor-crosshair"
            onClick={handlePianoRollClick}
          >
            {/* Grid lines - Vertical (beats) */}
            <div className="absolute inset-0 grid grid-cols-16 gap-px pointer-events-none">
              {Array(16).fill(0).map((_, i) => (
                <div key={`beat-${i}`} className={`border-r ${i % 4 === 0 ? 'border-gray-500' : 'border-gray-700'}`}></div>
              ))}
            </div>
            
            {/* Grid lines - Horizontal (notes) */}
            <div className="absolute inset-0 pointer-events-none">
              {Array(16).fill(0).map((_, i) => (
                <div 
                  key={`note-${i}`} 
                  className="border-b border-gray-700 h-4"
                  style={{ top: `${i * 16}px` }}
                ></div>
              ))}
            </div>
            
            {/* Playback cursor */}
            {isPlaying && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
                style={{
                  left: `${(currentBeat / 4) * 100}%`,
                }}
              />
            )}
            
            {/* Notes */}
            {notes.map((note, index) => {
              const noteIndex = pianoKeys.findIndex(k => k.note === note.note);
              const yPosition = (11 - noteIndex - (note.octave - 3) * 12) * 16;
              
              return (
                <div
                  key={index}
                  className="absolute bg-studio-accent rounded h-4 cursor-pointer hover:bg-blue-400 group"
                  style={{
                    left: `${(note.start / 4) * 100}%`,
                    width: `${Math.max((note.duration / 4) * 100, 2)}%`,
                    top: `${Math.max(0, Math.min(yPosition, 240))}px`,
                  }}
                  title={`${note.note}${note.octave} - Start: ${note.start}, Duration: ${note.duration}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeNote(index);
                  }}
                >
                  <div className="hidden group-hover:block absolute -top-6 left-0 bg-black text-white text-xs px-1 rounded">
                    Click to delete
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 text-xs text-gray-400 space-y-1">
            <div className="grid grid-cols-4 gap-8 text-center">
              <div>Beat 1</div>
              <div>Beat 2</div>
              <div>Beat 3</div>
              <div>Beat 4</div>
            </div>
          </div>
        </div>
        
        {/* Virtual Piano */}
        <div className="w-80 bg-studio-panel border border-gray-600 rounded-lg p-4">
          <h3 className="font-medium mb-4">Virtual Piano</h3>
          
          <div className="relative">
            {/* White Keys */}
            <div className="flex">
              {pianoKeys.filter(key => key.type === "white").map((key, index) => (
                <button
                  key={`white-${index}`}
                  onClick={() => playNote(key.note, currentOctave)}
                  className={`piano-key w-8 h-32 border border-gray-400 rounded-b ${key.color} text-black text-xs flex items-end justify-center pb-2 hover:bg-gray-200`}
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
                  onClick={() => playNote(key.note, currentOctave)}
                  className={`piano-key w-4 h-20 border border-gray-700 rounded-b ${key.color} text-white text-xs flex items-end justify-center pb-1 hover:bg-gray-600 ${
                    index === 1 || index === 4 ? "mr-6" : "mr-4"
                  }`}
                >
                  {key.note}
                </button>
              ))}
            </div>
          </div>
          
          {/* Octave Controls */}
          <div className="mt-4 flex items-center justify-between">
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => setCurrentOctave(Math.max(1, currentOctave - 1))}
            >
              <i className="fas fa-minus mr-1"></i>Octave
            </Button>
            <span className="text-sm font-mono">C{currentOctave}</span>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => setCurrentOctave(Math.min(7, currentOctave + 1))}
            >
              <i className="fas fa-plus mr-1"></i>Octave
            </Button>
          </div>
          
          {/* Melody Parameters */}
          <div className="mt-6 space-y-4">
            <h4 className="font-medium text-sm">Parameters</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Velocity</label>
                <input type="range" min="0" max="127" defaultValue="100" className="w-full" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Note Length</label>
                <Select defaultValue="1/4">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1/16">1/16 Note</SelectItem>
                    <SelectItem value="1/8">1/8 Note</SelectItem>
                    <SelectItem value="1/4">1/4 Note</SelectItem>
                    <SelectItem value="1/2">1/2 Note</SelectItem>
                    <SelectItem value="1/1">Whole Note</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
