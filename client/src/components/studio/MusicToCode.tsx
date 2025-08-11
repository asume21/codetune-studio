import { useState, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAudio } from "@/hooks/use-audio";
import { StudioAudioContext } from "@/pages/studio";
import SongUploader from "./SongUploader";

interface MusicAnalysis {
  tempo: number;
  key: string;
  timeSignature: string;
  structure: string[];
  instruments: string[];
  complexity: number;
  mood: string;
}

interface GeneratedCode {
  language: string;
  code: string;
  description: string;
  framework: string;
  functionality: string[];
}

export default function MusicToCode() {
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [codeStyle, setCodeStyle] = useState("functional");
  const [complexity, setComplexity] = useState([5]);
  const [musicAnalysis, setMusicAnalysis] = useState<MusicAnalysis | null>(null);
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [useCurrentComposition, setUseCurrentComposition] = useState(false);

  const { toast } = useToast();
  const studioContext = useContext(StudioAudioContext);

  const analyzeMutation = useMutation({
    mutationFn: async (data: { 
      audioFile?: File; 
      musicData?: any; 
      language: string; 
      codeStyle: string; 
      complexity: number 
    }) => {
      const formData = new FormData();
      if (data.audioFile) {
        formData.append('audio', data.audioFile);
      }
      if (data.musicData) {
        formData.append('musicData', JSON.stringify(data.musicData));
      }
      formData.append('language', data.language);
      formData.append('codeStyle', data.codeStyle);
      formData.append('complexity', data.complexity.toString());

      const response = await apiRequest("POST", "/api/music-to-code", formData);
      return response.json();
    },
    onSuccess: (data) => {
      setMusicAnalysis(data.analysis);
      setGeneratedCode(data.code);
      toast({
        title: "Music Analysis Complete!",
        description: `Generated ${data.code.language} code from musical composition.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze music and generate code.",
        variant: "destructive",
      });
    }
  });

  const testCircularTranslation = useMutation({
    mutationFn: async () => {
      // First, get CodedSwitch source code
      const response = await apiRequest("POST", "/api/test-circular-translation", {
        sourceCode: "CodedSwitch", // Special flag to use our own codebase
      });
      return response.json();
    },
    onSuccess: (data) => {
      setMusicAnalysis(data.originalAnalysis);
      setGeneratedCode(data.regeneratedCode);
      toast({
        title: "Circular Translation Test Complete!",
        description: `Match accuracy: ${data.accuracy}%`,
      });
    }
  });

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
  };

  const handleAnalyze = () => {
    if (useCurrentComposition) {
      // Use current studio composition
      const currentMusic = {
        pattern: studioContext.currentPattern,
        melody: studioContext.currentMelody,
        lyrics: studioContext.currentLyrics,
        codeMusic: studioContext.currentCodeMusic
      };
      
      analyzeMutation.mutate({
        musicData: currentMusic,
        language: selectedLanguage,
        codeStyle,
        complexity: complexity[0]
      });
    } else if (uploadedFile) {
      // Use uploaded audio file
      analyzeMutation.mutate({
        audioFile: uploadedFile,
        language: selectedLanguage,
        codeStyle,
        complexity: complexity[0]
      });
    } else {
      toast({
        title: "No Music Selected",
        description: "Please upload an audio file or select current composition.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Music → Code Converter
        </h2>
        <p className="text-muted-foreground">
          Transform musical compositions into functional code
        </p>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">Upload Music</TabsTrigger>
          <TabsTrigger value="current">Current Composition</TabsTrigger>
          <TabsTrigger value="circular">Circular Test</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audio File Upload</CardTitle>
              <CardDescription>
                Upload an audio file to analyze and convert to code
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-violet-50 file:text-violet-700
                    hover:file:bg-violet-100"
                />
              </div>
              {uploadedFile && (
                <div className="mt-2 p-2 bg-muted rounded">
                  <span className="text-sm">Selected: {uploadedFile.name}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="current" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Studio Composition</CardTitle>
              <CardDescription>
                Use the music you've created in CodedSwitch
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm">
                  <strong>Pattern:</strong> {studioContext.currentPattern ? 'Available' : 'None'}
                </div>
                <div className="text-sm">
                  <strong>Melody:</strong> {studioContext.currentMelody?.length || 0} notes
                </div>
                <div className="text-sm">
                  <strong>Lyrics:</strong> {studioContext.currentLyrics ? 'Available' : 'None'}
                </div>
              </div>
              <Button 
                onClick={() => setUseCurrentComposition(true)}
                className="mt-4"
                disabled={!studioContext.currentPattern && !studioContext.currentMelody}
              >
                Use Current Composition
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="circular" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Circular Translation Test</CardTitle>
              <CardDescription>
                Test perfect round-trip: CodedSwitch → Music → CodedSwitch
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground mb-4">
                This will take our own source code, convert it to music, then convert that music back to code.
                Perfect accuracy would mean we get identical code back!
              </div>
              <Button 
                onClick={() => testCircularTranslation.mutate()}
                disabled={testCircularTranslation.isPending}
                className="bg-gradient-to-r from-purple-500 to-pink-500"
              >
                {testCircularTranslation.isPending ? 'Testing...' : 'Run Circular Test'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Code Generation Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Code Generation Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="language">Target Language</Label>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="react">React Component</SelectItem>
                  <SelectItem value="css">CSS/HTML</SelectItem>
                  <SelectItem value="java">Java</SelectItem>
                  <SelectItem value="csharp">C#</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="style">Code Style</Label>
              <Select value={codeStyle} onValueChange={setCodeStyle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="functional">Functional</SelectItem>
                  <SelectItem value="object-oriented">Object-Oriented</SelectItem>
                  <SelectItem value="procedural">Procedural</SelectItem>
                  <SelectItem value="declarative">Declarative</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Code Complexity: {complexity[0]}</Label>
            <Slider
              value={complexity}
              onValueChange={setComplexity}
              min={1}
              max={10}
              step={1}
              className="w-full"
            />
          </div>

          <Button 
            onClick={handleAnalyze}
            disabled={analyzeMutation.isPending}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500"
          >
            {analyzeMutation.isPending ? 'Analyzing...' : 'Convert Music to Code'}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {(musicAnalysis || generatedCode) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Music Analysis */}
          {musicAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle>Music Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-2 text-sm">
                    <div><strong>Tempo:</strong> {musicAnalysis.tempo} BPM</div>
                    <div><strong>Key:</strong> {musicAnalysis.key}</div>
                    <div><strong>Time Signature:</strong> {musicAnalysis.timeSignature}</div>
                    <div><strong>Mood:</strong> {musicAnalysis.mood}</div>
                    <div><strong>Complexity:</strong> {musicAnalysis.complexity}/10</div>
                    <div><strong>Structure:</strong> {musicAnalysis.structure.join(' → ')}</div>
                    <div><strong>Instruments:</strong> {musicAnalysis.instruments.join(', ')}</div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Generated Code */}
          {generatedCode && (
            <Card>
              <CardHeader>
                <CardTitle>Generated Code</CardTitle>
                <CardDescription>
                  {generatedCode.framework} - {generatedCode.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <pre className="text-xs bg-muted p-4 rounded overflow-x-auto">
                    <code>{generatedCode.code}</code>
                  </pre>
                </ScrollArea>
                <div className="mt-4 space-y-1">
                  <div className="text-sm font-medium">Functionality:</div>
                  <ul className="text-sm text-muted-foreground list-disc pl-4">
                    {generatedCode.functionality.map((func, index) => (
                      <li key={index}>{func}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}