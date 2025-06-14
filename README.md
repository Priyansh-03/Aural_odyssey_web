
<p align="center">
  <img src="./public/aural-odyssey-logo.png" alt="Aural Odyssey Logo" width="150">
</p>

<h1 align="center">Aural Odyssey - AI-Powered Reading Companion</h1>

<p align="center">
  <strong>Transform your reading into an interactive and auditory adventure!</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15.x-black?logo=next.js&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/React-18.x-blue?logo=react&logoColor=61DAFB" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Genkit-1.x-orange?logo=firebase&logoColor=white" alt="Genkit">
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
</p>

Welcome to Aural Odyssey, your personal AI-powered audiobook and reading companion! This application transforms your reading experience by allowing you to interact with your books in new and engaging ways, including intelligent chat, deep content analysis, and immersive audio narration.

## ✨ Features

*   **🗣️ Conversational AI Chatbot:**
    *   Engage in intelligent conversations with an AI assistant (defaults to Hindi, but can switch languages).
    *   Ask questions about the app, discuss books, storytelling, or chat about a wide range of topics.
    *   **Web Content Fetching:** Provide a URL, and the AI can fetch and summarize its content.
    *   **YouTube Search:** Ask for a video, and the AI will generate a YouTube search URL.
    *   Supports voice input (Speech-to-Text) and optional voice output (Text-to-Speech) for bot responses with customizable voice and speed.

*   **📖 Book Analysis:**
    *   Upload your books (in `.txt` or `.pdf` format).
    *   Handles text-based and image-based (scanned) PDFs using multimodal AI.
    *   Ask specific questions about the book's content, and the AI will analyze the document to provide answers based solely on the text.

*   **🎧 Storyteller:**
    *   Upload a book (`.txt` or `.pdf`), and the AI will extract the first chapter (or main text).
    *   Read the extracted text in a dedicated view.
    *   Listen to the text narrated aloud with options to select narrator voice and playback speed.
    *   View the content broken down into "Chapter Sections" (paragraphs) on the right. Click any section to start narrating from there. The currently playing section is highlighted, and the list auto-scrolls.

*   **⚙️ Settings:**
    *   Customize your global default narrator voice and playback speed preferences.
    *   Settings are saved locally in your browser for a consistent experience.

*   **🎨 Modern UI:**
    *   A sleek, responsive, dark-themed interface built with Next.js, React, ShadCN UI, and Tailwind CSS.
    *   Glassmorphism effects and smooth transitions for a premium feel.

## 🛠️ Tech Stack

*   **Frontend:**
    *   Next.js (App Router) with React
    *   TypeScript
    *   ShadCN UI Components
    *   Tailwind CSS
    *   Lucide React (Icons)
    *   Web Speech API (for Text-to-Speech and Speech-to-Text)
*   **Backend (AI):**
    *   Genkit (Firebase Genkit)
    *   Google Gemini Models (via `@genkit-ai/googleai`)
    *   TypeScript for AI flows and tools
*   **Languages & Others:** TypeScript, CSS, HTML (JSX), JSON, Handlebars (for Genkit prompts)

## 📂 Project Structure

```
.
├── public/                     # Static assets (logo, etc.)
├── src/
│   ├── ai/                     # Genkit AI logic
│   │   ├── flows/              # AI flow definitions (chatbot, storyteller, book analyzer)
│   │   └── tools/              # AI tools (webpage fetcher, YouTube search)
│   ├── app/                    # Next.js App Router (pages, layout, global styles)
│   ├── components/             # React components (UI elements, sections)
│   │   └── ui/                 # ShadCN UI components
│   ├── hooks/                  # Custom React hooks (e.g., useToast)
│   └── lib/                    # Utility functions (e.g., cn for Tailwind)
├── .env                        # Environment variables (e.g., API Key)
├── next.config.ts              # Next.js configuration
├── package.json                # Project dependencies and scripts
└── README.md                   # This file
```

## 🚀 Getting Started

Follow these instructions to get Aural Odyssey up and running on your local machine.

### Prerequisites

