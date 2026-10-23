import React, { useState, useMemo } from 'react';
import {
  Search,
  Trash2,
  Play,
  RotateCcw,
  Clock,
  Film,
  X,
  ExternalLink,
  Download,
  Globe,
} from 'lucide-react';
import { AnalyzedVideo } from '../types/video';
import { exportVideoMarkdown } from '../utils/export';

interface ArchiveSidebarProps {
  videos: AnalyzedVideo[];
  activeVideoId: string | null;
  onSelectVideo: (video: AnalyzedVideo) => void;
  onDeleteVideo: (id: string) => Promise<void>;
  onResetSamples: () => Promise<void>;
  onClearArchive: () => Promise<void>;
  onToast: (type: 'success' | 'error', message: string) => void;
  onCloseMobile?: () => void;
}

export const ArchiveSidebar: React.FC<ArchiveSidebarProps> = ({
  videos,
  activeVideoId,
  onSelectVideo,
  onDeleteVideo,
  onResetSamples,
  onClearArchive,
  onToast,
  onCloseMobile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');
  const [confirmClear, setConfirmClear] = useState(false);

  const filteredVideos = useMemo(() => {
    let result = [...videos];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (v) =>
          v.title.toLowerCase().includes(q) ||
          v.channelTitle.toLowerCase().includes(q) ||
          v.summary.executiveSummary.toLowerCase().includes(q) ||
          (v.summary.topics && v.summary.topics.some((t) => t.toLowerCase().includes(q)))
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.analyzedAt).getTime() - new Date(b.analyzedAt).getTime();
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return result;
  }, [videos, searchQuery, sortBy]);

  const handleDelete = async (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation();
    try {
      await onDeleteVideo(id);
      onToast('success', `Removed "${title.slice(0, 25)}..." from archive`);
    } catch {
      onToast('error', 'Failed to delete video from archive');
    }
  };

  const handleExportSingle = (e: React.MouseEvent, video: AnalyzedVideo) => {
    e.stopPropagation();
    exportVideoMarkdown(video);
    onToast('success', 'Exported video summary as Markdown');
  };

  const handleClear = async () => {
    try {
      await onClearArchive();
      setConfirmClear(false);
      onToast('success', 'Archive cleared');
    } catch {
      onToast('error', 'Failed to clear archive');
    }
  };

  const handleReset = async () => {
    try {
      await onResetSamples();
      onToast('success', 'Archive restored with sample videos');
    } catch {
      onToast('error', 'Failed to reset archive');
    }
  };

  return (
    <aside className="w-full bg-[#0F1523] border border-slate-800 rounded-xl flex flex-col h-full max-h-[880px] shadow-lg">
      {/* Sidebar Header: Clean title, count, and optional mobile close button only */}
      <div className="p-4 border-b border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-rose-500" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Video Archive
            </h3>
            <span className="text-xs font-mono tabular-nums text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
              {videos.length}
            </span>
          </div>

          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1.5 text-slate-400 hover:text-white rounded"
              aria-label="Close archive drawer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Live Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search titles, creators, topics..."
            className="w-full pl-8 pr-3 py-1.5 bg-[#090D16] border border-slate-800 rounded-md text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Sorting and Filter controls */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-0.5">
          <span className="font-mono tabular-nums">
            {filteredVideos.length} of {videos.length} videos
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[#090D16] border border-slate-800 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-slate-700 cursor-pointer"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="title">Title (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Video Cards List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y divide-slate-800/40">
        {filteredVideos.length === 0 ? (
          <div className="p-6 text-center text-slate-500 space-y-2">
            <Film className="w-6 h-6 mx-auto text-slate-600" />
            <p className="text-xs font-medium text-slate-400">
              {searchQuery ? 'No matching archived videos' : 'Archive is empty'}
            </p>
            <p className="text-[11px] text-slate-500">
              {searchQuery
                ? 'Try a different keyword or creator name'
                : 'Analyze a YouTube video or restore default samples to populate.'}
            </p>
            {!searchQuery && (
              <div className="pt-1">
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restore Samples</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          filteredVideos.map((video) => {
            const isSelected = activeVideoId === video.id || activeVideoId === video.youtubeId;
            const dateStr = new Date(video.analyzedAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            });

            return (
              <div
                key={video.id}
                onClick={() => onSelectVideo(video)}
                className={`pt-2.5 first:pt-0 group relative p-2.5 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#141C2E] border-rose-500/80 shadow-md ring-1 ring-rose-500/40'
                    : 'bg-[#090D16]/80 hover:bg-[#111726] border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex gap-3">
                  {/* Thumbnail with duration / play overlay */}
                  <div className="relative w-24 h-16 bg-slate-900 rounded overflow-hidden shrink-0 border border-slate-800">
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;
                      }}
                    />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 flex items-center justify-center transition-colors">
                      <div className="w-5 h-5 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow">
                        <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {video.contentType === 'webpage' && (
                        <span className="px-1.5 py-0.2 text-[9px] font-semibold bg-blue-950 text-blue-400 border border-blue-800/60 rounded">
                          Web Page
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-semibold text-slate-200 line-clamp-2 leading-tight group-hover:text-white transition-colors">
                      {video.title}
                    </h4>

                    {/* Clean unboxed metadata with typographic separators */}
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                      <span className="truncate max-w-[100px] text-slate-300">
                        {video.channelTitle}
                      </span>
                      <span className="text-slate-600" aria-hidden="true">·</span>
                      {video.contentType === 'webpage' ? (
                        <span className="text-blue-400 font-medium flex items-center gap-1">
                          <Globe className="w-2.5 h-2.5" />
                          <span>{video.embeddedVideos?.length || 1} vids</span>
                        </span>
                      ) : (
                        <span className="shrink-0 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {dateStr}
                        </span>
                      )}
                    </div>

                    {/* Executive summary teaser */}
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-1 leading-snug">
                      {video.summary.executiveSummary}
                    </p>
                  </div>
                </div>

                {/* Card Action footer */}
                <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                  <span className="text-rose-400 font-medium group-hover:underline">
                    {isSelected ? 'Currently Viewing' : 'Load Video & Summary →'}
                  </span>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleExportSingle(e, video)}
                      className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
                      title="Export single video summary as Markdown"
                    >
                      <Download className="w-3 h-3" />
                    </button>
                    <a
                      href={video.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
                      title="Open on YouTube"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <button
                      onClick={(e) => handleDelete(e, video.id, video.title)}
                      className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-colors"
                      title="Delete from archive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sidebar Footer Controls */}
      <div className="p-3 border-t border-slate-800 bg-[#090D16]/50 flex items-center justify-between text-xs">
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          title="Restore sample videos"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Samples</span>
        </button>

        {confirmClear ? (
          <div className="flex items-center gap-2">
            <span className="text-rose-400 text-[11px]">Clear all?</span>
            <button
              onClick={handleClear}
              className="px-2 py-0.5 text-[11px] bg-rose-600 hover:bg-rose-500 text-white rounded font-medium cursor-pointer"
            >
              Confirm
            </button>
            <button
              onClick={() => setConfirmClear(false)}
              className="text-slate-400 hover:text-slate-200 text-[11px] cursor-pointer"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmClear(true)}
            disabled={videos.length === 0}
            className="text-slate-500 hover:text-rose-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            Clear Archive
          </button>
        )}
      </div>
    </aside>
  );
};
