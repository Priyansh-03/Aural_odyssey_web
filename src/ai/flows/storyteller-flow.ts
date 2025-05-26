
'use server';
/**
 * @fileOverview A flow to extract the first chapter from a book (text or PDF).
 *
 * - extractFirstChapter - A function that handles extracting the first chapter.
 * - ExtractFirstChapterInput - The input type for the extractFirstChapter function.
 * - ExtractFirstChapterOutput - The return type for the extractFirstChapter function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractFirstChapterInputSchema = z.object({
  bookContentDataUri: z
    .string()
    .describe(
      "The full content of the book (from a .txt or .pdf file), as a data URI that must include a MIME type (e.g., text/plain or application/pdf) and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractFirstChapterInput = z.infer<typeof ExtractFirstChapterInputSchema>;

const ExtractFirstChapterOutputSchema = z.object({
  firstChapterText: z.string().describe('The extracted text of the first chapter of the book.'),
});
export type ExtractFirstChapterOutput = z.infer<typeof ExtractFirstChapterOutputSchema>;

export async function extractFirstChapter(input: ExtractFirstChapterInput): Promise<ExtractFirstChapterOutput> {
  return storytellerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'storytellerPrompt',
  input: {schema: ExtractFirstChapterInputSchema},
  output: {schema: ExtractFirstChapterOutputSchema},
  prompt: `You are a helpful assistant that processes books.
Your task is to extract the first chapter from the provided book content.
The book content is provided via a data URI, which could be from a plain text file or a PDF document.

Book Content:
{{media url=bookContentDataUri}}

If the input is a PDF, first extract all its textual content. Then, from this extracted text (or from the original text if it was not a PDF), please identify and return only the text of the first chapter.
If the book is very short and seems to be only one chapter, return the entire content as the first chapter.
If you cannot determine the first chapter (e.g., unclear structure, or unable to process PDF content effectively), return an empty string for firstChapterText.
`,
});

const storytellerFlow = ai.defineFlow(
  {
    name: 'storytellerFlow',
    inputSchema: ExtractFirstChapterInputSchema,
    outputSchema: ExtractFirstChapterOutputSchema,
  },
  async input => {
    try {
      const {output} = await prompt(input);
      if (!output) {
        throw new Error('No output from storyteller prompt');
      }
      return output;
    } catch (error) {
      console.error("Error in storytellerFlow:", error);
      // Return a structured error or a default value
      return { firstChapterText: "Error processing book. Could not extract the first chapter." };
    }
  }
);

