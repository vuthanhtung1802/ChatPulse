import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../store/AppContext';
import { CommentSection } from '../components/CommentSection';
import {
  Heart,
  MessageCircle,
  Share2,
  BookmarkCheck,
  Bookmark,
  Clock,
  Loader2,
  Trash2,
  EyeOff,
  Check,
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const postCardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 300, damping: 24 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -12,
    transition: { duration: 0.2 },
  },
};

const SkeletonCard: React.FC = () => (
  <motion.div
    className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden"
    animate={{ opacity: [0.5, 1, 0.5] }}
    transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
  >
    <div className="p-5 flex items-center gap-3 border-b border-outline-variant/40">
      <div className="w-10 h-10 rounded-xl bg-surface-container-high" />
      <div className="space-y-2 flex-1">
        <div className="h-3 w-32 rounded-full bg-surface-container-high" />
        <div className="h-2 w-20 rounded-full bg-surface-container-high" />
      </div>
    </div>
    <div className="p-5 space-y-3">
      <div className="h-3 w-full rounded-full bg-surface-container-high" />
      <div className="h-3 w-3/4 rounded-full bg-surface-container-high" />
    </div>
  </motion.div>
);

export const SavedPosts: React.FC = () => {
  const { savedPosts, savedPostsLoading, fetchSavedPosts, toggleSavePost, toggleLikePost, hidePost, currentUser } = useApp();
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    fetchSavedPosts();
  }, []);

  useEffect(() => {
    if (toast) {
      clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(null), 2000);
    }
    return () => clearTimeout(toastTimer.current);
  }, [toast]);

  const formatTime = (createdAt: string) => {
    const date = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

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
              <SkeletonCard key={i} />
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
                savedPosts.map((post) => (
                  <motion.article
                    key={post._id}
                    layout
                    variants={postCardVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xs overflow-hidden"
                  >
                    <div className="p-5 flex items-center justify-between border-b border-outline-variant/40">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={post.author.avatar}
                            alt={post.author.name}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-xl object-cover ring-2 ring-primary/10"
                          />
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-secondary border-2 border-surface-container-lowest rounded-full"></div>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-display font-bold text-sm text-on-surface">{post.author.name}</h4>
                            <span className="text-[9px] font-bold text-primary bg-primary-container/40 px-1.5 py-0.2 rounded-sm uppercase tracking-wide">
                              Pro
                            </span>
                          </div>
                          {post.mood && (
                            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                              is feeling {post.mood}
                            </p>
                          )}
                          <p className="text-xs text-on-surface-variant opacity-85">{formatTime(post.createdAt)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleSavePost(post._id)}
                          className="p-1.5 rounded-lg text-primary bg-primary-container/20 transition-colors cursor-pointer"
                        >
                          <BookmarkCheck size={15} />
                        </button>
                      </div>
                    </div>

                    <div className="p-5 pt-4 space-y-4">
                      <p className="text-sm leading-relaxed text-on-surface/90 font-sans">
                        {post.content}
                      </p>

                      {post.images && post.images.length > 0 && (
                        <div
                          className={`grid gap-3.5 overflow-hidden rounded-2xl border border-outline-variant/50 ${
                            post.images.length === 1
                              ? 'grid-cols-1'
                              : post.images.length === 2
                              ? 'grid-cols-2'
                              : 'grid-cols-1 md:grid-cols-5'
                          } ${post.images.length >= 3 ? 'h-[340px] md:h-[400px]' : ''}`}
                        >
                          {post.images.length === 1 ? (
                            <div className="relative group overflow-hidden cursor-pointer rounded-2xl">
                              <img
                                src={post.images[0]}
                                alt=""
                                referrerPolicy="no-referrer"
                                className="w-full max-h-96 object-cover transition-transform duration-500 group-hover:scale-103"
                              />
                            </div>
                          ) : post.images.length === 2 ? (
                            post.images.map((img, idx) => (
                              <div key={idx} className="relative group overflow-hidden cursor-pointer rounded-2xl">
                                <img
                                  src={img}
                                  alt=""
                                  referrerPolicy="no-referrer"
                                  className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-103"
                                />
                              </div>
                            ))
                          ) : (
                            <>
                              <div className="md:col-span-3 h-full relative group overflow-hidden cursor-pointer">
                                <img
                                  src={post.images[0]}
                                  alt=""
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                                />
                              </div>
                              <div className="md:col-span-2 grid grid-rows-2 gap-3.5 h-full">
                                {post.images.slice(1, 3).map((img, idx) => (
                                  <div key={idx} className="h-full relative group overflow-hidden cursor-pointer">
                                    <img
                                      src={img}
                                      alt=""
                                      referrerPolicy="no-referrer"
                                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                                    />
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="px-5 py-3.5 bg-surface-container-low/40 border-t border-outline-variant/40 flex items-center justify-between text-on-surface-variant">
                      <div className="flex items-center gap-4 text-xs font-semibold">
                        <motion.button
                          whileTap={{ scale: 0.8 }}
                          onClick={() => toggleLikePost(post._id)}
                          className={`flex items-center gap-1.5 transition-colors cursor-pointer hover:text-error ${
                            post.likedByMe ? 'text-error font-extrabold' : ''
                          }`}
                        >
                          <motion.div
                            animate={post.likedByMe ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                            transition={{ duration: 0.3 }}
                          >
                            <Heart
                              size={16}
                              className={`transition-colors duration-200 ${
                                post.likedByMe ? 'fill-current text-error' : ''
                              }`}
                            />
                          </motion.div>
                          <span>{post.likes?.length || 0}</span>
                        </motion.button>

                        <button
                          onClick={() => setExpandedComments(expandedComments === post._id ? null : post._id)}
                          className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                            expandedComments === post._id ? 'text-primary' : 'hover:text-primary'
                          }`}
                        >
                          <MessageCircle size={16} />
                          <span>{post.commentsCount || 0}</span>
                        </button>

                        <button
                          onClick={async () => {
                            const url = `${window.location.origin}/post/${post._id}`;
                            try {
                              await navigator.clipboard.writeText(url);
                              setToast('Đã copy link bài viết');
                            } catch {
                              setToast('Không thể copy link');
                            }
                          }}
                          className="flex items-center gap-1.5 hover:text-secondary transition-colors cursor-pointer"
                        >
                          <Share2 size={16} />
                          <span>{post.shares || 0}</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {currentUser && (post.author._id === currentUser.id || currentUser.role === 'admin') ? (
                          <button
                            onClick={() => hidePost(post._id)}
                            className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/30 transition-colors cursor-pointer"
                            title="Xóa bài viết"
                          >
                            <Trash2 size={14} />
                          </button>
                        ) : (
                          <button
                            onClick={() => hidePost(post._id)}
                            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
                            title="Ẩn bài viết"
                          >
                            <EyeOff size={14} />
                          </button>
                        )}
                        <span className="text-[10px] uppercase tracking-wide font-bold opacity-60 flex items-center gap-1">
                          <Clock size={10} />
                          Saved
                        </span>
                      </div>
                    </div>

                    <CommentSection postId={post._id} isOpen={expandedComments === post._id} />
                  </motion.article>
                ))
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

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2.5 bg-surface-container-highest border border-outline-variant rounded-xl shadow-lg flex items-center gap-2 z-50"
          >
            <Check size={16} className="text-secondary" />
            <span className="text-xs font-medium text-on-surface">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
