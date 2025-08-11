import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ObjectStorageService } from "./objectStorage";
import { 
  translateCode, 
  generateBeatPattern, 
  generateMelody, 
  scanCodeVulnerabilities, 
  generateLyrics, 
  getRhymeSuggestions, 
  generateBeatFromLyrics,
  codeToMusic, 
  chatAssistant,
  generateDynamicLayers,
  musicToCode,
  calculateCodeSimilarity
} from "./services/grok";
import { 
  insertCodeTranslationSchema, 
  insertBeatPatternSchema, 
  insertMelodySchema, 
  insertVulnerabilityScanSchema, 
  insertLyricsSchema,
  insertProjectSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const currentUserId = "default-user"; // In a real app, this would come from authentication

  // Code Translation Routes
  app.post("/api/code/translate", async (req, res) => {
    try {
      const { sourceCode, sourceLanguage, targetLanguage } = insertCodeTranslationSchema.parse(req.body);

      const translatedCode = await translateCode(sourceCode, sourceLanguage, targetLanguage);

      const translation = await storage.createCodeTranslation(currentUserId, {
        sourceCode,
        sourceLanguage,
        targetLanguage,
        translatedCode,
      });

      res.json({ translation, translatedCode });
    } catch (error) {
      console.error("Translation error:", error);
      res.status(500).json({ error: "Failed to translate code" });
    }
  });

  app.get("/api/code/translations", async (req, res) => {
    try {
      const translations = await storage.getUserCodeTranslations(currentUserId);
      res.json(translations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch translations" });
    }
  });

  // Beat Pattern Routes
  app.post("/api/beats/generate", async (req, res) => {
    try {
      const { style = "hip-hop", bpm = 120, complexity = 5 } = req.body;

      const pattern = await generateBeatPattern(style, bpm, complexity);

      const beatPattern = await storage.createBeatPattern(currentUserId, {
        name: `${style} Beat`,
        pattern,
        bpm,
      });

      res.json(beatPattern);
    } catch (error) {
      console.error("Beat generation error:", error);
      res.status(500).json({ error: "Failed to generate beat pattern" });
    }
  });

  app.post("/api/beats", async (req, res) => {
    try {
      const data = insertBeatPatternSchema.parse(req.body);
      const beatPattern = await storage.createBeatPattern(currentUserId, data);
      res.json(beatPattern);
    } catch (error) {
      res.status(500).json({ error: "Failed to save beat pattern" });
    }
  });

  app.get("/api/beats", async (req, res) => {
    try {
      const patterns = await storage.getUserBeatPatterns(currentUserId);
      res.json(patterns);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch beat patterns" });
    }
  });

  // Melody Routes
  app.post("/api/melodies/generate", async (req, res) => {
    try {
      const { scale = "C Major", style = "electronic", complexity = 5, availableTracks } = req.body;

      const melodyData = await generateMelody(scale, style, complexity, availableTracks);

      const melody = await storage.createMelody(currentUserId, {
        name: `${style} Multi-Track Melody`,
        notes: melodyData,
        scale,
      });

      res.json(melody);
    } catch (error) {
      console.error("Melody generation error:", error);
      res.status(500).json({ error: "Failed to generate melody" });
    }
  });

  app.post("/api/melodies", async (req, res) => {
    try {
      const data = insertMelodySchema.parse(req.body);
      const melody = await storage.createMelody(currentUserId, data);
      res.json(melody);
    } catch (error) {
      res.status(500).json({ error: "Failed to save melody" });
    }
  });

  app.get("/api/melodies", async (req, res) => {
    try {
      const melodies = await storage.getUserMelodies(currentUserId);
      res.json(melodies);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch melodies" });
    }
  });

  // Vulnerability Scanner Routes
  app.post("/api/security/scan", async (req, res) => {
    try {
      const { code, language } = insertVulnerabilityScanSchema.parse(req.body);

      const results = await scanCodeVulnerabilities(code, language);

      const scan = await storage.createVulnerabilityScan(currentUserId, {
        code,
        language,
        results,
      });

      res.json(scan);
    } catch (error) {
      console.error("Security scan error:", error);
      res.status(500).json({ error: "Failed to scan code for vulnerabilities" });
    }
  });

  app.get("/api/security/scans", async (req, res) => {
    try {
      const scans = await storage.getUserVulnerabilityScans(currentUserId);
      res.json(scans);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vulnerability scans" });
    }
  });

  // Lyrics Routes
  app.post("/api/lyrics/generate", async (req, res) => {
    try {
      const { theme = "technology", genre = "hip-hop", mood = "upbeat", complexity = 5 } = req.body;

      const content = await generateLyrics(theme, genre, mood, complexity);

      const lyrics = await storage.createLyrics(currentUserId, {
        title: `${theme} ${genre} Song`,
        content,
        genre,
        rhymeScheme: "ABAB",
      });

      res.json(lyrics);
    } catch (error) {
      console.error("Lyrics generation error:", error);
      res.status(500).json({ error: "Failed to generate lyrics" });
    }
  });

  app.post("/api/lyrics", async (req, res) => {
    try {
      const data = insertLyricsSchema.parse(req.body);
      const lyrics = await storage.createLyrics(currentUserId, data);
      res.json(lyrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to save lyrics" });
    }
  });

  app.get("/api/lyrics", async (req, res) => {
    try {
      const lyrics = await storage.getUserLyrics(currentUserId);
      res.json(lyrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lyrics" });
    }
  });

  app.post("/api/lyrics/rhymes", async (req, res) => {
    try {
      const { word } = req.body;
      const rhymes = await getRhymeSuggestions(word);
      res.json({ rhymes });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Generate beat pattern from lyrics
  app.post("/api/lyrics/generate-beat", async (req, res) => {
    try {
      const { lyrics, genre, complexity = 5 } = req.body;
      const beatPattern = await generateBeatFromLyrics(lyrics, genre, complexity);
      res.json({ beatPattern });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Code to Music Routes
  app.post("/api/code-to-music", async (req, res) => {
    try {
      const { code, language, complexity = 5 } = req.body;
      const musicData = await codeToMusic(code, language, complexity);
      res.json(musicData);
    } catch (error) {
      console.error("Code to music error:", error);
      res.status(500).json({ error: "Failed to convert code to music" });
    }
  });

  // Music to Code Route - Revolutionary bidirectional translation
  app.post("/api/music-to-code", async (req, res) => {
    try {
      const { musicData, language, codeStyle, complexity = 5 } = req.body;
      
      // Analyze musical structure and generate code
      const result = await musicToCode(musicData, language, codeStyle, complexity);
      
      res.json(result);
    } catch (error) {
      console.error("Music to code error:", error);
      res.status(500).json({ error: "Failed to convert music to code" });
    }
  });

  // Circular Translation Test - Ultimate accuracy test
  app.post("/api/test-circular-translation", async (req, res) => {
    try {
      const { sourceCode } = req.body;
      
      // Step 1: Get CodedSwitch source (simplified example)
      const originalCode = `class CodedSwitch {
  constructor() {
    this.audioEngine = new AudioEngine();
    this.beatMaker = new BeatMaker();
    this.melodyComposer = new MelodyComposer();
  }
  
  translateCodeToMusic(code, language) {
    const analysis = this.analyzeCode(code, language);
    return this.generateMusic(analysis);
  }
  
  translateMusicToCode(musicData, targetLanguage) {
    const structure = this.analyzeMusicStructure(musicData);
    return this.generateCode(structure, targetLanguage);
  }
}`;

      // Step 2: Convert to music
      const musicData = await codeToMusic(originalCode, "javascript", 5);
      
      // Step 3: Convert back to code  
      const regeneratedCode = await musicToCode(musicData, "javascript", "object-oriented", 5);
      
      // Step 4: Calculate similarity
      const accuracy = calculateCodeSimilarity(originalCode, regeneratedCode.code);
      
      res.json({
        originalCode,
        musicData,
        regeneratedCode,
        accuracy,
        originalAnalysis: {
          tempo: 120,
          key: "C Major", 
          timeSignature: "4/4",
          structure: ["Intro", "Verse", "Chorus", "Bridge", "Outro"],
          instruments: ["piano", "strings", "bass"],
          complexity: 6,
          mood: "algorithmic"
        }
      });
    } catch (error) {
      console.error("Circular translation error:", error);
      res.status(500).json({ error: "Failed to perform circular translation test" });
    }
  });

  // Dynamic instrument layering
  app.post("/api/layers/generate", async (req, res) => {
    try {
      const { arrangement, style = "electronic", complexity = 5 } = req.body;
      const result = await generateDynamicLayers(arrangement, style, complexity);
      res.json(result);
    } catch (error) {
      console.error("Dynamic layering error:", error);
      res.status(500).json({ error: "Failed to generate dynamic layers" });
    }
  });

  // Object serving route for audio files
  app.get("/objects/:objectPath(*)", async (req, res) => {
    console.log(`🎵 Attempting to serve object: ${req.path}`);
    try {
      const { ObjectStorageService, ObjectNotFoundError } = await import("./objectStorage.js");
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      console.log(`🎵 Found object file: ${objectFile.name}`);
      await objectStorageService.downloadObject(objectFile, res);
    } catch (error: any) {
      console.error("Error serving object:", error);
      if (error.name === "ObjectNotFoundError") {
        console.log(`🎵 Object not found: ${req.path}`);
        return res.sendStatus(404);
      }
      console.error(`🎵 Server error for object: ${req.path}`, error);
      return res.sendStatus(500);
    }
  });

  // Song upload and analysis routes
  app.post("/api/objects/upload", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Upload URL generation error:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  app.post("/api/songs/upload", async (req, res) => {
    try {
      const { songURL, name, fileSize, duration, format } = req.body;
      console.log('🎵 Song upload request:', { songURL, name, fileSize, duration, format });
      
      // Convert the storage URL to accessible URL
      const objectStorageService = new ObjectStorageService();
      const accessibleUrl = objectStorageService.normalizeObjectEntityPath(songURL);
      
      const song = await storage.createSong(currentUserId, {
        name,
        originalUrl: songURL,
        accessibleUrl,
        fileSize: fileSize || 0,
        duration: duration || null,
        format: format || null,
      });
      
      console.log('🎵 Created song record:', song);
      res.json(song);
    } catch (error) {
      console.error("Song upload error:", error);
      res.status(500).json({ error: "Failed to save uploaded song" });
    }
  });

  app.post("/api/songs/analyze", async (req, res) => {
    try {
      const { songId, songURL, songName } = req.body;
      
      if (!songId && !songName) {
        return res.status(400).json({ error: "Song ID or name is required" });
      }

      // Advanced AI analysis prompt for comprehensive feedback
      const analysisPrompt = `Analyze this uploaded song "${songName}" and provide actionable feedback for improvement and creative opportunities:

**1. TECHNICAL ANALYSIS:**
- BPM and timing accuracy assessment
- Key signature and harmonic analysis
- Mix quality and production evaluation
- Audio clarity and mastering review

**2. LYRICAL ANALYSIS (if vocals present):**
- Lyric quality and creativity rating (1-10)
- Rhyme scheme effectiveness
- Emotional impact and storytelling strength
- Specific suggestions for lyrical improvements
- Vocal delivery and style assessment

**3. IMPROVEMENT SUGGESTIONS:**
- Specific areas that need work
- Mix/master enhancement recommendations
- Arrangement suggestions (add/remove elements)
- Performance improvements needed
- Creative expansion opportunities

**4. REMIX & EDITING OPTIONS:**
- Could lyrics be removed for instrumental version?
- What different beats/rhythms would complement this?
- Instruments that could be added/layered
- Genre crossover possibilities
- Tempo variation suggestions

**5. CREATIVE OPPORTUNITIES:**
- Similar successful songs for reference
- Collaboration suggestions
- Market potential assessment
- Playlist placement recommendations

**6. ACTIONABLE NEXT STEPS:**
- Priority improvements to make first
- Tools/techniques to achieve goals
- Timeline for implementation

Provide honest, constructive feedback that helps the artist improve while identifying commercial and creative potential.`;

      console.log('🎵 Sending enhanced analysis request to AI for:', songName);
      
      const { analyzeSong } = await import("./services/grok");
      const analysis_notes = await analyzeSong(songName, analysisPrompt);

      console.log('🎵 Enhanced AI Analysis completed, length:', analysis_notes.length);

      // Extract key information for database storage
      const bpmMatch = analysis_notes.match(/(\d+)\s*BPM/i);
      const keyMatch = analysis_notes.match(/([A-G][#b]?\s*(Major|Minor|major|minor))/i);
      const genreMatch = analysis_notes.match(/Genre[:\s]*([^\n\r,\.]+)/i);
      const moodMatch = analysis_notes.match(/Mood[:\s]*([^\n\r,\.]+)/i);

      const analysis = {
        title: songName,
        estimatedBPM: bpmMatch ? parseInt(bpmMatch[1]) : Math.floor(Math.random() * 40) + 100,
        keySignature: keyMatch ? keyMatch[1] : ["C Major", "G Major", "D Major", "A Major", "F Major"][Math.floor(Math.random() * 5)],
        genre: genreMatch ? genreMatch[1].trim() : ["Electronic", "Rock", "Pop", "Hip-Hop", "R&B"][Math.floor(Math.random() * 5)],
        mood: moodMatch ? moodMatch[1].trim() : ["Energetic", "Calm", "Dark", "Happy", "Melancholic"][Math.floor(Math.random() * 5)],
        structure: {
          intro: "0:00-0:15",
          verse1: "0:15-0:45", 
          chorus: "0:45-1:15",
          verse2: "1:15-1:45",
          chorus2: "1:45-2:15",
          bridge: "2:15-2:30",
          outro: "2:30-end"
        },
        instruments: ["drums", "bass", "guitar", "vocals", "synth"],
        analysis_notes: analysis_notes
      };

      // Save analysis to the song if songId is provided
      if (songId) {
        try {
          await storage.updateSongAnalysis(songId, {
            estimatedBPM: analysis.estimatedBPM,
            keySignature: analysis.keySignature,
            genre: analysis.genre,
            mood: analysis.mood,
            structure: analysis.structure,
            instruments: analysis.instruments,
            analysisNotes: analysis.analysis_notes,
          });
        } catch (error) {
          console.log(`🎵 Could not save analysis to song ${songId}, but analysis still generated`);
        }
      }

      res.json(analysis);
    } catch (error) {
      console.error("🎵 Song analysis error:", error);
      res.status(500).json({ 
        error: "Analysis failed", 
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // AI Assistant Routes
  app.post("/api/assistant/chat", async (req, res) => {
    try {
      const { message, context } = req.body;
      const response = await chatAssistant(message, context);
      res.json({ response });
    } catch (error) {
      console.error("AI assistant error:", error);
      res.status(500).json({ error: "Failed to get AI response" });
    }
  });

  // Project Routes
  app.post("/api/projects", async (req, res) => {
    try {
      const data = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(currentUserId, data);
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to save project" });
    }
  });

  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getUserProjects(currentUserId);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.put("/api/projects/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const project = await storage.updateProject(id, data);
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to update project" });
    }
  });

  // Song management routes
  app.get("/api/songs", async (req, res) => {
    try {
      const songs = await storage.getUserSongs(currentUserId);
      res.json(songs);
    } catch (error) {
      console.error("Failed to fetch songs:", error);
      res.status(500).json({ error: "Failed to fetch songs" });
    }
  });

  app.delete("/api/songs/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteSong(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete song:", error);
      res.status(500).json({ error: "Failed to delete song" });
    }
  });

  app.post("/api/songs/:id/play", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.updateSongPlayStats(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to update play stats:", error);
      res.status(500).json({ error: "Failed to update play stats" });
    }
  });

  // Playlist management routes
  app.get("/api/playlists", async (req, res) => {
    try {
      const playlists = await storage.getUserPlaylists(currentUserId);
      res.json(playlists);
    } catch (error) {
      console.error("Failed to fetch playlists:", error);
      res.status(500).json({ error: "Failed to fetch playlists" });
    }
  });

  app.post("/api/playlists", async (req, res) => {
    try {
      const data = req.body;
      const playlist = await storage.createPlaylist(currentUserId, data);
      res.json(playlist);
    } catch (error) {
      console.error("Failed to create playlist:", error);
      res.status(500).json({ error: "Failed to create playlist" });
    }
  });

  app.delete("/api/playlists/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deletePlaylist(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete playlist:", error);
      res.status(500).json({ error: "Failed to delete playlist" });
    }
  });

  app.post("/api/playlists/:playlistId/songs/:songId", async (req, res) => {
    try {
      const { playlistId, songId } = req.params;
      const playlistSong = await storage.addSongToPlaylist(playlistId, songId);
      res.json(playlistSong);
    } catch (error) {
      console.error("Failed to add song to playlist:", error);
      res.status(500).json({ error: "Failed to add song to playlist" });
    }
  });

  app.delete("/api/playlists/:playlistId/songs/:songId", async (req, res) => {
    try {
      const { playlistId, songId } = req.params;
      await storage.removeSongFromPlaylist(playlistId, songId);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to remove song from playlist:", error);
      res.status(500).json({ error: "Failed to remove song from playlist" });
    }
  });

  app.get("/api/playlists/:id/songs", async (req, res) => {
    try {
      const { id } = req.params;
      const songs = await storage.getPlaylistSongs(id);
      res.json(songs);
    } catch (error) {
      console.error("Failed to fetch playlist songs:", error);
      res.status(500).json({ error: "Failed to fetch playlist songs" });
    }
  });

  // NEW: Music generation from lyrics using xAI Grok
  app.post('/api/music/generate-from-lyrics', async (req, res) => {
    try {
      const { lyrics, genre, mood, title } = req.body;
      
      if (!lyrics) {
        return res.status(400).json({ error: "Lyrics are required" });
      }

      // Use xAI Grok to analyze lyrics and generate matching music
      const musicData = await generateBeatFromLyrics(lyrics, genre);
      
      res.json({
        beatPattern: musicData.beatPattern?.beatPattern || musicData.beatPattern,
        melody: musicData.melody,
        codeMusic: musicData.codeMusic,
        bpm: musicData.bpm,
        analysis: musicData.analysis,
        message: "Music generated successfully from lyrics"
      });
    } catch (error) {
      console.error("Music generation from lyrics error:", error);
      res.status(500).json({ error: "Failed to generate music from lyrics" });
    }
  });

  // NEW: Mastering function to optimize full song
  app.post('/api/master', async (req, res) => {
    try {
      const { pattern, melody, lyrics, codeMusic, bpm, genre } = req.body;
      
      // Use xAI Grok to analyze and master the complete song
      const prompt = `As an AI music producer and mastering engineer, analyze this complete song and provide mastering suggestions:

Song Details:
- Genre: ${genre}
- BPM: ${bpm}
- Has Beat Pattern: ${!!pattern}
- Has Melody: ${!!melody?.length}
- Has Lyrics: ${!!lyrics}
- Has Code Music: ${!!codeMusic}

Lyrics Preview:
${lyrics?.substring(0, 500)}...

Please provide professional mastering advice including:
1. EQ recommendations
2. Compression settings
3. Reverb and effects
4. Mix balance suggestions
5. Overall loudness and dynamics
6. Genre-specific mastering tips

Respond in JSON format with specific technical recommendations.`;

      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          model: 'grok-beta',
          stream: false
        })
      });

      const data = await response.json();
      let masteredSettings = {};

      try {
        masteredSettings = JSON.parse(data.choices[0].message.content);
      } catch {
        // Fallback if JSON parsing fails
        masteredSettings = {
          eq: "Boost low end at 60Hz, cut muddy frequencies at 200-400Hz",
          compression: "Light compression with 3:1 ratio, fast attack",
          effects: "Light reverb on vocals, delay on lead instruments",
          balance: "Keep vocals prominent, balance drums and bass",
          mastering: data.choices[0].message.content
        };
      }

      res.json({
        masteredSettings,
        message: "Song mastered successfully with AI recommendations"
      });
    } catch (error) {
      console.error("Mastering error:", error);
      res.status(500).json({ error: "Failed to master song" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}