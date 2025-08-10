import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAudio } from "@/hooks/use-audio";

interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "ai",
      content: "Hello! I'm your AI assistant for CodedSwitch Studio. I can help you with:\n• Code translation and optimization\n• Music composition suggestions\n• Beat pattern generation\n• Vulnerability scanning insights\n• Lyric writing assistance\n• Song analysis and insights\n\nHow can I help you today?",
      timestamp: new Date(Date.now() - 120000),
    },
  ]);

  // Listen for external messages (like from song analysis)
  useEffect(() => {
    const handleAddMessage = (event: CustomEvent) => {
      const aiMessage: Message = {
        id: Date.now().toString(),
        type: "ai",
        content: event.detail.content,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
    };

    window.addEventListener('addAIMessage', handleAddMessage as EventListener);
    return () => window.removeEventListener('addAIMessage', handleAddMessage as EventListener);
  }, []);
  const [inputMessage, setInputMessage] = useState("");

  const { toast } = useToast();
  const { initialize, isInitialized } = useAudio();

  const chatMutation = useMutation({
    mutationFn: async (data: { message: string; context?: string }) => {
      const response = await apiRequest("POST", "/api/assistant/chat", data);
      return response.json();
    },
    onSuccess: (data) => {
      const aiMessage: Message = {
        id: Date.now().toString(),
        type: "ai",
        content: data.response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
    },
    onError: () => {
      toast({
        title: "Failed to Send Message",
        description: "Unable to get AI response. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    chatMutation.mutate({
      message: inputMessage,
      context: "CodeTune Studio",
    });

    setInputMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = [
    { icon: "fas fa-magic", label: "Generate Beat Pattern", action: "Generate a hip-hop beat pattern for me" },
    { icon: "fas fa-code", label: "Optimize My Code", action: "Help me optimize this JavaScript code for better performance" },
    { icon: "fas fa-music", label: "Compose Melody", action: "Compose a melody in C major scale" },
    { icon: "fas fa-shield-alt", label: "Security Analysis", action: "Analyze my code for security vulnerabilities" },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-gray-600">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-heading font-bold">AI Music & Code Assistant</h2>
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => {
                initialize();
                toast({ title: "Audio Initialized", description: "The audio engine has started." });
              }}
              className="bg-studio-accent hover:bg-blue-500"
              disabled={isInitialized}
            >
              <i className="fas fa-power-off mr-2"></i>
              {isInitialized ? 'Audio Ready' : 'Start Audio'}
            </Button>
            <Button
              onClick={() => {
                if (isInitialized) {
                  toast({ title: "Playing", description: "Starting AI generated content playback." });
                } else {
                  toast({ title: "Audio Not Ready", description: "Please start audio first.", variant: "destructive" });
                }
              }}
              className="bg-studio-success hover:bg-green-500"
            >
              <i className="fas fa-play mr-2"></i>
              Play
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-6">
        <div className="flex flex-col space-y-6">
          {/* Chat Interface */}
          <div className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 bg-studio-panel border border-gray-600 rounded-lg p-4 mb-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex space-x-3 ${message.type === "user" ? "justify-end" : ""}`}>
                    {message.type === "ai" && (
                      <div className="w-8 h-8 bg-gradient-to-br from-studio-accent to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-robot text-white text-sm"></i>
                      </div>
                    )}

                    <div className={`flex-1 ${message.type === "user" ? "max-w-md" : ""}`}>
                      <div className={`rounded-lg p-3 ${
                        message.type === "user"
                          ? "bg-studio-accent text-white"
                          : "bg-gray-700"
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                      <div className={`text-xs text-gray-400 mt-1 ${message.type === "user" ? "text-right" : ""}`}>
                        {message.type === "ai" ? "AI Assistant" : "You"} • {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>

                    {message.type === "user" && (
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-white">CT</span>
                      </div>
                    )}
                  </div>
                ))}

                {chatMutation.isPending && (
                  <div className="flex space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-studio-accent to-blue-500 rounded-full flex items-center justify-center">
                      <i className="fas fa-robot text-white text-sm"></i>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="flex space-x-3">
              <div className="flex-1 relative">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask me anything about music production or coding..."
                  className="bg-studio-panel border-gray-600 pr-12"
                  disabled={chatMutation.isPending}
                />
                <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-studio-accent">
                  <i className="fas fa-microphone"></i>
                </button>
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={chatMutation.isPending || !inputMessage.trim()}
                className="bg-studio-accent hover:bg-blue-500"
              >
                <i className="fas fa-paper-plane"></i>
              </Button>
            </div>
          </div>

          {/* Quick Actions & Suggestions */}
          <div className="w-80 space-y-4">
            <div className="bg-studio-panel border border-gray-600 rounded-lg p-4">
              <h3 className="font-medium mb-3">Quick Actions</h3>
              <div className="space-y-2">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setInputMessage(action.action);
                      // Auto-send the message
                      setTimeout(() => handleSendMessage(), 100);
                    }}
                    className="w-full bg-gray-700 hover:bg-gray-600 p-3 rounded-lg text-sm text-left transition-colors"
                  >
                    <i className={`${action.icon} mr-2 text-studio-accent`}></i>
                    {action.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-studio-panel border border-gray-600 rounded-lg p-4">
              <h3 className="font-medium mb-3">Recent Suggestions</h3>
              <div className="space-y-3 text-sm">
                <div className="p-2 bg-gray-700 rounded">
                  <div className="font-medium text-studio-accent">Jazz Chord Progression</div>
                  <div className="text-gray-400">Cmaj7 - Am7 - Dm7 - G7</div>
                </div>
                <div className="p-2 bg-gray-700 rounded">
                  <div className="font-medium text-studio-accent">Code Refactor</div>
                  <div className="text-gray-400">Use array.map() instead of for loop</div>
                </div>
                <div className="p-2 bg-gray-700 rounded">
                  <div className="font-medium text-studio-accent">Drum Fill</div>
                  <div className="text-gray-400">32nd note snare roll at bar end</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}