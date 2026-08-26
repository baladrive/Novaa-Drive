"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  MessageCircle, Send, User, Reply, Check, X,
  Trash2, Edit3, MoreVertical, AtSign,
} from "lucide-react";
import { commentsService, Comment } from "../services/commentsService";
import { useAuth } from "../context/AuthContext";

interface CommentsPanelProps {
  fileId: string;
  onClose?: () => void;
}

export default function CommentsPanel({ fileId, onClose }: CommentsPanelProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const loadComments = useCallback(() => {
    const allComments = commentsService.getCommentsForFile(fileId);
    setComments(allComments);
  }, [fileId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleSubmit = useCallback(() => {
    if (!newComment.trim() || !user) return;

    commentsService.addComment(
      user.id,
      user.fullName || user.username || "Unknown",
      fileId,
      newComment
    );

    setNewComment("");
    loadComments();
  }, [newComment, user, fileId, loadComments]);

  const handleReply = useCallback((commentId: string) => {
    if (!newComment.trim() || !user) return;

    commentsService.addComment(
      user.id,
      user.fullName || user.username || "Unknown",
      fileId,
      newComment,
      commentId
    );

    setNewComment("");
    setReplyingTo(null);
    loadComments();
  }, [newComment, user, fileId, loadComments]);

  const handleEdit = useCallback((commentId: string) => {
    const comment = comments.find((c) => c.id === commentId);
    if (comment) {
      setEditingId(commentId);
      setEditContent(comment.content);
    }
  }, [comments]);

  const handleSaveEdit = useCallback(() => {
    if (!editContent.trim() || !editingId) return;

    commentsService.updateComment(editingId, editContent);
    setEditingId(null);
    setEditContent("");
    loadComments();
  }, [editContent, editingId, loadComments]);

  const handleDelete = useCallback((commentId: string) => {
    if (window.confirm("Delete this comment?")) {
      commentsService.deleteComment(commentId);
      loadComments();
    }
  }, [loadComments]);

  const handleResolve = useCallback((commentId: string) => {
    const comment = comments.find((c) => c.id === commentId);
    if (comment) {
      commentsService.setResolved(commentId, !comment.resolved);
      loadComments();
    }
  }, [comments, loadComments]);

  // Get top-level comments (no parent)
  const topLevelComments = comments.filter((c) => !c.parentId);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] p-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-purple-400" />
          <h3 className="font-semibold text-white">Comments</h3>
          <span className="text-xs text-white/40">({comments.length})</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-white/40 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {topLevelComments.length === 0 ? (
          <div className="py-8 text-center text-white/30">
            <MessageCircle className="mx-auto h-8 w-8 mb-2 opacity-30" />
            <p className="text-sm">No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          topLevelComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              replies={comments.filter((c) => c.parentId === comment.id)}
              onReply={(id) => setReplyingTo(id)}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onResolve={handleResolve}
              onSaveEdit={handleSaveEdit}
              editingId={editingId}
              editContent={editContent}
              setEditContent={setEditContent}
              currentUserId={user?.id || ""}
            />
          ))
        )}
      </div>

      {/* Reply Input */}
      {replyingTo && (
        <div className="border-t border-white/[0.06] p-3">
          <div className="flex gap-2">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a reply..."
              className="flex-1 resize-none rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none"
              rows={2}
            />
            <div className="flex gap-1">
              <button
                onClick={() => setReplyingTo(null)}
                className="rounded-lg px-3 py-1 text-xs text-white/40 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReply(replyingTo)}
                disabled={!newComment.trim()}
                className="rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
              >
                Reply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Comment Input */}
      <div className="border-t border-white/[0.06] p-3">
        <div className="flex gap-2">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment... (use @ to mention)"
            className="flex-1 resize-none rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none"
            rows={2}
          />
          <button
            onClick={handleSubmit}
            disabled={!newComment.trim() || !!replyingTo}
            className="rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 p-2 text-white shadow-lg disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Comment Item Component ──────────────────────────────────────────────────
interface CommentItemProps {
  comment: Comment;
  replies: Comment[];
  onReply: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onResolve: (id: string) => void;
  onSaveEdit: () => void;
  editingId: string | null;
  editContent: string;
  setEditContent: (content: string) => void;
  currentUserId: string;
}

function CommentItem({
  comment,
  replies,
  onReply,
  onEdit,
  onDelete,
  onResolve,
  onSaveEdit,
  editingId,
  editContent,
  setEditContent,
  currentUserId,
}: CommentItemProps) {
  const isOwnComment = comment.userId === currentUserId;
  const time = new Date(comment.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`space-y-2 ${comment.resolved ? "opacity-50" : ""}`}>
      <div className="flex gap-2">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-cyan-500">
          <User className="h-3 w-3 text-white" />
        </div>
        <div className="flex-1">
          <div className="rounded-xl bg-white/[0.03] px-3 py-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-white">{comment.userFullName}</span>
                <span className="text-xs text-white/30"> · {time}</span>
                {comment.resolved && (
                  <span className="ml-1 text-xs text-green-400">✓ resolved</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {isOwnComment && (
                  <>
                    <button
                      onClick={() => onEdit(comment.id)}
                      className="rounded p-0.5 text-xs text-white/30 hover:text-white/60"
                    >
                      <Edit3 className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => onDelete(comment.id)}
                      className="rounded p-0.5 text-xs text-white/30 hover:text-red-400"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </>
                )}
                {!comment.parentId && (
                  <button
                    onClick={() => onResolve(comment.id)}
                    className="rounded p-0.5 text-xs text-white/30 hover:text-green-400"
                  >
                    <Check className="h-3 w-3" />
                  </button>
                )}
                <button
                  onClick={() => onReply(comment.id)}
                  className="rounded p-0.5 text-xs text-white/30 hover:text-white/60"
                >
                  <Reply className="h-3 w-3" />
                </button>
              </div>
            </div>

            {editingId === comment.id ? (
              <div className="mt-1">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full resize-none rounded-lg border border-white/[0.06] bg-white/[0.05] px-2 py-1 text-sm text-white"
                  rows={2}
                />
                <div className="mt-1 flex gap-1">
                  <button
                    onClick={onSaveEdit}
                    className="rounded px-2 py-0.5 text-xs text-green-400"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => onEdit("")}
                    className="rounded px-2 py-0.5 text-xs text-white/40"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-1 text-sm text-white/80">{comment.content}</p>
            )}
          </div>
        </div>
      </div>

      {/* Replies */}
      {replies.length > 0 && (
        <div className="ml-8 space-y-2">
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              replies={[]}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onResolve={onResolve}
              onSaveEdit={onSaveEdit}
              editingId={editingId}
              editContent={editContent}
              setEditContent={setEditContent}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
