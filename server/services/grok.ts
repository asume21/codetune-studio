import OpenAI from "openai";

// Debug API key setup
const apiKey = process.env.XAI_API_KEY?.trim();
console.log("API Key Debug:", {
  exists: !!apiKey,
  length: apiKey?.length || 0,
  prefix: apiKey?.substring(0, 4) || 'none',
  suffix: apiKey?.substring(-4) || 'none',
  format: apiKey?.startsWith('xai-') ? 'correct' : 'incorrect',
  fullKey: apiKey ? `${apiKey.substring(0, 8)}...${apiKey.substring(-8)}` : 'none'
});

if (!apiKey) {
  throw new Error("XAI_API_KEY environment variable is not set. Please add it to your Replit Secrets.");
}

if (!apiKey.startsWith('xai-')) {
  throw new Error("Invalid XAI_API_KEY format. Key should start with 'xai-'");
}

// Using xAI's Grok API as requested by the user instead of OpenAI
const openai = new OpenAI({ 
  baseURL: "https://api.x.ai/v1",
  apiKey: apiKey,
  timeout: 30000
});

export async function translateCode(sourceCode: string, sourceLanguage: string, targetLanguage: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "grok-2-1212",
      messages: [
        {
          role: "system",
          content: `You are an expert programmer. Translate code from ${sourceLanguage} to ${targetLanguage}. 
          Maintain the same functionality and logic. Return only the translated code without explanations.`
        },
        {
          role: "user",
          content: `Translate this ${sourceLanguage} code to ${targetLanguage}:\n\n${sourceCode}`
        }
      ],
      temperature: 0.1,
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    throw new Error("Failed to translate code: " + (error as Error).message);
  }
}

