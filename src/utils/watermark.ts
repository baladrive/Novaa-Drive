/**
 * Watermark Preview Utility
 *
 * Adds watermarks to file previews for protected documents.
 * Supports text watermarks, user-specific watermarks, and
 * dynamic positioning.
 */

export interface WatermarkOptions {
  text: string;
  fontSize?: number;
  opacity?: number;
  color?: string;
  rotation?: number;
  position?: "center" | "tile" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
  userId?: string;
  timestamp?: boolean;
}

const DEFAULT_OPTIONS: WatermarkOptions = {
  text: "NOVAA DRIVE - CONFIDENTIAL",
  fontSize: 24,
  opacity: 0.15,
  color: "#ffffff",
  rotation: -30,
  position: "tile",
  timestamp: true,
};

/** Generate watermark text with user info and timestamp */
export function generateWatermarkText(
  baseText: string,
  userId?: string,
  includeTimestamp: boolean = true
): string {
  const parts = [baseText];
  if (userId) parts.push(`User: ${userId}`);
  if (includeTimestamp) parts.push(`Accessed: ${new Date().toLocaleString()}`);
  return parts.join(" | ");
}

/** Apply watermark to a canvas element */
export function applyWatermarkToCanvas(
  canvas: HTMLCanvasElement,
  options: Partial<WatermarkOptions> = {}
): HTMLCanvasElement {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const text = generateWatermarkText(opts.text, opts.userId, opts.timestamp);
  ctx.save();

  ctx.globalAlpha = opts.opacity ?? 0.15;
  ctx.fillStyle = opts.color ?? "#ffffff";
  ctx.font = `${opts.fontSize ?? 24}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (opts.position === "tile") {
    // Tile watermark across the canvas
    const textWidth = ctx.measureText(text).width;
    const textHeight = opts.fontSize ?? 24;
    const cols = Math.ceil(canvas.width / (textWidth + 100));
    const rows = Math.ceil(canvas.height / (textHeight + 100));

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((opts.rotation ?? -30) * Math.PI / 180);

    for (let i = -cols; i < cols; i++) {
      for (let j = -rows; j < rows; j++) {
        ctx.fillText(text, i * (textWidth + 100), j * (textHeight + 100));
      }
    }
  } else {
    // Position watermark at a specific corner or center
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((opts.rotation ?? -30) * Math.PI / 180);

    let x = 0;
    let y = 0;
    switch (opts.position) {
      case "center":
        x = 0;
        y = 0;
        ctx.translate(0, 0);
        ctx.rotate(0);
        break;
      case "top-left":
        x = -canvas.width / 2 + 100;
        y = -canvas.height / 2 + 50;
        break;
      case "top-right":
        x = canvas.width / 2 - 100;
        y = -canvas.height / 2 + 50;
        break;
      case "bottom-left":
        x = -canvas.width / 2 + 100;
        y = canvas.height / 2 - 50;
        break;
      case "bottom-right":
        x = canvas.width / 2 - 100;
        y = canvas.height / 2 - 50;
        break;
    }
    ctx.fillText(text, x, y);
  }

  ctx.restore();
  return canvas;
}

/** Apply watermark to an image URL and return a new blob URL */
export async function applyWatermarkToImage(
  imageUrl: string,
  options: Partial<WatermarkOptions> = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      // Draw the original image
      ctx.drawImage(img, 0, 0);

      // Apply watermark
      applyWatermarkToCanvas(canvas, options);

      // Convert to blob URL
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(URL.createObjectURL(blob));
        } else {
          reject(new Error("Could not create blob from canvas"));
        }
      }, "image/png");
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = imageUrl;
  });
}

/** Apply watermark to a PDF page (returns modified canvas) */
export async function applyWatermarkToPdfPage(
  pdfPageCanvas: HTMLCanvasElement,
  options: Partial<WatermarkOptions> = {}
): Promise<HTMLCanvasElement> {
  return applyWatermarkToCanvas(pdfPageCanvas, options);
}

/** Check if a file should have watermark protection */
export function shouldWatermark(
  filename: string,
  mimeType: string,
  isShared: boolean = false,
  isProtected: boolean = false
): boolean {
  if (isProtected) return true;
  if (isShared) return true;

  // Check if file is in a protected folder
  const protectedFolders = ["secure", "confidential", "private", "admin"];
  const lowerName = filename.toLowerCase();
  if (protectedFolders.some((f) => lowerName.includes(f))) return true;

  return false;
}

/** Generate a user-specific watermark */
export function getUserWatermark(userId: string, userFullName?: string): WatermarkOptions {
  return {
    text: `CONFIDENTIAL - ${userFullName || userId}`,
    fontSize: 20,
    opacity: 0.12,
    color: "#ff6b6b",
    rotation: -25,
    position: "tile",
    userId,
    timestamp: true,
  };
}
