import React, { useState } from 'react';
import { Copy, Check, Download, FileText, Sparkles, Quote, ListChecks, Target } from 'lucide-react';
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
    onToast('success', `Exported "${video.title.slice(0, 30)}..." as Markdown`);
  };

  const handleExportJson = () => {
    if (!video) return;
    exportVideoJSON(video);
    onToast('success', `Exported "${video.title.slice(0, 30)}..." as JSON`);
  };

  if (isLoading) {
    return (
      <div className="bg-[#0F1523] border border-slate-800 rounded-xl p-6 space-y-6 animate-pulse">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="h-5 w-40 bg-slate-800 rounded"></div>
          <div className="h-8 w-24 bg-slate-800 rounded"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 w-32 bg-slate-800 rounded"></div>
          <div className="h-16 w-full bg-slate-800/60 rounded"></div>
        </div>
        <div className="space-y-3">
          <div className="h-4 w-36 bg-slate-800 rounded"></div>
          <div className="h-10 w-full bg-slate-800/40 rounded"></div>
          <div className="h-10 w-full bg-slate-800/40 rounded"></div>
          <div className="h-10 w-full bg-slate-800/40 rounded"></div>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="bg-[#0F1523] border border-slate-800 rounded-xl p-8 text-center text-slate-500">
        <Sparkles className="w-8 h-8 mx-auto mb-3 text-slate-600" />
        <h3 className="text-sm font-semibold text-slate-300">No Summary Available</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Enter a YouTube link above and click Analyze Video to generate an executive overview and core highlights.
        </p>
      </div>
    );
  }

  const { summary } = video;
  const isWebPage = video.contentType === 'webpage';

  return (
    <div className="bg-[#0F1523] border border-slate-800 rounded-xl p-5 sm:p-6 space-y-6 shadow-lg">
      {/* Header and Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-rose-500" />
            <h3 className="text-base font-bold text-white tracking-tight">
              {isWebPage ? 'Unified Page & Video Synthesis' : 'AI Executive Summary'}
            </h3>
          </div>
          {/* Unboxed topic metadata with middots */}
          {summary.topics && summary.topics.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400 mt-1">
              <span>Topics:</span>
              {summary.topics.map((topic, i) => (
                <React.Fragment key={topic}>
                  <span className="text-slate-300">{topic}</span>
                  {i < summary.topics.length - 1 && (
                    <span className="text-slate-600" aria-hidden="true">·</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopyMarkdown}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-md transition-colors"
            title="Copy as Markdown"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Copied</span>
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
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-md transition-colors"
            title="Download Markdown summary"
          >
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>.MD</span>
          </button>

          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-md transition-colors"
            title="Download JSON data"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>.JSON</span>
          </button>
        </div>
      </div>

      {/* 1. Executive Summary Block */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {isWebPage ? 'Executive Synthesis (Page + Embedded Videos)' : 'Executive Takeaway'}
        </h4>
        <div className="p-4 bg-[#090D16] border border-slate-800/80 rounded-lg">
          <p className="text-sm leading-relaxed text-slate-200 font-normal">
            {summary.executiveSummary}
          </p>
        </div>
      </div>

      {/* 2. Core Bullet Highlights */}
      {summary.coreHighlights && summary.coreHighlights.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-slate-400" />
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {isWebPage ? `Synthesized Highlights (${summary.coreHighlights.length})` : `Core Highlights (${summary.coreHighlights.length})`}
            </h4>
          </div>
          <ul className="space-y-2.5">
            {summary.coreHighlights.map((point, index) => (
              <li
                key={index}
                className="flex items-start gap-3 p-3 bg-[#090D16]/70 border border-slate-800/60 rounded-lg text-sm text-slate-200 leading-relaxed"
              >
                <span className="font-mono text-xs text-rose-400 font-medium pt-0.5 shrink-0 tabular-nums">
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
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Key Takeaways
            </h4>
          </div>
          <div className="grid grid-cols-1 gap-2.5">
            {summary.mainTakeaways.map((takeaway, index) => (
              <div
                key={index}
                className="p-3 bg-[#090D16]/70 border border-slate-800/60 rounded-lg text-sm text-slate-300 flex items-start gap-2.5"
              >
                <span className="text-emerald-400 font-bold">✓</span>
                <span>{takeaway}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Memorable Quotes (if present) */}
      {summary.keyQuotes && summary.keyQuotes.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <Quote className="w-3.5 h-3.5 text-slate-400" />
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Memorable Quotes
            </h4>
          </div>
          <div className="space-y-2">
            {summary.keyQuotes.map((quote, idx) => (
              <blockquote
                key={idx}
                className="p-3 bg-[#090D16] border border-slate-800/70 rounded-lg text-xs italic text-slate-300 leading-relaxed"
              >
                "{quote}"
              </blockquote>
            ))}
          </div>
        </div>
      )}

      {/* 5. Viewer notes if attached */}
      {video.userNotes && (
        <div className="pt-2 border-t border-slate-800/80">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Viewer Context
          </h4>
          <p className="text-xs text-slate-400 italic bg-[#090D16] p-2.5 rounded border border-slate-800">
            {video.userNotes}
          </p>
        </div>
      )}
    </div>
  );
};
