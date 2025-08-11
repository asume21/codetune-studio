import { useState, useRef, useEffect, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAudio } from "@/hooks/use-audio";
import { useMIDI } from "@/hooks/use-midi";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { StudioAudioContext } from "@/pages/studio";
import { realisticAudio } from "@/lib/realisticAudio";

interface BeatPattern {
  kick: boolean[];
  bass: boolean[];
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
      { id: 'bass', name: 'Bass Drum', color: 'bg-red-700' },
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
  { id: "bass", name: "Bass Drum", color: "bg-red-700" },
  { id: "tom", name: "Tom", color: "bg-purple-600" },
  { id: "snare", name: "Snare", color: "bg-blue-500" },
  { id: "hihat", name: "Hi-Hat", color: "bg-yellow-500" },
  { id: "openhat", name: "Open Hat", color: "bg-green-500" },
  { id: "clap", name: "Clap", color: "bg-pink-500" },
  { id: "crash", name: "Crash", color: "bg-orange-500" },
];

export default function BeatMaker() {
  const studioContext = useContext(StudioAudioContext);
  const [bpm, setBpm] = useState(120);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedDrumKit, setSelectedDrumKit] = useState('acoustic');
  const [bassDrumDuration, setBassDrumDuration] = useState(0.8);
  const [complexity, setComplexity] = useState([5]);

  // Initialize pattern with default structure or load from studio context
  const [pattern, setPattern] = useState<BeatPattern>(() => {
    // Check for pattern from studio context first
    if (studioContext.currentPattern && Object.keys(studioContext.currentPattern).length > 0) {
      return {
        kick: studioContext.currentPattern.kick || Array(16).fill(false),
        bass: studioContext.currentPattern.bass || Array(16).fill(false),
        tom: studioContext.currentPattern.tom || Array(16).fill(false),
        snare: studioContext.currentPattern.snare || Array(16).fill(false),
        hihat: studioContext.currentPattern.hihat || Array(16).fill(false),
        openhat: studioContext.currentPattern.openhat || Array(16).fill(false),
        clap: studioContext.currentPattern.clap || Array(16).fill(false),
        crash: studioContext.currentPattern.crash || Array(16).fill(false),
      };
    }
    
    // Check localStorage for persisted data
    const storedData = localStorage.getItem('generatedMusicData');
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        if (parsed.beatPattern) {
          return {
            kick: parsed.beatPattern.kick || Array(16).fill(false),
            bass: parsed.beatPattern.bass || Array(16).fill(false),
            tom: parsed.beatPattern.tom || Array(16).fill(false),
            snare: parsed.beatPattern.snare || Array(16).fill(false),
            hihat: parsed.beatPattern.hihat || Array(16).fill(false),
            openhat: parsed.beatPattern.openhat || Array(16).fill(false),
            clap: parsed.beatPattern.clap || Array(16).fill(false),
            crash: parsed.beatPattern.crash || Array(16).fill(false),
          };
        }
      } catch (error) {
        console.error("Error loading stored pattern:", error);
      }
    }
    
    // Default empty pattern
    return {
      kick: Array(16).fill(false),
      bass: Array(16).fill(false),
      tom: Array(16).fill(false),
      snare: Array(16).fill(false),
      hihat: Array(16).fill(false),
      openhat: Array(16).fill(false),
      clap: Array(16).fill(false),
      crash: Array(16).fill(false),
    };
  });

  const { toast } = useToast();
  const { playDrumSound, initialize, isInitialized } = useAudio();
  
  // MIDI Controller Integration  
  const { isConnected: midiConnected, activeNotes, settings: midiSettings } = useMIDI();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const stepCounterRef = useRef<number>(0);

  // Initialize audio on first interaction
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [initialize, isInitialized]);

  // Listen for updates to studio context pattern (only once when component mounts or context changes)
  const patternLoadedRef = useRef(false);
  useEffect(() => {
    if (studioContext.currentPattern && Object.keys(studioContext.currentPattern).length > 0) {
      // Check if the pattern has any true values (actual beat data)
      const hasRealData = Object.values(studioContext.currentPattern).some(arr => 
        Array.isArray(arr) && arr.some(val => val === true));
      
      if (hasRealData) {
        setPattern({
          kick: studioContext.currentPattern.kick || Array(16).fill(false),
          bass: studioContext.currentPattern.bass || Array(16).fill(false),
          tom: studioContext.currentPattern.tom || Array(16).fill(false),
          snare: studioContext.currentPattern.snare || Array(16).fill(false),
          hihat: studioContext.currentPattern.hihat || Array(16).fill(false),
          openhat: studioContext.currentPattern.openhat || Array(16).fill(false),
          clap: studioContext.currentPattern.clap || Array(16).fill(false),
          crash: studioContext.currentPattern.crash || Array(16).fill(false),
        });
        
        // Update BPM if provided
        if (studioContext.currentPattern.bpm) {
          setBpm(studioContext.currentPattern.bpm);
        }
      }
    }
  }, [studioContext.currentPattern]);

  // Real-time pattern updates for live editing - disabled to fix playback issues
  // useEffect(() => {
  //   if (isPlaying && intervalRef.current) {
  //     // When pattern changes during playback, the useEffect will restart the interval
  //     // This ensures real-time editing works immediately
  //     clearInterval(intervalRef.current);
  //     
  //     const stepDuration = (60 / bpm / 4) * 1000;
  //     intervalRef.current = setInterval(() => {
  //       setCurrentStep(prev => {
  //         const step = prev % 16;
  //         
  //         // Play sounds for active steps using CURRENT pattern state
  //         Object.entries(pattern).forEach(([track, steps]) => {
  //           if (steps && steps[step]) {
  //             playDrumSound(track);
  //           }
  //         });
  //         
  //         return prev + 1;
  //       });
  //     }, stepDuration);
  //   }
  // }, [bpm, pattern, isPlaying, playDrumSound]); // Pattern dependency enables real-time updates

  const generateBeatMutation = useMutation({
    mutationFn: async (data: { style: string; bpm: number; complexity?: number }) => {
      const response = await apiRequest("POST", "/api/beats/generate", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.pattern) {
        setPattern(data.pattern);
        setBpm(data.bpm);
        // Save to studio context for master playback
        studioContext.setCurrentPattern(data.pattern);
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

  // Auto-save to studio context whenever pattern changes (moved outside render)
  useEffect(() => {
    studioContext.setCurrentPattern?.(pattern);
  }, [pattern, studioContext]);

  const handleGenerateAI = () => {
    const styles = ["hip-hop", "trap", "boom-bap", "lo-fi", "drill", "house", "techno", "reggaeton", "afrobeat", "rock"];
    const randomStyle = styles[Math.floor(Math.random() * styles.length)];
    
    generateBeatMutation.mutate({
      style: randomStyle,
      bpm,
      complexity: complexity[0],
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
      bass: Array(16).fill(false),
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

    console.log("🥁 Starting beat playback...");
    console.log("🔧 Audio initialized:", isInitialized);
    console.log("🎵 Pattern:", pattern);
    console.log("🎯 BPM:", bpm);

    // Ensure audio is initialized
    if (!isInitialized) {
      console.log("⚡ Initializing audio...");
      try {
        await initialize();
        console.log("✅ Audio initialization complete");
      } catch (error) {
        console.error("❌ Audio initialization failed:", error);
        toast({
          title: "Audio Error",
          description: "Failed to initialize audio. Please try again.",
          variant: "destructive",
        });
        return;
      }
    }

    setIsPlaying(true);
    setCurrentStep(0);

    const stepDuration = (60 / bpm / 4) * 1000; // 16th notes in milliseconds
    console.log("⏱️ Step duration:", stepDuration, "ms");

    // Reset step counter
    stepCounterRef.current = 0;
    
    intervalRef.current = setInterval(() => {
      const step = stepCounterRef.current % 16;
      console.log(`🎼 Playing step ${step + 1}/16`);
      
      // Update the visual step indicator
      setCurrentStep(stepCounterRef.current);

      // Check if pattern has any active steps
      let hasActiveSteps = false;
      
      // Play sounds for active steps
      Object.entries(pattern).forEach(([track, steps]) => {
        if (steps && steps[step]) {
          hasActiveSteps = true;
          console.log(`🥁 Playing ${track} on step ${step + 1}`);
          playDrumSound(track);
        }
      });

      if (!hasActiveSteps && step === 0) {
        console.log("⚠️ No active steps found in pattern. Click squares to add drum hits!");
      }

      stepCounterRef.current++;
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
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-6 border-b border-gray-600 flex-shrink-0">
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
            <div className="flex items-center space-x-3">
              <span className="text-sm whitespace-nowrap">Bass Duration:</span>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-400">0.3s</span>
                <Slider
                  value={[bassDrumDuration]}
                  onValueChange={(value) => {
                    const newDuration = value[0];
                    setBassDrumDuration(newDuration);
                    realisticAudio.bassDrumDuration = newDuration;
                  }}
                  max={2.0}
                  min={0.3}
                  step={0.1}
                  className="w-20"
                />
                <span className="text-xs text-gray-400">2.0s</span>
              </div>
              <span className="text-xs text-studio-accent font-mono">{bassDrumDuration.toFixed(1)}s</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm whitespace-nowrap">AI Complexity:</span>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-400">Simple</span>
                <Slider
                  value={complexity}
                  onValueChange={setComplexity}
                  max={10}
                  min={1}
                  step={1}
                  className="w-24"
                />
                <span className="text-xs text-gray-400">Complex</span>
              </div>
              <span className="text-xs text-studio-accent font-mono">{complexity[0]}/10</span>
            </div>
            <Button
              onClick={playPattern}
              className={`${isPlaying ? 'bg-red-600 hover:bg-red-500' : 'bg-studio-success hover:bg-green-500'}`}
            >
              <i className={`fas ${isPlaying ? 'fa-stop' : 'fa-play'} mr-2`}></i>
              {isPlaying ? 'Stop (Live Edit Mode)' : 'Play Beat Only'}
              {isPlaying && (
                <span className="ml-2 text-xs bg-yellow-500 text-black px-2 py-1 rounded animate-pulse">
                  LIVE
                </span>
              )}
            </Button>
            <Button onClick={stopPattern} className="bg-red-600 hover:bg-red-500">
              <i className="fas fa-stop mr-2"></i>
              Stop
            </Button>
            <div className="text-xs text-gray-400 px-2">
              <div>{isPlaying ? '🎵 LIVE EDITING: Click steps to hear changes instantly!' : 'Individual beat preview'}</div>
              <div>Use master controls for full song</div>
              {isPlaying && (
                <div className="text-yellow-400 animate-pulse">Step: {(currentStep % 16) + 1}/16</div>
              )}
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
            <Button 
              onClick={() => {
                // Add a simple test pattern
                setPattern({
                  kick: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
                  snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
                  hihat: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
                  bass: Array(16).fill(false),
                  tom: Array(16).fill(false),
                  openhat: Array(16).fill(false),
                  clap: Array(16).fill(false),
                  crash: Array(16).fill(false),
                });
                toast({
                  title: "Test Pattern Loaded",
                  description: "Basic kick, snare, and hi-hat pattern loaded. Click Play to test!",
                });
              }}
              className="bg-green-600 hover:bg-green-500"
            >
              <i className="fas fa-music mr-2"></i>
              Test Pattern
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6" style={{ scrollBehavior: 'smooth' }}>
        <div className="space-y-6">
          {/* Instructions */}
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <h3 className="text-blue-300 font-medium mb-2">How to Use Beat Maker</h3>
            <p className="text-sm text-gray-300">
              Click the <strong>squares</strong> to turn drum sounds on/off for each beat. 
              The <strong>round sliders</strong> control volume for each drum type.
              Press <strong>Play</strong> to hear your beat pattern!
            </p>
          </div>

          <div className="bg-studio-panel border border-gray-600 rounded-lg p-6">
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Drum Pattern Sequencer</h3>
              <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
                <span>Click squares to add drum hits • 16 steps per pattern</span>
                <span>BPM: {bpm}</span>
              </div>
              
              {/* Visual Time Indicator */}
              {isPlaying && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                    <span>Beat Progress</span>
                    <span>Step {(currentStep % 16) + 1} of 16</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                    <div 
                      className="bg-yellow-400 h-2 rounded-full transition-all duration-75 relative"
                      style={{ width: `${((currentStep % 16) + 1) / 16 * 100}%` }}
                    >
                      <div className="absolute right-0 top-0 w-1 h-2 bg-yellow-300 animate-pulse rounded-full"></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-16 gap-px">
                    {Array.from({ length: 16 }, (_, i) => (
                      <div 
                        key={i}
                        className={`h-1 rounded-sm transition-all duration-75 ${
                          i === (currentStep % 16) 
                            ? 'bg-yellow-400 animate-pulse' 
                            : i < (currentStep % 16) 
                              ? 'bg-yellow-600' 
                              : 'bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              {tracks.map((track) => (
                <div key={track.id} className="flex items-center space-x-4">
                  <div className="w-24 text-sm font-medium flex items-center space-x-2">
                    <div className={`w-5 h-5 rounded ${track.color} flex items-center justify-center text-xs font-bold text-white shadow-lg`}>
                      {track.name[0]}
                    </div>
                    <span className="text-gray-200">{track.name}</span>
                  </div>

                  <div className="flex space-x-1">
                    {(pattern[track.id as keyof BeatPattern] || Array(16).fill(false)).map((active, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          toggleStep(track.id as keyof BeatPattern, index);
                          if (!active && isInitialized) {
                            playDrumSound(track.id);
                          }
                        }}
                        className={`beat-pad w-10 h-10 rounded border-2 transition-all relative flex items-center justify-center text-xs font-bold ${
                          active 
                            ? `${track.color} shadow-lg transform scale-105 border-gray-300 text-white` 
                            : "bg-gray-700 hover:bg-gray-600 border-gray-500 text-gray-400 hover:border-gray-400"
                        } ${
                          isPlaying && (currentStep % 16) === index 
                            ? "ring-4 ring-yellow-400 ring-opacity-100 shadow-lg shadow-yellow-400/50 animate-pulse scale-110" 
                            : ""
                        }`}
                        title={`${track.name} - Step ${index + 1} (Click to toggle)`}
                      >
                        {/* Step number inside pad */}
                        <span className="opacity-70">{index + 1}</span>
                        
                        {/* Beat markers above */}
                        {index % 4 === 0 && (
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs text-yellow-400 font-bold bg-gray-800 px-1 rounded">
                            Beat {(index / 4) + 1}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <span className="text-xs text-gray-400 w-12">Volume:</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      defaultValue="80"
                      className="w-20 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      title={`${track.name} volume control`}
                    />
                    <span className="text-xs text-gray-400 w-8">80%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pattern Legend */}
          <div className="bg-studio-panel border border-gray-600 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Pattern Guide</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <span>4/4 Time</span>
                <span>•</span>
                <span>{bpm} BPM</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="text-gray-300 font-medium">Controls:</h4>
                <div className="space-y-1 text-xs text-gray-400">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gray-700 border border-gray-500 rounded flex items-center justify-center text-xs">1</div>
                    <span>Squares = Beat steps (click to toggle)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-2 bg-gray-700 rounded"></div>
                    <span>Sliders = Volume controls</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center text-xs text-white">K</div>
                    <span>Active beat (colored)</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-gray-300 font-medium">Drum Sounds:</h4>
                <div className="space-y-1 text-xs text-gray-400">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-red-500 rounded flex items-center justify-center text-xs font-bold text-white">K</div>
                    <span>Kick - Deep bass drum</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-blue-500 rounded flex items-center justify-center text-xs font-bold text-white">S</div>
                    <span>Snare - Sharp snappy sound</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded flex items-center justify-center text-xs font-bold text-white">H</div>
                    <span>Hi-Hat - Metallic cymbals</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}