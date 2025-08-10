import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
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
  generateDynamicLayers
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
      const { style = "hip-hop", bpm = 120 } = req.body;

      const pattern = await generateBeatPattern(style, bpm);

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
      const { theme = "technology", genre = "hip-hop", mood = "upbeat" } = req.body;

      const content = await generateLyrics(theme, genre, mood);

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
      const { lyrics, genre } = req.body;
      const beatPattern = await generateBeatFromLyrics(lyrics, genre);
      res.json({ beatPattern });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Code to Music Routes
  app.post("/api/code-to-music", async (req, res) => {
    try {
      const { code, language } = req.body;
      const musicData = await codeToMusic(code, language);
      res.json(musicData);
    } catch (error) {
      console.error("Code to music error:", error);
      res.status(500).json({ error: "Failed to convert code to music" });
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
    try {
      const { ObjectStorageService, ObjectNotFoundError } = await import("./objectStorage.js");
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error: any) {
      console.error("Error serving object:", error);
      if (error.name === "ObjectNotFoundError") {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Song upload and analysis routes
  app.post("/api/objects/upload", async (req, res) => {
    try {
      const { ObjectStorageService } = await import("./objectStorage.js");
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getAudioUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Upload URL generation error:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  app.post("/api/songs/upload", async (req, res) => {
    try {
      const { songURL, name } = req.body;
      const song = {
        id: `song-${Date.now()}`,
        name,
        url: songURL,
        size: Math.floor(Math.random() * 10000000), // Mock size
        uploadDate: new Date().toISOString(),
        duration: Math.floor(Math.random() * 300) + 60 // Mock duration 1-5 minutes
      };
      res.json(song);
    } catch (error) {
      console.error("Song upload error:", error);
      res.status(500).json({ error: "Failed to save uploaded song" });
    }
  });

  app.post("/api/songs/analyze", async (req, res) => {
    try {
      const { songURL, songName } = req.body;
      // Mock analysis result - in real implementation this would analyze the audio file
      const analysis = {
        title: songName,
        estimatedBPM: Math.floor(Math.random() * 40) + 100, // 100-140 BPM
        keySignature: ["C Major", "G Major", "D Major", "A Major", "F Major"][Math.floor(Math.random() * 5)],
        genre: ["Electronic", "Rock", "Pop", "Jazz", "Classical"][Math.floor(Math.random() * 5)],
        mood: ["Energetic", "Calm", "Dark", "Happy", "Melancholic"][Math.floor(Math.random() * 5)],
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
        analysis_notes: `AI analysis of ${songName}: This song has a ${["driving", "laid-back", "complex", "simple"][Math.floor(Math.random() * 4)]} rhythm with ${["rich", "sparse", "dynamic", "steady"][Math.floor(Math.random() * 4)]} instrumentation.`
      };
      res.json(analysis);
    } catch (error) {
      console.error("Song analysis error:", error);
      res.status(500).json({ error: "Failed to analyze song" });
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
        beatPattern: musicData.beatPattern,
        melody: musicData.melody,
        codeMusic: musicData.codeMusic,
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