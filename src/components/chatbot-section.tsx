
"use client";

import React, { useState, useRef, useEffect, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Send, User, RefreshCw, AlertCircle, Mic, SlidersHorizontal, MicOff, Volume2, VolumeX } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { chatWithBot, type ChatbotInput } from '@/ai/flows/chatbot-flow';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import VoiceSettings from './voice-settings';

const LOCAL_STORAGE_KEYS = {
  DEFAULT_VOICE_URI: 'auralOdyssey_defaultVoiceURI',
  DEFAULT_PLAYBACK_SPEED: 'auralOdyssey_defaultPlaybackSpeed',
};

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp?: string;
}

interface CustomSpeechRecognition extends SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
}

const BrowserSpeechRecognition =
  (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)) as { new(): CustomSpeechRecognition } | undefined;


export function ChatbotSection() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [sttSupported, setSttSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const speechRecognitionRef = useRef<CustomSpeechRecognition | null>(null);

  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');
  const [playbackSpeed, setPlaybackSpeed] = useState<string>('1.0');
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [currentlySpeakingMessageId, setCurrentlySpeakingMessageId] = useState<string | null>(null);


  useEffect(() => {
    let initialVoiceURI = localStorage.getItem(LOCAL_STORAGE_KEYS.DEFAULT_VOICE_URI) || '';
    let initialPlaybackSpeed = localStorage.getItem(LOCAL_STORAGE_KEYS.DEFAULT_PLAYBACK_SPEED) || '1.0';

    setSelectedVoiceURI(initialVoiceURI);
    setPlaybackSpeed(initialPlaybackSpeed);
    
    const updateVoiceListAndFinalizeSelection = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const systemVoices = speechSynthesis.getVoices();
        if (systemVoices.length > 0) {
          setAvailableVoices(systemVoices);
          setSelectedVoiceURI(currentSectionVoiceURI => {
            const targetVoice = currentSectionVoiceURI || initialVoiceURI;
            if (targetVoice && systemVoices.some(v => v.voiceURI === targetVoice)) {
              return targetVoice;
            }
            const hindiVoice = systemVoices.find(v => v.lang.toLowerCase().startsWith('hi'));
            if (hindiVoice) return hindiVoice.voiceURI;
            const enUS = systemVoices.find(v => v.lang === 'en-US' || v.lang.startsWith('en-US-'));
            if (enUS) return enUS.voiceURI;
            const enGB = systemVoices.find(v => v.lang === 'en-GB' || v.lang.startsWith('en-GB-'));
            if (enGB) return enGB.voiceURI;
            return systemVoices[0]?.voiceURI || '';
          });
        }
      }
    };
    updateVoiceListAndFinalizeSelection();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      speechSynthesis.onvoiceschanged = updateVoiceListAndFinalizeSelection;
    }
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        speechSynthesis.onvoiceschanged = null;
        if (speechSynthesis.speaking) speechSynthesis.cancel();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  useEffect(() => {
    const isSupported = !!BrowserSpeechRecognition;
    setSttSupported(isSupported);

    if (!isSupported) {
      setMicError("Speech recognition is not supported in your browser.");
      return;
    }

    const recognition = new BrowserSpeechRecognition();
    recognition.continuous = false; 
    recognition.interimResults = false; 
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      setInputValue(prevVal => prevVal + finalTranscript + ' '); 
    };

    recognition.onerror = (event) => {
      let errorMessage = `Speech recognition error: ${event.error}`;
      if (event.error === 'no-speech') errorMessage = 'No speech was detected. Please try again.';
      else if (event.error === 'audio-capture') errorMessage = 'Microphone problem. Ensure it is enabled and working correctly.';
      else if (event.error === 'not-allowed') errorMessage = 'Microphone access was denied. Please allow microphone permission in your browser settings.';
      
      setMicError(errorMessage);
      toast({ title: "Voice Input Error", description: errorMessage, variant: "destructive" });
      setIsListening(false);
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };

    speechRecognitionRef.current = recognition;

    return () => {
      if (speechRecognitionRef.current && typeof speechRecognitionRef.current.stop === 'function') {
        speechRecognitionRef.current.stop();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 


  const handleToggleListen = async () => {
    if (!sttSupported || !speechRecognitionRef.current) {
      toast({ title: "Voice Input Unavailable", description: micError || "Speech recognition not initialized or not supported.", variant: "destructive" });
      return;
    }

    if (isListening) {
      speechRecognitionRef.current.stop();
    } else {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true }); 
        speechRecognitionRef.current.start();
        setIsListening(true);
        setMicError(null);
        toast({ title: "Listening...", description: "Speak into your microphone. Speech will be appended." });
      } catch (err: any) {
        let message = "Could not start voice input. Please check microphone permissions.";
        if (err.name === 'NotAllowedError' || err.message === 'Permission denied') {
            message = "Microphone access denied. Please allow microphone permission in your browser settings.";
        } else if (err.name === 'NotFoundError' || err.message === 'Requested device not found') {
            message = "No microphone found. Please ensure a microphone is connected and enabled.";
        } else if (err.name === 'AbortError' || err.name === 'SecurityError') {
            message = "Microphone access was blocked or aborted. Please check browser settings.";
        }
        setMicError(message);
        toast({ title: "Microphone Access Error", description: message, variant: "destructive" });
        setIsListening(false);
      }
    }
  };

  const speakSpecificMessage = (messageId: string, text: string) => {
    if (!text || typeof window === 'undefined' || !window.speechSynthesis) return;

    if (speechSynthesis.speaking) {
      speechSynthesis.cancel(); 
      if (currentlySpeakingMessageId === messageId) { 
        setCurrentlySpeakingMessageId(null);
        utteranceRef.current = null;
        return; 
      }
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    if (selectedVoiceURI && availableVoices.length > 0) {
      const voiceToUse = availableVoices.find(v => v.voiceURI === selectedVoiceURI);
      if (voiceToUse) utterance.voice = voiceToUse;
    }

    const speedValue = parseFloat(playbackSpeed);
    utterance.rate = (!isNaN(speedValue) && speedValue >= 0.1 && speedValue <= 10) ? speedValue : 1.0;
    
    utterance.onstart = () => setCurrentlySpeakingMessageId(messageId);
    utterance.onend = () => { setCurrentlySpeakingMessageId(null); utteranceRef.current = null; };
    utterance.onerror = (event) => {
      console.warn("Chatbot TTS error:", event);
      toast({ title: "Speech Error", description: `Could not play bot response: ${event.error}`, variant: "destructive" });
      setCurrentlySpeakingMessageId(null);
      utteranceRef.current = null;
    };
    speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    const initialMessageContent = "नमस्ते! मैं ऑरल ओडिसी का एआई सहायक हूँ। आज मैं कहानियों की दुनिया में आपकी कैसे मदद कर सकता हूँ?"; 
    setMessages([{ 
        id: 'initial-bot-greeting', 
        role: 'model', 
        content: initialMessageContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
  }, []); 

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSubmit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    const userMessageContent = inputValue.trim();
    if (!userMessageContent) return;

    if (speechSynthesis.speaking && utteranceRef.current) {
      speechSynthesis.cancel();
      setCurrentlySpeakingMessageId(null);
    }

    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessageContent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    const historyForAI = messages.map(msg => ({ role: msg.role, content: msg.content }));
    
    try {
      const input: ChatbotInput = { userMessage: userMessageContent, history: historyForAI };
      const result = await chatWithBot(input);

      if (result && result.response) {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          content: result.response,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prevMessages) => [...prevMessages, botMessage]);
      } else {
        throw new Error("No response from AI or empty response.");
      }
    } catch (e: any) {
      console.error("Error in chatbot interaction:", e);
      const errorMessageText = `Failed to get response: ${e.message || "Unknown error"}`;
      setError(errorMessageText);
      const errorBotMessage: Message = { 
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: "मुझे क्षमा करें, मुझे एक त्रुटि का सामना करना पड़ा और मैं अभी जवाब नहीं दे सकता। कृपया बाद में पुन: प्रयास करें।", 
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prevMessages) => [...prevMessages, errorBotMessage]);
      toast({ title: "Chatbot Error", description: errorMessageText, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-var(--header-height,4rem)-2rem)]">
      <div className="mb-6 md:mb-8">
        <h2 className="text-3xl md:text-4xl font-bold font-serif text-gradient">Conversational AI</h2>
        <p className="text-md text-muted-foreground mt-1">Engage in intelligent conversations with our advanced AI assistant (Hindi default).</p>
      </div>

      <Card className="w-full shadow-xl rounded-xl overflow-hidden flex flex-col flex-grow glass-effect">
        <CardContent className="p-0 flex-grow flex flex-col overflow-hidden">
          <ScrollArea className="flex-grow p-4 md:p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn( "flex items-end gap-3 w-full", message.role === 'user' ? "justify-end" : "justify-start" )}
              >
                {message.role === 'model' && (
                  <Avatar className="h-9 w-9 border-2 border-primary/30 mb-1 shrink-0 self-start shadow-md">
                     <AvatarImage src="/aural-odyssey-logo.png" alt="Aural Odyssey Bot" className="object-contain" />
                    <AvatarFallback className="bg-primary/10"> 
                      <img src="/aural-odyssey-logo.png" alt="Aural Odyssey Bot" className="h-6 w-6 object-contain" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className={cn("flex flex-col group", message.role === 'user' ? "items-end" : "items-start")}>
                  <div
                    className={cn(
                      "max-w-md md:max-w-lg rounded-2xl px-4 py-3 shadow-md text-sm relative",
                      message.role === 'user'
                        ? "bg-primary text-primary-foreground rounded-br-none"
                        : "bg-secondary text-secondary-foreground rounded-bl-none glass-effect"
                    )}
                  >
                    {message.content.split('\n').map((line, index) => ( <span key={index} className="block">{line}</span> ))}
                     {message.role === 'model' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute -right-1 -top-1 h-7 w-7 text-muted-foreground hover:text-primary opacity-50 group-hover:opacity-100 transition-opacity"
                        onClick={() => speakSpecificMessage(message.id, message.content)}
                        title={currentlySpeakingMessageId === message.id ? "Stop speaking" : "Speak this message"}
                      >
                        {currentlySpeakingMessageId === message.id ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                        <span className="sr-only">Speak message</span>
                      </Button>
                    )}
                  </div>
                  {message.timestamp && ( <p className="text-xs text-muted-foreground mt-1 px-1"> {message.timestamp} </p> )}
                </div>
                {message.role === 'user' && (
                  <Avatar className="h-9 w-9 border-2 border-muted-foreground/30 mb-1 shrink-0 self-start shadow-md">
                     <AvatarFallback className="bg-muted-foreground/10"> <User className="h-5 w-5 text-muted-foreground" /> </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
            {isLoading && !isListening && (
               <div className="flex items-start gap-3 justify-start">
                  <Avatar className="h-8 w-8 border border-primary/30 shrink-0"> 
                     <AvatarImage src="/aural-odyssey-logo.png" alt="Aural Odyssey Bot Typing" className="object-contain" />
                    <AvatarFallback className="bg-primary/10"> 
                      <img src="/aural-odyssey-logo.png" alt="Aural Odyssey Bot Typing" className="h-5 w-5 object-contain" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="max-w-[75%] rounded-2xl px-4 py-3 shadow-md text-sm bg-secondary text-secondary-foreground rounded-bl-none glass-effect">
                      <RefreshCw className="h-4 w-4 animate-spin inline-block mr-2" /> Typing...
                  </div>
              </div>
            )}
          </ScrollArea>
          
          {(error || (micError && !isListening)) && ( 
            <div className="p-3 m-4 bg-destructive/20 border border-destructive/50 rounded-lg text-sm text-destructive-foreground flex items-center gap-2 shadow-sm glass-effect">
              <AlertCircle className="h-5 w-5" />
              <span>{error || micError}</span>
            </div>
          )}

          <div className="p-4 border-t border-border/50 bg-card/50">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground h-11 w-11 shrink-0 rounded-full hover-lift">
                    <SlidersHorizontal className="h-5 w-5" /> <span className="sr-only">Voice Settings</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 bg-popover border-border p-4 glass-effect">
                  <h4 className="font-medium leading-none text-foreground mb-4 font-serif">Chatbot Voice Settings</h4>
                  <VoiceSettings
                    idPrefix="chatbot-voice"
                    availableVoices={availableVoices}
                    selectedVoiceURI={selectedVoiceURI}
                    onVoiceChange={setSelectedVoiceURI}
                    playbackSpeed={playbackSpeed}
                    onPlaybackSpeedChange={setPlaybackSpeed}
                  />
                </PopoverContent>
              </Popover>

              <Input
                type="text"
                placeholder={isListening ? "Listening..." : "Ask me anything..."}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-grow bg-input border-border/50 focus:ring-primary text-sm h-11 rounded-lg placeholder:text-muted-foreground input-glow-focus"
                disabled={isLoading || isListening}
                aria-label="Chat message input"
              />
              <Button 
                type="button" 
                size="icon" 
                variant="ghost" 
                className={cn(
                  "h-11 w-11 shrink-0 rounded-full hover-lift",
                  isListening ? "text-destructive hover:text-destructive/80 animate-pulse" : "text-muted-foreground",
                  !sttSupported && "opacity-50 cursor-not-allowed"
                )}
                onClick={handleToggleListen}
                disabled={isLoading || !sttSupported}
                title={sttSupported ? (isListening ? "Stop Listening" : "Use Microphone") : "Speech input not available"}
              >
                {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                <span className="sr-only">{isListening ? "Stop Listening" : (sttSupported ? "Use Microphone" : "Speech input not available")}</span>
              </Button>
              <Button 
                type="submit" 
                size="icon" 
                className="primary-glow-button rounded-full h-11 w-11 shrink-0" 
                disabled={isLoading || isListening || !inputValue.trim()}
              >
                {isLoading && !isListening ? <RefreshCw className="animate-spin h-5 w-5" /> : <Send className="h-5 w-5" />}
                <span className="sr-only">Send message</span>
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    

    