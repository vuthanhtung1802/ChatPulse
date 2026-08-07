import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePosts } from '../PostsContext';
import { PostCard } from '../components/PostCard';
import { PostSkeleton, containerVariants } from '../components/PostSkeleton';
import { Bookmark } from 'lucide-react';

export const SavedPosts: React.FC = () => {
  const { savedPosts, savedPostsLoading, fetchSavedPosts } = usePosts();

  useEffect(() => {
    fetchSavedPosts();
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      <header className="h-16 border-b border-outline-variant/60 bg-surface-container-lowest flex items-center justify-between px-6 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="font-display font-bold text-lg text-on-surface">Saved Posts</h2>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary-container/40 text-on-secondary-container border border-secondary-container/40">
            Bookmarks
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {savedPostsLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <PostSkeleton key={i} />
            ))}
          </div>
        ) : (
          <motion.div
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence mode="popLayout">
              {savedPosts.length > 0 ? (
                savedPosts.map((post) => <PostCard key={post._id} post={post} />)
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 bg-surface-container-lowest border border-outline-variant rounded-2xl"
                >
                  <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center mx-auto text-on-surface-variant mb-3">
                    <Bookmark size={20} />
                  </div>
                  <p className="text-sm text-on-surface-variant">No saved posts yet.</p>
                  <p className="text-xs text-on-surface-variant/60 mt-1">Bookmark posts to read them later.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
};