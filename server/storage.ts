import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import { AnalyzedVideo } from '../src/types/video';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'archive.db');
const LEGACY_JSON_FILE = path.join(DATA_DIR, 'archive.json');

const INITIAL_SAMPLES: AnalyzedVideo[] = [
  {
    id: "sample-steve-jobs-stanford",
    youtubeId: "UF8uR6Z6KLc",
    originalUrl: "https://www.youtube.com/watch?v=UF8uR6Z6KLc",
    title: "Steve Jobs' 2005 Stanford Commencement Address",
    channelTitle: "Stanford University",
    thumbnailUrl: "https://img.youtube.com/vi/UF8uR6Z6KLc/maxresdefault.jpg",
    analyzedAt: "2026-03-15T14:30:00.000Z",
    summary: {
      executiveSummary: "Steve Jobs reflects on three pivotal stories from his life: connecting the dots in hindsight, love and loss through being fired from Apple, and confronting mortality to make meaningful decisions. He urges graduates to pursue work they truly love and stay hungry and foolish.",
      coreHighlights: [
        "Connecting the Dots: Dropping out of Reed College allowed him to take calligraphy classes, which directly inspired the typography of the Macintosh computer a decade later.",
        "Love and Loss: Getting ousted from Apple at 30 was devastating but freed him to enter one of the most creative periods of his life, founding NeXT and Pixar.",
        "Confronting Death: Remembering you are going to die is the most reliable tool to avoid the trap of thinking you have something to lose.",
        "Intuition Over Dogma: Do not let the noise of others' opinions drown out your own inner voice and courage.",
        "The Final Charge: 'Stay Hungry. Stay Foolish.' — quoted from the Whole Earth Catalog's final farewell issue."
      ],
      mainTakeaways: [
        "Trust that your disjointed interests and hardships will connect forward into meaningful outcomes.",
        "Rejection or sudden failure can serve as an unexpected catalyst for reinvention and higher mastery.",
        "Your time is finite; do not waste it living someone else's scripted life."
      ],
      topics: ["Leadership", "Career Advice", "Creativity", "Resilience", "Technology"],
      keyQuotes: [
        "You can't connect the dots looking forward; you can only connect them looking backwards.",
        "The only way to do great work is to love what you do.",
        "Stay Hungry. Stay Foolish."
      ]
    }
  },
  {
    id: "sample-karpathy-intro-llms",
    youtubeId: "zjkBMFhNj_g",
    originalUrl: "https://www.youtube.com/watch?v=zjkBMFhNj_g",
    title: "Intro to Large Language Models",
    channelTitle: "Andrej Karpathy",
    thumbnailUrl: "https://img.youtube.com/vi/zjkBMFhNj_g/maxresdefault.jpg",
    analyzedAt: "2026-03-28T09:15:00.000Z",
    summary: {
      executiveSummary: "Andrej Karpathy breaks down how Large Language Models work from first principles: pretraining on internet-scale text compression, fine-tuning for alignment, and their emergence as the next-generation operating system kernel that coordinates tools, memory, and computing.",
      coreHighlights: [
        "Pretraining Phase: Giant neural nets compress terabytes of web text into hundreds of billions of numerical parameters over months of GPU compute.",
        "Supervised Fine-Tuning (SFT): Transitioning the raw document completer into a helpful, obedient assistant through high-quality human Q&A demonstrations.",
        "Reinforcement Learning from Human Feedback (RLHF): Scoring comparative model answers to align with human preferences and factual guardrails.",
        "LLMs as Operating Systems: Rather than mere chatbots, LLMs resemble a new CPU/kernel that orchestrates files, search engines, python interpreters, and memory buffers.",
        "Security Challenges: Highlighting prompt injections, jailbreaks, and data poisoning as ongoing security frontiers."
      ],
      mainTakeaways: [
        "Mental model: View LLMs not as encyclopedias, but as lossy probabilistic text simulators with emerging reasoning capabilities.",
        "System integration: The primary unlock in application design is augmenting models with tool execution, retrieval (RAG), and structured sandboxes."
      ],
      topics: ["Artificial Intelligence", "Machine Learning", "Large Language Models", "System Architecture"],
      keyQuotes: [
        "The LLM is the CPU of a new computing architecture.",
        "Pretraining is where 99% of the compute happens; fine-tuning is where the personality is formed."
      ]
    }
  }
];

let dbInstance: DatabaseSync | null = null;