*   **Node.js:** v18 or later recommended (includes npm). Download from [nodejs.org](https://nodejs.org/).
*   **Git:** For cloning the repository. Download from [git-scm.com](https://git-scm.com/).
*   **Google API Key:** A valid API key for Google Gemini models.
    *   You can obtain one from [Google AI Studio](https://aistudio.google.com/app/apikey) or Google Cloud.

### Setup Instructions

1.  **Clone the Repository:**
    Open your terminal and run:
    ```bash
    git clone <your-repository-url>
    cd <repository-folder-name> # e.g., cd aural-odyssey
    ```
    (Replace `<your-repository-url>` with the actual URL of your GitHub repository)

2.  **Install Dependencies:**
    Using npm:
    ```bash
    npm install
    ```
    Or, if you prefer Yarn:
    ```bash
    yarn install
    ```

3.  **Set Up Environment Variables:**
    *   Create a new file named `.env` in the root directory of the project.
    *   Add your Google API Key to this file:
        ```env
        GOOGLE_API_KEY=YOUR_ACTUAL_GEMINI_API_KEY
        ```
    *   Replace `YOUR_ACTUAL_GEMINI_API_KEY` with your actual API key. **Do not commit this file to Git.**

### Running the Application Locally

You need to run two development servers concurrently: one for the Next.js frontend and one for the Genkit AI backend.

1.  **Start the Next.js Frontend:**
    Open a terminal window (or a new tab in your existing terminal), navigate to the project root, and run:
    ```bash
    npm run dev
    ```
    This will typically start the frontend on `http://localhost:9002`. Check your terminal output for the exact URL.

2.  **Start the Genkit Development Server:**
    Open *another* terminal window (or tab), navigate to the project root, and run:
    ```bash
    npm run genkit:dev
    ```
    This starts the Genkit server (usually on `http://localhost:3400`) and makes your AI flows and tools available. You should see output indicating that flows (e.g., `storytellerFlow`, `chatbotFlow`, `bookAnalyzerFlow`) and tools have been loaded.

3.  **Access the App:**
    Open your web browser and navigate to the URL provided by the Next.js dev server (e.g., `http://localhost:9002`).

## 💡 How to Use

Navigate through the app using the sidebar on the left.

*   **💬 Conversational AI:**
    *   Type your message in the input field or click the microphone icon to use voice input.
    *   The AI defaults to Hindi but can switch to other languages if you ask.
    *   It can fetch webpage content if you provide a URL (e.g., "Summarize example.com/article").
    *   It can provide YouTube search links (e.g., "Play relaxing music on YouTube").
    *   Click the speaker icon next to a bot's message to hear it read aloud.
    *   Use the "Tools" (slider icon) popover to adjust the bot's voice and speech speed for TTS.

*   **🔍 Book Analysis:**
    *   Upload a `.txt` or `.pdf` file of a book.
    *   Type your question about the book's content in the text area.
    *   Click "Get Answer." The AI will analyze the document and provide a response.

*   **🔊 Storyteller:**
    *   Upload a `.txt` or `.pdf` file. The AI processes it to extract the first chapter or main text.
    *   The extracted text is displayed in the main area.
    *   Use the "Listen" button to start narration. Controls for "Pause," "Resume," and "Stop" will appear.
    *   The "Chapter Sections" list on the right shows paragraphs/sections of the text. Click any section to start narrating from there. The currently playing section will be highlighted, and the list will auto-scroll.
    *   Use the "Settings" (slider icon) popover to adjust the narrator's voice and speech speed for this section.

*   **🔧 Settings:**
    *   Choose your preferred default narrator voice and playback speed for all text-to-speech features across the app (Chatbot and Storyteller).
    *   Click "Save Preferences." These settings are saved in your browser's local storage.

## 🤝 Contributing

This project is designed for development within Firebase Studio and locally.
1.  Ensure you have the necessary Firebase and Genkit tools set up if working outside Studio.
2.  Follow the setup and run instructions above.
3.  Make your changes and test thoroughly.
4.  If using Git, commit your changes and follow your repository's guidelines for pull requests or contributions.

---

Enjoy your Aural Odyssey! We hope it enriches your reading experience.
