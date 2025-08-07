import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface RhymeSuggestion {
  word: string;
  type: "perfect" | "near";
}

export default function LyricLab() {
  const [title, setTitle] = useState("My Awesome Track");
  const [content, setContent] = useState(`[Verse 1]
Started from the bottom of the code base,
Debugging through the night at my own pace,
Functions calling functions in this digital space,
Building something greater than the human race.

[Pre-Chorus]
Binary dreams and electric thoughts,
Creating melodies from the code I've wrought.

[Chorus]
We're translating hearts to algorithms,
Making music from the syntax we're writing,
Every loop and every variable's a rhythm,
In this digital symphony we're designing.

[Verse 2]
Type here or use AI generation...`);
  const [genre, setGenre] = useState("hip-hop");
  const [rhymeScheme, setRhymeScheme] = useState("ABAB");
  const [theme, setTheme] = useState("technology, coding");
  const [mood, setMood] = useState("upbeat");
  const [currentWord, setCurrentWord] = useState("");
  const [rhymeSuggestions, setRhymeSuggestions] = useState<RhymeSuggestion[]>([]);

  const { toast } = useToast();

  const generateLyricsMutation = useMutation({
    mutationFn: async (data: { theme: string; genre: string; mood: string }) => {
      const response = await apiRequest("POST", "/api/lyrics/generate", data);
      return response.json();
    },
    onSuccess: (data) => {
      setContent(data.content);
      setTitle(data.title);
      toast({
        title: "Lyrics Generated",
        description: "AI has created new lyrics for you.",
      });
    },
    onError: () => {
      toast({
        title: "Generation Failed",
        description: "Failed to generate lyrics. Please try again.",
        variant: "destructive",
      });
    },
  });

  const saveLyricsMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; genre: string; rhymeScheme: string }) => {
      const response = await apiRequest("POST", "/api/lyrics", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Lyrics Saved",
        description: "Your lyrics have been saved successfully.",
      });
    },
  });

  const rhymeMutation = useMutation({
    mutationFn: async (data: { word: string }) => {
      const response = await apiRequest("POST", "/api/lyrics/rhymes", data);
      return response.json();
    },
    onSuccess: (data) => {
      const suggestions: RhymeSuggestion[] = data.rhymes.map((rhyme: string) => ({
        word: rhyme,
        type: "perfect" as const,
      }));
      setRhymeSuggestions(suggestions);
    },
  });

  const { data: savedLyrics } = useQuery({
    queryKey: ["/api/lyrics"],
  });

  const handleGenerateAI = () => {
    if (!theme.trim()) {
      toast({
        title: "No Theme Provided",
        description: "Please enter a theme for the lyrics.",
        variant: "destructive",
      });
      return;
    }

    generateLyricsMutation.mutate({
      theme,
      genre,
      mood,
    });
  };

  const handleSave = () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Incomplete Lyrics",
        description: "Please provide both title and content.",
        variant: "destructive",
      });
      return;
    }

    saveLyricsMutation.mutate({
      title,
      content,
      genre,
      rhymeScheme,
    });
  };

  const handleFindRhymes = () => {
    if (!currentWord.trim()) return;
    rhymeMutation.mutate({ word: currentWord.trim() });
  };

  const insertRhyme = (rhyme: string) => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.substring(0, start) + rhyme + content.substring(end);
      setContent(newContent);
      
      // Restore cursor position
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + rhyme.length, start + rhyme.length);
      }, 0);
    }
  };

  const goToSection = (section: string) => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (textarea) {
      const sectionIndex = content.indexOf(`[${section.charAt(0).toUpperCase() + section.slice(1)}]`);
      if (sectionIndex !== -1) {
        textarea.focus();
        textarea.setSelectionRange(sectionIndex, sectionIndex);
        textarea.scrollTop = (sectionIndex / content.length) * textarea.scrollHeight;
      }
    }
  };

  const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
  const lineCount = content.split('\n').length;

  const genres = [
    { value: "hip-hop", label: "Hip-Hop" },
    { value: "pop", label: "Pop" },
    { value: "rock", label: "Rock" },
    { value: "r&b", label: "R&B" },
    { value: "country", label: "Country" },
    { value: "electronic", label: "Electronic" },
  ];

  const moods = [
    { value: "upbeat", label: "Upbeat" },
    { value: "melancholic", label: "Melancholic" },
    { value: "energetic", label: "Energetic" },
    { value: "romantic", label: "Romantic" },
    { value: "introspective", label: "Introspective" },
  ];

  const rhymeSchemes = [
    { value: "AABB", label: "AABB (Couplets)" },
    { value: "ABAB", label: "ABAB (Alternating)" },
    { value: "ABCB", label: "ABCB (Ballad)" },
    { value: "FREE", label: "Free Verse" },
  ];

  return (
    <div className="h-full p-6 flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-bold">Lyric Lab</h2>
        <div className="flex items-center space-x-4">
          <Select value={genre} onValueChange={setGenre}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {genres.map((g) => (
                <SelectItem key={g.value} value={g.value}>
                  {g.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            onClick={handleGenerateAI}
            disabled={generateLyricsMutation.isPending}
            className="bg-studio-accent hover:bg-blue-500"
          >
            {generateLyricsMutation.isPending ? (
              <>
                <i className="fas fa-spinner animate-spin mr-2"></i>
                Generating...
              </>
            ) : (
              <>
                <i className="fas fa-magic mr-2"></i>
                AI Generate
              </>
            )}
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={saveLyricsMutation.isPending}
            className="bg-studio-success hover:bg-green-500"
          >
            <i className="fas fa-save mr-2"></i>
            Save
          </Button>
        </div>
      </div>
      
      <div className="flex-1 grid grid-cols-3 gap-6">
        {/* Lyric Editor */}
        <div className="col-span-2 bg-studio-panel border border-gray-600 rounded-lg overflow-hidden">
          <div className="bg-gray-700 px-4 py-2 border-b border-gray-600 flex items-center justify-between">
            <h3 className="font-medium">Lyric Editor</h3>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <span>Words: {wordCount}</span>
                <span>Lines: {lineCount}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  <i className="fas fa-undo"></i>
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  <i className="fas fa-redo"></i>
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  <i className="fas fa-spell-check"></i>
                </Button>
              </div>
            </div>
          </div>
          
          <div className="p-4">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Song Title"
              className="mb-4 bg-gray-700 border-gray-600 font-semibold text-lg"
            />
            
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="h-96 bg-transparent border-none resize-none font-mono text-sm leading-relaxed focus:outline-none"
              placeholder="Start writing your lyrics here..."
            />
          </div>
          
          {/* Rhyme Suggestions */}
          {rhymeSuggestions.length > 0 && (
            <div className="p-4 bg-gray-800 border-t border-gray-600">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Rhyme Suggestions</span>
                <span className="text-xs text-gray-400">For: "{currentWord}"</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {rhymeSuggestions.slice(0, 8).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => insertRhyme(suggestion.word)}
                    className="px-2 py-1 bg-studio-accent bg-opacity-20 text-studio-accent rounded text-xs hover:bg-opacity-30 transition-colors"
                  >
                    {suggestion.word}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Lyric Tools */}
        <div className="space-y-6">
          {/* Song Structure */}
          <div className="bg-studio-panel border border-gray-600 rounded-lg p-4">
            <h3 className="font-medium mb-3">Song Structure</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between p-2 bg-gray-700 rounded cursor-pointer hover:bg-gray-600" onClick={() => goToSection("intro")}>
                <span>Intro</span>
                <span className="text-gray-400">8 bars</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-studio-accent bg-opacity-20 rounded cursor-pointer" onClick={() => goToSection("verse 1")}>
                <span>Verse 1</span>
                <span className="text-gray-400">16 bars</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-700 rounded cursor-pointer hover:bg-gray-600" onClick={() => goToSection("pre-chorus")}>
                <span>Pre-Chorus</span>
                <span className="text-gray-400">8 bars</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-700 rounded cursor-pointer hover:bg-gray-600" onClick={() => goToSection("chorus")}>
                <span>Chorus</span>
                <span className="text-gray-400">16 bars</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-600 rounded cursor-pointer hover:bg-gray-500">
                <span className="text-gray-400">+ Add Section</span>
                <i className="fas fa-plus text-gray-400"></i>
              </div>
            </div>
          </div>
          
          {/* Rhyme Scheme */}
          <div className="bg-studio-panel border border-gray-600 rounded-lg p-4">
            <h3 className="font-medium mb-3">Rhyme Scheme</h3>
            <div className="space-y-3">
              {rhymeSchemes.map((scheme) => (
                <div key={scheme.value} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="rhyme"
                    value={scheme.value}
                    checked={rhymeScheme === scheme.value}
                    onChange={(e) => setRhymeScheme(e.target.value)}
                    className="text-studio-accent"
                  />
                  <label className="text-sm cursor-pointer" onClick={() => setRhymeScheme(scheme.value)}>
                    {scheme.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          {/* AI Generation */}
          <div className="bg-studio-panel border border-gray-600 rounded-lg p-4">
            <h3 className="font-medium mb-3">AI Generation</h3>
            <div className="space-y-3">
              <Input
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="Theme or concept..."
                className="bg-gray-700 border-gray-600"
              />
              <Select value={mood} onValueChange={setMood}>
                <SelectTrigger>
                  <SelectValue placeholder="Select mood..." />
                </SelectTrigger>
                <SelectContent>
                  {moods.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleGenerateAI}
                disabled={generateLyricsMutation.isPending}
                className="w-full bg-studio-accent hover:bg-blue-500"
              >
                Generate Lyrics
              </Button>
            </div>
          </div>
          
          {/* Rhyme Dictionary */}
          <div className="bg-studio-panel border border-gray-600 rounded-lg p-4">
            <h3 className="font-medium mb-3">Rhyme Dictionary</h3>
            <div className="space-y-3">
              <div className="flex space-x-2">
                <Input
                  value={currentWord}
                  onChange={(e) => setCurrentWord(e.target.value)}
                  placeholder="Enter word to find rhymes..."
                  className="bg-gray-700 border-gray-600"
                  onKeyDown={(e) => e.key === "Enter" && handleFindRhymes()}
                />
                <Button
                  onClick={handleFindRhymes}
                  disabled={rhymeMutation.isPending}
                  size="sm"
                  className="bg-studio-accent hover:bg-blue-500"
                >
                  <i className="fas fa-search"></i>
                </Button>
              </div>
              
              {rhymeMutation.isPending && (
                <div className="text-center py-4">
                  <i className="fas fa-spinner animate-spin text-studio-accent"></i>
                </div>
              )}
            </div>
          </div>
          
          {/* Word Bank */}
          <div className="bg-studio-panel border border-gray-600 rounded-lg p-4">
            <h3 className="font-medium mb-3">Word Bank</h3>
            <div className="space-y-2 text-xs max-h-32 overflow-y-auto">
              <div className="flex flex-wrap gap-1">
                {["algorithm", "digital", "syntax", "binary", "electric", "function", "variable", "execute"].map((word) => (
                  <button
                    key={word}
                    onClick={() => insertRhyme(word)}
                    className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 cursor-pointer transition-colors"
                  >
                    {word}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
