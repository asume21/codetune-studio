import OpenAI from "openai";

// Debug API key setup
const apiKey = process.env.XAI_API_KEY;
console.log("API Key Debug:", {
  exists: !!apiKey,
  length: apiKey?.length || 0,
  prefix: apiKey?.substring(0, 4) || 'none',
  format: apiKey?.startsWith('xai-') ? 'correct' : 'incorrect'
});

// Using xAI's Grok API as requested by the user instead of OpenAI
const openai = new OpenAI({ 
  baseURL: "https://api.x.ai/v1",
  apiKey: apiKey
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
    const response = await openai.chat.completions.create({
      model: "grok-2-1212",
      messages: [
        {
          role: "system",
          content: `You are a music producer. Generate a 16-step drum pattern for a ${style} beat at ${bpm} BPM. 
          Return JSON with tracks: kick, snare, hihat, openhat. Each track has 16 boolean values for steps.`
        },
        {
          role: "user",
          content: `Generate a ${style} beat pattern at ${bpm} BPM`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    throw new Error("Failed to generate beat pattern: " + (error as Error).message);
  }
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
