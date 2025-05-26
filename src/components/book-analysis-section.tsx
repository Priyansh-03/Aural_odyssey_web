
"use client";

import { useState, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UploadCloud, FileText, AlertCircle, RefreshCw, HelpCircle, Sparkles } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { analyzeBookContent, type BookAnalyzerInput } from '@/ai/flows/book-analyzer-flow';
import { ScrollArea } from '@/components/ui/scroll-area';

export function BookAnalysisSection() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] =useState<string>('');
  const [question, setQuestion] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'text/plain' || selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setFileName(selectedFile.name);
        setAnalysisResult(null); 
        setError(null);
      } else {
        setError('Unsupported file type. Please upload a .txt or .pdf file.');
        toast({
          title: "Unsupported File Type",
          description: "For book analysis, please upload a .txt or .pdf file.",
          variant: "destructive",
        });
        setFile(null);
        setFileName('');
      }
    }
  };

  const fileToDataUri = (file: File): Promise<string> => {
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
      setError('Please select a book file.');
      toast({ title: "No File", description: "Please select a book file to analyze.", variant: "destructive" });
      return;
    }
    if (!question.trim()) {
      setError('Please enter a question about the book.');
      toast({ title: "No Question", description: "Please enter your question about the book.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const bookContentDataUri = await fileToDataUri(file);
      
      const input: BookAnalyzerInput = { bookContentDataUri, userQuestion: question };
      const result = await analyzeBookContent(input);

      if (result && result.answer) {
        setAnalysisResult(result.answer);
        toast({
          title: "Analysis Complete",
          description: `Received answer for your question about ${fileName}.`,
        });
      } else {
        throw new Error("Analysis failed or the AI returned an empty answer.");
      }
    } catch (e: any) {
      console.error("Error analyzing file:", e);
      const errorMessage = e.message || "Unknown error during analysis";
      setError(`Failed to analyze file: ${errorMessage}`);
      setAnalysisResult(`An error occurred: ${errorMessage}`); 
      toast({
        title: "Analysis Error",
        description: `Could not analyze the file. ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="mb-2 md:mb-4">
        <h2 className="text-3xl md:text-4xl font-bold font-serif text-gradient">Book Analysis</h2>
        <p className="text-md text-muted-foreground mt-1">Upload a book (.txt or .pdf) and ask questions about its content.</p>
      </div>

      <Card className="w-full shadow-xl rounded-xl glass-effect flex-grow flex flex-col overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl md:text-2xl font-semibold font-serif">
            <HelpCircle className="h-7 w-7 text-primary" />
            Ask Your Book
          </CardTitle>
          <CardDescription className="text-muted-foreground pt-1">
            Upload a .txt or .pdf file and type your question below to get AI-powered insights.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8 space-y-6 flex-grow overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="book-analysis-upload" className="font-medium text-foreground/90">Choose a book file (.txt, .pdf)</Label>
              <Input
                id="book-analysis-upload"
                type="file"
                accept=".txt,.pdf"
                onChange={handleFileChange}
                className="mt-1 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:rounded-md file:border-0 file:px-3 file:py-2 file:mr-3 cursor-pointer bg-input border-border focus:ring-primary text-sm input-glow-focus"
                disabled={isLoading}
                aria-describedby="file-analysis-description"
              />
              <p id="file-analysis-description" className="text-xs text-muted-foreground mt-1">.txt and .pdf files are supported for analysis.</p>
              {fileName && !isLoading && <p className="text-sm text-muted-foreground pt-1">Selected file: <span className="font-medium text-primary">{fileName}</span></p>}
            </div>
            
            <div>
              <Label htmlFor="book-question" className="font-medium text-foreground/90">Your Question</Label>
              <Textarea
                id="book-question"
                placeholder="e.g., What is the main theme of this book? Who is the protagonist?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="mt-1 bg-input border-border focus:ring-primary text-sm min-h-[100px] input-glow-focus"
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="p-3 bg-destructive/20 border border-destructive/50 rounded-lg text-sm text-destructive-foreground flex items-center gap-2 shadow-sm glass-effect">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" className="w-full sm:w-auto min-w-[180px] primary-glow-button rounded-lg text-base py-3" disabled={isLoading || !file || !question.trim()}>
              {isLoading ? (
                <>
                  <RefreshCw className="animate-spin mr-2 h-5 w-5" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Get Answer
                </>
              )}
            </Button>
          </form>

          {analysisResult && !isLoading && (
            <div className="mt-8 p-6 border border-border/50 rounded-lg bg-card/50 shadow-md glass-effect">
              <h3 className="font-semibold text-xl mb-4 font-serif text-gradient">AI's Answer</h3>
              <ScrollArea className="h-auto max-h-[300px] pr-3 border border-border/30 rounded-md p-3 bg-background/30">
                 <div className="prose prose-sm max-w-none text-foreground/90 whitespace-pre-wrap leading-relaxed">
                  {analysisResult}
                </div>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
