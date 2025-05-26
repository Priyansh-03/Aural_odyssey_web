
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { Settings, Save } from 'lucide-react';

const LOCAL_STORAGE_KEYS = {
  DEFAULT_VOICE_URI: 'auralOdyssey_defaultVoiceURI',
  DEFAULT_PLAYBACK_SPEED: 'auralOdyssey_defaultPlaybackSpeed',
};

export function SettingsSection() {
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [defaultVoiceURI, setDefaultVoiceURI] = useState<string>('');
  const [defaultPlaybackSpeed, setDefaultPlaybackSpeed] = useState<string>('1.0');
  const { toast } = useToast();

  useEffect(() => {
    const loadPersistedSettings = () => {
      const savedVoiceURI = localStorage.getItem(LOCAL_STORAGE_KEYS.DEFAULT_VOICE_URI);
      if (savedVoiceURI) setDefaultVoiceURI(savedVoiceURI);

      const savedSpeed = localStorage.getItem(LOCAL_STORAGE_KEYS.DEFAULT_PLAYBACK_SPEED);
      if (savedSpeed) setDefaultPlaybackSpeed(savedSpeed);
    };

    const updateVoiceList = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const systemVoices = speechSynthesis.getVoices();
        if (systemVoices.length > 0) {
          setAvailableVoices(systemVoices);
          
          setDefaultVoiceURI(currentSetVoiceURI => {
            // Prioritize already set/saved voice if valid
            if (currentSetVoiceURI && systemVoices.some(v => v.voiceURI === currentSetVoiceURI)) {
              return currentSetVoiceURI;
            }
            // Try to find a Hindi voice
            const hindiVoice = systemVoices.find(v => v.lang.toLowerCase().startsWith('hi'));
            if (hindiVoice) return hindiVoice.voiceURI;

            // Fallback to English voices or first available
            const enUS = systemVoices.find(v => v.lang === 'en-US' || v.lang.startsWith('en-US-'));
            if (enUS) return enUS.voiceURI;
            const enGB = systemVoices.find(v => v.lang === 'en-GB' || v.lang.startsWith('en-GB-'));
            if (enGB) return enGB.voiceURI;
            return systemVoices[0]?.voiceURI || '';
          });
        }
      }
    };
    
    loadPersistedSettings();
    updateVoiceList(); // Initial call

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      speechSynthesis.onvoiceschanged = updateVoiceList; // Update if voices change
    }

    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const handleSaveSettings = () => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.DEFAULT_VOICE_URI, defaultVoiceURI);
    localStorage.setItem(LOCAL_STORAGE_KEYS.DEFAULT_PLAYBACK_SPEED, defaultPlaybackSpeed);
    toast({
      title: "Settings Saved",
      description: "Your default voice and speed preferences have been updated.",
    });
  };

  return (
    <div className="space-y-8 h-full flex flex-col">
      <div className="mb-2 md:mb-4">
        <h2 className="text-3xl md:text-4xl font-bold font-serif text-gradient">App Settings</h2>
        <p className="text-md text-muted-foreground mt-1">Manage your global application preferences.</p>
      </div>

      <Card className="w-full shadow-xl rounded-xl glass-effect flex-grow">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl md:text-2xl font-semibold font-serif">
            <Settings className="h-7 w-7 text-primary" />
            Narration Defaults
          </CardTitle>
          <CardDescription className="text-muted-foreground pt-1">
            Set your preferred default voice and playback speed for text-to-speech features. Hindi voices will be prioritized if available.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="default-voice-select" className="font-medium text-foreground/90">Default Narrator Voice</Label>
            <Select value={defaultVoiceURI} onValueChange={setDefaultVoiceURI} disabled={availableVoices.length === 0}>
              <SelectTrigger id="default-voice-select" className="w-full bg-input border-border focus:ring-primary text-sm input-glow-focus">
                <SelectValue placeholder="Select a default voice" />
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
            {availableVoices.length === 0 && <p className="text-xs text-muted-foreground mt-1">No voices available or still loading. Ensure your browser supports speech synthesis.</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="default-speed-select" className="font-medium text-foreground/90">Default Playback Speed</Label>
            <Select value={defaultPlaybackSpeed} onValueChange={setDefaultPlaybackSpeed}>
              <SelectTrigger id="default-speed-select" className="w-full bg-input border-border focus:ring-primary text-sm input-glow-focus">
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
          
          <Button onClick={handleSaveSettings} className="w-full sm:w-auto min-w-[180px] primary-glow-button rounded-lg text-base py-3">
            <Save className="mr-2 h-5 w-5" />
            Save Preferences
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
