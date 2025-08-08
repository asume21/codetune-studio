import { Button } from "@/components/ui/button";
import codedSwitchLogo from "@assets/codedswitch_1754675449609.png";

export default function Header() {
  return (
    <div className="bg-studio-panel border-b border-gray-700 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <img 
            src={codedSwitchLogo} 
            alt="CodedSwitch Logo" 
            className="w-10 h-10 object-contain"
          />
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
