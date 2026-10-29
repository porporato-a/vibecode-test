import React, { useState } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  FileText,
  Download,
  ListChecks,
  Quote,
  Compass,
} from 'lucide-react';
import { AnalyzedVideo } from '../types/video';
import { exportVideoMarkdown, exportVideoJSON, formatVideoAsMarkdown } from '../utils/export';

interface SummaryPanelProps {
  video: AnalyzedVideo | null;
  isLoading: boolean;
  onToast: (type: 'success' | 'error', message: string) => void;
}

export const SummaryPanel: React.FC<SummaryPanelProps> = ({
  video,
  isLoading,
  onToast,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyMarkdown = () => {
    if (!video) return;
    const md = formatVideoAsMarkdown(video);
    navigator.clipboard.writeText(md);
    setCopied(true);
    onToast('success', 'Summary copied to clipboard as Markdown');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportMd = () => {
    if (!video) return;
    exportVideoMarkdown(video);
    onToast('success', 'Summary exported as Markdown (.md)');
  };

  const handleExportJson = () => {
    if (!video) return;
    exportVideoJSON(video);
    onToast('success', 'Data exported as JSON');
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#111622] border border-slate-200/90 dark:border-slate-800 rounded-xl p-6 sm:p-8 space-y-6 animate-pulse shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-48"></div>
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-28"></div>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-32"></div>
          <div className="h-20 bg-slate-100 dark:bg-slate-800/50 rounded-lg"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-36"></div>
          <div className="h-10 bg-slate-100 dark:bg-slate-800/50 rounded-lg"></div>
          <div className="h-10 bg-slate-100 dark:bg-slate-800/50 rounded-lg"></div>
          <div className="h-10 bg-slate-100 dark:bg-slate-800/50 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="bg-white dark:bg-[#111622] border border-slate-200/90 dark:border-slate-800 rounded-xl p-8 sm:p-12 text-center text-slate-400 dark:text-slate-500 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800/80 mx-auto flex items-center justify-center text-slate-500 dark:text-slate-400 mb-3">
          <Compass className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Awaiting Target Analysis
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
          Paste any YouTube video or article URL above to generate an executive intelligence summary.
        </p>
      </div>
    );
  }

  const { summary } = video;
  const isWebPage = video.contentType === 'webpage';

  return (
    <div className="bg-white dark:bg-[#111622] border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 sm:p-6 space-y-6 shadow-xs">
      {/* Header and Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              {isWebPage ? 'Unified Page & Video Synthesis' : 'AI Executive Summary'}
            </h3>
          </div>
          {/* Unboxed topic metadata with middots */}
          {summary.topics && summary.topics.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span>Topics:</span>
              {summary.topics.map((topic, i) => (
                <React.Fragment key={topic}>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{topic}</span>
                  {i < summary.topics.length - 1 && (
                    <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={handleCopyMarkdown}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-md transition-colors cursor-pointer shadow-2xs"
            title="Copy as Markdown"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-700 dark:text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            onClick={handleExportMd}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white dark:text-slate-900 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white rounded-md transition-colors cursor-pointer shadow-2xs"
            title="Export summary as Markdown (.md)"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>.MD</span>
          </button>

          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-md transition-colors cursor-pointer shadow-2xs"
            title="Download JSON data"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>.JSON</span>
          </button>
        </div>
      </div>

      {/* 1. Executive Summary Block */}
      <div className="space-y-1.5">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {isWebPage ? 'Executive Synthesis' : 'Executive Takeaway'}
        </h4>
        <div className="p-4 bg-slate-50/80 dark:bg-[#0A0E17]/80 border border-slate-200/60 dark:border-slate-800/80 rounded-lg">
          <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-200 font-normal">
            {summary.executiveSummary}
          </p>
        </div>
      </div>

      {/* 2. Core Bullet Highlights */}
      {summary.coreHighlights && summary.coreHighlights.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-slate-500" />
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {isWebPage ? `Synthesized Highlights (${summary.coreHighlights.length})` : `Core Highlights (${summary.coreHighlights.length})`}
            </h4>
          </div>
          <ul className="space-y-2">
            {summary.coreHighlights.map((point, index) => (
              <li
                key={index}
                className="flex items-start gap-3 p-3 bg-white dark:bg-[#0A0E17]/60 hover:bg-slate-50/80 dark:hover:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800/60 rounded-lg text-sm text-slate-800 dark:text-slate-200 leading-relaxed transition-colors"
              >
                <span className="font-mono text-xs text-slate-400 font-medium pt-0.5 shrink-0 tabular-nums">
                  0{index + 1}.
                </span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 3. Key Takeaways & Action Points */}
      {summary.mainTakeaways && summary.mainTakeaways.length > 0 && (
        <div className="space-y-2.5">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Key Takeaways & Action Points
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {summary.mainTakeaways.map((takeaway, i) => (
              <div
                key={i}
                className="p-3 bg-slate-50/60 dark:bg-[#0A0E17]/40 border border-slate-200/60 dark:border-slate-800/60 rounded-lg text-xs leading-relaxed text-slate-800 dark:text-slate-200 flex items-start gap-2"
              >
                <span className="font-mono text-slate-400 text-xs shrink-0 font-medium pt-0.5">
                  [{i + 1}]
                </span>
                <span>{takeaway}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Memorable Quotes (if present) */}
      {summary.keyQuotes && summary.keyQuotes.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Quote className="w-3.5 h-3.5 text-slate-400" />
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Notable Quotes
            </h4>
          </div>
          <div className="space-y-2">
            {summary.keyQuotes.map((quote, i) => (
              <blockquote
                key={i}
                className="p-3 bg-slate-50/50 dark:bg-[#0A0E17]/40 border-l-2 border-slate-300 dark:border-slate-700 text-xs italic text-slate-700 dark:text-slate-300 leading-relaxed rounded-r-md"
              >
                "{quote}"
              </blockquote>
            ))}
          </div>
        </div>
      )}

      {/* 5. Viewer Notes (if present) */}
      {video.userNotes && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
          <h5 className="text-xs font-medium text-slate-500">
            Viewer Context & Notes
          </h5>
          <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50/60 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800/60 leading-relaxed">
            {video.userNotes}
          </p>
        </div>
      )}
    </div>
  );
};
