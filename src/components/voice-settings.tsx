
"use client";

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface VoiceSettingsProps {
  availableVoices: SpeechSynthesisVoice[];
  selectedVoiceURI: string;
  onVoiceChange: (voiceURI: string) => void;
  playbackSpeed: string;
  onPlaybackSpeedChange: (speed: string) => void;
  idPrefix?: string; // Optional prefix for unique IDs if component is used multiple times
}

const VoiceSettings = ({
  availableVoices,
  selectedVoiceURI,
  onVoiceChange,
  playbackSpeed,
  onPlaybackSpeedChange,
  idPrefix = "voice-settings"
}: VoiceSettingsProps) => {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor={`${idPrefix}-voice-select`} className="text-sm font-medium mb-1.5 block text-foreground/90">
          Narrator Voice
        </Label>
        <Select value={selectedVoiceURI} onValueChange={onVoiceChange} disabled={availableVoices.length === 0}>
          <SelectTrigger id={`${idPrefix}-voice-select`} className="w-full bg-input border-border focus:ring-primary text-sm input-glow-focus">
            <SelectValue placeholder="Select a voice" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            {availableVoices.length > 0 ? (
              availableVoices.map((voice) => (
                <SelectItem key={voice.voiceURI} value={voice.voiceURI}>
                  {voice.name} ({voice.lang})
                </SelectItem>
              ))
            ) : (
              <SelectItem value="loading" disabled>Loading voices...</SelectItem>
            )}
          </SelectContent>
        </Select>
         {availableVoices.length === 0 && <p className="text-xs text-muted-foreground mt-1">No voices available or still loading.</p>}
      </div>

      <div>
        <Label htmlFor={`${idPrefix}-speed-select`} className="text-sm font-medium mb-1.5 block text-foreground/90">
          Playback Speed
        </Label>
        <Select value={playbackSpeed} onValueChange={onPlaybackSpeedChange}>
          <SelectTrigger id={`${idPrefix}-speed-select`} className="w-full bg-input border-border focus:ring-primary text-sm input-glow-focus">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="0.5">0.5x</SelectItem>
            <SelectItem value="0.75">0.75x</SelectItem>
            <SelectItem value="1.0">1.0x (Normal)</SelectItem>
            <SelectItem value="1.25">1.25x</SelectItem>
            <SelectItem value="1.5">1.5x</SelectItem>
            <SelectItem value="1.75">1.75x</SelectItem>
            <SelectItem value="2.0">2.0x</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default VoiceSettings;
