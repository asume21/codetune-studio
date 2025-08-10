import { 
  type User, 
  type InsertUser,
  type Project,
  type InsertProject,
  type CodeTranslation,
  type InsertCodeTranslation,
  type BeatPattern,
  type InsertBeatPattern,
  type Melody,
  type InsertMelody,
  type VulnerabilityScan,
  type InsertVulnerabilityScan,
  type Lyrics,
  type InsertLyrics,
  type Song,
  type InsertSong,
  type Playlist,
  type InsertPlaylist,
  type PlaylistSong
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Projects
  getProject(id: string): Promise<Project | undefined>;
  getUserProjects(userId: string): Promise<Project[]>;
  createProject(userId: string, project: InsertProject): Promise<Project>;
  updateProject(id: string, data: Partial<Project>): Promise<Project>;
  deleteProject(id: string): Promise<void>;

  // Code Translations
  getCodeTranslation(id: string): Promise<CodeTranslation | undefined>;
  getUserCodeTranslations(userId: string): Promise<CodeTranslation[]>;
  createCodeTranslation(userId: string, translation: InsertCodeTranslation & { translatedCode: string }): Promise<CodeTranslation>;

  // Beat Patterns
  getBeatPattern(id: string): Promise<BeatPattern | undefined>;
  getUserBeatPatterns(userId: string): Promise<BeatPattern[]>;
  createBeatPattern(userId: string, pattern: InsertBeatPattern): Promise<BeatPattern>;

  // Melodies
  getMelody(id: string): Promise<Melody | undefined>;
  getUserMelodies(userId: string): Promise<Melody[]>;
  createMelody(userId: string, melody: InsertMelody): Promise<Melody>;

  // Vulnerability Scans
  getVulnerabilityScan(id: string): Promise<VulnerabilityScan | undefined>;
  getUserVulnerabilityScans(userId: string): Promise<VulnerabilityScan[]>;
  createVulnerabilityScan(userId: string, scan: InsertVulnerabilityScan & { results: any }): Promise<VulnerabilityScan>;

  // Lyrics
  getLyrics(id: string): Promise<Lyrics | undefined>;
  getUserLyrics(userId: string): Promise<Lyrics[]>;
  createLyrics(userId: string, lyrics: InsertLyrics): Promise<Lyrics>;

  // Songs
  getSong(id: string): Promise<Song | undefined>;
  getUserSongs(userId: string): Promise<Song[]>;
  createSong(userId: string, song: InsertSong): Promise<Song>;
  updateSong(id: string, data: Partial<Song>): Promise<Song>;
  deleteSong(id: string): Promise<void>;
  updateSongPlayStats(id: string): Promise<void>;
  updateSongAnalysis(id: string, analysis: {
    estimatedBPM?: number;
    keySignature?: string;
    genre?: string;
    mood?: string;
    structure?: any;
    instruments?: string[];
    analysisNotes?: string;
  }): Promise<Song>;

  // Playlists
  getPlaylist(id: string): Promise<Playlist | undefined>;
  getUserPlaylists(userId: string): Promise<Playlist[]>;
  createPlaylist(userId: string, playlist: InsertPlaylist): Promise<Playlist>;
  updatePlaylist(id: string, data: Partial<Playlist>): Promise<Playlist>;
  deletePlaylist(id: string): Promise<void>;
  addSongToPlaylist(playlistId: string, songId: string): Promise<PlaylistSong>;
  removeSongFromPlaylist(playlistId: string, songId: string): Promise<void>;
  getPlaylistSongs(playlistId: string): Promise<(PlaylistSong & { song: Song })[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private projects: Map<string, Project>;
  private codeTranslations: Map<string, CodeTranslation>;
  private beatPatterns: Map<string, BeatPattern>;
  private melodies: Map<string, Melody>;
  private vulnerabilityScans: Map<string, VulnerabilityScan>;
  private lyrics: Map<string, Lyrics>;
  private songs: Map<string, Song>;
  private playlists: Map<string, Playlist>;
  private playlistSongs: Map<string, PlaylistSong>;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.codeTranslations = new Map();
    this.beatPatterns = new Map();
    this.melodies = new Map();
    this.vulnerabilityScans = new Map();
    this.lyrics = new Map();
    this.songs = new Map();
    this.playlists = new Map();
    this.playlistSongs = new Map();

    // Create default user
    const defaultUser: User = {
      id: "default-user",
      username: "CodeTuneUser",
      email: "user@codetune.studio",
      createdAt: new Date(),
    };
    this.users.set(defaultUser.id, defaultUser);
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  // Projects
  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getUserProjects(userId: string): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(project => project.userId === userId);
  }

  async createProject(userId: string, insertProject: InsertProject): Promise<Project> {
    const id = randomUUID();
    const project: Project = {
      ...insertProject,
      id,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    const existing = this.projects.get(id);
    if (!existing) throw new Error("Project not found");
    
    const updated: Project = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };
    this.projects.set(id, updated);
    return updated;
  }

  async deleteProject(id: string): Promise<void> {
    this.projects.delete(id);
  }

  // Code Translations
  async getCodeTranslation(id: string): Promise<CodeTranslation | undefined> {
    return this.codeTranslations.get(id);
  }

  async getUserCodeTranslations(userId: string): Promise<CodeTranslation[]> {
    return Array.from(this.codeTranslations.values()).filter(translation => translation.userId === userId);
  }

  async createCodeTranslation(userId: string, data: InsertCodeTranslation & { translatedCode: string }): Promise<CodeTranslation> {
    const id = randomUUID();
    const translation: CodeTranslation = {
      ...data,
      id,
      userId,
      createdAt: new Date(),
    };
    this.codeTranslations.set(id, translation);
    return translation;
  }

  // Beat Patterns
  async getBeatPattern(id: string): Promise<BeatPattern | undefined> {
    return this.beatPatterns.get(id);
  }

  async getUserBeatPatterns(userId: string): Promise<BeatPattern[]> {
    return Array.from(this.beatPatterns.values()).filter(pattern => pattern.userId === userId);
  }

  async createBeatPattern(userId: string, insertPattern: InsertBeatPattern): Promise<BeatPattern> {
    const id = randomUUID();
    const pattern: BeatPattern = {
      ...insertPattern,
      id,
      userId,
      createdAt: new Date(),
    };
    this.beatPatterns.set(id, pattern);
    return pattern;
  }

  // Melodies
  async getMelody(id: string): Promise<Melody | undefined> {
    return this.melodies.get(id);
  }

  async getUserMelodies(userId: string): Promise<Melody[]> {
    return Array.from(this.melodies.values()).filter(melody => melody.userId === userId);
  }

  async createMelody(userId: string, insertMelody: InsertMelody): Promise<Melody> {
    const id = randomUUID();
    const melody: Melody = {
      ...insertMelody,
      id,
      userId,
      createdAt: new Date(),
    };
    this.melodies.set(id, melody);
    return melody;
  }

  // Vulnerability Scans
  async getVulnerabilityScan(id: string): Promise<VulnerabilityScan | undefined> {
    return this.vulnerabilityScans.get(id);
  }

  async getUserVulnerabilityScans(userId: string): Promise<VulnerabilityScan[]> {
    return Array.from(this.vulnerabilityScans.values()).filter(scan => scan.userId === userId);
  }

  async createVulnerabilityScan(userId: string, data: InsertVulnerabilityScan & { results: any }): Promise<VulnerabilityScan> {
    const id = randomUUID();
    const scan: VulnerabilityScan = {
      ...data,
      id,
      userId,
      createdAt: new Date(),
    };
    this.vulnerabilityScans.set(id, scan);
    return scan;
  }

  // Lyrics
  async getLyrics(id: string): Promise<Lyrics | undefined> {
    return this.lyrics.get(id);
  }

  async getUserLyrics(userId: string): Promise<Lyrics[]> {
    return Array.from(this.lyrics.values()).filter(lyrics => lyrics.userId === userId);
  }

  async createLyrics(userId: string, insertLyrics: InsertLyrics): Promise<Lyrics> {
    const id = randomUUID();
    const lyrics: Lyrics = {
      ...insertLyrics,
      id,
      userId,
      createdAt: new Date(),
    };
    this.lyrics.set(id, lyrics);
    return lyrics;
  }

  // Songs
  async getSong(id: string): Promise<Song | undefined> {
    return this.songs.get(id);
  }

  async getUserSongs(userId: string): Promise<Song[]> {
    return Array.from(this.songs.values()).filter(song => song.userId === userId);
  }

  async createSong(userId: string, insertSong: InsertSong): Promise<Song> {
    const id = randomUUID();
    const song: Song = {
      ...insertSong,
      id,
      userId,
      uploadDate: new Date(),
      lastPlayed: null,
      playCount: 0,
      estimatedBPM: null,
      keySignature: null,
      genre: null,
      mood: null,
      structure: null,
      instruments: null,
      analysisNotes: null,
      analyzedAt: null,
    };
    this.songs.set(id, song);
    return song;
  }

  async updateSong(id: string, data: Partial<Song>): Promise<Song> {
    const song = this.songs.get(id);
    if (!song) throw new Error('Song not found');
    const updated = { ...song, ...data };
    this.songs.set(id, updated);
    return updated;
  }

  async deleteSong(id: string): Promise<void> {
    this.songs.delete(id);
  }

  async updateSongPlayStats(id: string): Promise<void> {
    const song = this.songs.get(id);
    if (song) {
      song.lastPlayed = new Date();
      song.playCount = (song.playCount || 0) + 1;
      this.songs.set(id, song);
    }
  }

  async updateSongAnalysis(id: string, analysis: {
    estimatedBPM?: number;
    keySignature?: string;
    genre?: string;
    mood?: string;
    structure?: any;
    instruments?: string[];
    analysisNotes?: string;
  }): Promise<Song> {
    const song = this.songs.get(id);
    if (!song) throw new Error('Song not found');
    const updated = { 
      ...song, 
      ...analysis,
      analyzedAt: new Date()
    };
    this.songs.set(id, updated);
    return updated;
  }

  // Playlists
  async getPlaylist(id: string): Promise<Playlist | undefined> {
    return this.playlists.get(id);
  }

  async getUserPlaylists(userId: string): Promise<Playlist[]> {
    return Array.from(this.playlists.values()).filter(playlist => playlist.userId === userId);
  }

  async createPlaylist(userId: string, insertPlaylist: InsertPlaylist): Promise<Playlist> {
    const id = randomUUID();
    const playlist: Playlist = {
      ...insertPlaylist,
      id,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.playlists.set(id, playlist);
    return playlist;
  }

  async updatePlaylist(id: string, data: Partial<Playlist>): Promise<Playlist> {
    const playlist = this.playlists.get(id);
    if (!playlist) throw new Error('Playlist not found');
    const updated = { ...playlist, ...data, updatedAt: new Date() };
    this.playlists.set(id, updated);
    return updated;
  }

  async deletePlaylist(id: string): Promise<void> {
    this.playlists.delete(id);
    // Remove all playlist songs for this playlist
    Array.from(this.playlistSongs.values())
      .filter(ps => ps.playlistId === id)
      .forEach(ps => this.playlistSongs.delete(ps.id));
  }

  async addSongToPlaylist(playlistId: string, songId: string): Promise<PlaylistSong> {
    const id = randomUUID();
    // Get position as the highest position + 1
    const existingPlaylistSongs = Array.from(this.playlistSongs.values())
      .filter(ps => ps.playlistId === playlistId);
    const position = existingPlaylistSongs.length > 0 
      ? Math.max(...existingPlaylistSongs.map(ps => ps.position)) + 1 
      : 1;
    
    const playlistSong: PlaylistSong = {
      id,
      playlistId,
      songId,
      position,
      addedAt: new Date(),
    };
    this.playlistSongs.set(id, playlistSong);
    return playlistSong;
  }

  async removeSongFromPlaylist(playlistId: string, songId: string): Promise<void> {
    const playlistSong = Array.from(this.playlistSongs.values())
      .find(ps => ps.playlistId === playlistId && ps.songId === songId);
    if (playlistSong) {
      this.playlistSongs.delete(playlistSong.id);
    }
  }

  async getPlaylistSongs(playlistId: string): Promise<(PlaylistSong & { song: Song })[]> {
    const playlistSongs = Array.from(this.playlistSongs.values())
      .filter(ps => ps.playlistId === playlistId)
      .sort((a, b) => a.position - b.position);
    
    return playlistSongs
      .map(ps => {
        const song = this.songs.get(ps.songId);
        return song ? { ...ps, song } : null;
      })
      .filter(Boolean) as (PlaylistSong & { song: Song })[];
  }
}

export const storage = new MemStorage();
