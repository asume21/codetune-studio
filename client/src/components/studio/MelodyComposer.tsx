import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAudio } from "@/hooks/use-audio";

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
  
  const { toast } = useToast();
  const { playNote } = useAudio();

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
        <h2 className="text-2xl font-heading font-bold">Melody Composer</h2>
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
          <h3 className="font-medium mb-4">Piano Roll</h3>
          
          {/* Note Grid */}
          <div className="h-64 bg-gray-800 rounded border border-gray-600 relative overflow-hidden">
            {/* Grid lines */}
            <div className="absolute inset-0 grid grid-cols-16 gap-px">
              {Array(16).fill(0).map((_, i) => (
                <div key={i} className="border-r border-gray-700"></div>
              ))}
            </div>
            
            {/* Notes */}
            {notes.map((note, index) => (
              <div
                key={index}
                className="absolute bg-studio-accent rounded h-4 cursor-pointer hover:bg-blue-400"
                style={{
                  left: `${(note.start / 4) * 100}%`,
                  width: `${(note.duration / 4) * 100}%`,
                  top: `${(12 - (note.octave * 12 + pianoKeys.findIndex(k => k.note === note.note))) * 16}px`,
                }}
                title={`${note.note}${note.octave}`}
              />
            ))}
          </div>
          
          <div className="mt-4 text-xs text-gray-400 space-y-1">
            <div>C5</div>
            <div>B4</div>
            <div>A4</div>
            <div>G4</div>
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
                  onClick={() => playNote(key.note, 4)}
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
                  onClick={() => playNote(key.note, 4)}
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
            <Button variant="secondary" size="sm">
              <i className="fas fa-minus mr-1"></i>Octave
            </Button>
            <span className="text-sm font-mono">C4</span>
            <Button variant="secondary" size="sm">
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
