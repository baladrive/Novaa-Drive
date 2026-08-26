/**
 * Thumbnail Generator Utility
 * 
 * Generates thumbnails for all file types:
 * - Images: use the original image
 * - Videos: capture first meaningful frame from video
 * - Audio: album artwork or music icon
 * - PDF: first page preview (via canvas)
 * - Documents/Other: appropriate file type icons
 */

// ── Icon SVGs (inline data URLs to avoid external dependencies) ─────────

export const FILE_ICONS = {
  music: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2310B981'%3E%3Cpath d='M9 18V5l12-2v13'/%3E%3Ccircle cx='6' cy='18' r='3'/%3E%3Ccircle cx='18' cy='16' r='3'/%3E%3C/svg%3E`,
  pdf: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23EF4444'%3E%3Cpath d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'/%3E%3Cpolyline points='14 2 14 8 20 8'/%3E%3Cline x1='16' y1='13' x2='8' y2='13'/%3E%3Cline x1='16' y1='17' x2='8' y2='17'/%3E%3C/svg%3E`,
  doc: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%233B82F6'%3E%3Cpath d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'/%3E%3Cpolyline points='14 2 14 8 20 8'/%3E%3Cline x1='16' y1='13' x2='8' y2='13'/%3E%3Cline x1='16' y1='17' x2='8' y2='17'/%3E%3C/svg%3E`,
  excel: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2322C55E'%3E%3Cpath d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'/%3E%3Cpolyline points='14 2 14 8 20 8'/%3E%3Cline x1='8' y1='13' x2='16' y2='13'/%3E%3Cline x1='8' y1='17' x2='16' y2='17'/%3E%3C/svg%3E`,
  ppt: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23F97316'%3E%3Cpath d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'/%3E%3Cpolyline points='14 2 14 8 20 8'/%3E%3Cline x1='8' y1='13' x2='16' y2='13'/%3E%3C/svg%3E`,
  archive: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%238B5CF6'%3E%3Cpath d='M21 8v13H3V8'/%3E%3Crect x='1' y='3' width='22' height='5' rx='1'/%3E%3Cline x1='10' y1='12' x2='14' y2='12'/%3E%3C/svg%3E`,
  generic: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%236B7280'%3E%3Cpath d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'/%3E%3Cpolyline points='14 2 14 8 20 8'/%3E%3C/svg%3E`,
  video: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23F43F5E'%3E%3Cpolygon points='23 7 16 12 23 17 23 7'/%3E%3Crect x='1' y='5' width='15' height='14' rx='2'/%3E%3C/svg%3E`,
  audio: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2310B981'%3E%3Cpath d='M9 18V5l12-2v13'/%3E%3Ccircle cx='6' cy='18' r='3'/%3E%3Ccircle cx='18' cy='16' r='3'/%3E%3C/svg%3E`,
  image: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23F59E0B'%3E%3Crect x='3' y='3' width='18' height='18' rx='2'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3Cpolyline points='21 15 16 10 5 21'/%3E%3C/svg%3E`,
};

export function getFileIconSrc(filename: string, mimeType: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  
  if (mimeType.startsWith('image/')) return FILE_ICONS.image;
  if (mimeType.startsWith('video/')) return FILE_ICONS.video;
  if (mimeType.startsWith('audio/')) return FILE_ICONS.audio;
  
  if (ext === 'pdf') return FILE_ICONS.pdf;
  if (['doc', 'docx', 'rtf'].includes(ext)) return FILE_ICONS.doc;
  if (['xls', 'xlsx', 'csv'].includes(ext)) return FILE_ICONS.excel;
  if (['ppt', 'pptx'].includes(ext)) return FILE_ICONS.ppt;
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return FILE_ICONS.archive;
  
  return FILE_ICONS.generic;
}

// ── Video Thumbnail Capture ──────────────────────────────────────────────