export async function generateBeatPattern(style: string, bpm: number): Promise<any> {
  try {
    const variations = [
      "energetic and driving",
      "laid-back and groovy", 
      "syncopated and complex",
      "minimal and spacious",
      "heavy and aggressive",
      "bouncy and playful",
      "dark and moody",
      "uplifting and bright"
    ];
    
    const randomVariation = variations[Math.floor(Math.random() * variations.length)];
    const timestamp = Date.now();
    const randomSeed = Math.floor(Math.random() * 10000);
    
    const response = await openai.chat.completions.create({
      model: "grok-2-1212",
      messages: [
        {
          role: "system",
          content: `You are a creative AI beat producer. Generate unique, varied ${style} patterns that are ${randomVariation}. 
          Each pattern must be COMPLETELY DIFFERENT from previous ones. Use creativity and musical knowledge.
          Return JSON with kick, bass, tom, snare, hihat, openhat, clap, crash arrays (16 boolean values each).
          Make patterns musically interesting with proper spacing, fills, and groove. Variation is KEY.`
        },
        {
          role: "user",
          content: `Create a fresh ${randomVariation} ${style} beat at ${bpm} BPM. 
          Unique session: ${timestamp}-${randomSeed}
          
          Requirements:
          - Must be different from generic patterns
          - Use creative drum placement
          - Consider syncopation and musical fills
          - Vary the kick and snare patterns
          - Make it ${randomVariation} in feel`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.95, // Very high temperature for maximum creativity
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    // Add fallback with randomization if JSON parsing fails
    if (!result.kick) {
      return generateRandomFallbackPattern(style, randomVariation);
    }
    
    return result;
  } catch (error) {
    console.error("AI generation failed, using randomized fallback:", error);
    return generateRandomFallbackPattern(style, "creative");
  }
}

function generateRandomFallbackPattern(style: string, variation: string): any {
  const patterns = {
    kick: Array(16).fill(false),
    bass: Array(16).fill(false),
    tom: Array(16).fill(false),
    snare: Array(16).fill(false),
    hihat: Array(16).fill(false),
    openhat: Array(16).fill(false),
    clap: Array(16).fill(false),
    crash: Array(16).fill(false)
  };
  
  // Generate truly random patterns with musical logic
  const kickProbability = Math.random() * 0.4 + 0.2; // 20-60% chance per step
  const snareProbability = Math.random() * 0.3 + 0.15; // 15-45% chance
  const hihatProbability = Math.random() * 0.6 + 0.3; // 30-90% chance
  
  for (let i = 0; i < 16; i++) {
    // Kick pattern - often on 1 and 9, sometimes others
    if (i === 0 || i === 8) patterns.kick[i] = Math.random() < 0.9;
    else patterns.kick[i] = Math.random() < kickProbability;
    
    // Bass drum - complement kick with lower probability
    patterns.bass[i] = Math.random() < (kickProbability * 0.3);
    
    // Snare - often on 4 and 12, sometimes others  
    if (i === 4 || i === 12) patterns.snare[i] = Math.random() < 0.8;
    else patterns.snare[i] = Math.random() < snareProbability;
    
    // Hi-hat - more frequent, create groove
    patterns.hihat[i] = Math.random() < hihatProbability;
    
    // Other elements - sparse and random
    patterns.tom[i] = Math.random() < 0.1;
    patterns.openhat[i] = Math.random() < 0.15;
    patterns.clap[i] = Math.random() < 0.12;
    patterns.crash[i] = i === 0 ? Math.random() < 0.3 : Math.random() < 0.05;
  }
  
  return {
    ...patterns,
    name: `${variation} ${style} Beat`,
    explanation: `Randomized ${variation} ${style} pattern with unique groove`
  };
}

export async function generateMelody(scale: string, style: string, complexity: number): Promise<any> {
  try {
    const response = await openai.chat.completions.create({
      model: "grok-2-1212",
      messages: [
        {
          role: "system",
          content: `You are a composer. Generate a melody in ${scale} scale with ${style} style. 
          Complexity level: ${complexity}/10. Return JSON with notes array containing: note, octave, duration, start.`
        },
        {
          role: "user",
          content: `Generate a ${style} melody in ${scale} scale with complexity ${complexity}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    throw new Error("Failed to generate melody: " + (error as Error).message);
  }
}

export async function scanCodeVulnerabilities(code: string, language: string): Promise<any> {
  try {
    const response = await openai.chat.completions.create({
      model: "grok-2-1212",
      messages: [
        {
          role: "system",
          content: `You are a security expert. Analyze this ${language} code for vulnerabilities. 
          Return JSON with: vulnerabilities array (each with type, severity, line, description, recommendation), 
          securityScore (0-100), summary.`
        },
        {
          role: "user",
          content: `Scan this ${language} code for security vulnerabilities:\n\n${code}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    throw new Error("Failed to scan vulnerabilities: " + (error as Error).message);
  }
}

export async function generateLyrics(theme: string, genre: string, mood: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "grok-2-1212",
      messages: [
        {
          role: "system",
          content: `You are a professional lyricist. Write ${genre} lyrics about ${theme} with a ${mood} mood. 
          Include verse, chorus, and bridge sections. Use appropriate rhyme schemes.`
        },
        {
          role: "user",
          content: `Write lyrics about ${theme} in ${genre} style with ${mood} mood`
        }
      ],
      temperature: 0.8,
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    throw new Error("Failed to generate lyrics: " + (error as Error).message);
  }
}

export async function getRhymeSuggestions(word: string): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "grok-2-1212",
      messages: [
        {
          role: "system",
          content: `You are a rhyme dictionary. Return JSON array of words that rhyme with the given word. 
          Include perfect rhymes and near rhymes.`
        },
        {
          role: "user",
          content: `Find rhyming words for: ${word}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.rhymes || [];
  } catch (error) {
    throw new Error("Failed to get rhyme suggestions: " + (error as Error).message);
  }
}

export async function codeToMusic(code: string, language: string): Promise<any> {
  try {
    const response = await openai.chat.completions.create({
      model: "grok-2-1212",
      messages: [
        {
          role: "system",
          content: `You are a code-to-music converter. Analyze this ${language} code and convert its structure to music. 
          Map: functions->melodies, loops->rhythms, variables->notes, conditionals->chord changes.
          Return JSON with: melody, rhythm, harmony, structure, instruments mapping.`
        },
        {
          role: "user",
          content: `Convert this ${language} code to music:\n\n${code}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.6,
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    throw new Error("Failed to convert code to music: " + (error as Error).message);
  }
}

export async function generateBeatFromLyrics(lyrics: string, genre: string): Promise<any> {
  try {
    const response = await openai.chat.completions.create({
      model: "grok-2-1212",
      messages: [
        {
          role: "system",
          content: `You are a music producer who analyzes lyrics to create matching beat patterns. 
          Analyze the lyrics for rhythm, flow, syllable density, and mood, then generate a 16-step drum pattern.
          Consider the genre: ${genre}. Return JSON with:
          - beatPattern: object with kick, snare, hihat, openhat arrays (16 boolean values each)
          - bpm: suggested tempo based on lyrical flow
          - analysis: rhythm analysis, flow type, and reasoning
          - suggestions: production tips for this lyrical style`
        },
        {
          role: "user",
          content: `Analyze these ${genre} lyrics and generate a matching beat pattern:\n\n${lyrics}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.6,
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    throw new Error("Failed to generate beat from lyrics: " + (error as Error).message);
  }
}

export async function chatAssistant(message: string, context: string = ""): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "grok-2-1212",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant for CodeTune Studio, helping with music production and code development. 
          You can help with beat making, melody composition, code translation, vulnerability scanning, and lyric writing.
          ${context ? `Context: ${context}` : ""}`
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.7,
    });

    return response.choices[0].message.content || "I'm sorry, I couldn't process that request.";
  } catch (error) {
    throw new Error("Failed to get AI response: " + (error as Error).message);
  }
}