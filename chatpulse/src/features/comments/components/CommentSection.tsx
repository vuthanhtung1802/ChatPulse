import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useComments } from '../CommentsContext';
import { useAuth } from '../../auth/AuthContext';
import { getInitialsAvatar } from '../../../utils/avatarUtils';
import { formatTime } from '../../../utils/formatTime';
import { Send, Trash2, Loader2 } from 'lucide-react';

interface CommentSectionProps {
  postId: string;
  isOpen: boolean;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ postId, isOpen }) => {
  const { comments, commentsTotal, fetchComments, createComment, deleteComment } = useComments();
  const { currentUser } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const postComments = comments[postId] || [];
  const totalComments = commentsTotal[postId] || 0;

  useEffect(() => {
    if (isOpen) {
      fetchComments(postId);
    }
  }, [isOpen, postId]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    await createComment(postId, newComment.trim());
    setNewComment('');
    setSubmitting(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="border-t border-outline-variant/40 overflow-hidden"
        >
          <div className="p-4 space-y-3 max-h-72 overflow-y-auto">
            {postComments.length > 0 ? (
              postComments.map((comment) => (
                <div key={comment._id} className="flex items-start gap-2.5 group">
                  <img
                    src={comment.author.avatar || getInitialsAvatar(comment.author.name)}
                    alt={comment.author.name}
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-lg object-cover shrink-0 mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-on-surface truncate">
                        {comment.author.name}
                      </span>
                      <span className="text-[10px] text-on-surface-variant/60 shrink-0">
                        {formatTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface/80 mt-0.5 leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                  {currentUser && (comment.author._id === currentUser.id || currentUser.role === 'admin') && (
                    <button
                      onClick={() => deleteComment(postId, comment._id)}
                      className="p-1 rounded text-on-surface-variant/40 hover:text-error hover:bg-error-container/30 opacity-0 group-hover:opacity-100 transition-all cursor-pointer shrink-0"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-on-surface-variant/60 text-center py-2">
                No comments yet. Be the first to comment!
              </p>
            )}
            {totalComments > postComments.length && (
              <button
                onClick={() => fetchComments(postId, Math.ceil(postComments.length / 20) + 1)}
                className="text-xs text-primary font-semibold hover:underline cursor-pointer"
              >
                Load more comments...
              </button>
            )}
          </div>
          <form onSubmit={handleSubmit} className="px-4 pb-4 flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 px-3 py-1.5 bg-surface-container-high border border-outline-variant rounded-lg text-xs text-on-surface placeholder:text-on-surface-variant/50 outline-hidden focus:border-primary transition-colors"
            />
            <button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className="p-1.5 rounded-lg bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
