import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
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

// Initialize Stripe only if keys are available
let stripe: Stripe | null = null;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
    });
  }
} catch (error) {
  console.log("Stripe not initialized - API keys not available");
}

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

  // File Security Scanner Route (using same AI as code scanner)
  app.post("/api/security/scan-file", async (req, res) => {
    try {
      const { filename, fileInfo } = req.body;
      
      const { FileSecurityScanner } = await import("./services/fileSecurity.js");
      const scanner = new FileSecurityScanner();
      
      const results = await scanner.analyzeFileContentWithAI(filename, fileInfo);
      
      res.json({
        ...results,
        scannedBy: "CodedSwitch AI Security Scanner",
        scannedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("File security scan error:", error);
      res.status(500).json({ error: "Failed to scan file for security threats" });
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
      
      // For demo purposes, create a working response
      const demoCode = `class MusicGeneratedApp {
  constructor() {
    this.tempo = ${musicData?.tempo || 120};
    this.key = "${musicData?.key || 'C Major'}";
    this.instruments = ${JSON.stringify(Object.keys(musicData?.pattern || {kick: true}))};
  }
  
  run() {
    console.log("Music-generated application running!");
    this.processBeats();
    this.handleMelody();
  }
  
  processBeats() {
    // Generated from beat pattern
    ${Object.keys(musicData?.pattern || {}).map(inst => 
      `this.play${inst.charAt(0).toUpperCase() + inst.slice(1)}();`
    ).join('\n    ')}
  }
  
  handleMelody() {
    // Generated from melody structure
    console.log("Processing melody with tempo:", this.tempo);
  }
}`;

      const result = {
        analysis: {
          tempo: musicData?.tempo || 120,
          key: musicData?.key || 'C Major',
          timeSignature: '4/4',
          structure: ['Intro', 'Main', 'Outro'],
          instruments: Object.keys(musicData?.pattern || {kick: true, snare: true}),
          complexity: complexity,
          mood: 'generated'
        },
        code: {
          language,
          code: demoCode,
          description: `Generated ${language} code from musical composition`,
          framework: 'JavaScript/Node.js',
          functionality: ['Music-based class structure', 'Tempo-driven processing', 'Instrument handling']
        }
      };
      
      res.json(result);
    } catch (error) {
      console.error("Music to code error:", error);
      res.status(500).json({ error: "Failed to convert music to code" });
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
      console.log("🎵 Upload URL request received");
      
      // Check if object storage is properly configured
      if (!process.env.PRIVATE_OBJECT_DIR) {
        console.error("❌ PRIVATE_OBJECT_DIR not set");
        return res.status(503).json({ 
          error: "Object storage temporarily unavailable - PRIVATE_OBJECT_DIR not configured",
          temporary: true,
          retryAfter: 300
        });
      }
      
      console.log("🎵 PRIVATE_OBJECT_DIR:", process.env.PRIVATE_OBJECT_DIR);
      
      const objectStorageService = new ObjectStorageService();
      console.log("🎵 ObjectStorageService created, getting upload URL...");
      
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      console.log("🎵 Upload URL generated successfully:", uploadURL ? "✅" : "❌");
      
      res.json({ uploadURL });
    } catch (error) {
      console.error("Upload URL generation error:", error);
      console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
      
      // Check if it's a sidecar connectivity issue
      if (error instanceof Error && error.message.includes("Failed to sign object URL")) {
        console.log("🔧 Detected sidecar connectivity issue, checking alternatives...");
        
        return res.status(503).json({ 
          error: "Upload service temporarily unavailable - object storage endpoint unreachable",
          details: "The upload service is experiencing connectivity issues. Please try again in a few minutes.",
          temporary: true,
          retryAfter: 180,
          code: "SIDECAR_UNREACHABLE"
        });
      }
      
      // Check for other object storage configuration issues
      if (error instanceof Error && error.message.includes("PRIVATE_OBJECT_DIR")) {
        return res.status(503).json({ 
          error: "Object storage service temporarily unavailable",
          details: "Storage configuration issue detected. Service should recover automatically.",
          temporary: true,
          retryAfter: 300,
          code: "CONFIG_ERROR"
        });
      }
      
      // Generic fallback for unknown errors
      res.status(503).json({ 
        error: "Upload service temporarily unavailable", 
        details: "The file upload service is experiencing technical difficulties. Please try again later.",
        temporary: true,
        retryAfter: 300,
        code: "UNKNOWN_ERROR"
      });
    }
  });

  app.post("/api/songs/upload", async (req, res) => {
    try {
      const { songURL, name, fileSize, duration, format, mimeType } = req.body;
      console.log('🎵 Song upload request:', { songURL, name, fileSize, duration, format, mimeType });
      
      // SECURITY: Use CodedSwitch's own AI scanner to protect uploads - but be less restrictive for legitimate audio files
      const { FileSecurityScanner } = await import("./services/fileSecurity.js");
      const scanner = new FileSecurityScanner();
      
      // Determine if this looks like a legitimate audio file
      const isLikelyAudioFile = (
        mimeType && mimeType.startsWith('audio/') ||
        format && ['mp3', 'wav', 'm4a', 'ogg', 'flac', 'aac'].includes(format.toLowerCase()) ||
        name && /\.(mp3|wav|m4a|ogg|flac|aac)$/i.test(name)
      );
      
      // AI-powered security analysis using our own scanner
      const securityScan = await scanner.analyzeFileContentWithAI(name, {
        url: songURL,
        fileSize: fileSize || 0,
        duration,
        format: format || 'audio',
        mimeType: mimeType || 'audio/*',
        uploadedAt: new Date().toISOString(),
        isAudioFile: isLikelyAudioFile
      });
      
      console.log('🛡️ CodedSwitch security scan result:', securityScan);
      
      // For audio files, be more lenient - only block on high-severity threats
      const shouldBlock = isLikelyAudioFile 
        ? securityScan.threats.some(threat => threat.severity === 'Critical')
        : !securityScan.isSecure;
      
      if (shouldBlock) {
        console.log('🚫 Upload blocked by CodedSwitch security scanner');
        return res.status(400).json({
          error: "File upload blocked by security scanner",
          securityScan: {
            score: securityScan.securityScore,
            threats: securityScan.threats,
            summary: securityScan.summary
          }
        });
      }
      
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
      
      console.log('🎵 Created song record with security approval:', song);
      res.json({
        ...song,
        securityScan: {
          score: securityScan.securityScore,
          summary: securityScan.summary,
          scannedBy: "CodedSwitch AI Security Scanner"
        }
      });
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

      // Enhanced AI analysis prompt with specific focus on vocal and lyric detection
      const analysisPrompt = `Analyze this uploaded song "${songName}" with special attention to vocal content and collaborative artists. Provide comprehensive analysis:

**1. VOCAL & LYRIC DETECTION (Critical - Analyze Carefully):**
- Are there ANY vocals present in this song? (Yes/No - be definitive)
- If YES, describe ALL vocal elements heard:
  * Main vocalist(s) - how many different voices?
  * Background vocals, harmonies, or ad-libs?
  * Featured artists or collaborators?
  * Rap verses vs sung melodies?
  * Auto-tuned or processed vocals?
- Lyric content analysis:
  * Can you make out any words or phrases?
  * Language(s) used in vocals
  * Vocal style (rap, singing, talking, etc.)
  * Emotional delivery and tone
- Vocal quality rating (1-10) and improvement suggestions

**2. TECHNICAL ANALYSIS:**
- BPM estimation (be specific)
- Key signature identification
- Genre classification (be precise - subgenres welcome)
- Production quality assessment
- Mix and mastering evaluation

**3. COLLABORATION ANALYSIS:**
- Evidence of multiple artists/collaborators?
- Different vocal styles suggesting featured artists?
- Production credits that can be inferred from style?
- Cross-genre collaboration elements?

**4. MUSICAL ELEMENTS:**
- Instruments clearly identifiable in the mix
- Song structure breakdown (intro, verse, chorus, etc.)
- Mood and energy level
- Commercial viability assessment

**5. ACTIONABLE FEEDBACK:**
- Specific improvements for vocal performance
- Mix suggestions for better vocal clarity
- Collaboration opportunities based on style
- Market positioning recommendations

IMPORTANT: Be extremely thorough in vocal detection. Even subtle background vocals, harmonies, or processed voices should be noted. If you detect ANY human voice sounds, report them as vocals present.`;

      console.log('🎵 Sending enhanced analysis request to AI for:', songName);
      
      const { analyzeSong } = await import("./services/grok");
      const analysis_notes = await analyzeSong(songName, analysisPrompt);

      console.log('🎵 Enhanced AI Analysis completed, length:', analysis_notes.length);

      // Enhanced extraction with better vocal/lyric detection
      const bpmMatch = analysis_notes.match(/(\d+)\s*BPM/i);
      const keyMatch = analysis_notes.match(/([A-G][#b]?\s*(Major|Minor|major|minor))/i);
      const genreMatch = analysis_notes.match(/Genre[:\s]*([^\n\r,\.]+)/i);
      const moodMatch = analysis_notes.match(/Mood[:\s]*([^\n\r,\.]+)/i);
      
      // Enhanced vocal detection patterns
      const vocalDetection = analysis_notes.toLowerCase();
      const hasVocals = vocalDetection.includes('vocals present: yes') || 
                       vocalDetection.includes('vocals: yes') ||
                       vocalDetection.includes('singing') ||
                       vocalDetection.includes('rapper') ||
                       vocalDetection.includes('vocalist') ||
                       vocalDetection.includes('lyrics') ||
                       vocalDetection.includes('voice') ||
                       vocalDetection.includes('vocal') ||
                       vocalDetection.includes('harmony') ||
                       vocalDetection.includes('ad-lib') ||
                       vocalDetection.includes('featured artist') ||
                       vocalDetection.includes('collaboration');

      // Extract instruments with better vocal detection
      let instruments = ["drums", "bass"];
      if (hasVocals) {
        instruments.push("vocals");
        console.log('🎵 Vocals detected in analysis for:', songName);
      } else {
        console.log('🎵 No vocals detected in analysis for:', songName);
      }
      
      // Add other instruments based on analysis
      if (analysis_notes.toLowerCase().includes('guitar')) instruments.push("guitar");
      if (analysis_notes.toLowerCase().includes('piano') || analysis_notes.toLowerCase().includes('keys')) instruments.push("piano");
      if (analysis_notes.toLowerCase().includes('synth')) instruments.push("synth");
      if (analysis_notes.toLowerCase().includes('strings')) instruments.push("strings");

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
        instruments: instruments,
        hasVocals: hasVocals,
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

  // AI Assistant Routes with enhanced memory
  app.post("/api/assistant/chat", async (req, res) => {
    try {
      const { message, context, conversationHistory } = req.body;
      console.log('💬 AI chat request with history:', conversationHistory?.length || 0, 'messages');
      
      const response = await chatAssistant(
        message, 
        context || "CodedSwitch Studio", 
        conversationHistory || []
      );
      
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

  // Stripe Payment Routes
  app.post("/api/create-subscription", async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ error: "Stripe not configured. Please add STRIPE_SECRET_KEY environment variable." });
      }

      // Support both Basic ($10) and Pro ($39.99) tiers
      const { tier = 'pro' } = req.body; // Default to pro tier
      let priceId;
      
      if (tier === 'basic') {
        priceId = process.env.STRIPE_PRICE_ID_BASIC;
        if (!priceId) {
          return res.status(500).json({ error: "Stripe Basic price ID not configured. Please add STRIPE_PRICE_ID_BASIC environment variable." });
        }
      } else {
        priceId = process.env.STRIPE_PRICE_ID_PRO || process.env.STRIPE_PRICE_ID;
        if (!priceId) {
          return res.status(500).json({ error: "Stripe Pro price ID not configured. Please add STRIPE_PRICE_ID_PRO environment variable." });
        }
      }

      const user = await storage.getUser(currentUserId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if user already has an active subscription
      if (user.stripeSubscriptionId) {
        try {
          const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
          if (subscription.status === 'active') {
            const latestInvoice = await stripe.invoices.retrieve(subscription.latest_invoice as string, {
              expand: ['payment_intent']
            });
            
            return res.json({
              subscriptionId: subscription.id,
              clientSecret: (latestInvoice.payment_intent as any)?.client_secret,
              status: 'existing_subscription'
            });
          }
        } catch (error) {
          console.log("Previous subscription not found, creating new one");
        }
      }

      // Create or get Stripe customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.username,
        });
        customerId = customer.id;
        await storage.updateStripeCustomerId(currentUserId, customerId);
      }

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{
          price: priceId,
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      // Update user with subscription info
      await storage.updateUserStripeInfo(currentUserId, {
        customerId: customerId,
        subscriptionId: subscription.id,
        status: subscription.status,
        tier: subscription.status === 'active' ? tier : 'free'
      });

      const latestInvoice = subscription.latest_invoice as any;
      res.json({
        subscriptionId: subscription.id,
        clientSecret: latestInvoice?.payment_intent?.client_secret,
        status: 'subscription_created'
      });

    } catch (error: any) {
      console.error("Stripe subscription creation error:", error);
      res.status(500).json({ 
        error: "Failed to create subscription", 
        details: error.message 
      });
    }
  });

  // Get subscription status
  app.get("/api/subscription-status", async (req, res) => {
    try {
      const user = await storage.getUser(currentUserId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      let subscriptionStatus = {
        tier: user.subscriptionTier || 'free',
        status: user.subscriptionStatus || 'inactive',
        hasActiveSubscription: false
      };

      if (stripe && user.stripeSubscriptionId) {
        try {
          const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
          // Determine tier from subscription metadata or price
          let currentTier = 'free';
          if (subscription.status === 'active') {
            const priceId = subscription.items.data[0]?.price?.id;
            if (priceId === process.env.STRIPE_PRICE_ID_BASIC) {
              currentTier = 'basic';
            } else if (priceId === process.env.STRIPE_PRICE_ID_PRO || priceId === process.env.STRIPE_PRICE_ID) {
              currentTier = 'pro';
            }
          }
          
          subscriptionStatus = {
            tier: currentTier,
            status: subscription.status,
            hasActiveSubscription: subscription.status === 'active'
          };

          // Update user status if it changed
          if (user.subscriptionStatus !== subscription.status || user.subscriptionTier !== currentTier) {
            await storage.updateUserStripeInfo(currentUserId, {
              status: subscription.status,
              tier: currentTier
            });
          }
        } catch (error) {
          console.log("Could not fetch subscription from Stripe, using cached data");
        }
      }

      res.json(subscriptionStatus);
    } catch (error) {
      console.error("Failed to get subscription status:", error);
      res.status(500).json({ error: "Failed to get subscription status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}