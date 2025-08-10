import { useState, useEffect, useCallback } from 'react';
import { useAudio } from './use-audio';

interface MIDIDevice {
  id: string;
  name: string;
  manufacturer: string;
  connection: string;
  state: string;
}

interface MIDINote {
  note: number;
  velocity: number;
  channel: number;
}

interface MIDISettings {
  inputDevice?: string;
  velocitySensitivity?: number[];
  channelMode?: string;
  activeChannel?: number;
  noteRange?: { min: number; max: number };
  sustainPedal?: boolean;
  pitchBend?: boolean;
  modulation?: boolean;
  autoConnect?: boolean;
}

export function useMIDI() {
  const [midiAccess, setMidiAccess] = useState<any | null>(null);
  const [connectedDevices, setConnectedDevices] = useState<MIDIDevice[]>([]);
  const [isSupported, setIsSupported] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lastNote, setLastNote] = useState<MIDINote | null>(null);
  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());
  const [settings, setSettings] = useState<MIDISettings>({
    inputDevice: 'all',
    velocitySensitivity: [100],
    channelMode: 'multi',
    activeChannel: 1,
    noteRange: { min: 21, max: 108 },
    sustainPedal: true,
    pitchBend: true,
    modulation: true,
    autoConnect: true
  });
  
  const { playNote } = useAudio();
  
  // Update settings
  const updateSettings = useCallback((newSettings: Partial<MIDISettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);
  
  // Refresh devices
  const refreshDevices = useCallback(() => {
    if (midiAccess) {
      console.log('🎹 Refreshing MIDI devices...');
      updateDeviceList(midiAccess);
    } else {
      console.log('🎹 MIDI not initialized. Attempting to initialize...');
      initializeMIDI();
    }
  }, [midiAccess, updateDeviceList, initializeMIDI]);
  
  // MIDI note number to note name conversion
  const noteNumberToName = useCallback((noteNumber: number) => {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(noteNumber / 12) - 1;
    const noteName = noteNames[noteNumber % 12];
    return { note: noteName, octave };
  }, []);
  
  // Initialize MIDI access
  const initializeMIDI = useCallback(async () => {
    if (!(navigator as any).requestMIDIAccess) {
      console.warn('Web MIDI API not supported in this browser');
      setIsSupported(false);
      return;
    }
    
    try {
      setIsSupported(true);
      const access = await (navigator as any).requestMIDIAccess();
      setMidiAccess(access);
      setIsConnected(true);
      
      console.log('🎹 MIDI access granted');
      console.log('🎹 Available MIDI inputs:', access.inputs.size);
      console.log('🎹 Available MIDI outputs:', access.outputs.size);
      
      // Listen for device connections/disconnections
      access.onstatechange = (event: any) => {
        console.log('MIDI device state changed:', event);
        updateDeviceList(access);
      };
      
      updateDeviceList(access);
      setupMIDIInputs(access);
      
    } catch (error) {
      console.error('Failed to initialize MIDI:', error);
      setIsSupported(false);
    }
  }, [updateDeviceList, setupMIDIInputs]);
  
  // Update connected devices list
  const updateDeviceList = useCallback((access: any) => {
    const devices: MIDIDevice[] = [];
    
    // Input devices
    for (const input of access.inputs.values()) {
      devices.push({
        id: input.id!,
        name: input.name || 'Unknown Input',
        manufacturer: input.manufacturer || 'Unknown',
        connection: input.connection!,
        state: input.state!
      });
    }
    
    // Output devices (for future use)
    for (const output of access.outputs.values()) {
      devices.push({
        id: output.id!,
        name: output.name || 'Unknown Output',
        manufacturer: output.manufacturer || 'Unknown',
        connection: output.connection!,
        state: output.state!
      });
    }
    
    setConnectedDevices(devices);
    console.log('🎹 Connected MIDI devices:', devices);
    if (devices.length === 0) {
      console.log('🎹 No MIDI devices found. Make sure your controller is:');
      console.log('   - Connected via USB or MIDI cable');
      console.log('   - Powered on and recognized by your system');
      console.log('   - Compatible with Web MIDI API');
    } else {
      devices.forEach(device => {
        console.log(`🎹 Found device: ${device.name} (${device.manufacturer}) - ${device.state}`);
      });
    }
  }, []);
  
  // Setup MIDI input listeners
  const setupMIDIInputs = useCallback((access: any) => {
    for (const input of access.inputs.values()) {
      input.onmidimessage = handleMIDIMessage;
      console.log(`Listening to MIDI input: ${input.name}`);
    }
  }, [handleMIDIMessage]);
  
  // Handle MIDI messages
  const handleMIDIMessage = useCallback((message: any) => {
    const [status, note, velocity] = message.data;
    const channel = status & 0x0F;
    const messageType = status & 0xF0;
    
    // Note On (0x90) or Note Off (0x80)
    if (messageType === 0x90 || messageType === 0x80) {
      const isNoteOn = messageType === 0x90 && velocity > 0;
      
      if (isNoteOn) {
        handleNoteOn(note, velocity, channel);
      } else {
        handleNoteOff(note, channel);
      }
    }
    
    // Control Change (0xB0) - for knobs, sliders, etc.
    else if (messageType === 0xB0) {
      console.log(`MIDI CC: Channel ${channel + 1}, Controller ${note}, Value ${velocity}`);
    }
    
    // Program Change (0xC0) - for preset switching
    else if (messageType === 0xC0) {
      console.log(`MIDI Program Change: Channel ${channel + 1}, Program ${note}`);
    }
  }, [handleNoteOn, handleNoteOff]);
  
  // Handle note on events
  const handleNoteOn = useCallback((midiNote: number, velocity: number, channel: number) => {
    const { note, octave } = noteNumberToName(midiNote);
    const normalizedVelocity = velocity / 127; // Convert 0-127 to 0-1
    
    setActiveNotes(prev => new Set(Array.from(prev).concat(midiNote)));
    setLastNote({ note: midiNote, velocity, channel });
    
    console.log(`🎹 MIDI Note On: ${note}${octave} (${midiNote}) vel:${velocity} ch:${channel + 1}`);
    
    // Play the note with current instrument
    const instrument = getMIDIChannelInstrument(channel);
    const duration = 2.0; // Sustained note duration
    
    playNote(note, octave, duration, instrument, normalizedVelocity, true);
  }, [noteNumberToName, playNote, getMIDIChannelInstrument]);
  
  // Handle note off events
  const handleNoteOff = useCallback((midiNote: number, channel: number) => {
    const { note, octave } = noteNumberToName(midiNote);
    
    setActiveNotes(prev => {
      const newSet = new Set(prev);
      newSet.delete(midiNote);
      return newSet;
    });
    
    console.log(`MIDI Note Off: ${note}${octave} (${midiNote}) ch:${channel + 1}`);
    
    // Note: For sustained instruments, you might want to implement note-off handling
    // This could involve stopping specific notes or reducing their volume
  }, [noteNumberToName]);
  
  // Map MIDI channels to instruments (customizable)
  const getMIDIChannelInstrument = useCallback((channel: number): string => {
    const channelMap: { [key: number]: string } = {
      0: 'piano-keyboard',    // Channel 1: Piano
      1: 'strings-guitar',    // Channel 2: Guitar
      2: 'bass-electric',     // Channel 3: Bass
      3: 'strings-violin',    // Channel 4: Violin
      4: 'flute-concert',     // Channel 5: Flute
      5: 'horns-trumpet',     // Channel 6: Trumpet
      6: 'piano-organ',       // Channel 7: Organ
      7: 'synth-analog',      // Channel 8: Synth
      9: 'kick',              // Channel 10: Drums (GM standard)
    };
    
    return channelMap[channel] || 'piano-keyboard';
  }, []);
  
  // Initialize on mount
  useEffect(() => {
    initializeMIDI();
  }, [initializeMIDI]);
  
  return {
    isSupported,
    isConnected,
    connectedDevices,
    lastNote,
    activeNotes,
    initializeMIDI,
    refreshDevices,
    settings,
    updateSettings
  };
}