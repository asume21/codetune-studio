import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <div className="bg-studio-panel border-b border-gray-700 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          {/* CodedSwitch Logo - recreated as SVG based on the provided design */}
          <div className="w-10 h-10 relative">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Background circle */}
              <circle cx="50" cy="50" r="45" fill="none" stroke="#3b82f6" strokeWidth="2" opacity="0.3"/>
              
              {/* Central eye shape */}
              <ellipse cx="50" cy="50" rx="25" ry="15" fill="none" stroke="#3b82f6" strokeWidth="2"/>
              <circle cx="50" cy="50" r="8" fill="none" stroke="#3b82f6" strokeWidth="2"/>
              <circle cx="50" cy="50" r="4" fill="#3b82f6"/>
              
              {/* Corner elements representing switches/controls */}
              <circle cx="25" cy="25" r="6" fill="none" stroke="#3b82f6" strokeWidth="2"/>
              <circle cx="75" cy="25" r="6" fill="none" stroke="#3b82f6" strokeWidth="2"/>
              <circle cx="25" cy="75" r="6" fill="none" stroke="#3b82f6" strokeWidth="2"/>
              
              {/* Connection lines */}
              <line x1="31" y1="31" x2="44" y2="44" stroke="#3b82f6" strokeWidth="1.5" opacity="0.7"/>
              <line x1="69" y1="31" x2="56" y2="44" stroke="#3b82f6" strokeWidth="1.5" opacity="0.7"/>
              <line x1="31" y1="69" x2="44" y2="56" stroke="#3b82f6" strokeWidth="1.5" opacity="0.7"/>
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-heading font-bold text-white">CodedSwitch</h1>
            <p className="text-xs text-blue-400 -mt-1 font-medium">AI Godfather</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <div className="w-2 h-2 bg-studio-success rounded-full animate-pulse"></div>
          <span>AI Engine Active</span>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <Button className="bg-studio-accent hover:bg-blue-500 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <i className="fas fa-save mr-2"></i>Save Project
        </Button>
        <Button variant="secondary" className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <i className="fas fa-share mr-2"></i>Export
        </Button>
        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
          <span className="text-xs font-bold">CT</span>
        </div>
      </div>
    </div>
  );
}