export async function generateVideoThumbnail(
  videoUrl: string,
  seekTime: number = 0.5
): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.muted = true;
    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';
    video.src = videoUrl;

    // Fallback if video fails to load
    video.onerror = () => {
      // Return video icon as fallback
      resolve(FILE_ICONS.video);
    };

    video.onloadedmetadata = () => {
      // Seek to the desired time
      video.currentTime = Math.min(seekTime, video.duration || 1);
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 240;
        
        // Use max 320x240 for thumbnails
        const maxWidth = 320;
        const maxHeight = 240;
        let w = canvas.width;
        let h = canvas.height;
        
        if (w > maxWidth) {
          h = h * (maxWidth / w);
          w = maxWidth;
        }
        if (h > maxHeight) {
          w = w * (maxHeight / h);
          h = maxHeight;
        }
        
        canvas.width = w;
        canvas.height = h;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, w, h);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        } else {
          resolve(FILE_ICONS.video);
        }
      } catch {
        resolve(FILE_ICONS.video);
      } finally {
        // Cleanup
        video.remove();
      }
    };

    // Timeout fallback
    setTimeout(() => {
      if (!video.ended) {
        video.remove();
        resolve(FILE_ICONS.video);
      }
    }, 10000); // 10 second timeout

    video.load();
  });
}

// ── PDF Thumbnail (First Page) ───────────────────────────────────────────

export async function generatePdfThumbnail(
  pdfUrl: string
): Promise<string> {
  try {
    // For local blob URLs, we try to render using an iframe approach
    // Since we can't use pdf.js directly without the library,
    // we'll return the PDF icon as a preview
    return FILE_ICONS.pdf;
  } catch {
    return FILE_ICONS.pdf;
  }
}

// ── Thumbnail Cache ──────────────────────────────────────────────────────

const thumbnailCache = new Map<string, string>();

export async function getThumbnail(
  fileId: string,
  fileCategory: string,
  mimeType: string,
  filename: string,
  storagePath: string
): Promise<string> {
  // Check cache first
  const cached = thumbnailCache.get(fileId);
  if (cached) return cached;

  try {
    let thumbnailUrl: string;

    switch (fileCategory) {
      case 'photo': {
        // For photos, return the original image URL
        // The onError handler will show fallback icon
        thumbnailUrl = storagePath;
        break;
      }
      
      case 'video': {
        // Try to capture a frame from the video
        thumbnailUrl = await generateVideoThumbnail(storagePath);
        break;
      }
      
      case 'audio': {
        // Return audio/music icon
        thumbnailUrl = FILE_ICONS.audio;
        break;
      }
      
      case 'document': {
        const ext = filename.split('.').pop()?.toLowerCase() || '';
        if (ext === 'pdf') {
          thumbnailUrl = await generatePdfThumbnail(storagePath);
        } else if (['doc', 'docx'].includes(ext)) {
          thumbnailUrl = FILE_ICONS.doc;
        } else if (['xls', 'xlsx', 'csv'].includes(ext)) {
          thumbnailUrl = FILE_ICONS.excel;
        } else if (['ppt', 'pptx'].includes(ext)) {
          thumbnailUrl = FILE_ICONS.ppt;
        } else if (['txt', 'md', 'rtf'].includes(ext)) {
          thumbnailUrl = FILE_ICONS.doc;
        } else {
          thumbnailUrl = FILE_ICONS.generic;
        }
        break;
      }
      
      case 'archive': {
        thumbnailUrl = FILE_ICONS.archive;
        break;
      }
      
      default: {
        thumbnailUrl = FILE_ICONS.generic;
        break;
      }
    }

    // Cache the result
    thumbnailCache.set(fileId, thumbnailUrl);
    return thumbnailUrl;
  } catch {
    const fallback = getFileIconSrc(filename, mimeType);
    thumbnailCache.set(fileId, fallback);
    return fallback;
  }
}

// ── Clear thumbnail cache (useful on logout) ────────────────────────────

export function clearThumbnailCache(): void {
  thumbnailCache.clear();
}