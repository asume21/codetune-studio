import { useAudio } from "@/hooks/use-audio";
import { Button } from "@/components/ui/button";
import { Volume2 } from "lucide-react";

export function IOSAudioEnable() {
  const { isIOSDevice, needsIOSAudioEnable, enableIOSAudio } = useAudio();

  if (!isIOSDevice || !needsIOSAudioEnable) {
    return null;
  }

  return (
    <Button
      onClick={enableIOSAudio}
      className="audio-enable-button fixed top-4 right-4 z-50 bg-blue-600 hover:bg-blue-500 text-white shadow-lg"
      size="sm"
    >
      <Volume2 className="w-4 h-4 mr-2" />
      Enable Audio
    </Button>
  );
}