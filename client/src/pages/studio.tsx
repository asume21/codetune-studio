import { useState, createContext, useContext } from "react";
import Header from "@/components/studio/Header";
import Sidebar from "@/components/studio/Sidebar";
import TransportControls from "@/components/studio/TransportControls";
import CodeTranslator from "@/components/studio/CodeTranslator";
import BeatMaker from "@/components/studio/BeatMaker";
import MelodyComposer from "@/components/studio/MelodyComposer";
import CodeToMusic from "@/components/studio/CodeToMusic";
import AIAssistant from "@/components/studio/AIAssistant";
import VulnerabilityScanner from "@/components/studio/VulnerabilityScanner";
import LyricLab from "@/components/studio/LyricLab";
import Mixer from "@/components/studio/Mixer";
import DynamicLayering from "@/components/studio/DynamicLayering";
import { useAudio } from "@/hooks/use-audio";

// Global studio audio context for master playback
export const StudioAudioContext = createContext({
  currentPattern: {} as any,
  currentMelody: [] as any[],
  currentLyrics: "" as string,
  currentCodeMusic: {} as any,
  currentLayers: [] as any[],
  isPlaying: false,
  bpm: 120,
  setCurrentPattern: (pattern: any) => {},
  setCurrentMelody: (melody: any[]) => {},
  setCurrentLyrics: (lyrics: string) => {},
  setCurrentCodeMusic: (music: any) => {},
  setCurrentLayers: (layers: any[]) => {},
  playCurrentAudio: () => Promise.resolve(),
  stopCurrentAudio: () => {},
  playFullSong: () => Promise.resolve(), // Master play function
  stopFullSong: () => {},
});

type Tab = "translator" | "beatmaker" | "melody" | "codebeat" | "assistant" | "security" | "lyrics" | "mixer" | "layers";

export default function Studio() {
  const [activeTab, setActiveTab] = useState<Tab>("beatmaker");
  const [currentPattern, setCurrentPattern] = useState({});
  const [currentMelody, setCurrentMelody] = useState([]);
  const [currentLyrics, setCurrentLyrics] = useState("");
  const [currentCodeMusic, setCurrentCodeMusic] = useState({});
  const [currentLayers, setCurrentLayers] = useState([]);
  const [isStudioPlaying, setIsStudioPlaying] = useState(false);
  const [studioBpm, setStudioBpm] = useState(120);
  
  const { initialize, isInitialized } = useAudio();

  const playCurrentAudio = async () => {
    if (!isInitialized) {
      await initialize();
    }
    setIsStudioPlaying(true);
  };

  const stopCurrentAudio = () => {
    setIsStudioPlaying(false);
  };

  const getActiveToolName = (tab: Tab): string => {
    const toolNames: Record<Tab, string> = {
      "translator": "Code Translator",
      "beatmaker": "Beat Maker", 
      "melody": "Melody Composer",
      "codebeat": "Code to Music",
      "assistant": "AI Assistant",
      "security": "Security Scanner",
      "lyrics": "Lyric Lab",
      "mixer": "Mixer",
      "layers": "Dynamic Layering"
    };
    return toolNames[tab] || "Beat Maker";
  };

  const playFullSong = async () => {
    if (!isInitialized) {
      await initialize();
    }
    
    console.log("Playing full song with:");
    console.log("- Pattern:", currentPattern);
    console.log("- Melody:", currentMelody);
    console.log("- Lyrics:", currentLyrics);
    console.log("- Code Music:", currentCodeMusic);
    
    setIsStudioPlaying(true);
    // TODO: Implement combined playback logic
  };

  const stopFullSong = () => {
    setIsStudioPlaying(false);
  };

  const studioAudioValue = {
    currentPattern,
    currentMelody,
    currentLyrics,
    currentCodeMusic,
    currentLayers,
    isPlaying: isStudioPlaying,
    bpm: studioBpm,
    setCurrentPattern,
    setCurrentMelody,
    setCurrentLyrics,
    setCurrentCodeMusic,
    setCurrentLayers,
    playCurrentAudio,
    stopCurrentAudio,
    playFullSong,
    stopFullSong,
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "translator":
        return <CodeTranslator />;
      case "beatmaker":
        return <BeatMaker />;
      case "melody":
        return <MelodyComposer />;
      case "codebeat":
        return <CodeToMusic />;
      case "assistant":
        return <AIAssistant />;
      case "security":
        return <VulnerabilityScanner />;
      case "lyrics":
        return <LyricLab />;
      case "mixer":
        return <Mixer />;
      case "layers":
        return <DynamicLayering />;
      default:
        return <BeatMaker />;
    }
  };

  return (
    <StudioAudioContext.Provider value={studioAudioValue}>
      <div className="h-screen flex flex-col bg-studio-bg text-white">
        <Header />
        
        <div className="flex-1 flex overflow-hidden">
          <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
          
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-auto">
              <div className="min-w-max p-6">
                {renderTabContent()}
              </div>
            </div>
            
            <TransportControls currentTool={getActiveToolName(activeTab)} activeTab={activeTab} />
          </div>
        </div>
      </div>
    </StudioAudioContext.Provider>
  );
}
