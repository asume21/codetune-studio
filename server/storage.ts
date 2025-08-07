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
  type InsertLyrics
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
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private projects: Map<string, Project>;
  private codeTranslations: Map<string, CodeTranslation>;
  private beatPatterns: Map<string, BeatPattern>;
  private melodies: Map<string, Melody>;
  private vulnerabilityScans: Map<string, VulnerabilityScan>;
  private lyrics: Map<string, Lyrics>;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.codeTranslations = new Map();
    this.beatPatterns = new Map();
    this.melodies = new Map();
    this.vulnerabilityScans = new Map();
    this.lyrics = new Map();

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
}

export const storage = new MemStorage();
