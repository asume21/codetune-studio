import { useState, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { StudioAudioContext } from "@/pages/studio";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";

interface UploadedSong {
  id: string;
  name: string;
  url: string;
  duration?: number;
  size: number;
  uploadDate: string;
}

export default function SongUploader() {
  const [uploadedSongs, setUploadedSongs] = useState<UploadedSong[]>([]);
  const [currentSong, setCurrentSong] = useState<UploadedSong | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const { toast } = useToast();
  const studioContext = useContext(StudioAudioContext);

  const uploadSongMutation = useMutation({
    mutationFn: async (songURL: string) => {
      const response = await apiRequest("POST", "/api/songs/upload", {
        songURL,
        name: `Uploaded Song ${Date.now()}`
      });
      return response.json();
    },
    onSuccess: (newSong: UploadedSong) => {
      setUploadedSongs(prev => [...prev, newSong]);
      queryClient.invalidateQueries({ queryKey: ['/api/songs'] });
      toast({
        title: "Song Uploaded",
        description: `${newSong.name} has been added to your library!`,
      });
    },
    onError: () => {
      toast({
        title: "Upload Failed",
        description: "Failed to save your song. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getUploadParameters = async () => {
    const response = await apiRequest("POST", "/api/objects/upload", {});
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const handleUploadComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    console.log('🎵 Upload completed:', result);
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const songURL = uploadedFile.uploadURL;
      console.log('🎵 Upload URL received:', songURL);
      
      if (songURL) {
        uploadSongMutation.mutate(songURL);
      }
    }
  };

  const playSong = async (song: UploadedSong) => {
    if (audioElement) {
      audioElement.pause();
      audioElement.src = '';
    }

    try {
      // Convert object storage URL to accessible endpoint
      console.log('🎵 Original song URL:', song.url);
      
      // Extract bucket and path from Google Storage URL
      const match = song.url.match(/https:\/\/storage\.googleapis\.com\/([^\/]+)\/(.*)/);
      if (!match) {
        throw new Error('Invalid storage URL format');
      }
      
      const [, bucket, objectPath] = match;
      console.log(`🎵 Parsed - bucket: ${bucket}, objectPath: ${objectPath}`);
      
      // Create accessible URL - we need to strip the .private prefix since our endpoint handles it
      const accessibleURL = `/objects/${objectPath}`;
      console.log('🎵 Converted accessible URL:', accessibleURL);
      
      const audio = new Audio();
      
      // Add comprehensive error handling
      audio.addEventListener('error', (e) => {
        console.error('Audio playback error:', e);
        const error = (e.target as HTMLAudioElement).error;
        let errorMessage = 'Unknown error occurred';
        
        if (error) {
          switch (error.code) {
            case error.MEDIA_ERR_ABORTED:
              errorMessage = 'Audio playback aborted';
              break;
            case error.MEDIA_ERR_NETWORK:
              errorMessage = 'Network error while loading audio';
              break;
            case error.MEDIA_ERR_DECODE:
              errorMessage = 'Audio format not supported or corrupted';
              break;
            case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
              errorMessage = 'Audio format not supported by browser';
              break;
          }
        }
        
        toast({
          title: "Playback Error",
          description: `Cannot play ${song.name}: ${errorMessage}`,
          variant: "destructive",
        });
        
        setIsPlaying(false);
        setCurrentSong(null);
      });

      audio.addEventListener('loadedmetadata', () => {
        console.log(`🎵 Song loaded: ${song.name}, duration: ${audio.duration}s`);
      });
      
      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentSong(null);
      });

      audio.addEventListener('canplaythrough', () => {
        console.log(`🎵 Song ready to play: ${song.name}`);
      });

      // Set source and load
      audio.src = accessibleURL;
      audio.load();
      
      // Wait for audio to be ready before playing
      await new Promise((resolve, reject) => {
        const onCanPlay = () => {
          audio.removeEventListener('canplaythrough', onCanPlay);
          audio.removeEventListener('error', onError);
          resolve(void 0);
        };
        
        const onError = (e: Event) => {
          audio.removeEventListener('canplaythrough', onCanPlay);
          audio.removeEventListener('error', onError);
          reject(e);
        };
        
        audio.addEventListener('canplaythrough', onCanPlay);
        audio.addEventListener('error', onError);
      });

      await audio.play();
      setAudioElement(audio);
      setCurrentSong(song);
      setIsPlaying(true);
      
      toast({
        title: "Now Playing",
        description: `Playing ${song.name}`,
      });
      
    } catch (error) {
      console.error('Failed to play song:', error);
      toast({
        title: "Playback Failed",
        description: `Cannot play ${song.name}. The file may be corrupted or unsupported.`,
        variant: "destructive",
      });
      setIsPlaying(false);
      setCurrentSong(null);
    }
  };

  const stopSong = () => {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentSong(null);
  };

  const analyzeSong = async (song: UploadedSong) => {
    try {
      const response = await apiRequest("POST", "/api/songs/analyze", {
        songURL: song.url,
        songName: song.name
      });
      const analysis = await response.json();
      
      toast({
        title: "Song Analysis Complete",
        description: `AI analyzed ${song.name} - check the AI Assistant for insights!`,
      });

      // Store analysis in studio context for other tools to use
      studioContext.setCurrentCodeMusic?.({
        ...analysis,
        source: 'uploaded_song',
        originalSong: song
      });

      // Send analysis to AI Assistant by posting a message
      const analysisMessage = `📊 **Song Analysis Complete: ${song.name}**

🎵 **Musical Properties:**
• BPM: ${analysis.estimatedBPM}
• Key: ${analysis.keySignature} 
• Genre: ${analysis.genre}
• Mood: ${analysis.mood}

🎼 **Song Structure:**
${Object.entries(analysis.structure).map(([section, timing]) => `• ${section}: ${timing}`).join('\n')}

🎺 **Instruments Detected:**
${analysis.instruments.join(', ')}

🤖 **AI Analysis Notes:**
${analysis.analysis_notes}

This analysis has been saved and can be used with other studio tools for remixing, layering, and composition inspiration!`;

      // Add message to AI Assistant (this would need to be implemented)
      // For now, we'll try to trigger it via the global studio context
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('addAIMessage', { 
          detail: { content: analysisMessage } 
        }));
      }

    } catch (error) {
      toast({
        title: "Analysis Failed", 
        description: "Could not analyze the song. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return Math.round(bytes / (1024 * 1024)) + ' MB';
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-6 border-b border-gray-600 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-heading font-bold">Song Upload & Library</h2>
          <div className="text-xs text-gray-400 px-2">
            <div>Upload existing songs for AI analysis</div>
            <div>Supported: MP3, WAV, M4A, OGG</div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <ObjectUploader
            maxNumberOfFiles={1}
            maxFileSize={50485760} // 50MB max for audio files
            onGetUploadParameters={getUploadParameters}
            onComplete={handleUploadComplete}
            buttonClassName="bg-studio-accent hover:bg-blue-500"
          >
            <div className="flex items-center gap-2">
              <i className="fas fa-upload"></i>
              <span>Upload Song</span>
            </div>
          </ObjectUploader>

          {uploadedSongs.length > 0 && (
            <Badge variant="secondary">{uploadedSongs.length} songs uploaded</Badge>
          )}

          {isPlaying && currentSong && (
            <Button
              onClick={stopSong}
              className="bg-red-600 hover:bg-red-500"
            >
              <i className="fas fa-stop mr-2"></i>
              Stop {currentSong.name}
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {uploadedSongs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center">
            <div className="max-w-md">
              <i className="fas fa-cloud-upload-alt text-6xl text-gray-600 mb-4"></i>
              <h3 className="text-xl font-semibold mb-2">No Songs Uploaded</h3>
              <p className="text-gray-400 mb-6">
                Upload your existing songs to integrate them with CodedSwitch's AI tools. 
                Once uploaded, you can analyze them for musical insights, extract patterns, 
                or use them as reference for new compositions.
              </p>
              <div className="text-sm text-gray-500 space-y-2">
                <p><strong>What you can do with uploaded songs:</strong></p>
                <p>• AI analysis for musical structure and patterns</p>
                <p>• Extract beats and melodies for remixing</p>
                <p>• Generate lyrics that match the song's mood</p>
                <p>• Use as reference for Dynamic Layering</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Uploaded Songs ({uploadedSongs.length})</h3>
            </div>

            <div className="grid gap-4">
              {uploadedSongs.map((song) => (
                <Card key={song.id} className={`border-gray-600 ${currentSong?.id === song.id ? 'ring-2 ring-blue-500' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center">
                        <i className="fas fa-music mr-2 text-blue-400"></i>
                        {song.name}
                      </CardTitle>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          onClick={() => playSong(song)}
                          disabled={isPlaying && currentSong?.id === song.id}
                          className="bg-green-600 hover:bg-green-500"
                        >
                          <i className={`fas ${isPlaying && currentSong?.id === song.id ? 'fa-pause' : 'fa-play'} mr-1`}></i>
                          {isPlaying && currentSong?.id === song.id ? 'Playing' : 'Play'}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => analyzeSong(song)}
                          className="bg-purple-600 hover:bg-purple-500"
                        >
                          <i className="fas fa-brain mr-1"></i>
                          Analyze
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Size:</span>
                          <div className="font-semibold">{formatFileSize(song.size)}</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Uploaded:</span>
                          <div className="font-semibold">{formatDate(song.uploadDate)}</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Duration:</span>
                          <div className="font-semibold">{song.duration ? `${Math.round(song.duration)}s` : 'Unknown'}</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Status:</span>
                          <div className="font-semibold text-green-400">Ready</div>
                        </div>
                      </div>

                      <Separator className="bg-gray-600" />

                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="text-xs">
                          <i className="fas fa-file-audio mr-1"></i>
                          Audio File
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          <i className="fas fa-brain mr-1"></i>
                          AI Ready
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          <i className="fas fa-layer-group mr-1"></i>
                          Layer Source
                        </Badge>
                      </div>

                      <div className="text-xs text-gray-500">
                        Click "Analyze" to extract musical patterns, or use as reference material for Dynamic Layering and other AI tools.
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}