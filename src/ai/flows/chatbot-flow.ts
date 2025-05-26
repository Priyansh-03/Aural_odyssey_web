
'use server';
/**
 * @fileOverview A conversational AI flow for the chatbot.
 *
 * - chatWithBot - A function that handles chat interactions.
 * - ChatbotInput - The input type for the chatWithBot function.
 * - ChatbotOutput - The return type for the chatWithBot function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { fetchWebpageContentTool, createYouTubeSearchUrlTool } from '@/ai/tools/action-tools';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const ChatbotInputSchema = z.object({
  userMessage: z.string().describe('The latest message from the user.'),
  history: z.array(ChatMessageSchema).describe('The conversation history between the user and the AI.'),
});
export type ChatbotInput = z.infer<typeof ChatbotInputSchema>;

const ChatbotOutputSchema = z.object({
  response: z.string().describe('The AI\'s response to the user\'s message. If a tool was used, this response should incorporate the tool\'s output, for example, by including a URL provided by the YouTube tool or summarizing content from the webpage fetching tool.'),
});
export type ChatbotOutput = z.infer<typeof ChatbotOutputSchema>;

export async function chatWithBot(input: ChatbotInput): Promise<ChatbotOutput> {
  return chatbotFlow(input);
}

const systemInstruction = `You are Aural Odyssey's friendly and helpful AI assistant.
Your primary goal is to be a versatile and engaging conversationalist.
ALWAYS reply in Hindi by default, unless the user explicitly asks you to use a different language.
When replying in Hindi, use simple, clear, and easy-to-understand language.
If the user asks for a different language, switch to that language for the conversation.

Feel free to chat about a wide range of topics.
Be prepared for any kind of question, even if it seems non-sensical or silly. If a question is unusual, try to respond in a light-hearted, creative, or playful manner. Don't be afraid to be a little humorous if appropriate.

In addition to general conversation, you can also help users with questions about the Aural Odyssey app or discuss books and storytelling in their preferred language (defaulting to Hindi).
Aural Odyssey is an app that transforms written stories into engaging audio experiences. Users can upload their books (TXT or PDF), and the app's AI crafts the narrative. For free users, only the first chapter is processed.

You have access to the following tools:
- fetchWebpageContent: Use this tool if the user provides a URL and asks for information from it, or if you need to consult a specific webpage to answer a question. You should use the fetched content to inform your response. For example, if a user asks "What's on example.com/article?", use this tool with that URL.
- createYouTubeSearchUrl: Use this tool when the user asks to play a video or search for something on YouTube. You should provide the generated URL in your response.

When the fetchWebpageContent tool provides content, summarize it or use it directly to answer the user's question.
When the createYouTubeSearchUrl tool provides a URL, please include it clearly in your response, for example: "मैंने आपके लिए यह खोजा: [URL]" or "आप इसे यूट्यूब पर यहां देख सकते हैं: [URL]".
Keep your responses engaging, helpful, and use simple language (defaulting to Hindi).`;

const prompt = ai.definePrompt({
  name: 'chatbotPrompt',
  model: 'googleai/gemini-2.0-flash',
  tools: [fetchWebpageContentTool, createYouTubeSearchUrlTool],
  input: {schema: ChatbotInputSchema},
  output: {schema: ChatbotOutputSchema},
  system: systemInstruction,
  prompt: (input: ChatbotInput) => {
    // Construct prompt with history
    let fullPrompt = '';
    input.history.forEach(msg => {
      fullPrompt += `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}\n`;
    });
    fullPrompt += `User: ${input.userMessage}\nAI:`;
    return fullPrompt;
  },
  config: {
    temperature: 0.7,
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


const chatbotFlow = ai.defineFlow(
  {
    name: 'chatbotFlow',
    inputSchema: ChatbotInputSchema,
    outputSchema: ChatbotOutputSchema,
  },
  async (input: ChatbotInput) => {
    const { history, userMessage } = input;

    const llmInput = {
      userMessage,
      history,
    };
    
    const { output } = await prompt(llmInput);
    
    if (!output || !output.response) {
      console.error("Chatbot flow did not receive a valid response from the model.");
      return { response: "मुझे क्षमा करें, मैं अभी प्रतिक्रिया उत्पन्न नहीं कर सका। कृपया पुन: प्रयास करें।" }; // Default error in Hindi
    }
    return { response: output.response };
  }
);

