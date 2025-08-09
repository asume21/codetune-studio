import { useState } from 'react';
import { useMIDI } from '@/hooks/use-midi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export function MIDIController() {
  const { 
    isSupported, 
    isConnected, 
    connectedDevices, 
    lastNote, 
    activeNotes,
    initializeMIDI 
  } = useMIDI();
  
  const [showDetails, setShowDetails] = useState(false);
  
  if (!isSupported) {
    return (
      <Card className="bg-studio-panel border-gray-600">
        <CardHeader>
          <CardTitle className="text-gray-200 flex items-center">
            <i className="fas fa-keyboard mr-2"></i>
            MIDI Controller
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <i className="fas fa-exclamation-triangle text-yellow-500 text-2xl mb-2"></i>
            <p className="text-gray-400 mb-3">
              Web MIDI API not supported in this browser
            </p>
            <p className="text-sm text-gray-500">
              Try using Chrome, Edge, or Opera for MIDI support
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="bg-studio-panel border-gray-600">
      <CardHeader>
        <CardTitle className="text-gray-200 flex items-center justify-between">
          <div className="flex items-center">
            <i className="fas fa-keyboard mr-2"></i>
            MIDI Controller
            {isConnected && (
              <Badge variant="secondary" className="ml-2 bg-green-600 text-white">
                Connected
              </Badge>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Hide' : 'Show'} Details
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-300">Status:</span>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm">
              {isConnected ? 'Ready for MIDI input' : 'Not connected'}
            </span>
          </div>
        </div>
        
        {!isConnected && (
          <Button onClick={initializeMIDI} className="w-full">
            <i className="fas fa-plug mr-2"></i>
            Connect MIDI Devices
          </Button>
        )}
        
        {/* Connected Devices */}
        {connectedDevices.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">
              Connected Devices ({connectedDevices.length})
            </h4>
            <ScrollArea className="h-24">
              <div className="space-y-1">
                {connectedDevices.map((device) => (
                  <div 
                    key={device.id} 
                    className="flex items-center justify-between p-2 bg-gray-800 rounded text-xs"
                  >
                    <div>
                      <div className="font-medium text-gray-200">{device.name}</div>
                      <div className="text-gray-400">{device.manufacturer}</div>
                    </div>
                    <Badge 
                      variant={device.state === 'connected' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {device.state}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
        
        {/* Real-time Activity */}
        {isConnected && (
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">Activity</h4>
            
            {/* Active Notes */}
            {activeNotes.size > 0 && (
              <div className="mb-2">
                <div className="text-xs text-gray-400 mb-1">Playing Notes:</div>
                <div className="flex flex-wrap gap-1">
                  {[...activeNotes].map((note) => (
                    <Badge key={note} variant="default" className="bg-studio-accent text-xs">
                      {note}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {/* Last Note Info */}
            {lastNote && (
              <div className="p-2 bg-gray-800 rounded text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Last Note:</span>
                  <span className="text-gray-200">
                    Note {lastNote.note} • Ch {lastNote.channel + 1} • Vel {lastNote.velocity}
                  </span>
                </div>
              </div>
            )}
            
            {activeNotes.size === 0 && !lastNote && (
              <div className="text-center py-3 text-gray-500 text-sm">
                <i className="fas fa-music mb-1"></i>
                <div>Play your MIDI controller to see activity</div>
              </div>
            )}
          </div>
        )}
        
        {/* Channel Mapping Info */}
        {showDetails && isConnected && (
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">Channel Mapping</h4>
            <ScrollArea className="h-32">
              <div className="space-y-1 text-xs">
                {[
                  { ch: 1, instrument: 'Piano' },
                  { ch: 2, instrument: 'Guitar' },
                  { ch: 3, instrument: 'Bass' },
                  { ch: 4, instrument: 'Violin' },
                  { ch: 5, instrument: 'Flute' },
                  { ch: 6, instrument: 'Trumpet' },
                  { ch: 7, instrument: 'Organ' },
                  { ch: 8, instrument: 'Synth' },
                  { ch: 10, instrument: 'Drums' },
                ].map((mapping) => (
                  <div key={mapping.ch} className="flex justify-between p-1 bg-gray-800 rounded">
                    <span className="text-gray-400">Channel {mapping.ch}:</span>
                    <span className="text-gray-200">{mapping.instrument}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="mt-2 text-xs text-gray-500">
              Set your MIDI controller to different channels to play different instruments
            </div>
          </div>
        )}
        
        {/* Instructions */}
        <div className="text-xs text-gray-500 space-y-1">
          <div>🎹 Connect your MIDI keyboard or pad controller</div>
          <div>🎵 Play notes to trigger CodedSwitch instruments</div>
          <div>📻 Use different MIDI channels for different instruments</div>
          {isConnected && <div>✅ Your controller is ready to play!</div>}
        </div>
      </CardContent>
    </Card>
  );
}