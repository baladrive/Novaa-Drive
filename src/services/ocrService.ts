/**
 * OCR Service — Extract text from scanned PDFs and images
 *
 * Uses Tesseract.js (loaded lazily) for client-side OCR.
 * Falls back to filename-based heuristics when Tesseract is unavailable.
 */

export interface OcrResult {
  text: string;
  confidence: number;
  language: string;
  processingTimeMs: number;
  wordCount: number;
}

export interface OcrProgress {
  status: "loading" | "recognizing" | "complete" | "error";
  progress: number;
  message: string;
}

// Lazy-load Tesseract.js only when needed
let tesseractModule: any = null;

async function loadTesseract(): Promise<any> {
  if (tesseractModule) return tesseractModule;
  try {
    // Dynamic import to avoid bundling Tesseract in the main bundle
    const Tesseract = await import("tesseract.js");
    tesseractModule = Tesseract;
    return Tesseract;
  } catch (e) {
    console.warn("Tesseract.js not available, using fallback OCR");
    return null;
  }
}

/** Detect if a file is likely a scanned image or PDF */
export function isOcrCandidate(file: File): boolean {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const mime = file.type.toLowerCase();

  // Images that are likely scans
  if (["png", "jpg", "jpeg", "gif", "bmp", "tiff", "webp"].includes(ext)) return true;

  // PDFs (may be scanned)
  if (ext === "pdf" || mime.includes("pdf")) return true;

  return false;
}

/** Extract text from an image file using Tesseract.js */
export async function ocrImage(
  file: File,
  onProgress?: (progress: OcrProgress) => void
): Promise<OcrResult> {
  const startTime = Date.now();
  onProgress?.({ status: "loading", progress: 0, message: "Loading OCR engine..." });

  const Tesseract = await loadTesseract();

  if (!Tesseract) {
    // Fallback: extract text from filename
    const fallbackText = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
    return {
      text: fallbackText,
      confidence: 0.3,
      language: "en",
      processingTimeMs: Date.now() - startTime,
      wordCount: fallbackText.split(/\s+/).filter(Boolean).length,
    };
  }

  onProgress?.({ status: "recognizing", progress: 30, message: "Recognizing text..." });

  try {
    const { data } = await Tesseract.recognize(file, "eng", {
      logger: (m: any) => {
        if (m.status === "recognizing") {
          onProgress?.({
            status: "recognizing",
            progress: Math.min(100, 30 + m.progress * 70),
            message: `Recognizing... ${Math.round(m.progress * 100)}%`,
          });
        }
      },
    });

    const text = data.text.trim();
    const confidence = data.confidence / 100;

    onProgress?.({ status: "complete", progress: 100, message: "OCR complete!" });

    return {
      text,
      confidence: Math.round(confidence * 100) / 100,
      language: "en",
      processingTimeMs: Date.now() - startTime,
      wordCount: text.split(/\s+/).filter(Boolean).length,
    };
  } catch (e) {
    console.error("OCR failed:", e);
    onProgress?.({ status: "error", progress: 0, message: "OCR failed" });

    // Fallback
    const fallbackText = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
    return {
      text: fallbackText,
      confidence: 0.2,
      language: "en",
      processingTimeMs: Date.now() - startTime,
      wordCount: fallbackText.split(/\s+/).filter(Boolean).length,
    };
  }
}

/** Extract text from a PDF file (first page as image, then OCR) */
export async function ocrPdf(
  file: File,
  onProgress?: (progress: OcrProgress) => void
): Promise<OcrResult> {
  onProgress?.({ status: "loading", progress: 0, message: "Loading PDF..." });

  try {
    // Try to use pdfjs to render first page, then OCR
    const pdfjsLib = await import("pdfjs-dist");
    const pdfjsWorker = await import("pdfjs-dist/build/pdf.worker.min.mjs");
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    if (pdf.numPages === 0) {
      throw new Error("PDF has no pages");
    }

    onProgress?.({ status: "recognizing", progress: 20, message: "Rendering page 1..." });

    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: ctx,
      viewport,
    }).promise;

    onProgress?.({ status: "recognizing", progress: 50, message: "Running OCR on page..." });

    // Convert canvas to blob and OCR
    const blob: Blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png")!);
    const imageFile = new File([blob], "page1.png", { type: "image/png" });

    return await ocrImage(imageFile, onProgress);
  } catch (e) {
    console.error("PDF OCR failed:", e);
    // Fallback: try direct image OCR on the PDF file
    return await ocrImage(file, onProgress);
  }
}

/** Main entry: detect file type and run appropriate OCR */
export async function extractText(
  file: File,
  onProgress?: (progress: OcrProgress) => void
): Promise<OcrResult> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";

  if (ext === "pdf") {
    return await ocrPdf(file, onProgress);
  }

  return await ocrImage(file, onProgress);
}

/** Extract text from a data URL (for blob URLs from fileService) */
export async function extractTextFromUrl(
  url: string,
  filename: string,
  onProgress?: (progress: OcrProgress) => void
): Promise<OcrResult> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const file = new File([blob], filename, { type: blob.type });
    return await extractText(file, onProgress);
  } catch (e) {
    console.error("Failed to extract text from URL:", e);
    return {
      text: filename.replace(/\.[^/.]+$/, ""),
      confidence: 0,
      language: "en",
      processingTimeMs: 0,
      wordCount: 0,
    };
  }
}

/** Cache OCR results to avoid reprocessing */
const ocrCache = new Map<string, OcrResult>();

export function getCachedOcr(fileId: string): OcrResult | null {
  return ocrCache.get(fileId) || null;
}

export function setCachedOcr(fileId: string, result: OcrResult): void {
  ocrCache.set(fileId, result);
  // Limit cache size
  if (ocrCache.size > 50) {
    const firstKey = ocrCache.keys().next().value;
    if (firstKey) ocrCache.delete(firstKey);
  }
}
