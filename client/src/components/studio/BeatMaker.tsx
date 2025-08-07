import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAudio } from "@/hooks/use-audio";

interface BeatPattern {
  kick: boolean[];
  snare: boolean[];
  hihat: boolean[];
  openhat: boolean[];
}

export default function BeatMaker() {
  const [bpm, setBpm] = useState(120);
  const [pattern, setPattern] = useState<BeatPattern>({
    kick: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
    snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
    hihat: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
    openhat: [false, false, false, false, false, false, true, false, false, false, false, false, false, false, true, false],
  });
  
  const { toast } = useToast();
  const { playDrumSound } = useAudio();

  const generateBeatMutation = useMutation({
    mutationFn: async (data: { style: string; bpm: number }) => {
      const response = await apiRequest("POST", "/api/beats/generate", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.pattern) {
        setPattern(data.pattern);
        setBpm(data.bpm);
        toast({
          title: "Beat Generated",
          description: "AI has generated a new beat pattern.",
        });
      }
    },
    onError: () => {
      toast({
        title: "Generation Failed",
        description: "Failed to generate beat pattern. Please try again.",
        variant: "destructive",
      });
    },
  });

  const saveBeatMutation = useMutation({
    mutationFn: async (data: { name: string; pattern: BeatPattern; bpm: number }) => {
      const response = await apiRequest("POST", "/api/beats", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Beat Saved",
        description: "Beat pattern has been saved successfully.",
      });
    },
  });

  const toggleStep = (track: keyof BeatPattern, step: number) => {
    setPattern(prev => ({
      ...prev,
      [track]: prev[track].map((active, index) => 
        index === step ? !active : active
      )
    }));
  };

  const handleGenerateAI = () => {
    generateBeatMutation.mutate({
      style: "hip-hop",
      bpm,
    });
  };

  const handleSave = () => {
    saveBeatMutation.mutate({
      name: `Beat ${new Date().toLocaleTimeString()}`,
      pattern,
      bpm,
    });
  };

  const clearPattern = () => {
    setPattern({
      kick: Array(16).fill(false),
      snare: Array(16).fill(false),
      hihat: Array(16).fill(false),
      openhat: Array(16).fill(false),
    });
  };

  const tracks = [
    { id: "kick", name: "Kick", color: "bg-red-500" },
    { id: "snare", name: "Snare", color: "bg-blue-500" },
    { id: "hihat", name: "Hi-Hat", color: "bg-yellow-500" },
    { id: "openhat", name: "Open Hat", color: "bg-green-500" },
  ];

  return (
    <div className="h-full p-6 flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-bold">Beat Sequencer</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm">BPM:</span>
            <Input
              type="number"
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="w-16 text-sm"
              min="60"
              max="200"
            />
          </div>
          <Button
            onClick={handleGenerateAI}
            disabled={generateBeatMutation.isPending}
            className="bg-studio-accent hover:bg-blue-500"
          >
            {generateBeatMutation.isPending ? (
              <>
                <i className="fas fa-spinner animate-spin mr-2"></i>
                Generating...
              </>
            ) : (
              <>
                <i className="fas fa-magic mr-2"></i>
                AI Generate
              </>
            )}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveBeatMutation.isPending}
            variant="secondary"
          >
            <i className="fas fa-save mr-2"></i>
            Save
          </Button>
          <Button onClick={clearPattern} variant="destructive">
            <i className="fas fa-trash mr-2"></i>
            Clear
          </Button>
        </div>
      </div>
      
      <div className="flex-1 bg-studio-panel border border-gray-600 rounded-lg p-6">
        <div className="space-y-4">
          {tracks.map((track) => (
            <div key={track.id} className="flex items-center space-x-4">
              <div className="w-20 text-sm font-medium flex items-center space-x-2">
                <div className={`w-3 h-3 rounded ${track.color}`}></div>
                <span>{track.name}</span>
              </div>
              
              <div className="flex space-x-2">
                {pattern[track.id as keyof BeatPattern].map((active, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      toggleStep(track.id as keyof BeatPattern, index);
                      if (active) {
                        playDrumSound(track.id);
                      }
                    }}
                    className={`beat-pad w-8 h-8 rounded border border-gray-600 transition-all ${
                      active 
                        ? `${track.color} shadow-lg transform scale-105` 
                        : "bg-gray-700 hover:bg-gray-600"
                    }`}
                  />
                ))}
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  defaultValue="80"
                  className="w-16"
                />
                <span className="text-xs text-gray-400 w-8">80%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Waveform Visualization */}
      <div className="bg-studio-panel border border-gray-600 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">Waveform</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <span>4/4 Time</span>
            <span>•</span>
            <span>{bpm} BPM</span>
          </div>
        </div>
        <svg className="w-full h-20" viewBox="0 0 800 80">
          <path 
            className="waveform-line" 
            d="M0,40 Q50,20 100,40 T200,40 Q250,60 300,40 T400,40 Q450,20 500,40 T600,40 Q650,60 700,40 T800,40"
          />
        </svg>
      </div>
    </div>
  );
}
