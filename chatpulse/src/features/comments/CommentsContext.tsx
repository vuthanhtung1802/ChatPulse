import React, { createContext, useContext } from 'react';
import { Comment } from '../../types/types';
import { useCommentsState } from './useComments';
import { useAuth } from '../auth/AuthContext';

interface CommentsContextValue {
  comments: Record<string, Comment[]>;
  commentsTotal: Record<string, number>;
  fetchComments: (postId: string, page?: number) => Promise<void>;
  createComment: (postId: string, content: string) => Promise<void>;
  deleteComment: (postId: string, commentId: string) => Promise<void>;
}

const CommentsContext = createContext<CommentsContextValue | undefined>(
  undefined,
);

export const CommentsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { currentUser } = useAuth();
  const value = useCommentsState(currentUser);

  return (
    <CommentsContext.Provider value={value}>{children}</CommentsContext.Provider>
  );
};

export const useComments = () => {
  const context = useContext(CommentsContext);
  if (context === undefined) {
    throw new Error('useComments must be used within a CommentsProvider');
  }
  return context;
};