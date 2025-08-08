import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAudio } from "@/hooks/use-audio";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BeatPattern {
  kick: boolean[];
  tom: boolean[];
  snare: boolean[];
  hihat: boolean[];
  openhat: boolean[];
  clap: boolean[];
  crash: boolean[];
}

const drumKits = {
  acoustic: {
    name: 'Acoustic',
    sounds: [
      { id: 'kick', name: 'Kick', color: 'bg-red-500' },
      { id: 'tom', name: 'Tom', color: 'bg-purple-600' },
      { id: 'snare', name: 'Snare', color: 'bg-blue-500' },
      { id: 'hihat', name: 'Hi-Hat', color: 'bg-yellow-500' },
      { id: 'openhat', name: 'Open Hat', color: 'bg-green-500' },
      { id: 'clap', name: 'Clap', color: 'bg-pink-500' },
      { id: 'crash', name: 'Crash', color: 'bg-orange-500' },
    ]
  }
};

const defaultTracks = [
  { id: "kick", name: "Kick", color: "bg-red-500" },
  { id: "tom", name: "Tom", color: "bg-purple-600" },
  { id: "snare", name: "Snare", color: "bg-blue-500" },
  { id: "hihat", name: "Hi-Hat", color: "bg-yellow-500" },
  { id: "openhat", name: "Open Hat", color: "bg-green-500" },
  { id: "clap", name: "Clap", color: "bg-pink-500" },
  { id: "crash", name: "Crash", color: "bg-orange-500" },
];

export default function BeatMaker() {
  const [bpm, setBpm] = useState(120);
  const [selectedDrumKit, setSelectedDrumKit] = useState('acoustic');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Initialize pattern with default structure
  const [pattern, setPattern] = useState<BeatPattern>({
    kick: Array(16).fill(false),
    tom: Array(16).fill(false),
    snare: Array(16).fill(false),
    hihat: Array(16).fill(false),
    openhat: Array(16).fill(false),
    clap: Array(16).fill(false),
    crash: Array(16).fill(false),
  });


  const { toast } = useToast();
  const { playDrumSound, initialize, isInitialized } = useAudio();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio on first interaction
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [initialize, isInitialized]);

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
      tom: Array(16).fill(false),
      snare: Array(16).fill(false),
      hihat: Array(16).fill(false),
      openhat: Array(16).fill(false),
      clap: Array(16).fill(false),
      crash: Array(16).fill(false),
    });
  };

  const playPattern = async () => {
    if (isPlaying) {
      stopPattern();
      return;
    }

    // Ensure audio is initialized
    if (!isInitialized) {
      await initialize();
    }

    setIsPlaying(true);
    setCurrentStep(0);

    const stepDuration = (60 / bpm / 4) * 1000; // 16th notes in milliseconds

    intervalRef.current = setInterval(() => {
      setCurrentStep(prev => {
        const step = prev % 16;

        // Play sounds for active steps
        Object.entries(pattern).forEach(([track, steps]) => {
          if (steps && steps[step]) {
            playDrumSound(track);
          }
        });

        return prev + 1;
      });
    }, stepDuration);
  };

  const stopPattern = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPlaying(false);
    setCurrentStep(0);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Get tracks safely with fallback
  const currentDrumKit = drumKits[selectedDrumKit as keyof typeof drumKits];
  const tracks = currentDrumKit?.sounds || defaultTracks;

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-gray-600">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-heading font-bold">Beat Sequencer</h2>
          <div className="flex items-center space-x-4">
            <Button
              onClick={initialize}
              disabled={isInitialized}
              className="bg-studio-accent hover:bg-blue-500"
            >
              <i className="fas fa-power-off mr-2"></i>
              {isInitialized ? 'Audio Ready' : 'Start Audio'}
            </Button>
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
              onClick={playPattern}
              className={`${isPlaying ? 'bg-red-600 hover:bg-red-500' : 'bg-studio-success hover:bg-green-500'}`}
            >
              <i className={`fas ${isPlaying ? 'fa-stop' : 'fa-play'} mr-2`}></i>
              {isPlaying ? 'Stop' : 'Play Beat'}
            </Button>
            <Button onClick={stopPattern} className="bg-red-600 hover:bg-red-500">
              <i className="fas fa-stop mr-2"></i>
              Stop
            </Button>
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
      </div>

      <ScrollArea className="flex-1 p-6">
        <div className="space-y-6">
          <div className="bg-studio-panel border border-gray-600 rounded-lg p-6">
            <div className="space-y-4">
              {tracks.map((track) => (
                <div key={track.id} className="flex items-center space-x-4">
                  <div className="w-20 text-sm font-medium flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded ${track.color}`}></div>
                    <span>{track.name}</span>
                  </div>

                  <div className="flex space-x-2">
                    {(pattern[track.id as keyof BeatPattern] || Array(16).fill(false)).map((active, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          toggleStep(track.id as keyof BeatPattern, index);
                          if (!active && isInitialized) {
                            playDrumSound(track.id);
                          }
                        }}
                        className={`beat-pad w-8 h-8 rounded border transition-all relative ${
                          active 
                            ? `${track.color} shadow-lg transform scale-105 border-gray-400` 
                            : "bg-gray-700 hover:bg-gray-600 border-gray-600"
                        } ${
                          isPlaying && (currentStep % 16) === index 
                            ? "ring-2 ring-white ring-opacity-75" 
                            : ""
                        }`}
                      >
                        {index % 4 === 0 && (
                          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-400">
                            {(index / 4) + 1}
                          </div>
                        )}
                      </button>
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
      </ScrollArea>
    </div>
  );
}