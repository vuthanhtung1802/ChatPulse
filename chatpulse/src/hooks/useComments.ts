import { useState } from 'react';
import { Comment, User } from '../types/types';
import { commentService } from '../services/comment.service';

export function useCommentsState(currentUser: User | null) {
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [commentsTotal, setCommentsTotal] = useState<Record<string, number>>({});

  const fetchComments = async (postId: string, page = 1) => {
    try {
      const data = await commentService.getComments(postId, page);
      if (page === 1) {
        setComments((prev) => ({ ...prev, [postId]: data.comments || [] }));
      } else {
        setComments((prev) => ({
          ...prev,
          [postId]: [...(prev[postId] || []), ...(data.comments || [])],
        }));
      }
      setCommentsTotal((prev) => ({ ...prev, [postId]: data.total || 0 }));
    } catch (err) {
      console.error('Error fetching comments', err);
    }
  };

  const createComment = async (postId: string, content: string) => {
    if (!currentUser) return;
    try {
      await commentService.createComment(postId, content);
      setCommentsTotal((prev) => ({
        ...prev,
        [postId]: (prev[postId] || 0) + 1,
      }));
    } catch (err) {
      console.error('Error creating comment', err);
    }
  };

  const deleteComment = async (postId: string, commentId: string) => {
    try {
      await commentService.deleteComment(postId, commentId);
      setComments((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).filter((c) => c._id !== commentId),
      }));
      setCommentsTotal((prev) => ({
        ...prev,
        [postId]: Math.max(0, (prev[postId] || 0) - 1),
      }));
    } catch (err) {
      console.error('Error deleting comment', err);
    }
  };

  return {
    comments, setComments,
    commentsTotal, setCommentsTotal,
    fetchComments, createComment, deleteComment
  };
}
