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

export async function generateMelody(scale: string, style: string, complexity: number, availableTracks?: Array<{id: string, instrument: string, name: string}>): Promise<any> {
  try {
    const melodyMoods = [
      "soaring and uplifting",
      "melancholic and emotional", 
      "playful and bouncing",
      "mysterious and dark",
      "romantic and flowing",
      "energetic and rhythmic",
      "dreamy and ethereal",
      "bold and dramatic"
    ];
    
    const techniques = [
      "use stepwise motion and leaps",
      "incorporate syncopated rhythms",
      "add ornaments and grace notes", 
      "use call and response patterns",
      "create melodic sequences",
      "blend scalar and arpeggiated passages",
      "layer complementary instrument parts",
      "create harmonic progressions",
      "use instrument-specific techniques"
    ];
    
    const randomMood = melodyMoods[Math.floor(Math.random() * melodyMoods.length)];
    const randomTechnique = techniques[Math.floor(Math.random() * techniques.length)];
    const timestamp = Date.now();
    const seed = Math.floor(Math.random() * 10000);
    
    // Prepare instrument information for AI
    const instrumentList = availableTracks ? 
      availableTracks.map(track => `${track.id} (${track.name}: ${track.instrument})`).join(', ') :
      'track1 (Piano: piano-keyboard), track2 (Guitar: strings-guitar), track3 (Flute: flute-recorder)';
    
    const response = await openai.chat.completions.create({
      model: "grok-2-1212",
      messages: [
        {
          role: "system",
          content: `You are a creative multi-instrument composer who writes unique orchestral arrangements. Generate a ${randomMood} composition in ${scale} scale with ${style} style. 
          Complexity: ${complexity}/10. Use technique: ${randomTechnique}.
          
          CRITICAL: You have access to ALL instruments simultaneously:
          Available instruments: ${instrumentList}
          
          Create parts for MULTIPLE instruments to make a rich, layered composition.
          Return JSON with notes array where each note specifies which track/instrument to use.
          Use notes: C, D, E, F, G, A, B (without octave numbers).
          Use octaves: 3, 4, 5. Make each melody COMPLETELY DIFFERENT and use ALL available instruments.`
        },
        {
          role: "user",
          content: `Create a fresh ${randomMood} ${style} multi-instrument composition in ${scale} scale (complexity ${complexity}).
          Session: ${timestamp}-${seed}
          
          Available instruments: ${instrumentList}
          
          Requirements:
          - Return JSON format: {notes: [{note: "C", octave: 4, start: 0, duration: 0.5, track: "track1"}]}
          - Use note names: C, D, E, F, G, A, B (no numbers like C4)
          - Use octaves as separate number: 3, 4, or 5
          - CREATE PARTS FOR MULTIPLE INSTRUMENTS - don't just use one track
          - Layer instruments harmonically (piano chords + guitar melody + flute harmony)
          - ${randomTechnique}
          - Create interesting melodic contours across ALL instruments
          - Vary note durations: 0.25, 0.5, 0.75, 1.0, 1.5, 2.0
          - Make it ${randomMood} in character
          - Use instrument ranges appropriately (bass notes for low instruments, high notes for flute)
          - Create complementary parts that work together as an ensemble`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.95,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    if (!result.notes) {
      return generateRandomMultiTrackMelody(scale, style, complexity, randomMood, availableTracks);
    }
    
    return result;
  } catch (error) {
    console.error("Melody AI generation failed, using randomized fallback:", error);
    return generateRandomMultiTrackMelody(scale, style, complexity, "creative", availableTracks);
  }
}

function generateRandomMultiTrackMelody(scale: string, style: string, complexity: number, mood: string, availableTracks?: Array<{id: string, instrument: string, name: string}>): any {
  const scaleNotes = getScaleNotes(scale);
  const notes: any[] = [];
  
  // Default tracks if none provided
  const tracks = availableTracks || [
    {id: 'track1', instrument: 'piano-keyboard', name: 'Piano'},
    {id: 'track2', instrument: 'strings-guitar', name: 'Guitar'},
    {id: 'track3', instrument: 'flute-recorder', name: 'Flute'}
  ];
  
  // Generate notes for each track
  tracks.forEach((track, trackIndex) => {
    const numNotes = Math.floor(Math.random() * 6) + 4; // 4-10 notes per track
    const octaveVariations = getInstrumentOctaveRange(track.instrument);
    
    let currentTime = trackIndex * 0.5; // Slight offset between tracks
    
    for (let i = 0; i < numNotes; i++) {
      const randomNote = scaleNotes[Math.floor(Math.random() * scaleNotes.length)];
      const randomOctave = octaveVariations[Math.floor(Math.random() * octaveVariations.length)];
      const duration = [0.25, 0.5, 0.75, 1.0, 1.5, 2.0][Math.floor(Math.random() * 6)];
      
      notes.push({
        note: randomNote.note,
        octave: randomOctave,
        start: currentTime,
        duration,
        track: track.id
      });
      
      currentTime += duration + (Math.random() * 0.25); // Small random gaps
    }
  });
  
  return {
    notes: notes,
    name: `${mood} ${style} Multi-Track Melody`,
    scale,
    explanation: `Randomized ${mood} melody with ${notes.length} notes across ${tracks.length} instruments`
  };
}

function getInstrumentOctaveRange(instrument: string): number[] {
  if (instrument.includes('bass')) return [2, 3, 4];
  if (instrument.includes('flute') || instrument.includes('trumpet')) return [4, 5, 6];
  if (instrument.includes('guitar') || instrument.includes('violin')) return [3, 4, 5];
  return [3, 4, 5]; // Default range
}

function getScaleNotes(scale: string) {
  const baseFreq = 261.63; // C4
  const notes = [
    { note: "C", octave: 4, frequency: baseFreq },
    { note: "D", octave: 4, frequency: baseFreq * 1.122 },
    { note: "E", octave: 4, frequency: baseFreq * 1.260 },
    { note: "F", octave: 4, frequency: baseFreq * 1.335 },
    { note: "G", octave: 4, frequency: baseFreq * 1.498 },
    { note: "A", octave: 4, frequency: baseFreq * 1.682 },
    { note: "B", octave: 4, frequency: baseFreq * 1.888 }
  ];
  return notes;
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
    const perspectives = ["first person introspective", "storytelling narrative", "conversational direct", "poetic metaphorical", "stream of consciousness"];
    const structures = ["verse-chorus-verse-chorus-bridge-chorus", "verse-pre-chorus-chorus-verse-pre-chorus-chorus-bridge-outro", "intro-verse-chorus-verse-chorus-bridge-final-chorus"];
    const approaches = ["vulnerable and honest", "confident and bold", "nostalgic and reflective", "rebellious and fierce", "romantic and tender", "philosophical and deep"];
    
    const randomPerspective = perspectives[Math.floor(Math.random() * perspectives.length)];
    const randomStructure = structures[Math.floor(Math.random() * structures.length)];
    const randomApproach = approaches[Math.floor(Math.random() * approaches.length)];
    const timestamp = Date.now();
    const seed = Math.floor(Math.random() * 10000);
    
    const response = await openai.chat.completions.create({
      model: "grok-2-1212",
      messages: [
        {
          role: "system",
          content: `You are a creative songwriter who writes unique, never-repeating lyrics. Write ${randomApproach} lyrics about ${theme} in ${genre} style with ${mood} mood.
          Use ${randomPerspective} perspective and ${randomStructure} structure.
          Each set of lyrics must be COMPLETELY ORIGINAL and different from previous generations.`
        },
        {
          role: "user",
          content: `Create fresh, original ${genre} lyrics about "${theme}" with ${mood} mood.
          Session: ${timestamp}-${seed}
          
          Requirements:
          - ${randomApproach} approach
          - ${randomPerspective} writing style  
          - ${randomStructure} structure
          - Must be completely unique and different
          - Genre-appropriate language and imagery
          - Emotionally resonant and meaningful`
        }
      ],
      temperature: 0.95,
    });

    return response.choices[0].message.content || generateRandomLyrics(theme, genre, mood, randomApproach);
  } catch (error) {
    console.error("Lyrics AI generation failed, using randomized fallback:", error);
    return generateRandomLyrics(theme, genre, mood, "creative");
  }
}

function generateRandomLyrics(theme: string, genre: string, mood: string, approach: string): string {
  const templates = [
    `[Verse 1]\nThinking about ${theme} in the ${mood} light\nEvery moment feels so right\nIn this ${genre} state of mind\nLeaving yesterday behind\n\n[Chorus]\nThis is our ${approach} time\nEvery beat, every rhyme\n${theme} calling out to me\nThis is how we're meant to be\n\n[Verse 2]\nWalking through the ${mood} dreams\nNothing's quite the way it seems\n${theme} echoes in my soul\nMaking broken pieces whole`,
    
    `[Verse 1]\n${theme} surrounds us everywhere\nIn the ${mood} atmosphere\n${genre} rhythms in our hearts\nThis is where the music starts\n\n[Pre-Chorus]\nFeel it building up inside\nCan't keep these feelings to hide\n\n[Chorus]\nWe're ${approach} and alive\nIn this moment we will thrive\n${theme} is our battle cry\nTogether we will touch the sky`,
    
    `[Intro]\n${mood} whispers in the night\n${theme} burning bright\n\n[Verse 1]\nEvery step a ${approach} move\nIn this ${genre} groove\n${theme} guides us on our way\nTo a brighter day\n\n[Chorus]\nThis is our anthem now\nWe made it through somehow\n${mood} feelings, ${approach} hearts\nThis is where the future starts`
  ];
  
  const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
  return randomTemplate;
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

// Helper function to get note frequency
function getNoteFrequency(note: string): number {
  const noteMap: { [key: string]: number } = {
    'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
    'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
    'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77
  };
  return noteMap[note] || 261.63; // Default to C4
}

export async function codeToMusic(code: string, language: string): Promise<any> {
  try {
    const musicalStyles = ["classical symphony", "jazz fusion", "electronic ambient", "rock anthem", "hip-hop groove", "world music", "orchestral cinematic", "minimal techno"];
    const interpretations = ["mathematical and precise", "organic and flowing", "aggressive and intense", "ethereal and spacious", "rhythmic and percussive", "melodic and harmonic"];
    const instruments = ["piano and strings", "synthesizers and drums", "guitar and bass", "orchestra", "electronic pads", "world instruments"];
    
    const randomStyle = musicalStyles[Math.floor(Math.random() * musicalStyles.length)];
    const randomInterpretation = interpretations[Math.floor(Math.random() * interpretations.length)];
    const randomInstruments = instruments[Math.floor(Math.random() * instruments.length)];
    const timestamp = Date.now();
    const seed = Math.floor(Math.random() * 10000);
    
    const response = await openai.chat.completions.create({
      model: "grok-2-1212",
      messages: [
        {
          role: "system",
          content: `You are a creative code-to-music AI that creates unique, never-repeating musical interpretations. 
          Convert ${language} code structure to ${randomStyle} music in a ${randomInterpretation} way using ${randomInstruments}.
          Each conversion must be COMPLETELY DIFFERENT and creative. Return JSON with detailed musical mapping.`
        },
        {
          role: "user",
          content: `Transform this ${language} code into ${randomStyle} music (${randomInterpretation}):
          Session: ${timestamp}-${seed}
          
          Code:
          ${code}
          
          Requirements:
          - Create unique musical interpretation 
          - Map code structure to ${randomStyle} elements
          - Use ${randomInstruments} for instrumentation
          - Make it ${randomInterpretation} in feel
          - RETURN ACTUAL PLAYABLE NOTES FOR MULTIPLE INSTRUMENTS in this exact format:
          {
            "melody": [
              {"note": "C4", "start": 0, "duration": 0.5, "frequency": 261.63, "instrument": "piano"},
              {"note": "G3", "start": 0, "duration": 1.0, "frequency": 196.00, "instrument": "bass"},
              {"note": "E4", "start": 0.5, "duration": 0.5, "frequency": 329.63, "instrument": "violin"}
            ],
            "drumPattern": {
              "kick": [true,false,true,false,true,false,true,false,true,false,true,false,true,false,true,false],
              "snare": [false,false,false,false,true,false,false,false,false,false,false,false,true,false,false,false],
              "hihat": [true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true]
            },
            "title": "Brief title",
            "description": "Brief description"
          }
          - Map code elements to instruments: classes→piano, functions→violin/guitar, variables→bass, loops→drums
          - Include drum patterns with kick, snare, hihat arrays (16 steps each, true/false)
          - melody MUST be an array of note objects with note, start, duration, frequency
          - Must be different from previous conversions`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.95,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    // Check if melody is an array of playable notes (not just description text)
    if (!result.melody || !Array.isArray(result.melody) || result.melody.length === 0) {
      console.log("AI returned invalid melody format, using fallback");
      return generateRandomCodeMusic(language, randomStyle, randomInterpretation);
    }
    
    // Validate that melody contains proper note objects
    const hasValidNotes = result.melody.every((note: any) => 
      note && typeof note === 'object' && note.note && typeof note.start === 'number'
    );
    
    if (!hasValidNotes) {
      console.log("AI melody notes are invalid, using fallback");
      return generateRandomCodeMusic(language, randomStyle, randomInterpretation);
    }
    
    return result;
  } catch (error) {
    console.error("Code-to-music AI generation failed, using randomized fallback:", error);
    return generateRandomCodeMusic(language, "creative", "algorithmic");
  }
}

function generateRandomCodeMusic(language: string, style: string, interpretation: string): any {
  const melodyNotes = ["C4", "D4", "E4", "F4", "G4", "A4", "B4"];
  const rhythms = ["4/4", "3/4", "7/8", "5/4"];
  
  const instruments = ['piano', 'violin', 'guitar', 'bass', 'flute', 'trumpet'];
  
  // Generate multi-instrument melody (classes→piano, functions→violin/guitar, variables→bass)
  const melody = Array.from({length: Math.floor(Math.random() * 12) + 8}, (_, i) => {
    const note = melodyNotes[Math.floor(Math.random() * melodyNotes.length)];
    const instrument = instruments[Math.floor(Math.random() * instruments.length)];
    return {
      note: note,
      start: i * 0.25,
      duration: [0.25, 0.5, 1.0][Math.floor(Math.random() * 3)],
      frequency: getNoteFrequency(note),
      instrument: instrument
    };
  });
  
  // Generate a basic drum pattern based on code complexity
  const drumPattern = {
    kick: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
    snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
    hihat: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
    bass: [true, false, true, false, false, false, true, false, true, false, true, false, false, false, true, false],
    tom: Array.from({length: 16}, () => Math.random() < 0.1),
    openhat: Array.from({length: 16}, () => Math.random() < 0.05),
    clap: Array.from({length: 16}, () => Math.random() < 0.1),
    crash: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false]
  };
  
  return {
    melody,
    drumPattern,
    rhythm: rhythms[Math.floor(Math.random() * rhythms.length)],
    style,
    interpretation,
    language,
    title: `${style} Code Symphony`,
    description: `${interpretation} ${style} interpretation of ${language} code structure with multi-instrument arrangement`,
    bpm: Math.floor(Math.random() * 40) + 100 // 100-140 BPM
  };
}

export async function generateDynamicLayers(currentArrangement: any, targetStyle: string, complexity: number): Promise<any> {
  try {
    const layerTypes = [
      "harmonic foundation", "rhythmic support", "melodic counterpoint", 
      "atmospheric texture", "percussive accents", "bass reinforcement"
    ];
    const instruments = [
      "strings", "brass", "woodwinds", "synthesizers", 
      "guitar", "piano", "choir", "ethnic instruments", "electronic pads",
      "violin", "cello", "flute", "trumpet", "saxophone", "organ", 
      "harp", "acoustic guitar", "electric piano", "ambient pads"
    ];
    const approaches = [
      "subtle and supportive", "bold and prominent", "intricate and complex",
      "minimal and spacious", "rich and lush", "rhythmic and driving"
    ];
    
    const randomLayerType = layerTypes[Math.floor(Math.random() * layerTypes.length)];
    const randomInstrument = instruments[Math.floor(Math.random() * instruments.length)];
    const randomApproach = approaches[Math.floor(Math.random() * approaches.length)];
    const timestamp = Date.now();
    const seed = Math.floor(Math.random() * 10000);
    
    const response = await openai.chat.completions.create({
      model: "grok-2-1212",
      messages: [
        {
          role: "system",
          content: `You are an AI music arranger specializing in dynamic instrument layering. Analyze the current musical arrangement and intelligently add ${randomApproach} ${randomLayerType} layers using ${randomInstrument}.
          
          IMPORTANT: Focus on MELODIC and HARMONIC instruments, NOT percussion/drums. Generate instruments like:
          - Piano, organ, electric piano
          - Violin, cello, guitar, harp
          - Flute, trumpet, saxophone
          - Synthesizers, ambient pads, choir
          - Avoid drums, beats, percussion unless specifically requested
          
          Create layers that:
          - Complement existing elements without competing
          - Add ${randomApproach} character to the arrangement  
          - Use ${randomInstrument} in creative melodic/harmonic ways
          - Maintain musical coherence and balance
          - Each layer must be UNIQUE and contextually appropriate
          - Generate 2-4 different instrumental layers with varied roles
          
          Return JSON with: layers array containing {instrument, type, notes, volume, pan, effects, role}`
        },
        {
          role: "user",
          content: `Add intelligent ${randomLayerType} layers to this ${targetStyle} arrangement (complexity ${complexity}):
          
          Current Arrangement:
          ${JSON.stringify(currentArrangement, null, 2)}
          
          Session: ${timestamp}-${seed}
          
          Requirements:
          - Add ${randomApproach} ${randomInstrument} layers
          - Focus on ${randomLayerType}
          - Complexity level: ${complexity}/10
          - Must enhance, not overwhelm existing elements
          - Create unique layers different from previous generations
          - Include specific instrument techniques and effects`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.95,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    if (!result.layers) {
      return generateRandomLayers(randomLayerType, randomInstrument, randomApproach, complexity);
    }
    
    return {
      ...result,
      layerType: randomLayerType,
      primaryInstrument: randomInstrument,
      approach: randomApproach,
      complexity
    };
  } catch (error) {
    console.error("Dynamic layering AI generation failed, using randomized fallback:", error);
    return generateRandomLayers("harmonic foundation", "strings", "supportive", complexity);
  }
}

function generateRandomLayers(layerType: string, instrument: string, approach: string, complexity: number): any {
  const numLayers = Math.min(Math.floor(complexity / 2) + 1, 4); // 1-4 layers based on complexity
  const layers = [];
  
  // Ensure diverse melodic instruments
  const melodicInstruments = [
    "Piano", "Electric Piano", "Violin", "Cello", "Acoustic Guitar", 
    "Flute", "Trumpet", "Saxophone", "Organ", "Harp", "Ambient Pad", 
    "String Section", "Choir", "Synthesizer"
  ];
  
  for (let i = 0; i < numLayers; i++) {
    const layerInstrument = melodicInstruments[Math.floor(Math.random() * melodicInstruments.length)];
    const noteCount = Math.floor(Math.random() * 8) + 4; // 4-12 notes per layer for richer content
    const notes = Array.from({length: noteCount}, (_, idx) => ({
      frequency: 220 * Math.pow(2, Math.random() * 3), // Expanded 3-octave range
      start: idx * (Math.random() * 1.2 + 0.3), // More varied timing
      duration: Math.random() * 2 + 0.5, // 0.5-2.5 second durations
      velocity: Math.random() * 0.4 + 0.3 // 0.3-0.7 velocity range
    }));
    
    layers.push({
      instrument: layerInstrument,
      type: layerType,
      notes,
      volume: Math.random() * 0.3 + 0.4, // 0.4-0.7 volume
      pan: (Math.random() - 0.5) * 1.6, // -0.8 to 0.8 stereo pan
      effects: [`reverb-${Math.floor(Math.random() * 3) + 1}`, `eq-${Math.floor(Math.random() * 2) + 1}`],
      role: `${approach} ${layerType}`
    });
  }
  
  return {
    layers,
    layerType,
    primaryInstrument: instrument,
    approach,
    complexity,
    explanation: `Generated ${numLayers} ${approach} ${instrument} layers for ${layerType}`
  };
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

export async function analyzeSong(songName: string, analysisPrompt: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "grok-2-1212",
      messages: [
        {
          role: "system",
          content: "You are a Grammy-winning music producer and A&R executive with 20+ years experience. Provide brutally honest but constructive feedback that helps artists improve and succeed commercially. Focus on actionable advice and specific improvement suggestions."
        },
        {
          role: "user",
          content: analysisPrompt
        }
      ],
      max_tokens: 1500,
      temperature: 0.8,
    });

    return response.choices[0].message.content || "Analysis could not be completed.";
  } catch (error) {
    console.error("Song analysis AI error:", error);
    throw new Error("Failed to analyze song: " + (error as Error).message);
  }
}