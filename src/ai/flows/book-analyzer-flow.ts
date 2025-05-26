
'use server';
/**
 * @fileOverview A flow to analyze book content (text or PDF, including image-based PDFs) and answer user questions.
 *
 * - analyzeBookContent - A function that handles analyzing book content.
 * - BookAnalyzerInput - The input type for the analyzeBookContent function.
 * - BookAnalyzerOutput - The return type for the analyzeBookContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const BookAnalyzerInputSchema = z.object({
  bookContentDataUri: z
    .string()
    .describe(
      "The full content of the book (from a .txt or .pdf file), as a data URI that must include a MIME type (e.g., text/plain or application/pdf) and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'. The PDF may be text-based or image-based (scanned)."
    ),
  userQuestion: z.string().describe('The question asked by the user about the book content.'),
});
export type BookAnalyzerInput = z.infer<typeof BookAnalyzerInputSchema>;

const BookAnalyzerOutputSchema = z.object({
  answer: z.string().describe('The AI\'s answer to the user\'s question based on the book content. If the PDF was image-based and text extraction was problematic, this should be noted.'),
});
export type BookAnalyzerOutput = z.infer<typeof BookAnalyzerOutputSchema>;

export async function analyzeBookContent(input: BookAnalyzerInput): Promise<BookAnalyzerOutput> {
  return bookAnalyzerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'bookAnalyzerPrompt',
  model: 'googleai/gemini-2.0-flash', // This model supports multimodal input.
  input: {schema: BookAnalyzerInputSchema},
  output: {schema: BookAnalyzerOutputSchema},
  prompt: `You are an AI assistant specialized in analyzing book content.
The user has provided a document (which could be a text file or a PDF document) and a question about it.
The PDF document might be text-based or image-based (e.g., a scanned book).

Your tasks are:
1. If the input is a PDF, determine if it's primarily text-based or image-based.
2. If it's image-based or text extraction is otherwise difficult, use your multimodal capabilities to perform Optical Character Recognition (OCR) to extract the textual content from the document.
3. Analyze the extracted textual content (or the original text if not a PDF/image-based PDF) to answer the user's question.

Document Content:
{{media url=bookContentDataUri}}

User's Question:
"{{{userQuestion}}}"

Please provide a comprehensive and detailed answer based *only* on the text you can extract from the document provided.
- Ensure your answer is complete and directly addresses all parts of the user's question.
- If the question requires a detailed explanation or differentiation, provide a thorough response.
- If the answer cannot be found in the text, state that clearly.
- If the document is a PDF and you had significant trouble extracting text (e.g., poor image quality, unreadable text), please indicate this in your answer. For example: "I had difficulty extracting clear text from the provided PDF, which appears to be image-based. Based on the partially extracted text..." or "The PDF seems to be image-based, and I was unable to extract sufficient text to answer the question."
`,
  config: {
    temperature: 0.5, // Slightly lower temperature for more factual recall
     safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
    ],
  }
});

const bookAnalyzerFlow = ai.defineFlow(
  {
    name: 'bookAnalyzerFlow',
    inputSchema: BookAnalyzerInputSchema,
    outputSchema: BookAnalyzerOutputSchema,
  },
  async (input: BookAnalyzerInput) => {
    try {
      const { output } = await prompt(input);
      
      // Check if output or output.answer is null/undefined or an empty string
      if (!output || typeof output.answer !== 'string' || output.answer.trim() === '') {
        // This handles cases where the model might return an empty response or a non-string answer.
        // It's important to provide feedback to the user in such scenarios.
        console.warn("Book Analyzer Flow: AI returned no answer or an empty answer string for question:", input.userQuestion);
        return { answer: "The AI did not provide a specific answer for this question. This could be due to processing difficulties, no relevant information found in the document, or the question being unanswerable based on the content." };
      }
      return output;
    } catch (error) {
      console.error("Error in bookAnalyzerFlow:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during analysis.";
      // Provide a structured error response that the frontend can display
      return { answer: `Error analyzing book content: ${errorMessage}. Please ensure the document is valid and try again.` };
    }
  }
);
