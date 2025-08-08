import { useState, useContext, createContext } from "react";
import { Button } from "@/components/ui/button";
import { useAudio, useSequencer } from "@/hooks/use-audio";

// Audio Context for sharing state between components
export const AudioContext = createContext({
  isPlaying: false,
  currentTime: "00:00",
  bpm: 120,
  volume: 75,
  playAudio: () => {},
  stopAudio: () => {},
  setVolume: (volume: number) => {},
});

export default function TransportControls() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState("00:00");
  const [totalTime] = useState("02:45");
  const [bpm] = useState(120);
  const [bar] = useState(1);
  const [beat] = useState(1);
  const [volume, setVolume] = useState(75);
  
  const { setMasterVolume, initialize, isInitialized } = useAudio();
  const { playPattern, stopPattern, isPlaying: sequencerPlaying } = useSequencer();

  const handlePlay = async () => {
    if (!isInitialized) {
      await initialize();
    }
    
    if (isPlaying) {
      stopPattern();
      setIsPlaying(false);
    } else {
      // Start with a basic pattern - this will be enhanced when connected to other components
      const basicPattern = {
        kick: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
        snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
        hihat: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
      };
      playPattern(basicPattern, bpm);
      setIsPlaying(true);
    }
  };

  const handleStop = () => {
    stopPattern();
    setIsPlaying(false);
    setCurrentTime("00:00");
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);
    setVolume(newVolume);
    setMasterVolume(newVolume);
  };

  return (
    <div className="bg-studio-panel border-t border-gray-700 px-6 py-4">
      {/* Playback Controls Help */}
      <div className="mb-2 text-xs text-gray-500 text-center">
        <strong>Playback Controls:</strong> Use the round buttons below to play, pause, and control your music
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Transport Control Buttons with Labels */}
          <div className="flex items-center space-x-6">
            <div className="flex flex-col items-center space-y-1">
              <Button
                variant="secondary"
                className="bg-gray-700 hover:bg-gray-600 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                title="Previous Track - Go to previous song or beat pattern"
              >
                <i className="fas fa-step-backward"></i>
              </Button>
              <span className="text-xs text-gray-400">Previous</span>
            </div>

            <div className="flex flex-col items-center space-y-1">
              <Button
                onClick={handlePlay}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                  isPlaying 
                    ? "bg-red-600 hover:bg-red-500" 
                    : "bg-studio-success hover:bg-green-500"
                }`}
                title={isPlaying ? "Pause - Stop playing current beat" : "Play - Start playing your beat pattern"}
              >
                <i className={`fas ${isPlaying ? "fa-pause" : "fa-play"} text-lg`}></i>
              </Button>
              <span className="text-xs text-gray-300 font-medium">
                {isPlaying ? "Pause" : "Play"}
              </span>
            </div>

            <div className="flex flex-col items-center space-y-1">
              <Button
                onClick={handleStop}
                className="bg-red-600 hover:bg-red-500 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                title="Stop - Stop playback and reset to beginning"
              >
                <i className="fas fa-stop"></i>
              </Button>
              <span className="text-xs text-gray-400">Stop</span>
            </div>

            <div className="flex flex-col items-center space-y-1">
              <Button
                variant="secondary"
                className="bg-gray-700 hover:bg-gray-600 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                title="Next Track - Go to next song or beat pattern"
              >
                <i className="fas fa-step-forward"></i>
              </Button>
              <span className="text-xs text-gray-400">Next</span>
            </div>

            <div className="flex flex-col items-center space-y-1">
              <Button
                variant="secondary"
                className="bg-gray-700 hover:bg-gray-600 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                title="Loop - Repeat current pattern continuously"
              >
                <i className="fas fa-redo"></i>
              </Button>
              <span className="text-xs text-gray-400">Loop</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="text-sm">
            <span className="font-mono text-lg">{currentTime}</span>
            <span className="text-gray-400 ml-2">/ {totalTime}</span>
          </div>
          <div className="text-sm">
            <span className="font-mono">Bar {bar}</span>
            <span className="text-gray-400 ml-2">Beat {beat}</span>
          </div>
          <div className="text-sm">
            <span className="font-mono">{bpm} BPM</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Button
            variant="secondary"
            className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded text-sm transition-colors"
          >
            <i className="fas fa-cog mr-2"></i>Settings
          </Button>
          <div className="flex items-center space-x-2">
            <i className="fas fa-volume-up text-gray-400"></i>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={handleVolumeChange}
              className="w-20 h-2 bg-gray-700 rounded-lg appearance-none slider"
            />
            <span className="text-sm text-gray-400 w-8">{volume}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}