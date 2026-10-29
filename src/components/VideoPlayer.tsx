import React, { useState } from 'react';
import { ExternalLink, Copy, Check, Tv2, Globe, Play, Youtube } from 'lucide-react';
import { AnalyzedVideo } from '../types/video';
import { getYouTubeEmbedUrl, getYouTubeWatchUrl } from '../utils/youtube';

interface VideoPlayerProps {
  video: AnalyzedVideo | null;
  onCopyLink?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ video }) => {
  const [copied, setCopied] = useState(false);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);

  if (!video) {
    return (
      <div className="w-full aspect-video bg-white dark:bg-[#111622] border border-slate-200/90 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-6 text-center shadow-xs">
        <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center mb-2.5 text-slate-500 dark:text-slate-400">
          <Tv2 className="w-5 h-5" />
        </div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No report or video selected</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
          Paste any YouTube video or web page URL above, or pick a saved item from the archive.
        </p>
      </div>
    );
  }

  const isWebPage = video.contentType === 'webpage';
  const hasMultipleVideos = isWebPage && video.embeddedVideos && video.embeddedVideos.length > 1;

  // Active playing video (defaults to first embedded video or video.youtubeId)
  const currentEmbedded = isWebPage && video.embeddedVideos && video.embeddedVideos[selectedVideoIndex]
    ? video.embeddedVideos[selectedVideoIndex]
    : null;

  const currentYoutubeId = currentEmbedded ? currentEmbedded.youtubeId : video.youtubeId;
  const currentTitle = currentEmbedded ? currentEmbedded.title : video.title;

  const isValidVideo = Boolean(
    currentYoutubeId &&
    !currentYoutubeId.startsWith('web-') &&
    currentYoutubeId !== 'webpage-ref' &&
    currentYoutubeId.length === 11
  );

  const embedUrl = isValidVideo ? getYouTubeEmbedUrl(currentYoutubeId) : '';
  const watchUrl = isValidVideo ? getYouTubeWatchUrl(currentYoutubeId) : video.originalUrl;

  const handleCopy = () => {
    navigator.clipboard.writeText(isWebPage ? video.originalUrl : watchUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedDate = new Date(video.analyzedAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="space-y-3">
      {/* If Web Page with multiple videos, show video switcher bar */}
      {hasMultipleVideos && (
        <div className="bg-white dark:bg-[#111622] border border-slate-200/90 dark:border-slate-800 rounded-lg p-2.5 flex items-center gap-2 overflow-x-auto shadow-2xs">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400 shrink-0 flex items-center gap-1 pl-1">
            <Globe className="w-3.5 h-3.5" />
            <span>Videos ({video.embeddedVideos?.length}):</span>
          </span>
          <div className="flex items-center gap-1.5 min-w-0">
            {video.embeddedVideos?.map((ev, idx) => (
              <button
                key={ev.youtubeId + idx}
                type="button"
                onClick={() => setSelectedVideoIndex(idx)}
                className={`px-2.5 py-1 text-xs rounded-md transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  selectedVideoIndex === idx
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-medium shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title={ev.title}
              >
                <Play className="w-2.5 h-2.5 fill-current" />
                <span className="max-w-[180px] truncate">{ev.title || `Video ${idx + 1}`}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 16:9 Responsive Embed Container or Article Hero Header */}
      {isValidVideo ? (
        <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
          <iframe
            key={currentYoutubeId}
            src={embedUrl}
            title={currentTitle}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 w-full h-full border-0"
          />
        </div>
      ) : (
        <div className="w-full bg-white dark:bg-[#111622] border border-slate-200/90 dark:border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center text-center shadow-xs space-y-3.5">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
            <Globe className="w-6 h-6" />
          </div>
          <div className="max-w-xl space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Web Article Report
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
              {video.title}
            </h3>
            <p className="text-xs text-slate-500">
              Source: <span className="text-slate-700 dark:text-slate-300 font-medium">{video.channelTitle}</span> · Analyzed {formattedDate}
            </p>
          </div>
          <div className="pt-1">
            <a
              href={video.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-medium rounded-lg transition-colors cursor-pointer shadow-2xs"
            >
              <span>View Source Webpage</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* Video Context & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pt-1">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            {isWebPage ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                <Globe className="w-3 h-3" />
                <span>Web Page</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/40 shrink-0">
                <Youtube className="w-3 h-3 fill-current" />
                <span>YouTube</span>
              </span>
            )}
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-snug line-clamp-2">
              {video.title}
            </h2>
          </div>

          {/* Zero-pill metadata with subtle separators */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium text-slate-700 dark:text-slate-300">{video.channelTitle}</span>
            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
            <span>Analyzed {formattedDate}</span>
            {isWebPage && video.embeddedVideos && video.embeddedVideos.length > 0 && (
              <>
                <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">{video.embeddedVideos.length} Embedded Videos</span>
              </>
            )}
            {!isWebPage && isValidVideo && (
              <>
                <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
                <span className="font-mono tabular-nums text-slate-400 dark:text-slate-500">ID: {video.youtubeId}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-md transition-colors cursor-pointer shadow-2xs"
            title={isWebPage ? 'Copy web page link' : 'Copy YouTube video link'}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-700 dark:text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy Link</span>
              </>
            )}
          </button>

          {isWebPage ? (
            <a
              href={video.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-md transition-colors cursor-pointer shadow-2xs"
              title="Open original web page in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              <span>Open Source</span>
            </a>
          ) : (
            <a
              href={watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-md transition-colors cursor-pointer shadow-2xs"
              title="Open on YouTube in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              <span>Open YouTube</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
