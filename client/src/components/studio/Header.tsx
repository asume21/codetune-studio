import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <div className="bg-studio-panel border-b border-gray-700 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          {/* CodedSwitch Logo - Triple Entendre Design */}
          <div className="w-10 h-10 relative">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Layer 1: Code brackets { } representing coding */}
              <path d="M20 30 L10 50 L20 70" fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round"/>
              <path d="M80 30 L90 50 L80 70" fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round"/>
              
              {/* Layer 2: Switch toggle in center representing switching */}
              <rect x="35" y="45" width="30" height="10" rx="5" fill="none" stroke="#60a5fa" strokeWidth="2"/>
              <circle cx="55" cy="50" r="6" fill="#60a5fa"/>
              <circle cx="55" cy="50" r="3" fill="#1e40af"/>
              
              {/* Layer 3: Three interconnected nodes representing communication/networking */}
              <circle cx="30" cy="25" r="4" fill="#3b82f6" opacity="0.8"/>
              <circle cx="70" cy="25" r="4" fill="#3b82f6" opacity="0.8"/>
              <circle cx="50" cy="75" r="4" fill="#3b82f6" opacity="0.8"/>
              
              {/* Connection lines forming a triangle */}
              <line x1="30" y1="25" x2="70" y2="25" stroke="#3b82f6" strokeWidth="1.5" opacity="0.5"/>
              <line x1="30" y1="25" x2="50" y2="75" stroke="#3b82f6" strokeWidth="1.5" opacity="0.5"/>
              <line x1="70" y1="25" x2="50" y2="75" stroke="#3b82f6" strokeWidth="1.5" opacity="0.5"/>
              
              {/* Binary code dots for extra tech feel */}
              <circle cx="25" cy="15" r="1.5" fill="#60a5fa" opacity="0.6"/>
              <circle cx="35" cy="12" r="1.5" fill="#60a5fa" opacity="0.6"/>
              <circle cx="45" cy="15" r="1.5" fill="#60a5fa" opacity="0.6"/>
              <circle cx="55" cy="12" r="1.5" fill="#60a5fa" opacity="0.6"/>
              <circle cx="65" cy="15" r="1.5" fill="#60a5fa" opacity="0.6"/>
              <circle cx="75" cy="12" r="1.5" fill="#60a5fa" opacity="0.6"/>
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
