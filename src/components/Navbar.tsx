import React from 'react';
import { Youtube, Download, Library, Upload } from 'lucide-react';
import { AnalyzedVideo } from '../types/video';

interface NavbarProps {
  archiveCount: number;
  onExportAll: () => void;
  onImportClick?: () => void;
  onOpenArchiveMobile?: () => void;
  activeVideo: AnalyzedVideo | null;
  onNewAnalysisClick: () => void;
  onNavigateWorkspace: () => void;
  onNavigateArchive: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  archiveCount,
  onExportAll,
  onImportClick,
  onOpenArchiveMobile,
  onNewAnalysisClick,
  onNavigateWorkspace,
  onNavigateArchive,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#0B0F17]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-rose-600 flex items-center justify-center text-white shadow-sm shadow-rose-950">
            <Youtube className="w-5 h-5 fill-current" />
          </div>
          <span className="text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap">
            YouTube Intelligence
          </span>
        </div>

        {/* Zone 2: Navigation Links / Quiet Metadata aligned */}
        <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-slate-400">
          <button
            type="button"
            onClick={onNewAnalysisClick}
            className="hover:text-white transition-colors whitespace-nowrap text-slate-300 cursor-pointer"
          >
            Analyze Video
          </button>
          <span className="text-slate-600 select-none" aria-hidden="true">·</span>
          <button
            type="button"
            onClick={onNavigateWorkspace}
            className="hover:text-white transition-colors whitespace-nowrap cursor-pointer"
          >
            Workspace
          </button>
          <span className="text-slate-600 select-none" aria-hidden="true">·</span>
          <button
            type="button"
            onClick={onNavigateArchive}
            className="hover:text-white transition-colors whitespace-nowrap cursor-pointer"
          >
            Archive (<span className="font-mono tabular-nums">{archiveCount}</span>)
          </button>
        </nav>

        {/* Zone 3: Primary Action & Mobile Toggle */}
        <div className="flex items-center gap-2.5 shrink-0">
          {onOpenArchiveMobile && (
            <button
              onClick={onOpenArchiveMobile}
              className="md:hidden flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Library className="w-3.5 h-3.5 text-slate-400" />
              <span>Archive ({archiveCount})</span>
            </button>
          )}

          {/* Import Archive Button */}
          {onImportClick && (
            <button
              onClick={onImportClick}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-700/80 rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
              title="Import video & webpage summaries from Markdown (.md) or JSON"
            >
              <Upload className="w-3.5 h-3.5 text-slate-400" />
              <span>Import Archive (.MD)</span>
            </button>
          )}

          {/* Export Archive Button */}
          <button
            onClick={onExportAll}
            disabled={archiveCount === 0}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-white bg-slate-800 border border-slate-700/80 rounded-md hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
            title="Export complete archive as Markdown (.md)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Archive</span>
          </button>
        </div>
      </div>
    </header>
  );
};
