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
  codeToMusic,
  chatAssistant 
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
      const { scale = "C Major", style = "electronic", complexity = 5 } = req.body;
      
      const melodyData = await generateMelody(scale, style, complexity);
      
      const melody = await storage.createMelody(currentUserId, {
        name: `${style} Melody`,
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
      console.error("Rhyme suggestions error:", error);
      res.status(500).json({ error: "Failed to get rhyme suggestions" });
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

  const httpServer = createServer(app);
  return httpServer;
}
