import { useState } from "react";
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

type Tab = "translator" | "beatmaker" | "melody" | "codebeat" | "assistant" | "security" | "lyrics" | "mixer";

export default function Studio() {
  const [activeTab, setActiveTab] = useState<Tab>("translator");

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
      default:
        return <CodeTranslator />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-studio-bg text-white overflow-hidden">
      <Header />
      
      <div className="flex-1 flex">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-hidden">
            {renderTabContent()}
          </div>
          
          <TransportControls />
        </div>
      </div>
    </div>
  );
}
