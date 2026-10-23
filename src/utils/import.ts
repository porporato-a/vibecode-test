import { AnalyzedVideo } from '../types/video';
import { parseMarkdownToVideos } from './markdownParser';

export interface ImportResult {
  success: boolean;
  importedCount?: number;
  videos?: AnalyzedVideo[];
  error?: string;
}

export async function parseAndImportFile(file: File): Promise<ImportResult> {
  try {
    const text = await file.text();
    const fileName = file.name.toLowerCase();
    let recordsToImport: any[] = [];

    if (fileName.endsWith('.json')) {
      // Try JSON parsing
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          recordsToImport = parsed;
        } else if (parsed && Array.isArray(parsed.videos)) {
          recordsToImport = parsed.videos;
        } else if (parsed && typeof parsed === 'object') {
          recordsToImport = [parsed];
        }
      } catch {
        return { success: false, error: 'The selected file is not valid JSON.' };
      }
    } else {
      // Treat as Markdown (.md, .markdown, or other text)
      const parsedFromMd = parseMarkdownToVideos(text);
      if (parsedFromMd && parsedFromMd.length > 0) {
        recordsToImport = parsedFromMd;
      } else {
        // Fallback: check if content happens to be raw JSON inside a .md or text file
        try {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) recordsToImport = parsed;
          else if (parsed && typeof parsed === 'object') recordsToImport = [parsed];
        } catch {
          return {
            success: false,
            error: 'No valid YouTube video summaries or links were found in this Markdown file. Make sure it contains a YouTube URL.',
          };
        }
      }
    }

    if (recordsToImport.length === 0) {
      return { success: false, error: 'No video records could be extracted from this file.' };
    }

    // Call server SQLite import endpoint
    const res = await fetch('/api/archive/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(recordsToImport),
    });

    const result = await res.json();
    if (!res.ok || !result.success) {
      return { success: false, error: result.error || 'Failed to import records into database.' };
    }

    return {
      success: true,
      importedCount: result.importedCount,
      videos: result.videos,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to read file.',
    };
  }
}
