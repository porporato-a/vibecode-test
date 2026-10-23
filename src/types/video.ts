export interface VideoSummary {
  executiveSummary: string;
  coreHighlights: string[];
  mainTakeaways: string[];
  topics: string[];
  keyQuotes?: string[];
  pageContextSummary?: string;
}

export interface EmbeddedVideoInfo {
  youtubeId: string;
  url: string;
  title: string;
  authorName?: string;
  thumbnailUrl?: string;
}

export interface AnalyzedVideo {
  id: string;
  contentType?: 'video' | 'webpage';
  youtubeId: string;
  originalUrl: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  duration?: string;
  analyzedAt: string;
  summary: VideoSummary;
  userNotes?: string;
  embeddedVideos?: EmbeddedVideoInfo[];
}

export interface SummarizeRequest {
  url: string;
  notes?: string;
}

export interface SummarizeResponse {
  success: boolean;
  video: AnalyzedVideo;
  archiveCount?: number;
  error?: string;
}

export interface SummarizeWebPageRequest {
  url: string;
  notes?: string;
}
