# YouTube Video Summarizer & SQLite Archive

A clean, minimalist workspace that turns any YouTube video into an embedded player with AI-synthesized executive takeaways, core bullet highlights, and a persistent SQLite video archive with import & export capabilities.

Powered by **Gemini 3.8 Flash** with Google Search grounding.

---

## Features

- **Instant YouTube Embed**: Paste any standard watch URL, `youtu.be` link, YouTube Shorts, or embed link to view in a responsive 16:9 player.
- **AI Executive Synthesis**: Automatically produces a concise 2–3 sentence executive summary, 4–6 core bullet highlights, key takeaways, and categorical topics.
- **Persistent SQLite Archive**: All analyzed videos and summaries are stored in a local SQLite database (`data/archive.db`). Excluded from Git to preserve privacy.
- **Search & Sort**: Filter archived videos in real-time by video title, channel, summary text, or topics.
- **Import & Export**:
  - Export individual summaries as Markdown (`.md`) or structured JSON (`.json`).
  - Export the full archive compendium as Markdown or JSON backup.
  - Import previously exported JSON archive backup files with automatic upsert into SQLite.
- **High-Contrast Minimalist UI**: Built with Tailwind CSS, Plus Jakarta Sans typography, and tabular figures.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Motion
- **Backend**: Node.js 22, Express, `node:sqlite` (native SQLite database)
- **AI Engine**: `@google/genai` (Gemini 3.8 Flash with Search Grounding)
- **Bundler**: Vite

---

## Getting Started

### 1. Clone the repository
```bash
git clone <your-repository-url>
cd youtube-video-summarizer
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment
Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```
Add your Gemini API key (from [aistudio.google.com/apikey](https://aistudio.google.com/apikey)):
```env
GEMINI_API_KEY="AIzaSy..."
```

### 4. Run the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for production
```bash
npm run build
npm start
```

---

## License

Apache-2.0
