import React, { createContext, useContext } from 'react';
import { Post } from '../../types/types';
import { usePostsState } from './usePosts';
import { useAuth } from '../auth/AuthContext';

interface PostsContextValue {
  posts: Post[];
  postsLoading: boolean;
  savedPosts: Post[];
  savedPostsLoading: boolean;
  toggleLikePost: (postId: string) => Promise<void>;
  toggleSavePost: (postId: string) => Promise<void>;
  hidePost: (postId: string) => Promise<void>;
  createPost: (content: string, images?: string[], mood?: string) => Promise<void>;
  fetchSavedPosts: () => Promise<void>;
}

const PostsContext = createContext<PostsContextValue | undefined>(undefined);

export const PostsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { currentUser } = useAuth();
  const value = usePostsState(currentUser);

  return <PostsContext.Provider value={value}>{children}</PostsContext.Provider>;
};

export const usePosts = () => {
  const context = useContext(PostsContext);
  if (context === undefined) {
    throw new Error('usePosts must be used within a PostsProvider');
  }
  return context;
};