import { useState, useContext } from "react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAudio, useSequencer } from "@/hooks/use-audio";
import { StudioAudioContext } from "@/pages/studio";
import type { Playlist } from "@shared/schema";

// Remove the duplicate AudioContext since we're using StudioAudioContext from pages/studio.tsx

interface TransportControlsProps {
  currentTool?: string;
  activeTab?: string;
}

export default function TransportControls({ currentTool = "Beat Maker", activeTab = "beatmaker" }: TransportControlsProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState("00:00");
  const [totalTime] = useState("02:45");
  const [bpm] = useState(120);
  const [bar] = useState(1);
  const [beat] = useState(1);
  const [volume, setVolume] = useState(75);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPlaylistDropdown, setShowPlaylistDropdown] = useState(false);
  const [isDocked, setIsDocked] = useState(true);
  const [isFloating, setIsFloating] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const { setMasterVolume, initialize, isInitialized } = useAudio();
  const { playPattern, stopPattern, isPlaying: sequencerPlaying } = useSequencer();
  const studioContext = useContext(StudioAudioContext);
  const { toast } = useToast();

  // Fetch playlists
  const { data: playlists } = useQuery<Playlist[]>({
    queryKey: ['/api/playlists'],
    initialData: [],
  });

  // Create playlist mutation
  const createPlaylistMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest("POST", "/api/playlists", {
        name,
        description: `Playlist created on ${new Date().toLocaleDateString()}`,
        isPublic: false,
      });
      return response.json();
    },
    onSuccess: (newPlaylist: Playlist) => {
      queryClient.invalidateQueries({ queryKey: ['/api/playlists'] });
      setNewPlaylistName("");
      setShowCreateDialog(false);
      toast({
        title: "Playlist Created",
        description: `${newPlaylist.name} has been created!`,
      });
    },
  });

  const handlePlay = async () => {
    try {
      if (!isInitialized) {
        console.log("🎵 Initializing audio...");
        await initialize();
      }
      
      if (isPlaying) {
        console.log("🎵 Stopping playback...");
        stopPattern();
        studioContext.stopFullSong();
        setIsPlaying(false);
      } else {
        console.log(`🎵 Starting playback - Mode: ${studioContext.playMode}, Tool: ${activeTab}`);
        
        // Always play the beat pattern as the base
        const currentPattern = studioContext.currentPattern && Object.keys(studioContext.currentPattern).length > 0 
          ? studioContext.currentPattern 
          : {
              kick: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
              snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
              hihat: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
            };

        console.log("🎵 Playing pattern:", currentPattern);
        playPattern(currentPattern, studioContext.bpm || 120);

        if (studioContext.playMode === 'all') {
          // Play all tools combined
          console.log("🎵 Playing ALL tools combined");
          await studioContext.playFullSong();
        } else {
          // Play only current tool
          console.log(`🎵 Playing current tool only: ${activeTab}`);
          await studioContext.playCurrentAudio();
        }
        
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("🚫 Play button error:", error);
      setIsPlaying(false);
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

  const getPlayingContent = (tab: string): string => {
    switch (tab) {
      case "beatmaker":
        return studioContext.currentPattern && Object.keys(studioContext.currentPattern).length > 0 
          ? "Custom Beat Pattern" : "Default Beat Pattern";
      case "melody":
        return studioContext.currentMelody && studioContext.currentMelody.length > 0 
          ? "Custom Melody" : "Default Melody Pattern";
      case "mixer":
        return "Mixed Audio Content";
      case "codebeat":
        return "AI Generated Music";
      case "assistant":
        return "Assistant Demo Audio";
      case "playlist":
        if (studioContext.currentPlaylist && studioContext.currentPlaylist.songs) {
          const currentSong = studioContext.currentPlaylist.songs[studioContext.currentPlaylistIndex];
          return currentSong ? `${currentSong.name} (${studioContext.currentPlaylistIndex + 1}/${studioContext.currentPlaylist.songs.length})` 
                              : `${studioContext.currentPlaylist.name} - Empty`;
        }
        return "No Playlist Selected";
      default:
        return "Demo Audio Pattern";
    }
  };

  const handlePrevious = () => {
    if (activeTab === "playlist" && studioContext.currentPlaylist && studioContext.currentPlaylist.songs) {
      const newIndex = studioContext.currentPlaylistIndex > 0 
        ? studioContext.currentPlaylistIndex - 1 
        : studioContext.currentPlaylist.songs.length - 1;
      studioContext.setCurrentPlaylistIndex(newIndex);
      console.log(`🎵 Previous track: ${newIndex + 1}/${studioContext.currentPlaylist.songs.length}`);
    }
  };

  const handleNext = () => {
    if (activeTab === "playlist" && studioContext.currentPlaylist && studioContext.currentPlaylist.songs) {
      const newIndex = studioContext.currentPlaylistIndex < studioContext.currentPlaylist.songs.length - 1
        ? studioContext.currentPlaylistIndex + 1 
        : 0;
      studioContext.setCurrentPlaylistIndex(newIndex);
      console.log(`🎵 Next track: ${newIndex + 1}/${studioContext.currentPlaylist.songs.length}`);
    }
  };

  const handleSetActivePlaylist = async (playlist: Playlist) => {
    try {
      const response = await apiRequest("GET", `/api/playlists/${playlist.id}/songs`, {});
      const playlistWithSongs = await response.json();
      
      studioContext.setCurrentPlaylist({
        ...playlist,
        songs: playlistWithSongs
      });
      studioContext.setCurrentPlaylistIndex(0);
      
      toast({
        title: "Active Playlist Set",
        description: `${playlist.name} is now active. Use play button to start.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to set active playlist.",
        variant: "destructive",
      });
    }
  };

  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) {
      toast({
        title: "Invalid Name",
        description: "Please enter a playlist name.",
        variant: "destructive",
      });
      return;
    }
    createPlaylistMutation.mutate(newPlaylistName.trim());
  };

  const handleFloat = () => {
    setIsDocked(false);
    setIsFloating(true);
    setIsMinimized(false);
    // Center the floating controls
    const centerX = window.innerWidth / 2 - 400; // Half of min-width
    const centerY = window.innerHeight / 2 - 100;
    setPosition({ x: Math.max(0, centerX), y: Math.max(0, centerY) });
  };

  const handleDock = () => {
    setIsFloating(false);
    setIsDocked(true);
    setIsMinimized(false);
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isFloating) return;
    // Only allow dragging from header area, not buttons
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="button"]')) return;
    
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !isFloating) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // Keep within viewport bounds
    const maxX = window.innerWidth - 800; // min-width of floating panel
    const maxY = window.innerHeight - 200; // approximate height
    
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add mouse event listeners for dragging
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  const containerClasses = isFloating 
    ? `fixed bg-studio-panel border border-gray-600 rounded-lg shadow-2xl px-6 py-4 z-50 min-w-[800px] ${isDragging ? 'cursor-grabbing' : ''} ${isMinimized ? 'pb-4' : ''}`
    : "bg-studio-panel border-t border-gray-700 px-6 py-4";

  const containerStyle = isFloating 
    ? { 
        left: `${position.x}px`, 
        top: `${position.y}px`,
        transform: 'none'
      } 
    : {};

  return (
    <div 
      className={containerClasses}
      style={containerStyle}
      onMouseDown={isFloating ? handleMouseDown : undefined}
    >
      {/* Dock/Float Controls - More Visible */}
      <div className={`absolute ${isFloating ? 'top-10' : 'top-2'} right-2 flex items-center space-x-2 bg-gray-800 rounded-md p-1`}>
        {isFloating && (
          <Button
            onClick={handleDock}
            size="sm"
            variant="default"
            className="h-8 w-8 p-0 text-xs bg-blue-600 hover:bg-blue-500"
            title="Dock to bottom"
          >
            <i className="fas fa-anchor text-white"></i>
          </Button>
        )}
        {isDocked && (
          <Button
            onClick={handleFloat}
            size="sm"
            variant="default"
            className="h-8 w-8 p-0 text-xs bg-green-600 hover:bg-green-500"
            title="Float controls - Detach from bottom"
          >
            <i className="fas fa-external-link-alt text-white"></i>
          </Button>
        )}
        <span className="text-xs text-gray-300 font-medium">
          {isDocked ? "Float" : "Dock"}
        </span>
      </div>

      {/* Floating drag handle */}
      {isFloating && (
        <div 
          className="absolute top-0 left-0 right-0 h-8 bg-gray-700 rounded-t-lg flex items-center justify-center cursor-grab hover:bg-gray-600 transition-colors"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            </div>
            <span className="text-xs text-gray-400 font-medium">Transport Controls</span>
            <Button
              onClick={handleMinimize}
              size="sm"
              variant="ghost"
              className="h-5 w-5 p-0 text-xs hover:bg-gray-600 ml-auto mr-2"
              title={isMinimized ? "Expand" : "Minimize"}
            >
              <i className={`fas ${isMinimized ? 'fa-expand' : 'fa-minus'} text-gray-400 text-xs`}></i>
            </Button>
          </div>
        </div>
      )}

      {/* Main content - hidden when minimized */}
      {(!isFloating || !isMinimized) && (
        <>
          {/* Play Mode Toggle */}
          <div className={`mb-3 flex items-center justify-center gap-4 p-2 bg-gray-800 rounded-lg relative ${isFloating ? 'mt-8' : ''}`}>
        <span className="text-xs font-medium text-gray-300">
          {studioContext.playMode === 'current' ? 'Current Tool Only' : 'All Tools Combined'}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Current</span>
          <Switch
            checked={studioContext.playMode === 'all'}
            onCheckedChange={(checked) => studioContext.setPlayMode(checked ? 'all' : 'current')}
            className="data-[state=checked]:bg-studio-accent"
          />
          <span className="text-xs text-gray-400">All</span>
        </div>
      </div>

      {/* Master Playback Status */}
      <div className="mb-2 text-xs text-gray-400 text-center">
        <strong>Mode:</strong> {studioContext.playMode === 'current' ? `Playing ${currentTool} only` : "Playing ALL tools combined"} | 
        <strong> Status:</strong> {isPlaying ? "Playing" : "Ready"} | 
        <strong> Content:</strong> {getPlayingContent(activeTab)}
        {activeTab === "playlist" && studioContext.currentPlaylist && (
          <div className="mt-1">
            <strong>Playlist:</strong> {studioContext.currentPlaylist.name} | 
            <strong> Track:</strong> {studioContext.currentPlaylistIndex + 1}/{studioContext.currentPlaylist.songs?.length || 0}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Transport Control Buttons with Labels */}
          <div className="flex items-center space-x-6">
            <div className="flex flex-col items-center space-y-1">
              <Button
                onClick={handlePrevious}
                variant="secondary"
                className="bg-gray-700 hover:bg-gray-600 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                title={activeTab === "playlist" ? "Previous Song in Playlist" : "Previous Track - Go to previous song or beat pattern"}
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
                onClick={handleNext}
                variant="secondary"
                className="bg-gray-700 hover:bg-gray-600 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                title={activeTab === "playlist" ? "Next Song in Playlist" : "Next Track - Go to next song or beat pattern"}
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

        {/* Playlist Management */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-400">Playlists:</span>
            <Select 
              value={studioContext.currentPlaylist?.id || ""} 
              onValueChange={(playlistId) => {
                const playlist = playlists?.find(p => p.id === playlistId);
                if (playlist) handleSetActivePlaylist(playlist);
              }}
            >
              <SelectTrigger className="w-32 h-8 bg-gray-700 border-gray-600 text-xs">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                {playlists?.map((playlist) => (
                  <SelectItem key={playlist.id} value={playlist.id}>
                    {playlist.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button variant="secondary" size="sm" className="h-8 bg-gray-700 hover:bg-gray-600 text-xs">
                <i className="fas fa-plus mr-1"></i>New
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-800 border-gray-600">
              <DialogHeader>
                <DialogTitle>Create New Playlist</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Enter playlist name..."
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreatePlaylist()}
                  className="bg-gray-700 border-gray-600"
                />
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreatePlaylist} disabled={createPlaylistMutation.isPending}>
                    {createPlaylistMutation.isPending ? 'Creating...' : 'Create'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

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
        </>
      )}
    </div>
  );
}