/**
 * Comments & Mentions Service
 *
 * Provides file-level comments with @mention support, threaded replies,
 * and real-time notifications.
 */

export interface Comment {
  id: string;
  fileId: string;
  userId: string;
  userFullName: string;
  userAvatarUrl?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  parentId?: string | null; // For threaded replies
  resolved: boolean;
  mentions: string[]; // User IDs mentioned
  position?: { x: number; y: number }; // For image annotations
}

export interface Mention {
  id: string;
  userId: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
}

const COMMENTS_KEY = "novaa_comments";

function getComments(): Comment[] {
  try {
    const raw = localStorage.getItem(COMMENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveComments(comments: Comment[]): void {
  try {
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments.slice(0, 500)));
  } catch {}
}

/** Parse @mentions from text */
export function parseMentions(content: string): string[] {
  const matches = content.match(/@(\w+)/g);
  return matches ? matches.map((m) => m.slice(1)) : [];
}

export const commentsService = {
  /** Add a comment to a file */
  addComment(
    userId: string,
    userFullName: string,
    fileId: string,
    content: string,
    parentId?: string | null,
    position?: { x: number; y: number }
  ): Comment {
    const mentions = parseMentions(content);

    const comment: Comment = {
      id: "cmt_" + Math.random().toString(36).substring(2, 15),
      fileId,
      userId,
      userFullName,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      parentId: parentId || null,
      resolved: false,
      mentions,
      position,
    };

    const comments = getComments();
    comments.push(comment);
    saveComments(comments);

    return comment;
  },

  /** Get all comments for a file (including replies) */
  getCommentsForFile(fileId: string): Comment[] {
    return getComments()
      .filter((c) => c.fileId === fileId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  /** Get top-level comments (no parent) for a file */
  getTopLevelComments(fileId: string): Comment[] {
    return getComments()
      .filter((c) => c.fileId === fileId && !c.parentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  /** Get replies to a specific comment */
  getReplies(commentId: string): Comment[] {
    return getComments()
      .filter((c) => c.parentId === commentId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  /** Update a comment */
  updateComment(commentId: string, newContent: string): Comment | null {
    const comments = getComments();
    const idx = comments.findIndex((c) => c.id === commentId);
    if (idx === -1) return null;

    comments[idx].content = newContent.trim();
    comments[idx].updatedAt = new Date().toISOString();
    comments[idx].mentions = parseMentions(newContent);
    saveComments(comments);

    return comments[idx];
  },

  /** Delete a comment (and all its replies) */
  deleteComment(commentId: string): void {
    const comments = getComments().filter((c) => c.id !== commentId && c.parentId !== commentId);
    saveComments(comments);
  },

  /** Resolve/unresolve a comment thread */
  setResolved(commentId: string, resolved: boolean): void {
    const comments = getComments();
    const idx = comments.findIndex((c) => c.id === commentId);
    if (idx !== -1) {
      comments[idx].resolved = resolved;
      saveComments(comments);
    }
  },

  /** Get comment count for a file */
  getCommentCount(fileId: string): number {
    return getComments().filter((c) => c.fileId === fileId).length;
  },

  /** Get unresolved comment count for a file */
  getUnresolvedCount(fileId: string): number {
    return getComments().filter((c) => c.fileId === fileId && !c.resolved && !c.parentId).length;
  },

  /** Get all mentions for a user across all files */
  getMentionsForUser(userId: string): Comment[] {
    return getComments().filter((c) => c.mentions.includes(userId));
  },
};
