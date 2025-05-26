
"use client";

import React, { useState, type ChangeEvent, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UploadCloud, FileText, AlertCircle, RefreshCw, Play, Pause, StopCircle, SlidersHorizontal } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { extractFirstChapter, type ExtractFirstChapterInput } from '@/ai/flows/storyteller-flow';
import { ScrollArea } from '@/components/ui/scroll-area';
import VoiceSettings from './voice-settings';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const LOCAL_STORAGE_KEYS = {
  DEFAULT_VOICE_URI: 'auralOdyssey_defaultVoiceURI',
  DEFAULT_PLAYBACK_SPEED: 'auralOdyssey_defaultPlaybackSpeed',
};

export function StorytellerSection() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [parsedContent, setParsedContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [textChunks, setTextChunks] = useState<string[]>([]);
  const [currentChunkIndex, setCurrentChunkIndex] = useState<number>(0);
  const [highlightedChunkIndex, setHighlightedChunkIndex] = useState<number>(-1);
  const [userManuallyStopped, setUserManuallyStopped] = useState(false);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  

  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');
  const [playbackSpeed, setPlaybackSpeed] = useState<string>('1.0');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const chunkItemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    let initialVoiceURI = localStorage.getItem(LOCAL_STORAGE_KEYS.DEFAULT_VOICE_URI) || '';
    let initialPlaybackSpeed = localStorage.getItem(LOCAL_STORAGE_KEYS.DEFAULT_PLAYBACK_SPEED) || '1.0';
    
    setPlaybackSpeed(initialPlaybackSpeed);

    const updateVoiceListAndFinalizeSelection = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const systemVoices = speechSynthesis.getVoices();
        if (systemVoices.length > 0) {
          setAvailableVoices(systemVoices);
          setSelectedVoiceURI(currentLocalStorageVoiceURI => {
            const targetVoice = currentLocalStorageVoiceURI || initialVoiceURI; // Prioritize LS over component's initial
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

    updateVoiceListAndFinalizeSelection(); // Initial call
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      speechSynthesis.onvoiceschanged = updateVoiceListAndFinalizeSelection; // Update if voices change
    }

    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        speechSynthesis.onvoiceschanged = null;
        if (speechSynthesis.speaking || speechSynthesis.pending) {
          speechSynthesis.cancel();
        }
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array: run once on mount

  useEffect(() => {
    if (parsedContent) {
      const chunks = parsedContent
        .split(/\n\s*\n+/) 
        .map(chunk => chunk.trim())
        .filter(chunk => chunk.length > 0);
      setTextChunks(chunks);
      setCurrentChunkIndex(0);
      setHighlightedChunkIndex(-1);
      setUserManuallyStopped(false);
      if (utteranceRef.current || (typeof window !== 'undefined' && window.speechSynthesis && (speechSynthesis.speaking || speechSynthesis.pending))) {
        handleStopPlayback(false, false); // Stop current speech but don't show "stopped" toast
      }
      chunkItemRefs.current = chunks.map(() => null);
    } else {
      setTextChunks([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsedContent]);
  
  useEffect(() => {
    if (highlightedChunkIndex >= 0 && chunkItemRefs.current[highlightedChunkIndex]) {
      const activeChunkElement = chunkItemRefs.current[highlightedChunkIndex];
      if (activeChunkElement) {
        setTimeout(() => { 
          activeChunkElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center', 
          });
        }, 0);
      }
    }
  }, [highlightedChunkIndex, textChunks]);


  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'text/plain' || selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setFileName(selectedFile.name);
        setParsedContent(null);    
        setTextChunks([]);
        setError(null);
        if (utteranceRef.current || (typeof window !== 'undefined' && window.speechSynthesis && (speechSynthesis.speaking || speechSynthesis.pending))) {
            handleStopPlayback(false, false); 
        }
      } else {
        setError('Unsupported file type. Please upload a .txt or .pdf file.');
        toast({ title: "Unsupported File Type", description: "Please upload a .txt or .pdf file.", variant: "destructive" });
        setFile(null);
        setFileName('');
      }
    }
  };
  
  const stringToTextDataUri = (textString: string): string => {
    const GUESSED_MIME_TYPE = "text/plain"; 
    try { return `data:${GUESSED_MIME_TYPE};charset=utf-8;base64,${btoa(unescape(encodeURIComponent(textString)))}`; } 
    catch (e) { return `data:${GUESSED_MIME_TYPE};base64,${btoa(textString)}`; }
  };

  const fileToDataUriAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string); 
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setError('Please select a file.');
      toast({ title: "No File Selected", description: "Please select a file to upload.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setError(null);
    setParsedContent(null);
    setTextChunks([]);
    if (utteranceRef.current || (typeof window !== 'undefined' && window.speechSynthesis && (speechSynthesis.speaking || speechSynthesis.pending))) {
        handleStopPlayback(false, false);
    }

    try {
      let bookContentDataUriForFlow: string;
      if (file.type === "application/pdf") {
        bookContentDataUriForFlow = await fileToDataUriAsBase64(file); 
      } else { 
        const fileText = await file.text();
        bookContentDataUriForFlow = stringToTextDataUri(fileText); // Storyteller flow expects text/plain for non-PDFs
      }

      const input: ExtractFirstChapterInput = { bookContentDataUri: bookContentDataUriForFlow };
      const result = await extractFirstChapter(input);

      if (result && typeof result.firstChapterText === 'string') {
        if (result.firstChapterText.trim() === "" || result.firstChapterText.startsWith("Error processing book")) {
          setParsedContent(result.firstChapterText || "Could not extract the first chapter or the chapter is empty.");
          toast({ title: "Processing Note", description: result.firstChapterText || `Could not determine the first chapter from ${file.name}.`, variant: "default" });
        } else {
          setParsedContent(result.firstChapterText);
          toast({ title: "File Processed", description: `${file.name} processed. First chapter available.` });
        }
      } else {
        throw new Error("Failed to extract chapter or AI returned an unexpected response.");
      }
    } catch (e: any) {
      console.error("Error processing file:", e);
      const errorMessage = e.message || "Unknown error";
      setError(`Failed to process file: ${errorMessage}`);
      setParsedContent(null); 
      toast({ title: "Processing Error", description: `Could not process file. ${errorMessage}`, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const playChunk = (indexToPlay: number) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || indexToPlay < 0 || indexToPlay >= textChunks.length) {
      if (isSpeaking) { // Was speaking but ran out of chunks
        handleStopPlayback(false, true); // Not a manual stop, show "complete" toast
      }
      return;
    }

    if (speechSynthesis.speaking || speechSynthesis.pending) {
      speechSynthesis.cancel(); 
    }

    const chunkText = textChunks[indexToPlay];
    if (!chunkText || chunkText.trim() === "") { 
      if (isSpeaking) { // Still in "speaking mode" but current chunk is empty
        const nextChunk = indexToPlay + 1;
        if (nextChunk < textChunks.length) {
          setCurrentChunkIndex(nextChunk);
          playChunk(nextChunk);
        } else { // Empty chunk was the last one
          handleStopPlayback(false, true); // Not manual, show complete
        }
      }
      return;
    }

    const utterance = new SpeechSynthesisUtterance(chunkText);
    utteranceRef.current = utterance;

    if (selectedVoiceURI && availableVoices.length > 0) {
      const voiceToUse = availableVoices.find(v => v.voiceURI === selectedVoiceURI);
      if (voiceToUse) utterance.voice = voiceToUse;
    }

    const speedValue = parseFloat(playbackSpeed);
    utterance.rate = (!isNaN(speedValue) && speedValue >= 0.1 && speedValue <= 10) ? speedValue : 1.0;
    
    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
      setHighlightedChunkIndex(indexToPlay);
    };

    utterance.onpause = () => {
      if (isSpeaking && !userManuallyStopped) { 
           setIsPaused(true);
      }
    };

    utterance.onresume = () => {
      setIsPaused(false);
    };
    
    utterance.onend = () => {
      const stillOurUtterance = utteranceRef.current === utterance;
      if (stillOurUtterance && isSpeaking && !userManuallyStopped) { 
        const nextChunkIndex = indexToPlay + 1;
        if (nextChunkIndex < textChunks.length) {
          setCurrentChunkIndex(nextChunkIndex);
          playChunk(nextChunkIndex);
        } else {
          handleStopPlayback(false, true); 
        }
      } else if (!stillOurUtterance || userManuallyStopped) {
        // Expected after manual stop or if another utterance took over. Do nothing further.
      } else { 
         setHighlightedChunkIndex(-1); 
      }
    };
    
    utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
      const wasOurUtterance = utteranceRef.current === utterance;
      console.error("Storyteller: Speech 'onerror' event:", event, "Error code:", event.error);

      let shouldToastError = false;
      let toastMessage = "An unknown speech error occurred during narration.";

      if (event.error && event.error !== 'canceled') {
          switch (event.error) {
              case 'synthesis-unavailable': toastMessage = "Speech synthesis service is unavailable on this device/browser."; break;
              case 'synthesis-failed': toastMessage = "Speech synthesis failed. Please try a different voice or check your internet connection."; break;
              case 'language-unavailable': toastMessage = "The selected language for narration is not available."; break;
              case 'voice-unavailable': toastMessage = "The selected voice for narration is not available. Please try another."; break;
              case 'text-too-long': toastMessage = "The current text section is too long to narrate with the selected voice/engine."; break;
              case 'invalid-argument': toastMessage = "Invalid argument for speech synthesis (e.g., invalid speed)."; break;
              case 'not-allowed': toastMessage = "Speech synthesis is not allowed by browser settings (e.g., autoplay blocked)."; break;
              case 'audio-busy': toastMessage = "Audio output is busy. Please try again shortly."; break;
              case 'audio-hardware': toastMessage = "A problem occurred with your audio hardware."; break;
              default: toastMessage = `Speech error: ${event.error}. Please try again.`;
          }
          shouldToastError = true;
      } else if (!event.error) { 
          console.warn("Storyteller: Speech 'onerror' with null/undefined error code. This can sometimes happen if speech is interrupted or during pause/resume. Utterance:", utterance);
      }
      
      if (wasOurUtterance) {
        if (shouldToastError) {
            toast({ title: "Speech Error", description: toastMessage, variant: "destructive" });
        }
        // Always stop playback on error to reset UI state correctly.
        // Pass true for manualStop if it was a genuine error, false if it might be a 'canceled' or null error from an interruption.
        handleStopPlayback(!!(event.error && event.error !== 'canceled'), false);
      }
    };
    
    speechSynthesis.speak(utterance);
    setCurrentChunkIndex(indexToPlay); 
  };

  const handleTogglePlayPause = () => {
    if (!parsedContent || textChunks.length === 0) return;

    if (isSpeaking) {
      if (isPaused) { 
        // This is the "Resume" case
        // Stop current, clear pause state, and restart the current chunk
        handleStopPlayback(false, false); // Not a manual stop, don't show "stopped" toast
        
        // Short delay to ensure speech synthesis is fully clear before new speak
        setTimeout(() => {
            const chunkToResume = (currentChunkIndex >= 0 && currentChunkIndex < textChunks.length) ? currentChunkIndex : 0;
            if (textChunks.length > 0) {
                setUserManuallyStopped(false); // Ensure we are not in a manually stopped state
                setIsPaused(false); // We are no longer paused
                // isSpeaking will be set to true by playChunk's onstart
                playChunk(chunkToResume);
            }
        }, 50); // Delay can be adjusted or removed if not needed

      } else { 
        // Currently speaking and not paused, so "Pause"
        if (utteranceRef.current && speechSynthesis.speaking) {
          speechSynthesis.pause();
          setIsPaused(true);
        }
      }
    } else { 
      // Not speaking (either initial play or was stopped), so "Listen"
      setIsPaused(false); 
      setUserManuallyStopped(false); 
      const chunkToPlay = (currentChunkIndex >= 0 && currentChunkIndex < textChunks.length) ? currentChunkIndex : 0;
      playChunk(chunkToPlay);
    }
  };
  
  const handleStopPlayback = (manualStop: boolean = true, showCompletionToast: boolean = false) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    
    // This flag determines if the onend handler should try to play the next chunk
    setUserManuallyStopped(manualStop); 
    
    const wasSpeakingOrPaused = isSpeaking || isPaused; 
    
    if (speechSynthesis.speaking || speechSynthesis.pending) {
      speechSynthesis.cancel(); // This will trigger 'onend' for the current utterance
    }

    setIsSpeaking(false);
    setIsPaused(false);
    setHighlightedChunkIndex(-1);
    // Don't reset currentChunkIndex, so resume can pick up from where it was, or stop keeps context.
    utteranceRef.current = null; 

    if (manualStop && showCompletionToast && wasSpeakingOrPaused) { // Typically, completion toast is handled by onend
      toast({ title: "Narration Stopped", description: "Audio playback has been stopped." });
    } else if (!manualStop && showCompletionToast && wasSpeakingOrPaused){ // From onend when all chunks are done
        toast({ title: "Narration Complete", description: "Finished narrating all sections." });
    }
  };

  const handleChunkClick = (index: number) => {
    if (index < 0 || index >= textChunks.length) return;
    
    handleStopPlayback(false, false); // Stop current speech, not a "manual stop" for sequence, no "stopped" toast
    
    // Short delay to ensure speech synthesis is fully clear
    setTimeout(() => {
      setUserManuallyStopped(false); // Reset for new playback sequence from clicked chunk
      setCurrentChunkIndex(index);
      setIsPaused(false); // Not paused when starting from a click
      playChunk(index);
    }, 50); // Delay can be adjusted
  };
  
  useEffect(() => { 
    // Cleanup on unmount
    return () => {
      if (utteranceRef.current || (typeof window !== 'undefined' && window.speechSynthesis && (speechSynthesis.speaking || speechSynthesis.pending))) {
          handleStopPlayback(true, false); // Treat as manual stop, don't show completion toast
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6 h-full flex flex-col">
       <div className="mb-2 md:mb-4">
        <h2 className="text-3xl md:text-4xl font-bold font-serif text-gradient">Storyteller</h2>
        <p className="text-md text-muted-foreground mt-1">Upload your book (.txt or .pdf) and listen to the first chapter.</p>
      </div>

      <Card className="w-full shadow-xl rounded-xl glass-effect flex-grow flex flex-col overflow-hidden">
        <CardHeader className="pb-4">
            <CardTitle className="font-serif flex items-center gap-3 text-xl md:text-2xl font-semibold">
                <UploadCloud className="h-7 w-7 text-primary"/>
                Upload Your Story
            </CardTitle>
             <CardDescription className="text-muted-foreground pt-1">
                Supports .txt and .pdf files. The AI will narrate the first chapter.
            </CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8 flex-grow flex flex-col space-y-6 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="book-upload" className="font-medium text-foreground/90">Choose a book file</Label>
              <Input
                id="book-upload"
                type="file"
                accept=".txt,.pdf" 
                onChange={handleFileChange}
                className="mt-1 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:rounded-md file:border-0 file:px-3 file:py-2 file:mr-3 cursor-pointer bg-input border-border focus:ring-primary text-sm input-glow-focus"
                disabled={isLoading}
                aria-describedby="file-description"
              />
              <p id="file-description" className="text-xs text-muted-foreground">Supported formats: .txt, .pdf.</p>
              {fileName && !isLoading && <p className="text-sm text-muted-foreground pt-1">Selected file: <span className="font-medium text-primary">{fileName}</span></p>}
            </div>

            {error && (
              <div className="p-3 bg-destructive/20 border border-destructive/50 rounded-lg text-sm text-destructive-foreground flex items-center gap-2 shadow-sm glass-effect">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" className="w-full sm:w-auto min-w-[180px] primary-glow-button rounded-lg text-base py-3" disabled={isLoading || !file}>
              {isLoading ? ( <> <RefreshCw className="animate-spin mr-2 h-5 w-5" /> Processing... </> ) 
                         : ( <> <FileText className="mr-2 h-5 w-5" /> Upload and Process </> )
              }
            </Button>
          </form>

          {parsedContent && !isLoading && textChunks.length > 0 && (
            <div className="flex-grow flex flex-col md:flex-row gap-6 mt-4 pt-4 border-t border-border/30">
              {/* Left Column: Full Text & Main Controls */}
              <div className="md:w-2/3 flex flex-col space-y-3">
                <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-lg font-serif text-gradient">Full Chapter Text</h3>
                    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary hover-lift">
                        <SlidersHorizontal className="h-5 w-5" /> <span className="sr-only">Voice Settings</span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 bg-popover border-border p-4 glass-effect">
                        <h4 className="font-medium leading-none text-foreground mb-4 font-serif">Narration Settings</h4>
                        <VoiceSettings
                        idPrefix="storyteller-voice"
                        availableVoices={availableVoices}
                        selectedVoiceURI={selectedVoiceURI}
                        onVoiceChange={setSelectedVoiceURI}
                        playbackSpeed={playbackSpeed}
                        onPlaybackSpeedChange={setPlaybackSpeed}
                        />
                    </PopoverContent>
                    </Popover>
                </div>
                <ScrollArea className="flex-grow mb-4 pr-3 border border-primary rounded-md p-3 bg-background/30 min-h-[200px] max-h-[calc(60vh-80px)]">
                    <div className="prose prose-sm max-w-none text-foreground/90 whitespace-pre-wrap leading-relaxed">
                    {parsedContent}
                    </div>
                </ScrollArea>
                <div className="flex items-center gap-3 pt-2">
                    <Button 
                    onClick={handleTogglePlayPause} 
                    variant="outline" 
                    className="min-w-[120px] border-primary text-primary hover:bg-primary/10 hover:text-primary rounded-lg primary-glow-button focus:ring-primary/50" 
                    disabled={!parsedContent || textChunks.length === 0 || availableVoices.length === 0 || (parsedContent||"").startsWith("Could not extract") || (parsedContent||"").startsWith("Error processing book")}
                    >
                    {isSpeaking && !isPaused ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
                    {isSpeaking && !isPaused ? 'Pause' : (isPaused ? 'Resume' : 'Listen')}
                    </Button>
                    {(isSpeaking || isPaused) && (
                    <Button 
                        onClick={() => handleStopPlayback(true, true)} 
                        variant="outline" 
                        className="text-destructive hover:text-destructive border-destructive hover:bg-destructive/10 focus-visible:ring-destructive rounded-lg"
                    >
                        <StopCircle className="mr-2 h-5 w-5" /> Stop
                    </Button>
                    )}
                </div>
              </div>

              {/* Right Column: Chapter Sections List */}
              <div className="md:w-1/3 flex flex-col space-y-3">
                <h3 className="font-semibold text-lg font-serif text-gradient">Chapter Sections</h3>
                <ScrollArea className="flex-grow border border-primary rounded-md p-2 bg-background/30 min-h-[200px] max-h-[60vh]">
                  <div className="space-y-1.5">
                    {textChunks.map((chunk, index) => (
                      <Button
                        key={index}
                        ref={(el) => (chunkItemRefs.current[index] = el)}
                        variant="ghost"
                        onClick={() => handleChunkClick(index)}
                        className={cn(
                          "w-full h-auto text-left justify-start p-2.5 text-sm text-foreground/80 hover:bg-primary/10 hover:text-primary rounded-md transition-colors duration-150 whitespace-normal leading-relaxed",
                          highlightedChunkIndex === index && "bg-primary/20 text-primary font-medium ring-1 ring-primary/50"
                        )}
                        disabled={isLoading || availableVoices.length === 0}
                      >
                        {`Section ${index + 1}: ${chunk.substring(0, 70)}${chunk.length > 70 ? '...' : ''}`}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}

          {(!parsedContent || (textChunks.length === 0 && parsedContent)) && !isLoading && file && (
            <div className="p-6 md:p-8 text-center text-muted-foreground flex-grow flex items-center justify-center">
              <p>Content processed, but no narratable text found or content is empty.</p>
            </div>
          )}
          {(!parsedContent) && !isLoading && !file && (
            <div className="p-6 md:p-8 text-center text-muted-foreground flex-grow flex items-center justify-center">
              <p>Upload a file to begin.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

