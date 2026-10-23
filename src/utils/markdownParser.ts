import { AnalyzedVideo, EmbeddedVideoInfo } from '../types/video';
import { extractYouTubeId } from './youtube';

export function parseMarkdownToVideos(markdown: string): AnalyzedVideo[] {
  if (!markdown || typeof markdown !== 'string') return [];

  // 1. Check for embedded metadata comment first (100% lossless round-trip)
  const archiveDataMatch = markdown.match(/<!--\s*ARCHIVE_DATA:\s*([\s\S]*?)\s*-->/);
  if (archiveDataMatch && archiveDataMatch[1]) {
    try {
      const parsed = JSON.parse(archiveDataMatch[1]);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      if (parsed && typeof parsed === 'object' && parsed.youtubeId) return [parsed];
    } catch {
      // Fallback to text parsing
    }
  }

  const singleDataMatch = markdown.match(/<!--\s*YOUTUBE_DATA:\s*([\s\S]*?)\s*-->/);
  if (singleDataMatch && singleDataMatch[1]) {
    try {
      const parsed = JSON.parse(singleDataMatch[1]);
      if (parsed && typeof parsed === 'object' && parsed.youtubeId) return [parsed];
    } catch {
      // Fallback to text parsing
    }
  }

  // 2. Check if this is an archive compendium containing multiple items
  const archiveItemRegex = /###\s*(?:\d+\.)?\s*\[([^\]]+)\]\(([^)]+)\)([\s\S]*?)(?=(?:###\s*(?:\d+\.)?\s*\[|$))/g;
  let match: RegExpExecArray | null;
  const compendiumVideos: AnalyzedVideo[] = [];

  while ((match = archiveItemRegex.exec(markdown)) !== null) {
    const rawTitle = match[1].trim();
    const rawUrl = match[2].trim();
    const body = match[3];

    const isWebPage = /Type:\*\*\s*Web Page/i.test(body);
    const yId = extractYouTubeId(rawUrl) || (isWebPage ? 'webpage-ref' : null);
    if (!yId) continue;

    // Extract publisher/channel
    const channelMatch = body.match(/\*\*(?:Channel|Creator|Publisher):\*\*\s*([^\n·]+)/i);
    const channelTitle = channelMatch ? channelMatch[1].trim() : (isWebPage ? 'Web Source' : 'YouTube Creator');

    // Extract date
    const dateMatch = body.match(/\*\*Analyzed:\*\*\s*([^\n\r]+)/i);
    const analyzedAt = dateMatch ? new Date(dateMatch[1].trim()).toISOString() : new Date().toISOString();

    // Extract executive summary
    const summaryMatch = body.match(/\*\*Executive Summary:\*\*\s*([^\n]+(?:\n[^\n#*]+)*)/i) ||
                         body.match(/##\s*Executive Summary\s*\n+([^\n#]+(?:\n[^\n#]+)*)/i);
    const executiveSummary = summaryMatch ? summaryMatch[1].trim() : 'Summary imported from Markdown compendium.';

    // Extract core highlights
    const highlights: string[] = [];
    const hlSection = body.match(/\*\*Core Highlights:\*\*\s*\n([\s\S]*?)(?=\n\*\*|\n##|\n---|---|$)/i) ||
                      body.match(/##\s*Core Highlights\s*\n([\s\S]*?)(?=\n##|\n---|---|$)/i);
    if (hlSection && hlSection[1]) {
      const lines = hlSection[1].split('\n');
      for (const line of lines) {
        const itemMatch = line.match(/^[-*•]\s+(.*)$/);
        if (itemMatch && itemMatch[1].trim()) {
          highlights.push(itemMatch[1].trim());
        }
      }
    }

    compendiumVideos.push({
      id: `imported-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      contentType: isWebPage ? 'webpage' : 'video',
      youtubeId: yId,
      originalUrl: rawUrl,
      title: rawTitle,
      channelTitle,
      thumbnailUrl: yId !== 'webpage-ref' ? `https://img.youtube.com/vi/${yId}/maxresdefault.jpg` : '',
      analyzedAt,
      summary: {
        executiveSummary,
        coreHighlights: highlights.length > 0 ? highlights : [executiveSummary],
        mainTakeaways: [],
        topics: isWebPage ? ['Web Article', 'Imported'] : ['Imported'],
      },
    });
  }

  if (compendiumVideos.length > 0) {
    return compendiumVideos;
  }

  // 3. Parse as single video or single webpage report Markdown
  const isWebPage = /Type:\*\*\s*Web Page/i.test(markdown) || /\*\*Source Webpage:\*\*/i.test(markdown);

  const titleMatch = markdown.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : (isWebPage ? 'Imported Web Page Report' : 'Imported Video');

  let originalUrl = '';
  let yId = '';
  const embeddedVideos: EmbeddedVideoInfo[] = [];

  if (isWebPage) {
    const pageUrlMatch = markdown.match(/\*\*Source Webpage:\*\*\s*([^\s\n]+)/i);
    originalUrl = pageUrlMatch ? pageUrlMatch[1].trim() : '';

    // Extract any embedded video list
    const evSection = markdown.match(/\*\*Embedded Videos[^\n]*\n([\s\S]*?)(?=\n\*\*|\n##|\n---|---|$)/i);
    if (evSection && evSection[1]) {
      const evMatches = evSection[1].matchAll(/\[([^\]]+)\]\(([^)]+)\)/g);
      for (const m of evMatches) {
        const evUrl = m[2].trim();
        const evId = extractYouTubeId(evUrl);
        if (evId) {
          embeddedVideos.push({
            youtubeId: evId,
            url: evUrl,
            title: m[1].trim(),
            thumbnailUrl: `https://img.youtube.com/vi/${evId}/maxresdefault.jpg`,
          });
        }
      }
    }

    yId = embeddedVideos[0]?.youtubeId || 'web-summary-id';
  } else {
    const urlMatch = markdown.match(/\*\*Video URL:\*\*\s*([^\s\n]+)/i) ||
                     markdown.match(/(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]{11}[^\s\n]*)/i);
    originalUrl = urlMatch ? urlMatch[1].trim() : '';
    yId = extractYouTubeId(originalUrl) || '';
  }

  if (!originalUrl && !yId) {
    return [];
  }

  const creatorMatch = markdown.match(/\*\*(?:Creator|Channel|Domain\/Publisher):\*\*\s*([^\n·]+)/i);
  const channelTitle = creatorMatch ? creatorMatch[1].trim() : (isWebPage ? 'Web Publisher' : 'YouTube Creator');

  const topicsMatch = markdown.match(/\*\*Topics:\*\*\s*([^\n]+)/i);
  const topics: string[] = topicsMatch
    ? topicsMatch[1].split(/[·,]/).map((t) => t.trim()).filter(Boolean)
    : ['Imported'];

  const execMatch = markdown.match(/##\s*Executive Summary\s*\n+([\s\S]*?)(?=\n##|$)/i);
  const executiveSummary = execMatch ? execMatch[1].trim() : 'Summary imported from Markdown.';

  const hlMatch = markdown.match(/##\s*Core Highlights\s*\n+([\s\S]*?)(?=\n##|$)/i);
  const coreHighlights: string[] = [];
  if (hlMatch && hlMatch[1]) {
    const lines = hlMatch[1].split('\n');
    for (const line of lines) {
      const bullet = line.match(/^[-*•]\s+(.*)$/) || line.match(/^\d+\.\s+(.*)$/);
      if (bullet && bullet[1].trim()) {
        coreHighlights.push(bullet[1].trim());
      }
    }
  }

  const takeMatch = markdown.match(/##\s*Key Takeaways[^\n]*\n+([\s\S]*?)(?=\n##|$)/i);
  const mainTakeaways: string[] = [];
  if (takeMatch && takeMatch[1]) {
    const lines = takeMatch[1].split('\n');
    for (const line of lines) {
      const bullet = line.match(/^\d+\.\s+(.*)$/) || line.match(/^[-*•]\s+(.*)$/);
      if (bullet && bullet[1].trim()) {
        mainTakeaways.push(bullet[1].trim());
      }
    }
  }

  const quoteMatch = markdown.match(/##\s*Memorable Quotes\s*\n+([\s\S]*?)(?=\n##|$)/i);
  const keyQuotes: string[] = [];
  if (quoteMatch && quoteMatch[1]) {
    const lines = quoteMatch[1].split('\n');
    for (const line of lines) {
      const q = line.match(/^>\s*["“]?([^"”\n]+)["”]?/);
      if (q && q[1].trim()) {
        keyQuotes.push(q[1].trim());
      }
    }
  }

  const notesMatch = markdown.match(/##\s*Viewer Context[^\n]*\n+([\s\S]*?)(?=\n##|\n---|$)/i);
  const userNotes = notesMatch ? notesMatch[1].trim() : undefined;

  return [
    {
      id: isWebPage ? `web-${Date.now()}` : `yt-${yId}-${Date.now()}`,
      contentType: isWebPage ? 'webpage' : 'video',
      youtubeId: yId,
      originalUrl: originalUrl || (yId ? `https://www.youtube.com/watch?v=${yId}` : ''),
      title,
      channelTitle,
      thumbnailUrl: yId && yId !== 'web-summary-id' ? `https://img.youtube.com/vi/${yId}/maxresdefault.jpg` : '',
      analyzedAt: new Date().toISOString(),
      summary: {
        executiveSummary,
        coreHighlights: coreHighlights.length > 0 ? coreHighlights : [executiveSummary],
        mainTakeaways: mainTakeaways.length > 0 ? mainTakeaways : [],
        topics,
        keyQuotes: keyQuotes.length > 0 ? keyQuotes : undefined,
      },
      userNotes,
      embeddedVideos: embeddedVideos.length > 0 ? embeddedVideos : undefined,
    },
  ];
}
