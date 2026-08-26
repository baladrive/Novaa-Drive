export interface AiSuggestion {
  type: "rename" | "organize" | "tag" | "summary" | "duplicate" | "optimize";
  fileId?: string;
  filename?: string;
  suggestion: string;
  confidence: number;
  reason: string;
}

export interface AiDocumentSummary {
  summary: string;
  keyPoints: string[];
  wordCount: number;
  readingTime: string;
}

export interface AiImageRecognition {
  labels: string[];
  objects: string[];
  colors: string[];
  scene: string;
  confidence: number;
}

export const aiService = {
  // ─── AI Auto-Organize ────────────────────────────────────────────────────
  async getOrganizeSuggestions(files: { id: string; filename: string; category: string; size: number }[]): Promise<AiSuggestion[]> {
    const suggestions: AiSuggestion[] = [];
    const nameGroups: Record<string, typeof files> = {};

    // Group by filename patterns
    files.forEach((f) => {
      const base = f.filename.replace(/\.[^/.]+$/, "").toLowerCase();
      const patterns = [
        { match: /^(img|image|photo|pic|snap|screenshot)/i, folder: "Screenshots" },
        { match: /^(doc|document|report|memo|letter)/i, folder: "Documents" },
        { match: /^(vid|video|movie|recording)/i, folder: "Videos" },
        { match: /^(song|track|audio|music|podcast)/i, folder: "Audio" },
        { match: /^(backup|export|dump)/i, folder: "Backups" },
        { match: /^(project|work|office|presentation)/i, folder: "Work" },
        { match: /^(study|notes|lecture|class)/i, folder: "Study" },
      ];

      for (const p of patterns) {
        if (p.match.test(base)) {
          suggestions.push({
            type: "organize",
            fileId: f.id,
            filename: f.filename,
            suggestion: `Move to "${p.folder}" folder`,
            confidence: 0.75 + Math.random() * 0.2,
            reason: `Filename matches ${p.folder.toLowerCase()} pattern`,
          });
          break;
        }
      }
    });

    // Suggest folder creation for categories with 5+ files
    const catCount: Record<string, number> = {};
    files.forEach((f) => {
      catCount[f.category] = (catCount[f.category] || 0) + 1;
    });
    Object.entries(catCount).forEach(([cat, count]) => {
      if (count >= 5) {
        suggestions.push({
          type: "organize",
          suggestion: `Create "${cat.charAt(0).toUpperCase() + cat.slice(1)}s" folder with ${count} files`,
          confidence: 0.9,
          reason: `${count} files of type "${cat}" detected`,
        });
      }
    });

    return suggestions.slice(0, 10);
  },

  // ─── AI Rename Suggestions ───────────────────────────────────────────────
  async getRenameSuggestions(filename: string): Promise<string[]> {
    const base = filename.replace(/\.[^/.]+$/, "");
    const ext = filename.split(".").pop() || "";
    const lower = base.toLowerCase();
    const suggestions: string[] = [];

    // Clean up common messy patterns
    if (/^[a-z0-9]{8,}$/i.test(base)) {
      suggestions.push(`renamed_file.${ext}`);
      suggestions.push(`document_${Date.now().toString(36)}.${ext}`);
    }

    if (lower.includes("screenshot") || lower.includes("screen")) {
      const date = new Date().toISOString().split("T")[0];
      suggestions.push(`Screenshot_${date}.${ext}`);
      suggestions.push(`Screen_Capture_${date}.${ext}`);
    }

    if (lower.includes("img") || lower.includes("photo") || lower.includes("pic")) {
      const date = new Date().toISOString().split("T")[0];
      suggestions.push(`Photo_${date}.${ext}`);
      suggestions.push(`Image_${Date.now()}.${ext}`);
    }

    if (lower.includes("doc") || lower.includes("document")) {
      suggestions.push(`Document_${new Date().toLocaleDateString("en-CA")}.${ext}`);
      suggestions.push(`Report_${Date.now()}.${ext}`);
    }

    // Default suggestions
    if (suggestions.length === 0) {
      suggestions.push(`Clean_${base}.${ext}`);
      suggestions.push(`${base}_${new Date().toLocaleDateString("en-CA")}.${ext}`);
    }

    return suggestions.slice(0, 3);
  },

  // ─── AI Duplicate Detection ──────────────────────────────────────────────
  async findDuplicates(files: { id: string; filename: string; size: number }[]): Promise<{ original: string; duplicate: string; fileId: string; duplicateId: string; confidence: number }[]> {
    const duplicates: { original: string; duplicate: string; fileId: string; duplicateId: string; confidence: number }[] = [];
    const seen = new Map<string, { id: string; filename: string }[]>();

    files.forEach((f) => {
      const base = f.filename.replace(/\.[^/.]+$/, "").toLowerCase().replace(/[-_]/g, " ");
      const key = `${base}_${f.size}`;
      if (!seen.has(key)) seen.set(key, []);
      seen.get(key)!.push({ id: f.id, filename: f.filename });
    });

    seen.forEach((group) => {
      if (group.length > 1) {
        for (let i = 1; i < group.length; i++) {
          duplicates.push({
            original: group[0].filename,
            duplicate: group[i].filename,
            fileId: group[0].id,
            duplicateId: group[i].id,
            confidence: 0.85 + Math.random() * 0.15,
          });
        }
      }
    });

    return duplicates.slice(0, 20);
  },

  // ─── AI Document Summary ─────────────────────────────────────────────────
  async summarizeDocument(text: string, filename: string): Promise<AiDocumentSummary> {
    const words = text.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const readingTime = `${Math.max(1, Math.ceil(wordCount / 200))} min`;

    // Extract key points (sentences with key terms)
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const keyTerms = ["important", "note", "key", "summary", "conclusion", "result", "findings", "recommend"];
    const keyPoints = sentences
      .filter((s) => keyTerms.some((t) => s.toLowerCase().includes(t)))
      .slice(0, 5)
      .map((s) => s.trim());

    // Generate summary (first few sentences)
    const summary = sentences.slice(0, 3).join(" ").trim() || "No content to summarize.";

    return {
      summary: summary.length > 500 ? summary.substring(0, 500) + "..." : summary,
      keyPoints: keyPoints.length > 0 ? keyPoints : ["No key points identified"],
      wordCount,
      readingTime,
    };
  },

  // ─── AI Image Recognition ────────────────────────────────────────────────
  async recognizeImage(filename: string, mimeType: string): Promise<AiImageRecognition> {
    const lower = filename.toLowerCase();
    const labels: string[] = ["Image"];
    const objects: string[] = [];
    const colors: string[] = [];
    let scene = "Unknown";

    // Simulate AI image recognition based on filename patterns
    if (lower.includes("sunset") || lower.includes("sun") || lower.includes("dusk")) {
      labels.push("Sunset", "Nature", "Scenic");
      objects.push("Sun", "Sky", "Clouds");
      colors.push("Orange", "Red", "Purple", "Yellow");
      scene = "Sunset landscape";
    } else if (lower.includes("beach") || lower.includes("sea") || lower.includes("ocean") || lower.includes("coast")) {
      labels.push("Beach", "Nature", "Water");
      objects.push("Water", "Sand", "Sky");
      colors.push("Blue", "White", "Gold");
      scene = "Beach or coastal view";
    } else if (lower.includes("person") || lower.includes("people") || lower.includes("crowd") || lower.includes("group")) {
      labels.push("People", "Social");
      objects.push("People", "Faces");
      colors.push("Various");
      scene = "Group of people";
    } else if (lower.includes("food") || lower.includes("meal") || lower.includes("dish") || lower.includes("recipe")) {
      labels.push("Food", "Cuisine");
      objects.push("Food", "Plate", "Table");
      colors.push("Warm tones");
      scene = "Food photography";
    } else if (lower.includes("car") || lower.includes("vehicle") || lower.includes("auto")) {
      labels.push("Vehicle", "Transport");
      objects.push("Car", "Vehicle");
      colors.push("Various");
      scene = "Vehicle photography";
    } else if (lower.includes("building") || lower.includes("architecture") || lower.includes("city") || lower.includes("urban")) {
      labels.push("Architecture", "Urban");
      objects.push("Building", "Structure");
      colors.push("Gray", "Blue", "White");
      scene = "Urban architecture";
    } else if (lower.includes("pet") || lower.includes("dog") || lower.includes("cat") || lower.includes("animal")) {
      labels.push("Animal", "Pet");
      objects.push("Animal");
      colors.push("Various");
      scene = "Animal or pet photography";
    } else if (lower.includes("nature") || lower.includes("forest") || lower.includes("tree") || lower.includes("mountain")) {
      labels.push("Nature", "Landscape");
      objects.push("Trees", "Landscape");
      colors.push("Green", "Brown", "Blue");
      scene = "Natural landscape";
    } else {
      labels.push("General");
      objects.push("Subject");
      colors.push("Mixed");
      scene = "General photography";
    }

    return {
      labels: labels.slice(0, 5),
      objects: objects.slice(0, 5),
      colors: colors.slice(0, 4),
      scene,
      confidence: 0.7 + Math.random() * 0.25,
    };
  },

  // ─── AI Smart Search ─────────────────────────────────────────────────────
  async smartSearch(query: string, files: { id: string; filename: string; tags: string[]; category: string }[]): Promise<{ fileId: string; filename: string; score: number; matchReason: string }[]> {
    const lower = query.toLowerCase();
    const results: { fileId: string; filename: string; score: number; matchReason: string }[] = [];

    files.forEach((f) => {
      let score = 0;
      let reasons: string[] = [];

      // Exact filename match
      if (f.filename.toLowerCase() === lower) {
        score += 100;
        reasons.push("Exact filename match");
      }

      // Partial filename match
      if (f.filename.toLowerCase().includes(lower)) {
        score += 50;
        reasons.push("Filename contains query");
      }

      // Tag match
      f.tags.forEach((tag) => {
        if (tag.toLowerCase().includes(lower)) {
          score += 30;
          reasons.push(`Tag match: ${tag}`);
        }
      });

      // Category match
      if (f.category.toLowerCase() === lower || f.category.toLowerCase().includes(lower)) {
        score += 20;
        reasons.push(`Category: ${f.category}`);
      }

      // Semantic matches
      const semanticMap: Record<string, string[]> = {
        photo: ["image", "picture", "photo", "snap", "screenshot", "img"],
        video: ["video", "movie", "film", "clip", "recording", "vid"],
        audio: ["audio", "music", "song", "sound", "podcast", "track"],
        document: ["document", "doc", "file", "pdf", "text", "note", "report"],
        archive: ["archive", "zip", "compressed", "backup", "rar"],
      };

      Object.entries(semanticMap).forEach(([cat, terms]) => {
        if (terms.includes(lower) && f.category === cat) {
          score += 15;
          reasons.push(`Semantic category: ${cat}`);
        }
      });

      if (score > 0) {
        results.push({
          fileId: f.id,
          filename: f.filename,
          score,
          matchReason: reasons.join(", "),
        });
      }
    });

    return results.sort((a, b) => b.score - a.score).slice(0, 20);
  },

  // ─── AI Storage Optimization ─────────────────────────────────────────────
  async getOptimizationSuggestions(stats: { used: number; limit: number; fileCount: number; categoryBreakdown: Record<string, number> }): Promise<AiSuggestion[]> {
    const suggestions: AiSuggestion[] = [];
    const usagePercent = (stats.used / stats.limit) * 100;

    if (usagePercent > 80) {
      suggestions.push({
        type: "optimize",
        suggestion: `Storage at ${usagePercent.toFixed(0)}% capacity. Consider deleting trashed files or large media.`,
        confidence: 0.95,
        reason: "High storage usage detected",
      });
    }

    // Suggest cleanup for largest categories
    const sortedCats = Object.entries(stats.categoryBreakdown).sort(([, a], [, b]) => b - a);
    if (sortedCats.length > 0) {
      const [largestCat, largestSize] = sortedCats[0];
      if (largestSize > 100 * 1024 * 1024) {
        suggestions.push({
          type: "optimize",
          suggestion: `${largestCat.charAt(0).toUpperCase() + largestCat.slice(1)} files use ${(largestSize / (1024 * 1024 * 1024)).toFixed(1)}GB. Consider archiving old ones.`,
          confidence: 0.85,
          reason: `Large ${largestCat} storage footprint`,
        });
      }
    }

    if (stats.fileCount > 100) {
      suggestions.push({
        type: "optimize",
        suggestion: `You have ${stats.fileCount} files. Running duplicate detection could free up space.`,
        confidence: 0.8,
        reason: "High file count detected",
      });
    }

    return suggestions;
  },
};