import React, { useState } from 'react';
import { Search, Sparkles, Loader2, Clipboard, ChevronDown, ChevronUp, Youtube, Globe } from 'lucide-react';
import { extractYouTubeId } from '../utils/youtube';

interface UrlInputBarProps {
  onAnalyze: (url: string, notes?: string, mode?: 'video' | 'webpage') => Promise<void>;
  isLoading: boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export const UrlInputBar: React.FC<UrlInputBarProps> = ({
  onAnalyze,
  isLoading,
  inputRef,
}) => {
  const [mode, setMode] = useState<'video' | 'webpage'>('video');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInputError(null);

    const trimmed = url.trim();
    if (!trimmed) {
      setInputError(mode === 'video' ? 'Please enter a YouTube video URL or ID.' : 'Please enter a web page URL.');
      return;
    }

    if (mode === 'video') {
      const videoId = extractYouTubeId(trimmed);
      if (!videoId) {
        setInputError('Invalid YouTube URL. Please provide a standard YouTube video link, youtu.be link, or Shorts URL.');
        return;
      }
    } else {
      if (!/^https?:\/\//i.test(trimmed)) {
        setInputError('Please enter a valid web page URL starting with http:// or https://');
        return;
      }
    }

    try {
      await onAnalyze(trimmed, notes.trim() || undefined, mode);
    } catch {
      // Handled by parent toast
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        setInputError(null);
      }
    } catch {
      // Clipboard unavailable
    }
  };

  return (
    <div className="w-full bg-white dark:bg-[#111622] border border-slate-200/90 dark:border-slate-800/90 rounded-xl p-4 sm:p-5 shadow-xs transition-all space-y-4">
      {/* Mode Selector - Minimal Segmented Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 dark:border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Target:
          </span>
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => {
                setMode('video');
                setInputError(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                mode === 'video'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Youtube className="w-3.5 h-3.5" />
              <span>YouTube Video</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('webpage');
                setInputError(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                mode === 'webpage'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Web Page & Videos</span>
            </button>
          </div>
        </div>

        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          {mode === 'video'
            ? 'Synthesizes video into key takeaways'
            : 'Scans article and synthesizes all embedded videos'}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              {mode === 'video' ? <Search className="w-4 h-4" /> : <Globe className="w-4 h-4 text-slate-600 dark:text-slate-400" />}
            </div>
            <input
              ref={inputRef}
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (inputError) setInputError(null);
              }}
              placeholder={
                mode === 'video'
                  ? 'Paste YouTube link (e.g. youtube.com/watch?v=... or youtu.be/...)'
                  : 'Paste article or webpage URL (e.g. https://circuloos.eu/ramp-...)'
              }
              disabled={isLoading}
              className="w-full pl-10 pr-24 py-2.5 sm:py-3 bg-slate-50/70 dark:bg-[#0A0E17] border border-slate-200 dark:border-slate-700/80 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-[#0A0E17] focus:border-slate-900 dark:focus:border-slate-300 focus:ring-1 focus:ring-slate-900/10 dark:focus:ring-slate-300/10 transition-colors disabled:opacity-50"
            />
            {/* Quick paste button inside input */}
            <button
              type="button"
              onClick={handlePaste}
              disabled={isLoading}
              className="absolute inset-y-1.5 right-1.5 px-2.5 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700/60 shadow-2xs transition-colors disabled:opacity-40 cursor-pointer"
              title="Paste from clipboard"
            >
              <Clipboard className="w-3 h-3" />
              <span className="hidden sm:inline">Paste</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="flex items-center justify-center gap-2 px-5 py-2.5 sm:py-3 bg-slate-900 hover:bg-slate-800 active:bg-black dark:bg-slate-100 dark:hover:bg-white dark:active:bg-slate-200 text-white dark:text-slate-900 text-sm font-medium rounded-lg shadow-2xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{mode === 'video' ? 'Analyze Video' : 'Synthesize Page'}</span>
              </>
            )}
          </button>
        </div>

        {inputError && (
          <p className="text-xs text-rose-600 dark:text-rose-400 px-1 font-medium">{inputError}</p>
        )}

        {/* Context / User notes toggle */}
        <div className="pt-0.5">
          <button
            type="button"
            onClick={() => setShowNotes(!showNotes)}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <span>{showNotes ? 'Hide focus notes' : '+ Add custom context or specific focus questions (optional)'}</span>
            {showNotes ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showNotes && (
            <div className="mt-2.5">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional: Mention specific topics to focus on, questions to answer, or paste key excerpts..."
                rows={2}
                disabled={isLoading}
                className="w-full p-3 bg-slate-50/70 dark:bg-[#0A0E17] border border-slate-200 dark:border-slate-700/80 rounded-lg text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-[#0A0E17] focus:border-slate-900 dark:focus:border-slate-400 focus:ring-1 focus:ring-slate-900/10 transition-colors leading-relaxed"
              />
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
