import React from 'react';
import { Youtube, Download, Library, Upload, Sun, Moon } from 'lucide-react';
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
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  archiveCount,
  onExportAll,
  onImportClick,
  onOpenArchiveMobile,
  onNewAnalysisClick,
  onNavigateWorkspace,
  onNavigateArchive,
  isDark,
  onToggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-[#0B0F19]/90 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-950 transition-colors">
            <Youtube className="w-4 h-4 fill-current" />
          </div>
          <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
            Video Intelligence
          </span>
        </div>

        {/* Zone 2: Navigation Links / Quiet Metadata aligned */}
        <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-slate-500 dark:text-slate-400">
          <button
            type="button"
            onClick={onNewAnalysisClick}
            className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap cursor-pointer"
          >
            Analyze
          </button>
          <span className="text-slate-300 dark:text-slate-700 select-none" aria-hidden="true">·</span>
          <button
            type="button"
            onClick={onNavigateWorkspace}
            className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap cursor-pointer"
          >
            Workspace
          </button>
          <span className="text-slate-300 dark:text-slate-700 select-none" aria-hidden="true">·</span>
          <button
            type="button"
            onClick={onNavigateArchive}
            className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap cursor-pointer"
          >
            Archive (<span className="font-mono tabular-nums">{archiveCount}</span>)
          </button>
        </nav>

        {/* Zone 3: Primary Action & Mobile Toggle */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Theme Switcher */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title={isDark ? 'Switch to Light minimal theme' : 'Switch to Dark theme'}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          )}

          {/* Mobile Archive trigger */}
          {onOpenArchiveMobile && (
            <button
              onClick={onOpenArchiveMobile}
              className="md:hidden flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Library className="w-3.5 h-3.5 text-slate-500" />
              <span>Archive ({archiveCount})</span>
            </button>
          )}

          {/* Import Archive Button */}
          {onImportClick && (
            <button
              onClick={onImportClick}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
              title="Import video & webpage summaries from Markdown (.md) or JSON"
            >
              <Upload className="w-3.5 h-3.5 text-slate-400" />
              <span>Import (.MD)</span>
            </button>
          )}

          {/* Export Archive Button */}
          <button
            onClick={onExportAll}
            disabled={archiveCount === 0}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white dark:text-slate-900 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer shadow-2xs"
            title="Export complete archive as Markdown (.md)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export All</span>
          </button>
        </div>
      </div>
    </header>
  );
};
