import { useState, createContext, useContext, useEffect } from "react";
import Header from "@/components/studio/Header";
import Sidebar from "@/components/studio/Sidebar";
import TransportControls from "@/components/studio/TransportControls";
import CodeTranslator from "@/components/studio/CodeTranslator";
import BeatMaker from "@/components/studio/BeatMaker";
import MelodyComposer from "@/components/studio/MelodyComposer";
import CodeToMusic from "@/components/studio/CodeToMusic";
import MusicToCode from "@/components/studio/MusicToCode";
import AIAssistant from "@/components/studio/AIAssistant";
import VulnerabilityScanner from "@/components/studio/VulnerabilityScanner";
import LyricLab from "@/components/studio/LyricLab";
import MusicMixer from "@/components/studio/MusicMixer";
import Mixer from "@/components/studio/Mixer";
import DynamicLayering from "@/components/studio/DynamicLayering";
import SongUploader from "@/components/studio/SongUploader";
import { MIDIController } from "@/components/studio/MIDIController";
import { PerformanceMetrics } from "@/components/studio/PerformanceMetrics";
import PlaylistManager from "@/components/studio/PlaylistManager";
import { useAudio } from "@/hooks/use-audio";
import { AIMessageProvider } from "@/contexts/AIMessageContext";

// Global studio audio context for master playback
export const StudioAudioContext = createContext({
  currentPattern: {} as any,
  currentMelody: [] as any[],
  currentLyrics: "" as string,
  currentCodeMusic: {} as any,
  currentLayers: [] as any[],
  isPlaying: false,
  bpm: 120,
  playMode: 'current' as 'current' | 'all',
  setPlayMode: (mode: 'current' | 'all') => {},
  activeTab: 'beatmaker' as string,
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

type Tab = "translator" | "beatmaker" | "melody" | "codebeat" | "musiccode" | "assistant" | "security" | "lyrics" | "musicmixer" | "mixer" | "layers" | "upload" | "midi" | "playlist" | "metrics";

export default function Studio() {
  const [activeTab, setActiveTab] = useState<Tab>("beatmaker");
  const [currentPattern, setCurrentPattern] = useState({});
  const [currentMelody, setCurrentMelody] = useState<any[]>([]);
  const [currentLyrics, setCurrentLyrics] = useState("");
  const [currentCodeMusic, setCurrentCodeMusic] = useState({});
  const [currentLayers, setCurrentLayers] = useState<any[]>([]);
  const [isStudioPlaying, setIsStudioPlaying] = useState(false);
  const [studioBpm, setStudioBpm] = useState(120);
  const [playMode, setPlayMode] = useState<'current' | 'all'>('current'); // New play mode state
  
  const { initialize, isInitialized } = useAudio();

  // Listen for tab navigation events from other components
  useEffect(() => {
    const handleTabNavigation = (event: CustomEvent) => {
      const targetTab = event.detail as Tab;
      setActiveTab(targetTab);
    };

    window.addEventListener('navigateToTab', handleTabNavigation as EventListener);
    return () => {
      window.removeEventListener('navigateToTab', handleTabNavigation as EventListener);
    };
  }, []);

  const playCurrentAudio = async () => {
    if (!isInitialized) {
      await initialize();
    }
    
    console.log(`🎵 Playing current tool only: ${activeTab}`);
    
    // Play only the content from the current active tab
    switch (activeTab) {
      case "beatmaker":
        console.log("🎵 Playing beat pattern only:", currentPattern);
        // Beat pattern will be handled by the transport controls via sequencer
        break;
      case "melody":
        console.log("🎵 Playing melody only:", currentMelody);
        // Melody playback - would trigger melody composer's play function
        if (window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('playCurrentMelody'));
        }
        break;
      case "codebeat":
        console.log("🎵 Playing code-to-music only:", currentCodeMusic);
        break;
      case "lyrics":
        console.log("🎵 Playing lyrics only:", currentLyrics);
        // Could trigger text-to-speech or backing track
        break;
      default:
        console.log("🎵 Playing default audio for:", activeTab);
        break;
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
      "musiccode": "Music to Code",
      "assistant": "AI Assistant",
      "security": "Security Scanner",
      "lyrics": "Lyric Lab",
      "musicmixer": "Music Mixer",
      "mixer": "Mixer",
      "layers": "Dynamic Layering",
      "upload": "Song Uploader",
      "midi": "MIDI Controller",
      "metrics": "Performance Metrics"
    };
    return toolNames[tab] || "Beat Maker";
  };

  const playFullSong = async () => {
    if (!isInitialized) {
      await initialize();
    }
    
    console.log("🎵 Playing ALL tools combined:");
    console.log("- Beat Pattern:", currentPattern);
    console.log("- Melody:", currentMelody);
    console.log("- Lyrics:", currentLyrics);
    console.log("- Code Music:", currentCodeMusic);
    console.log("- Layers:", currentLayers);
    
    // Trigger all tools to play simultaneously
    if (window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('playAllTools', {
        detail: {
          pattern: currentPattern,
          melody: currentMelody,
          lyrics: currentLyrics,
          codeMusic: currentCodeMusic,
          layers: currentLayers,
          bpm: studioBpm
        }
      }));
    }
    
    setIsStudioPlaying(true);
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
    playMode,
    setPlayMode,
    activeTab,
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
      case "musiccode":
        return <MusicToCode />;
      case "assistant":
        return <AIAssistant />;
      case "security":
        return <VulnerabilityScanner />;
      case "lyrics":
        return <LyricLab />;
      case "musicmixer":
        return <MusicMixer />;
      case "mixer":
        return <Mixer />;
      case "layers":
        return <DynamicLayering />;
      case "upload":
        return <SongUploader />;
      case "midi":
        return <MIDIController />;
      case "playlist":
        return <PlaylistManager />;
      case "metrics":
        return <PerformanceMetrics />;
      default:
        return <BeatMaker />;
    }
  };

  return (
    <AIMessageProvider>
      <StudioAudioContext.Provider value={studioAudioValue}>
        <div className="h-screen flex flex-col bg-studio-bg text-white">
          <Header />
        
          <div className="flex-1 flex overflow-hidden">
            <Sidebar activeTab={activeTab} onTabChange={(tab: string) => setActiveTab(tab as Tab)} />
            
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
    </AIMessageProvider>
  );
}
