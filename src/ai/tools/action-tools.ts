
'use server';
/**
 * @fileOverview Defines tools for the AI to interact with external services.
 *
 * - fetchWebpageContentTool - Fetches text content from a given URL.
 * - createYouTubeSearchUrlTool - Generates a YouTube search URL.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const fetchWebpageContentTool = ai.defineTool(
  {
    name: 'fetchWebpageContent',
    description: 'Fetches the main text content from a given webpage URL. Use this when the user asks for information from a specific URL or when you need to consult a webpage to answer a question.',
    inputSchema: z.object({
      url: z.string().url().describe('The full URL of the webpage to fetch content from.'),
    }),
    outputSchema: z.object({
      fetchedContent: z.string().describe('The extracted text content from the webpage, or a message indicating an error or if content could not be extracted.'),
    }),
  },
  async (input) => {
    try {
      const response = await fetch(input.url, {
        headers: {
          // Some websites might block requests without a common user-agent
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        }
      });

      if (!response.ok) {
        return { fetchedContent: `Error: Failed to fetch the webpage. Status: ${response.status} ${response.statusText}` };
      }

      const contentType = response.headers.get('content-type');
      if (contentType && (contentType.includes('text/html') || contentType.includes('text/plain'))) {
        const textContent = await response.text();
        // Basic HTML stripping - for more advanced parsing, a library like cheerio would be needed.
        // This is a very naive stripping approach.
        const strippedText = textContent.replace(/<style[^>]*>.*<\/style>/gs, '') // Remove style tags and content
                                      .replace(/<script[^>]*>.*<\/script>/gs, '') // Remove script tags and content
                                      .replace(/<[^>]+>/g, ' ') // Remove all other HTML tags, replace with space
                                      .replace(/\s\s+/g, ' ') // Replace multiple spaces with single space
                                      .trim();
        
        if (!strippedText) {
            return { fetchedContent: "Successfully fetched the page, but no meaningful text content could be extracted after basic HTML stripping."};
        }
        // Return a snippet if too long to avoid overwhelming the AI or hitting token limits.
        return { fetchedContent: strippedText.substring(0, 5000) + (strippedText.length > 5000 ? "..." : "") };
      } else {
        return { fetchedContent: `Error: Fetched content is not HTML or plain text. Content-Type: ${contentType}` };
      }
    } catch (error: any) {
      console.error("Error in fetchWebpageContentTool:", error);
      return { fetchedContent: `Error: An exception occurred while trying to fetch the webpage: ${error.message}` };
    }
  }
);

export const createYouTubeSearchUrlTool = ai.defineTool(
  {
    name: 'createYouTubeSearchUrl',
    description: 'Generates a YouTube search URL for a given video query. Use this when the user asks to play a video or search for something on YouTube.',
    inputSchema: z.object({
      query: z.string().describe('The YouTube search query (e.g., song title, video topic).'),
    }),
    outputSchema: z.object({
      youtubeUrl: z.string().url().describe('The fully formed YouTube search URL.'),
    }),
  },
  async (input) => {
    const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(input.query)}`;
    return { youtubeUrl };
  }
);

