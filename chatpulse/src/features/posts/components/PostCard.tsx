import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Post } from '../../../types/types';
import { usePosts } from '../PostsContext';
import { useAuth } from '../../auth/AuthContext';
import { getInitialsAvatar } from '../../../utils/avatarUtils';
import { formatTime } from '../../../utils/formatTime';
import { CommentSection } from '../../comments/components/CommentSection';
import { Toast } from '../../../components/ui/Toast';
import { postCardVariants } from './PostSkeleton';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  BookmarkCheck,
  MoreHorizontal,
  Trash2,
  EyeOff,
} from 'lucide-react';

interface PostCardProps {
  post: Post;
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const { toggleLikePost, toggleSavePost, hidePost } = usePosts();
  const { currentUser } = useAuth();
  const [openMenu, setOpenMenu] = useState(false);
  const [expandedComments, setExpandedComments] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (toast) {
      clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(null), 2000);
    }
    return () => clearTimeout(toastTimer.current);
  }, [toast]);

  const isOwnerOrAdmin =
    !!currentUser && (post.author._id === currentUser.id || currentUser.role === 'admin');

  const handleShare = async () => {
    const url = `${window.location.origin}/post/${post._id}`;
    try {
      await navigator.clipboard.writeText(url);
      setToast('Đã copy link bài viết');
    } catch {
      setToast('Không thể copy link');
    }
  };

  const handleHide = async () => {
    await hidePost(post._id);
    setOpenMenu(false);
  };

  return (
    <>
      <motion.article
        layout
        variants={postCardVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xs overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 flex items-center justify-between border-b border-outline-variant/40">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={post.author.avatar || getInitialsAvatar(post.author.name)}
                alt={post.author.name}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-xl object-cover ring-2 ring-primary/10"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-secondary border-2 border-surface-container-lowest rounded-full"></div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-display font-bold text-sm text-on-surface">
                  {post.author.name}
                </h4>
                {currentUser && post.author._id === currentUser.id && currentUser.role === 'admin' && (
                  <span className="text-[9px] font-bold text-primary bg-primary-container/40 px-1.5 py-0.2 rounded-sm uppercase tracking-wide">
                    Pro
                  </span>
                )}
              </div>
              {post.mood && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[11px] text-amber-600 dark:text-amber-400 font-medium"
                >
                  is feeling {post.mood}
                </motion.p>
              )}
              <p className="text-xs text-on-surface-variant opacity-85">
                {formatTime(post.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 relative">
            <button
              onClick={() => toggleSavePost(post._id)}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                post.savedByMe
                  ? 'text-primary bg-primary-container/20'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {post.savedByMe ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
            </button>
            <button
              onClick={() => setOpenMenu((prev) => !prev)}
              className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer"
            >
              <MoreHorizontal size={15} />
            </button>
            {openMenu && (
              <div
                ref={menuRef}
                className="absolute top-full right-0 mt-1 bg-surface-container-lowest border border-outline-variant rounded-xl p-1.5 shadow-lg z-20 w-44"
              >
                <button
                  onClick={handleHide}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer ${
                    isOwnerOrAdmin
                      ? 'text-error font-medium hover:bg-error-container/30'
                      : 'text-on-surface font-medium hover:bg-surface-container-high'
                  }`}
                >
                  {isOwnerOrAdmin ? (
                    <>
                      <Trash2 size={14} />
                      <span>Xóa bài viết</span>
                    </>
                  ) : (
                    <>
                      <EyeOff size={14} />
                      <span>Ẩn bài viết</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content + attachments */}
        <div className="p-5 pt-4 space-y-4">
          <p className="text-sm leading-relaxed text-on-surface/90 font-sans">
            {post.content}
          </p>

          {post.images && post.images.length > 0 && (
            <motion.div
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
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
            </motion.div>
          )}
        </div>

        {/* Actions */}
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
              onClick={() => setExpandedComments((prev) => !prev)}
              className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                expandedComments ? 'text-primary' : 'hover:text-primary'
              }`}
            >
              <MessageCircle size={16} />
              <span>{post.commentsCount || 0}</span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 hover:text-secondary transition-colors cursor-pointer"
            >
              <Share2 size={16} />
              <span>{post.shares || 0}</span>
            </button>
          </div>

          <span className="text-[10px] uppercase tracking-wide font-bold opacity-60">
            Team Update
          </span>
        </div>

        <CommentSection postId={post._id} isOpen={expandedComments} />
      </motion.article>

      <Toast message={toast} />
    </>
  );
};