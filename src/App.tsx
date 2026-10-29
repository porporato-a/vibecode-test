import { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { UrlInputBar } from './components/UrlInputBar';
import { VideoPlayer } from './components/VideoPlayer';
import { SummaryPanel } from './components/SummaryPanel';
import { ArchiveSidebar } from './components/ArchiveSidebar';
import { Toast, ToastMessage } from './components/Toast';
import { AnalyzedVideo, SummarizeResponse } from './types/video';
import { exportArchiveMarkdown } from './utils/export';
import { parseAndImportFile } from './utils/import';

export default function App() {
  const [archive, setArchive] = useState<AnalyzedVideo[]>([]);
  const [activeVideo, setActiveVideo] = useState<AnalyzedVideo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isArchiveLoading, setIsArchiveLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [mobileArchiveOpen, setMobileArchiveOpen] = useState<boolean>(false);
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const inputRef = useRef<HTMLInputElement>(null);
  const navbarFileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load archive on mount
  const fetchArchive = async () => {
    try {
      setIsArchiveLoading(true);
      const res = await fetch('/api/archive');
      const data = await res.json();
      if (data.success && Array.isArray(data.videos)) {
        setArchive(data.videos);
        // Default to first video if none is active
        if (data.videos.length > 0 && !activeVideo) {
          setActiveVideo(data.videos[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load archive:', err);
      showToast('error', 'Could not load archive from server.');
    } finally {
      setIsArchiveLoading(false);
    }
  };

  useEffect(() => {
    fetchArchive();
  }, []);

  const handleAnalyze = async (url: string, notes?: string, mode: 'video' | 'webpage' = 'video') => {
    setIsLoading(true);
    try {
      const endpoint = mode === 'webpage' ? '/api/summarize-webpage' : '/api/summarize';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, notes }),
      });

      const data: SummarizeResponse = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to synthesize summary.');
      }

      const newVideo = data.video;
      setActiveVideo(newVideo);

      // Refresh archive or prepend
      setArchive((prev) => {
        const filtered = prev.filter((v) => v.id !== newVideo.id && v.youtubeId !== newVideo.youtubeId);
        return [newVideo, ...filtered];
      });

      showToast(
        'success',
        mode === 'webpage'
          ? `Generated unified report for "${newVideo.title.slice(0, 25)}..." (${newVideo.embeddedVideos?.length || 1} embedded videos)`
          : `Analysis complete for "${newVideo.title.slice(0, 30)}..."`
      );
    } catch (err: any) {
      console.warn('Analysis error:', err);
      showToast('error', err.message || 'An error occurred during analysis.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    const res = await fetch(`/api/archive/${id}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.videos)) {
      setArchive(data.videos);
      if (activeVideo?.id === id) {
        setActiveVideo(data.videos.length > 0 ? data.videos[0] : null);
      }
    } else {
      throw new Error(data.error || 'Failed to delete');
    }
  };

  const handleResetSamples = async () => {
    const res = await fetch('/api/archive/reset', { method: 'POST' });
    const data = await res.json();
    if (data.success && Array.isArray(data.videos)) {
      setArchive(data.videos);
      if (data.videos.length > 0) {
        setActiveVideo(data.videos[0]);
      }
    } else {
      throw new Error('Failed to reset archive');
    }
  };

  const handleClearArchive = async () => {
    const res = await fetch('/api/archive/clear', { method: 'POST' });
    const data = await res.json();
    if (data.success && Array.isArray(data.videos)) {
      setArchive(data.videos);
      setActiveVideo(null);
    } else {
      throw new Error('Failed to clear archive');
    }
  };

  const handleImportFile = async (file: File) => {
    setIsArchiveLoading(true);
    try {
      const res = await parseAndImportFile(file);
      if (!res.success || !res.videos) {
        throw new Error(res.error || 'Failed to import archive.');
      }
      setArchive(res.videos);
      if (res.videos.length > 0 && !activeVideo) {
        setActiveVideo(res.videos[0]);
      }
      showToast('success', `Imported ${res.importedCount ?? res.videos.length} report(s) from Markdown into archive.`);
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to import Markdown file.');
    } finally {
      setIsArchiveLoading(false);
    }
  };

  const handleFocusInput = () => {
    const el = document.getElementById('analysis-form');
    if (el) {
      const top = el.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setTimeout(() => {
      inputRef.current?.focus();
    }, 250);
  };

  const handleNavigateWorkspace = () => {
    const el = document.getElementById('workspace');
    if (el) {
      const top = el.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const handleNavigateArchive = () => {
    if (window.innerWidth < 1024) {
      setMobileArchiveOpen(true);
    } else {
      const el = document.getElementById('archive');
      if (el) {
        const top = el.getBoundingClientRect().top + window.pageYOffset - 80;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    }
  };

  const handleSelectVideo = (video: AnalyzedVideo) => {
    setActiveVideo(video);
    setMobileArchiveOpen(false);
    // Smooth scroll to workspace on small screens
    if (window.innerWidth < 1024) {
      const el = document.getElementById('workspace');
      if (el) {
        const top = el.getBoundingClientRect().top + window.pageYOffset - 80;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Hidden file input for Navbar import */}
      <input
        type="file"
        ref={navbarFileInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleImportFile(file);
            e.target.value = '';
          }
        }}
        accept=".md,.markdown,.json"
        className="hidden"
      />

      {/* Top Bar adhering to Top Bar Contract with Lite/Dark theme toggle */}
      <Navbar
        archiveCount={archive.length}
        activeVideo={activeVideo}
        isDark={isDark}
        onToggleTheme={() => setIsDark((prev) => !prev)}
        onExportAll={() => {
          if (archive.length > 0) {
            exportArchiveMarkdown(archive);
            showToast('success', 'Exported complete video archive as Markdown');
          }
        }}
        onImportClick={() => navbarFileInputRef.current?.click()}
        onOpenArchiveMobile={() => setMobileArchiveOpen(true)}
        onNewAnalysisClick={handleFocusInput}
        onNavigateWorkspace={handleNavigateWorkspace}
        onNavigateArchive={handleNavigateArchive}
      />

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Analysis Form Section */}
        <section id="analysis-form" className="scroll-mt-24">
          <UrlInputBar
            onAnalyze={handleAnalyze}
            isLoading={isLoading}
            inputRef={inputRef}
          />
        </section>

        {/* Workspace Split View: Left = Player + Summary, Right = Persistent Archive */}
        <div id="workspace" className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start scroll-mt-24">
          {/* Active Video Stage (7 cols on lg, 8 cols on xl) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            <VideoPlayer video={activeVideo} />
            <SummaryPanel
              video={activeVideo}
              isLoading={isLoading}
              onToast={showToast}
            />
          </div>

          {/* Desktop Archive Sidebar (5 cols on lg, 4 cols on xl) */}
          <div id="archive" className="hidden lg:block lg:col-span-5 xl:col-span-4 sticky top-24 scroll-mt-24">
            <ArchiveSidebar
              videos={archive}
              activeVideoId={activeVideo?.id || activeVideo?.youtubeId || null}
              onSelectVideo={handleSelectVideo}
              onDeleteVideo={handleDeleteVideo}
              onResetSamples={handleResetSamples}
              onClearArchive={handleClearArchive}
              onToast={showToast}
            />
          </div>
        </div>

        {/* Mobile Archive Drawer */}
        {mobileArchiveOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setMobileArchiveOpen(false)}
            />
            <div className="relative ml-auto w-full max-w-md h-full bg-white dark:bg-[#111622] p-4 flex flex-col z-10 shadow-2xl">
              <ArchiveSidebar
                videos={archive}
                activeVideoId={activeVideo?.id || activeVideo?.youtubeId || null}
                onSelectVideo={handleSelectVideo}
                onDeleteVideo={handleDeleteVideo}
                onResetSamples={handleResetSamples}
                onClearArchive={handleClearArchive}
                onToast={showToast}
                onCloseMobile={() => setMobileArchiveOpen(false)}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer adhering to Clean Design rules */}
      <footer className="w-full border-t border-slate-200/80 dark:border-slate-800/80 py-6 text-xs text-slate-500 bg-white dark:bg-[#070A11] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Video Intelligence</span>
            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
            <span>AI video analysis & persistent archive</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <span>Import & Export (.JSON, .MD)</span>
          </div>
        </div>
      </footer>

      {/* Toast Notification Container */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