function getDb(): DatabaseSync {
  if (!dbInstance) {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    dbInstance = new DatabaseSync(DB_PATH);

    // Initialize SQLite schema
    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS videos (
        id TEXT PRIMARY KEY,
        youtube_id TEXT NOT NULL UNIQUE,
        original_url TEXT NOT NULL,
        title TEXT NOT NULL,
        channel_title TEXT NOT NULL,
        thumbnail_url TEXT NOT NULL,
        duration TEXT,
        analyzed_at TEXT NOT NULL,
        summary_json TEXT NOT NULL,
        user_notes TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_videos_analyzed_at ON videos(analyzed_at DESC);
    `);

    // Check if table is empty and seed
    const countRow = dbInstance.prepare(`SELECT count(*) as count FROM videos`).get() as { count: number | bigint };
    const count = Number(countRow?.count || 0);

    if (count === 0) {
      // Check if we can migrate from legacy JSON file
      let seeded = false;
      if (fs.existsSync(LEGACY_JSON_FILE)) {
        try {
          const raw = fs.readFileSync(LEGACY_JSON_FILE, 'utf-8');
          const legacyVideos = JSON.parse(raw);
          if (Array.isArray(legacyVideos) && legacyVideos.length > 0) {
            importVideosInternal(dbInstance, legacyVideos);
            seeded = true;
          }
        } catch (e) {
          console.warn('Failed to migrate legacy JSON to SQLite:', e);
        }
      }

      if (!seeded) {
        importVideosInternal(dbInstance, INITIAL_SAMPLES);
      }
    }
  }
  return dbInstance;
}

function rowToVideo(row: any): AnalyzedVideo {
  let summary: any = {
    executiveSummary: '',
    coreHighlights: [],
    mainTakeaways: [],
    topics: [],
    keyQuotes: [],
  };

  try {
    summary = JSON.parse(row.summary_json);
  } catch (err) {
    console.warn(`Failed to parse summary_json for ${row.id}:`, err);
  }

  const contentType = summary._contentType || 'video';
  const embeddedVideos = summary._embeddedVideos || undefined;
  delete summary._contentType;
  delete summary._embeddedVideos;

  return {
    id: row.id,
    contentType,
    youtubeId: row.youtube_id,
    originalUrl: row.original_url,
    title: row.title,
    channelTitle: row.channel_title,
    thumbnailUrl: row.thumbnail_url,
    duration: row.duration || undefined,
    analyzedAt: row.analyzed_at,
    summary,
    userNotes: row.user_notes || undefined,
    embeddedVideos,
  };
}

function importVideosInternal(db: DatabaseSync, videos: AnalyzedVideo[]): number {
  const insertStmt = db.prepare(`
    INSERT INTO videos (
      id, youtube_id, original_url, title, channel_title, thumbnail_url, duration, analyzed_at, summary_json, user_notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(youtube_id) DO UPDATE SET
      title = excluded.title,
      channel_title = excluded.channel_title,
      thumbnail_url = excluded.thumbnail_url,
      analyzed_at = excluded.analyzed_at,
      summary_json = excluded.summary_json,
      user_notes = excluded.user_notes
  `);

  let count = 0;
  for (const v of videos) {
    if (!v.youtubeId) continue;
    const summaryObj: any = {
      ...(v.summary || {}),
      _contentType: v.contentType || 'video',
    };
    if (v.embeddedVideos && v.embeddedVideos.length > 0) {
      summaryObj._embeddedVideos = v.embeddedVideos;
    }
    const summaryJson = JSON.stringify(summaryObj);
    insertStmt.run(
      v.id || `yt-${v.youtubeId}-${Date.now()}`,
      v.youtubeId,
      v.originalUrl || `https://www.youtube.com/watch?v=${v.youtubeId}`,
      v.title || 'Untitled Video',
      v.channelTitle || 'Unknown Channel',
      v.thumbnailUrl || `https://img.youtube.com/vi/${v.youtubeId}/maxresdefault.jpg`,
      v.duration || null,
      v.analyzedAt || new Date().toISOString(),
      summaryJson,
      v.userNotes || null
    );
    count++;
  }
  return count;
}

export function getArchivedVideos(): AnalyzedVideo[] {
  const db = getDb();
  const rows = db.prepare(`SELECT * FROM videos ORDER BY analyzed_at DESC`).all() as any[];
  return rows.map(rowToVideo);
}

export function saveVideoToArchive(video: AnalyzedVideo): AnalyzedVideo[] {
  const db = getDb();
  importVideosInternal(db, [video]);
  return getArchivedVideos();
}

export function importVideos(videos: AnalyzedVideo[]): { importedCount: number; videos: AnalyzedVideo[] } {
  const db = getDb();
  const importedCount = importVideosInternal(db, videos);
  return {
    importedCount,
    videos: getArchivedVideos(),
  };
}

export function deleteVideoFromArchive(idOrYoutubeId: string): AnalyzedVideo[] {
  const db = getDb();
  db.prepare(`DELETE FROM videos WHERE id = ? OR youtube_id = ?`).run(idOrYoutubeId, idOrYoutubeId);
  return getArchivedVideos();
}

export function clearArchive(): AnalyzedVideo[] {
  const db = getDb();
  db.prepare(`DELETE FROM videos`).run();
  return [];
}

export function resetArchiveToSamples(): AnalyzedVideo[] {
  const db = getDb();
  db.prepare(`DELETE FROM videos`).run();
  importVideosInternal(db, INITIAL_SAMPLES);
  return getArchivedVideos();
}
