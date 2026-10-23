import { GoogleGenAI } from '@google/genai';
import { VideoSummary } from '../src/types/video';

// Initialize Gemini client strictly with server environment variable
const getGenAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server. Please ensure the API key is set in AI Studio secrets.');
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

export interface VideoMetadata {
  title: string;
  author_name: string;
  thumbnail_url: string;
  html?: string;
}

export async function fetchYouTubeMetadata(videoId: string): Promise<VideoMetadata> {
  const defaultMeta: VideoMetadata = {
    title: `YouTube Video (${videoId})`,
    author_name: 'YouTube Creator',
    thumbnail_url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
  };

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetch(oembedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (res.ok) {
      const data = await res.json();
      return {
        title: data.title || defaultMeta.title,
        author_name: data.author_name || defaultMeta.author_name,
        thumbnail_url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        html: data.html,
      };
    }
  } catch (err) {
    console.warn(`Could not fetch oEmbed for ${videoId}, using defaults:`, err);
  }

  return defaultMeta;
}

export async function summarizeYouTubeVideo(
  videoId: string,
  meta: VideoMetadata,
  userNotes?: string
): Promise<VideoSummary> {
  const ai = getGenAIClient();

  const prompt = `
You are an expert executive intelligence analyst. Analyze this YouTube video and generate a crisp, high-impact summary.

Video Details:
- Title: "${meta.title}"
- Creator/Channel: "${meta.author_name}"
- YouTube Video ID: "${videoId}"
- YouTube URL: "https://www.youtube.com/watch?v=${videoId}"
${userNotes ? `- Additional Context/Notes from Viewer: "${userNotes}"` : ''}

Your response MUST be a valid JSON object matching the following structure without any markdown formatting or surrounding backticks:
{
  "executiveSummary": "A concise 2 to 3 sentence executive overview summarizing the core thesis, main problem addressed, and overarching conclusion of the video.",
  "coreHighlights": [
    "Highlight 1: Explanation of first major point or topic",
    "Highlight 2: Explanation of second major point or key argument",
    "Highlight 3: Explanation of third major point or practical insight",
    "Highlight 4: Additional core highlight or takeaway",
    "Highlight 5: Additional core highlight or takeaway"
  ],
  "mainTakeaways": [
    "Key actionable takeaway or strategic principle",
    "Second actionable takeaway or lesson"
  ],
  "topics": ["Topic 1", "Topic 2", "Topic 3", "Topic 4"],
  "keyQuotes": [
    "Notable statement or central quote from the video"
  ]
}

Instructions:
1. "executiveSummary" must be punchy, clear, and direct (2-3 sentences max).
2. "coreHighlights" must be between 4 and 6 insightful, structured bullet points that capture the meat of the discussion.
3. "mainTakeaways" must highlight 2 to 4 practical conclusions or action items.
4. "topics" should contain 3 to 5 categorical tags (e.g. Artificial Intelligence, Productivity, Business).
5. Ensure factual accuracy about the video and its speaker.
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.3,
      },
    });

    const textOutput = response.text || '';
    
    // Clean potential code fences
    let cleaned = textOutput.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(cleaned);

    return {
      executiveSummary: parsed.executiveSummary || 'No executive summary provided.',
      coreHighlights: Array.isArray(parsed.coreHighlights) ? parsed.coreHighlights : [],
      mainTakeaways: Array.isArray(parsed.mainTakeaways) ? parsed.mainTakeaways : [],
      topics: Array.isArray(parsed.topics) ? parsed.topics : ['Video Analysis'],
      keyQuotes: Array.isArray(parsed.keyQuotes) ? parsed.keyQuotes : [],
    };
  } catch (err: any) {
    console.error('Gemini summarization error:', err);
    throw new Error(`Failed to generate video summary: ${err?.message || err}`);
  }
}

export function extractYouTubeIdsFromHtml(html: string): string[] {
  if (!html || typeof html !== 'string') return [];
  const ids = new Set<string>();

  // Normalize escaped backslashes, HTML entities, and percent encoding
  const normalized = html
    .replaceAll('\\/', '/')
    .replaceAll('\\\\/', '/')
    .replaceAll('&quot;', '"')
    .replaceAll('&#039;', "'")
    .replaceAll('&#39;', "'")
    .replaceAll('&#34;', '"')
    .replaceAll('&amp;', '&')
    .replaceAll('%2F', '/')
    .replaceAll('%2f', '/')
    .replaceAll('%3F', '?')
    .replaceAll('%3f', '?')
    .replaceAll('%3D', '=')
    .replaceAll('%3d', '=')
    .replaceAll('%3A', ':')
    .replaceAll('%3a', ':');

  const patterns = [
    // 1. youtu.be/<id>
    /(?:https?:)?\/{1,2}(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})(?:[?&#/]|$)/gi,
    // 2. youtube.com/watch?v=<id> or &v=<id>
    /[?&]v=([a-zA-Z0-9_-]{11})(?:[&#]|$)/gi,
    // 3. /embed/<id>, /v/<id>, /shorts/<id>, /live/<id>
    /\/(?:embed|v|shorts|live)\/([a-zA-Z0-9_-]{11})(?:[?&#/]|$)/gi,
    // 4. vi/<id>/ (thumbnail URL)
    /\/vi\/([a-zA-Z0-9_-]{11})\//gi,
    // 5. JSON / data attributes like youtube_url: "https://youtu.be/<id>" or "video_id": "<id>"
    /(?:video_id|data-video-id|data-youtube-id|videoid)["':=\s]+["']?([a-zA-Z0-9_-]{11})["'&\s]/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(normalized)) !== null) {
      if (match[1] && match[1].length === 11 && !ids.has(match[1])) {
        if (/^[a-zA-Z0-9_-]{11}$/.test(match[1])) {
          ids.add(match[1]);
        }
      }
    }
  }

  return Array.from(ids);
}

export async function summarizeWebPageWithVideos(
  webPageUrl: string,
  userNotes?: string
) {
  let html = '';
  let domain = 'Web Source';
  try {
    domain = new URL(webPageUrl).hostname.replace(/^www\./, '');
  } catch {
    domain = 'Web Source';
  }

  // 1. Attempt to fetch HTML of target webpage
  try {
    const res = await fetch(webPageUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (res.ok) {
      html = await res.text();
    }
  } catch (err) {
    console.warn(`Direct fetch for ${webPageUrl} failed, will rely on Search grounding:`, err);
  }

  // 2. Discover embedded YouTube videos
  const videoIds = html ? extractYouTubeIdsFromHtml(html) : [];

  // 3. Extract title and clean text
  let pageTitle = '';
  if (html) {
    const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
    const titleTagMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);

    if (ogTitleMatch && ogTitleMatch[1]) {
      pageTitle = ogTitleMatch[1].trim();
    } else if (titleTagMatch && titleTagMatch[1]) {
      pageTitle = titleTagMatch[1].trim();
    } else if (h1Match && h1Match[1]) {
      pageTitle = h1Match[1].replace(/<[^>]+>/g, '').trim();
    }
  }

  if (!pageTitle) {
    pageTitle = `${domain} Article`;
  }

  // Clean article text (strip scripts, styles, navs, tags)
  let cleanText = '';
  if (html) {
    cleanText = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
      .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '')
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleanText.length > 7000) {
      cleanText = cleanText.slice(0, 7000) + '...';
    }
  }

  // 4. Fetch metadata for discovered embedded videos (if any)
  const embeddedVideos: any[] = [];
  const primaryVideoIds = videoIds.slice(0, 8);

  for (const vId of primaryVideoIds) {
    try {
      const meta = await fetchYouTubeMetadata(vId);
      embeddedVideos.push({
        youtubeId: vId,
        url: `https://www.youtube.com/watch?v=${vId}`,
        title: meta.title,
        authorName: meta.author_name,
        thumbnailUrl: meta.thumbnail_url,
      });
    } catch {
      embeddedVideos.push({
        youtubeId: vId,
        url: `https://www.youtube.com/watch?v=${vId}`,
        title: `YouTube Video (${vId})`,
      });
    }
  }

  const hasEmbeddedVideos = embeddedVideos.length > 0;
  const primaryVideo = hasEmbeddedVideos ? embeddedVideos[0] : null;

  // 5. Synthesize unified report via Gemini 3.8 Flash with Google Search Grounding
  const ai = getGenAIClient();
  const videosListText = hasEmbeddedVideos
    ? embeddedVideos
        .map((v, i) => `${i + 1}. "${v.title}" by ${v.authorName || 'Creator'} (${v.url})`)
        .join('\n')
    : 'No embedded videos detected on page. Synthesize the article narrative directly.';

  const prompt = `
You are an elite research intelligence analyst. Synthesize a comprehensive, high-impact executive report for this web page${hasEmbeddedVideos ? ` and its ${embeddedVideos.length} embedded YouTube video(s)` : ''}.

Webpage Details:
- Webpage Title: "${pageTitle}"
- Source URL: "${webPageUrl}"
- Publisher/Domain: "${domain}"
${userNotes ? `- Viewer Context & Focus Notes: "${userNotes}"` : ''}

${hasEmbeddedVideos ? `Embedded YouTube Videos Discovered in Page:\n${videosListText}\n` : 'Focus: Comprehensive synthesis of the web article content.'}

${cleanText ? `Extracted Page Context & Narrative Excerpt:\n"${cleanText}"\n` : `Please use Google Search grounding to retrieve the core context and narrative from "${webPageUrl}".`}

Task:
Produce a cohesive executive report synthesizing the key arguments, findings, and concepts${hasEmbeddedVideos ? ' connecting the article with the embedded videos' : ' of this article'}.

Your response MUST be a valid JSON object matching the following structure without any markdown formatting or surrounding backticks:
{
  "executiveSummary": "A punchy 2 to 3 sentence executive overview capturing the core premise and overarching conclusion of the webpage${hasEmbeddedVideos ? ' and how the embedded video(s) illustrate or advance the topic' : ''}.",
  "coreHighlights": [
    "Highlight 1: Major insight from the article",
    "Highlight 2: Key concept, breakdown, or case study presented",
    "Highlight 3: Crucial evidence, methodology, or argument",
    "Highlight 4: Critical perspective or solution highlighted",
    "Highlight 5: Additional unified takeaway"
  ],
  "mainTakeaways": [
    "Actionable strategic takeaway or principle from the synthesis",
    "Second actionable conclusion"
  ],
  "topics": ["Topic 1", "Topic 2", "Topic 3", "Topic 4"],
  "keyQuotes": [
    "Memorable quote or striking statement from the page or discussions"
  ]
}

Instructions:
1. "executiveSummary" must be clear, authoritative, and direct (2-3 sentences max).
2. "coreHighlights" must be between 4 and 6 deep, informative bullet points.
3. "mainTakeaways" must deliver practical conclusions.
4. "topics" should contain 3 to 5 categorical tags.
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.3,
      },
    });

    const textOutput = response.text || '';
    let cleaned = textOutput.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(cleaned);

    const summary = {
      executiveSummary: parsed.executiveSummary || `Executive synthesis of ${pageTitle}.`,
      coreHighlights: Array.isArray(parsed.coreHighlights) ? parsed.coreHighlights : [],
      mainTakeaways: Array.isArray(parsed.mainTakeaways) ? parsed.mainTakeaways : [],
      topics: Array.isArray(parsed.topics) ? parsed.topics : ['Web Article', 'Intelligence Report'],
      keyQuotes: Array.isArray(parsed.keyQuotes) ? parsed.keyQuotes : [],
    };

    return {
      id: `web-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      contentType: 'webpage' as const,
      youtubeId: primaryVideo ? primaryVideo.youtubeId : `web-${Date.now().toString(36)}`,
      originalUrl: webPageUrl,
      title: pageTitle,
      channelTitle: domain,
      thumbnailUrl: primaryVideo ? (primaryVideo.thumbnailUrl || `https://img.youtube.com/vi/${primaryVideo.youtubeId}/maxresdefault.jpg`) : '',
      analyzedAt: new Date().toISOString(),
      summary,
      userNotes: userNotes || undefined,
      embeddedVideos: embeddedVideos.length > 0 ? embeddedVideos : undefined,
    };
  } catch (err: any) {
    console.error('Gemini webpage summarization error:', err);
    throw new Error(`Failed to synthesize webpage report: ${err?.message || err}`);
  }
}
