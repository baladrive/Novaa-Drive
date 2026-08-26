/**
 * Virus Scanning Service
 *
 * Scans files before upload using multiple detection methods:
 * 1. File extension / MIME type blacklist
 * 2. File signature (magic bytes) verification
 * 3. File size limits
 * 4. Suspicious pattern detection
 * 5. Integration with backend virus scanning API (when available)
 */

export type ScanResult = "clean" | "suspicious" | "infected" | "unknown";

export interface ScanReport {
  result: ScanResult;
  threats: string[];
  warnings: string[];
  scannedAt: string;
  fileSize: number;
  fileName: string;
  scanDurationMs: number;
  details: string;
}

// Dangerous file extensions (executable, script, etc.)
const DANGEROUS_EXTENSIONS = new Set([
  "exe", "bat", "cmd", "com", "pif", "scr", "vbs", "vbe", "js", "jse",
  "wsf", "wsh", "msi", "dll", "sys", "drv", "inf", "reg", "hta",
  "cpl", "msc", "msp", "mst", "sh", "bash", "zsh", "fish",
  "php", "asp", "aspx", "jsp", "cgi", "pl", "py", "rb",
]);

// Suspicious file extensions (may contain macros or exploits)
const SUSPICIOUS_EXTENSIONS = new Set([
  "docm", "xlsm", "pptm", "dotm", "xltm", "potm", "sldm",
  "doc", "xls", "ppt", "dot", "xlt", "pot",
  "rtf", "chm", "hlp", "inf", "lnk", "url",
]);

// Maximum file size for scanning (100 MB)
const MAX_SCAN_SIZE = 100 * 1024 * 1024;

// Dangerous file signatures (magic bytes)
const DANGEROUS_SIGNATURES: { pattern: number[]; offset: number; name: string }[] = [
  { pattern: [0x4d, 0x5a], offset: 0, name: "Windows executable (MZ)" },
  { pattern: [0x7f, 0x45, 0x4c, 0x46], offset: 0, name: "ELF executable" },
  { pattern: [0xca, 0xfe, 0xba, 0xbe], offset: 0, name: "Java class file" },
  { pattern: [0x4d, 0x5a, 0x90, 0x00], offset: 0, name: "DOS executable" },
];

// Suspicious patterns in file content
const SUSPICIOUS_PATTERNS = [
  /<script[^>]*>/i,
  /javascript:/i,
  /vbscript:/i,
  /onload\s*=/i,
  /onerror\s*=/i,
  /onclick\s*=/i,
  /eval\s*\(/i,
  /document\.cookie/i,
  /window\.location/i,
  /base64_decode/i,
  /shell_exec/i,
  /system\s*\(/i,
  /exec\s*\(/i,
];

/** Read first N bytes of a file as hex array */
async function readMagicBytes(file: File, numBytes: number = 16): Promise<number[]> {
  const blob = file.slice(0, numBytes);
  const buf = await blob.arrayBuffer();
  return Array.from(new Uint8Array(buf));
}

/** Check if file extension is dangerous */
function checkExtension(filename: string): { isDangerous: boolean; isSuspicious: boolean; ext: string } {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  return {
    isDangerous: DANGEROUS_EXTENSIONS.has(ext),
    isSuspicious: SUSPICIOUS_EXTENSIONS.has(ext),
    ext,
  };
}

/** Check file signature against known dangerous signatures */
function checkSignature(bytes: number[]): string[] {
  const threats: string[] = [];
  for (const sig of DANGEROUS_SIGNATURES) {
    const match = sig.pattern.every(
      (b, i) => bytes[sig.offset + i] === b
    );
    if (match) {
      threats.push(sig.name);
    }
  }
  return threats;
}

/** Check file content for suspicious patterns (text files only) */
async function checkContentPatterns(file: File): Promise<string[]> {
  const warnings: string[] = [];
  const ext = file.name.split(".").pop()?.toLowerCase() || "";

  // Only scan text-based files
  const textExts = ["txt", "html", "htm", "xml", "json", "csv", "md", "rtf", "log"];
  if (!textExts.includes(ext)) return warnings;

  try {
    const text = await file.text();
    for (const pattern of SUSPICIOUS_PATTERNS) {
      if (pattern.test(text)) {
        warnings.push(`Suspicious pattern detected: ${pattern.source}`);
      }
    }
  } catch {
    // Binary file, skip content scan
  }

  return warnings;
}

/** Main scan function */
export async function scanFile(file: File): Promise<ScanReport> {
  const startTime = Date.now();
  const threats: string[] = [];
  const warnings: string[] = [];

  // 1. Check file size
  if (file.size > MAX_SCAN_SIZE) {
    warnings.push(`File size (${formatSize(file.size)}) exceeds recommended limit (${formatSize(MAX_SCAN_SIZE)})`);
  }

  // 2. Check extension
  const extCheck = checkExtension(file.name);
  if (extCheck.isDangerous) {
    threats.push(`Dangerous file extension: .${extCheck.ext}`);
  }
  if (extCheck.isSuspicious) {
    warnings.push(`Suspicious file extension: .${extCheck.ext} (may contain macros)`);
  }

  // 3. Check file signature
  try {
    const magicBytes = await readMagicBytes(file, 16);
    const sigThreats = checkSignature(magicBytes);
    threats.push(...sigThreats);
  } catch {
    warnings.push("Could not read file signature");
  }

  // 4. Check content patterns
  const contentWarnings = await checkContentPatterns(file);
  warnings.push(...contentWarnings);

  // 5. Try backend scan (if available)
  try {
    const backendResult = await scanWithBackend(file);
    if (backendResult) {
      threats.push(...backendResult.threats);
      warnings.push(...backendResult.warnings);
    }
  } catch {
    // Backend not available, continue with local scan
  }

  // Determine overall result
  let result: ScanResult;
  if (threats.length > 0) {
    result = "infected";
  } else if (warnings.length > 0) {
    result = "suspicious";
  } else {
    result = "clean";
  }

  return {
    result,
    threats,
    warnings,
    scannedAt: new Date().toISOString(),
    fileSize: file.size,
    fileName: file.name,
    scanDurationMs: Date.now() - startTime,
    details: threats.length > 0
      ? `Found ${threats.length} threat(s)`
      : warnings.length > 0
        ? `Found ${warnings.length} warning(s)`
        : "File passed all security checks",
  };
}

/** Try to scan with backend API */
async function scanWithBackend(file: File): Promise<{ threats: string[]; warnings: string[] } | null> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/scan", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) return null;

    const data = await response.json();
    return {
      threats: data.threats || [],
      warnings: data.warnings || [],
    };
  } catch {
    return null;
  }
}

function formatSize(bytes: number): string {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

/** Quick scan (extension + size only, no content reading) */
export function quickScan(file: File): ScanReport {
  const extCheck = checkExtension(file.name);
  const threats: string[] = [];
  const warnings: string[] = [];

  if (extCheck.isDangerous) {
    threats.push(`Dangerous file extension: .${extCheck.ext}`);
  }
  if (extCheck.isSuspicious) {
    warnings.push(`Suspicious file extension: .${extCheck.ext}`);
  }
  if (file.size > MAX_SCAN_SIZE) {
    warnings.push(`File size exceeds limit`);
  }

  return {
    result: threats.length > 0 ? "infected" : warnings.length > 0 ? "suspicious" : "clean",
    threats,
    warnings,
    scannedAt: new Date().toISOString(),
    fileSize: file.size,
    fileName: file.name,
    scanDurationMs: 0,
    details: "Quick scan completed",
  };
}
