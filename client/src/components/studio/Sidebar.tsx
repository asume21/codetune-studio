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
    { id: "assistant", icon: "fas fa-robot", label: "AI Assistant" },
    { id: "security", icon: "fas fa-shield-alt", label: "Security Scanner" },
    { id: "lyrics", icon: "fas fa-microphone", label: "Lyric Lab" },
    { id: "mixer", icon: "fas fa-sliders-h", label: "Mixer" },
  ];

  return (
    <div className="w-16 bg-studio-panel border-r border-gray-700 flex flex-col items-center py-4 space-y-4">
      {tabs.map((tab) => (
        <Button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
            activeTab === tab.id
              ? "bg-studio-accent hover:bg-blue-500"
              : "bg-gray-700 hover:bg-gray-600"
          }`}
          title={tab.label}
        >
          <i className={`${tab.icon} text-lg`}></i>
        </Button>
      ))}
    </div>
  );
}
