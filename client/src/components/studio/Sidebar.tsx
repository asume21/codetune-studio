import { Button } from "@/components/ui/button";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const tabs = [
    { id: "translator", icon: "fas fa-code", label: "Code Translator" },
    { id: "beatmaker", icon: "fas fa-drum", label: "Beat Maker" },
    { id: "melody", icon: "fas fa-music", label: "Melody Composer" },
    { id: "codebeat", icon: "fas fa-exchange-alt", label: "Code to Music" },
    { id: "layers", icon: "fas fa-layer-group", label: "Dynamic Layering" },
    { id: "upload", icon: "fas fa-cloud-upload-alt", label: "Song Uploader" },
    { id: "assistant", icon: "fas fa-robot", label: "AI Assistant" },
    { id: "security", icon: "fas fa-shield-alt", label: "Security Scanner" },
    { id: "lyrics", icon: "fas fa-microphone", label: "Lyric Lab" },
    { id: "mixer", icon: "fas fa-sliders-h", label: "Mixer" },
    { id: "midi", icon: "fas fa-piano", label: "MIDI Controller" },
    { id: "metrics", icon: "fas fa-chart-line", label: "Performance Metrics" },
  ];

  return (
    <div className="w-48 bg-studio-panel border-r border-gray-700 flex flex-col py-4 space-y-2 overflow-y-auto max-h-screen">
      <div className="px-4 mb-4">
        <h3 className="text-sm font-medium text-gray-300 mb-2">Studio Tools</h3>
        <p className="text-xs text-gray-500">Click any tool to switch</p>
      </div>
      
      {tabs.map((tab) => (
        <Button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`mx-2 h-12 rounded-lg flex items-center justify-start px-4 transition-colors ${
            activeTab === tab.id
              ? "bg-studio-accent hover:bg-blue-500 text-white"
              : "bg-gray-700 hover:bg-gray-600 text-gray-300"
          }`}
          title={tab.label}
        >
          <i className={`${tab.icon} text-lg mr-3 flex-shrink-0`}></i>
          <span className="text-sm font-medium">{tab.label}</span>
        </Button>
      ))}
      
      <div className="px-4 mt-6 pt-4 border-t border-gray-600">
        <div className="text-xs text-gray-500">
          <div className="mb-2">
            <strong className="text-gray-400">Current:</strong> {tabs.find(tab => tab.id === activeTab)?.label || "Unknown"}
          </div>
          <div>
            {activeTab === "beatmaker" && "Create drum patterns and beats"}
            {activeTab === "translator" && "Convert code between languages"}
            {activeTab === "melody" && "Compose musical melodies"}
            {activeTab === "codebeat" && "Turn code into music"}
            {activeTab === "layers" && "AI-powered instrument layering"}
            {activeTab === "upload" && "Upload and analyze existing songs"}
            {activeTab === "assistant" && "AI-powered music help"}
            {activeTab === "security" && "Scan code for vulnerabilities"}
            {activeTab === "lyrics" && "Write and edit song lyrics"}
            {activeTab === "mixer" && "Mix and master your tracks"}
            {activeTab === "midi" && "Connect physical MIDI controllers"}
            {activeTab === "metrics" && "AI music generation analytics"}
          </div>
        </div>
      </div>
    </div>
  );
}
