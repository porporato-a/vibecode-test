import express, { Request, Response } from 'express';
import http from 'http';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { extractYouTubeId } from './src/utils/youtube';
import {
  fetchYouTubeMetadata,
  summarizeYouTubeVideo,
  summarizeWebPageWithVideos,
} from './server/gemini';
import {
  getArchivedVideos,
  saveVideoToArchive,
  deleteVideoFromArchive,
  resetArchiveToSamples,
  clearArchive,
  importVideos,
} from './server/storage';
import { AnalyzedVideo } from './src/types/video';

dotenv.config();

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  app.use(express.json());

  // API Routes
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Get full archive
  app.get('/api/archive', (_req: Request, res: Response) => {
    try {
      const videos = getArchivedVideos();
      res.json({ success: true, videos });
    } catch (err: any) {
      console.error('Error in GET /api/archive:', err);
      res.status(500).json({ success: false, error: 'Failed to retrieve archive' });
    }
  });

  // Save/Update video in archive
  app.post('/api/archive', (req: Request, res: Response) => {
    try {
      const video: AnalyzedVideo = req.body;
      if (!video || !video.youtubeId) {
        return res.status(400).json({ success: false, error: 'Invalid video payload' });
      }
      const updatedList = saveVideoToArchive(video);
      res.json({ success: true, videos: updatedList });
    } catch (err: any) {
      console.error('Error in POST /api/archive:', err);
      res.status(500).json({ success: false, error: 'Failed to save video to archive' });
    }
  });

  // Delete video from archive
  app.delete('/api/archive/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updatedList = deleteVideoFromArchive(id);
      res.json({ success: true, videos: updatedList });
    } catch (err: any) {
      console.error('Error in DELETE /api/archive/:id:', err);
      res.status(500).json({ success: false, error: 'Failed to delete video' });
    }
  });

  // Reset archive to default samples
  app.post('/api/archive/reset', (_req: Request, res: Response) => {
    try {
      const samples = resetArchiveToSamples();
      res.json({ success: true, videos: samples });
    } catch (err: any) {
      console.error('Error in POST /api/archive/reset:', err);
      res.status(500).json({ success: false, error: 'Failed to reset archive' });
    }
  });

  // Clear archive
  app.post('/api/archive/clear', (_req: Request, res: Response) => {
    try {
      const empty = clearArchive();
      res.json({ success: true, videos: empty });
    } catch (err: any) {
      console.error('Error in POST /api/archive/clear:', err);
      res.status(500).json({ success: false, error: 'Failed to clear archive' });
    }
  });

  // Import videos into SQLite archive
  app.post('/api/archive/import', (req: Request, res: Response) => {
    try {
      const payload = req.body;
      let rawList: any[] = [];

      if (Array.isArray(payload)) {
        rawList = payload;
      } else if (payload && Array.isArray(payload.videos)) {
        rawList = payload.videos;
      } else if (payload && typeof payload === 'object') {
        rawList = [payload];
      }

      if (rawList.length === 0) {
        return res.status(400).json({ success: false, error: 'No video records provided to import.' });
      }

      // Normalize records
      const validVideos: AnalyzedVideo[] = [];
      for (const item of rawList) {
        const yId = item.youtubeId || (item.originalUrl ? extractYouTubeId(item.originalUrl) : null);
        if (yId) {
          validVideos.push({
            id: item.id || `yt-${yId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            youtubeId: yId,
            originalUrl: item.originalUrl || `https://www.youtube.com/watch?v=${yId}`,
            title: item.title || 'Imported Video Analysis',
            channelTitle: item.channelTitle || 'YouTube Creator',
            thumbnailUrl: item.thumbnailUrl || `https://img.youtube.com/vi/${yId}/maxresdefault.jpg`,
            duration: item.duration,
            analyzedAt: item.analyzedAt || new Date().toISOString(),
            summary: item.summary || {
              executiveSummary: item.executiveSummary || 'Imported summary.',
              coreHighlights: Array.isArray(item.coreHighlights) ? item.coreHighlights : [],
              mainTakeaways: Array.isArray(item.mainTakeaways) ? item.mainTakeaways : [],
              topics: Array.isArray(item.topics) ? item.topics : ['Imported'],
              keyQuotes: Array.isArray(item.keyQuotes) ? item.keyQuotes : [],
            },
            userNotes: item.userNotes,
          });
        }
      }

      if (validVideos.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No valid video records recognized. Each record must contain a youtubeId or valid YouTube URL.',
        });
      }

      const { importedCount, videos } = importVideos(validVideos);
      res.json({
        success: true,
        importedCount,
        videos,
      });
    } catch (err: any) {
      console.error('Error in POST /api/archive/import:', err);
      res.status(500).json({ success: false, error: 'Failed to import archive: ' + err.message });
    }
  });

  // Fetch oEmbed info only (fast preview)
  app.get('/api/video-info', async (req: Request, res: Response) => {
    try {
      const rawUrl = req.query.url as string;
      const videoId = extractYouTubeId(rawUrl);
      if (!videoId) {
        return res.status(400).json({ success: false, error: 'Invalid YouTube URL or ID' });
      }
      const meta = await fetchYouTubeMetadata(videoId);
      res.json({ success: true, videoId, meta });
    } catch (err: any) {
      console.error('Error in /api/video-info:', err);
      res.status(500).json({ success: false, error: 'Failed to fetch video information' });
    }
  });

  // AI Summarize Endpoint
  app.post('/api/summarize', async (req: Request, res: Response) => {
    try {
      const { url, notes } = req.body;
      if (!url) {
        return res.status(400).json({ success: false, error: 'YouTube URL is required' });
      }

      const videoId = extractYouTubeId(url);
      if (!videoId) {
        return res.status(400).json({
          success: false,
          error: 'Could not extract a valid YouTube video ID. Please check the URL format.',
        });
      }

      // Step 1: Fetch metadata (title, author, thumbnail)
      const meta = await fetchYouTubeMetadata(videoId);

      // Step 2: Call server-side Gemini 3.8 Flash to synthesize summary
      const summary = await summarizeYouTubeVideo(videoId, meta, notes);

      // Step 3: Construct AnalyzedVideo object
      const analyzedVideo: AnalyzedVideo = {
        id: `yt-${videoId}-${Date.now()}`,
        youtubeId: videoId,
        originalUrl: url.trim(),
        title: meta.title,
        channelTitle: meta.author_name,
        thumbnailUrl: meta.thumbnail_url,
        analyzedAt: new Date().toISOString(),
        summary,
        userNotes: notes || undefined,
      };

      // Step 4: Persist to backend archive
      const updatedArchive = saveVideoToArchive(analyzedVideo);

      res.json({
        success: true,
        video: analyzedVideo,
        archiveCount: updatedArchive.length,
      });
    } catch (err: any) {
      console.error('Error in /api/summarize:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'An unexpected error occurred while analyzing the video with Gemini.',
      });
    }
  });

  // AI Web Page with Embedded Videos Summarize Endpoint
  app.post('/api/summarize-webpage', async (req: Request, res: Response) => {
    try {
      const { url, notes } = req.body;
      if (!url || typeof url !== 'string' || !url.trim().startsWith('http')) {
        return res.status(400).json({
          success: false,
          error: 'Please enter a valid HTTP or HTTPS web page URL.',
        });
      }

      const analyzedReport = await summarizeWebPageWithVideos(url.trim(), notes);
      const updatedArchive = saveVideoToArchive(analyzedReport);

      res.json({
        success: true,
        video: analyzedReport,
        archiveCount: updatedArchive.length,
      });
    } catch (err: any) {
      console.error('Error in /api/summarize-webpage:', err);
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to synthesize web page with embedded videos.',
      });
    }
  });

  // Development vs Production serving
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const portArgIndex = process.argv.indexOf('--port');
  const cliPort = portArgIndex !== -1 ? parseInt(process.argv[portArgIndex + 1], 10) : undefined;
  const PORT = cliPort || Number(process.env.PORT) || 3000;

  const runningServer = httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`  ➜  Local:   http://localhost:${PORT}/`);
    console.log(`YouTube Intelligence Workspace server ready on port ${PORT}`);
  });

  const shutdown = () => {
    runningServer.close(() => {
      process.exit(0);
    });
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer().catch((err) => {
  console.error('Fatal server boot error:', err);
  process.exit(1);
});
