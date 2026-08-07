import { useState, useEffect } from 'react';
import { Post, User } from '../../types/types';
import { postService } from './services/posts.service';

export function usePostsState(currentUser: User | null) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [savedPostsLoading, setSavedPostsLoading] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const fetchPosts = async () => {
      setPostsLoading(true);
      try {
        const data = await postService.getPosts();
        setPosts(data.posts || []);
      } catch (err) {
        console.error('Error fetching posts', err);
      } finally {
        setPostsLoading(false);
      }
    };
    fetchPosts();
  }, [currentUser]);

  const toggleLikePost = async (postId: string) => {
    try {
      const data = await postService.toggleLikePost(postId);
      if (data.post) {
        setPosts((prev) =>
          prev.map((p) =>
            p._id === postId ? { ...p, ...data.post } : p
          )
        );
        setSavedPosts((prev) =>
          prev.map((p) =>
            p._id === postId ? { ...p, ...data.post } : p
          )
        );
      }
    } catch (err) {
      console.error('Error toggling like', err);
    }
  };

  const toggleSavePost = async (postId: string) => {
    try {
      const data = await postService.toggleSavePost(postId);
      if (data.post) {
        setPosts((prev) =>
          prev.map((p) =>
            p._id === postId ? { ...p, ...data.post } : p
          )
        );
        setSavedPosts((prev) => {
          const updated = prev.map((p) =>
            p._id === postId ? { ...p, ...data.post } : p
          );
          if (data.post.savedByMe) {
            const exists = prev.some((p) => p._id === postId);
            if (!exists) {
              const source = posts.find((p) => p._id === postId);
              if (source) return [...updated, { ...source, ...data.post }];
            }
          }
          return updated.filter((p) => p.savedByMe !== false);
        });
      }
    } catch (err) {
      console.error('Error toggling save', err);
    }
  };

  const hidePost = async (postId: string) => {
    try {
      await postService.deletePost(postId);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
      setSavedPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch (err) {
      console.error('Error hiding post', err);
    }
  };

  const fetchSavedPosts = async () => {
    setSavedPostsLoading(true);
    try {
      const data = await postService.getSavedPosts();
      setSavedPosts(data.posts || []);
    } catch (err) {
      console.error('Error fetching saved posts', err);
    } finally {
      setSavedPostsLoading(false);
    }
  };

  const createPost = async (content: string, images?: string[], mood?: string) => {
    if (!currentUser) return;
    try {
      const data = await postService.createPost(content, images, mood);
      if (data.post) {
        setPosts((prev) => [data.post, ...prev]);
      }
    } catch (err) {
      console.error('Error creating post', err);
    }
  };

  return {
    posts, setPosts, postsLoading,
    savedPosts, setSavedPosts, savedPostsLoading,
    toggleLikePost, toggleSavePost, hidePost, createPost, fetchSavedPosts
  };
}
