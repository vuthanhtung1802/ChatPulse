import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../store/AppContext';
import { postService } from '../services/api';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Image as ImageIcon, 
  Smile, 
  Send, 
  Search, 
  SlidersHorizontal,
  Bookmark,
  MoreHorizontal,
  X,
  Loader2,
  Trash2,
  EyeOff,
  BookmarkCheck
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
      <div className="h-40 w-full rounded-2xl bg-surface-container-high" />
    </div>
  </motion.div>
);

export const Home: React.FC = () => {
  const { posts, postsLoading, toggleLikePost, toggleSavePost, hidePost, createPost, currentUser } = useApp();
  const [postText, setPostText] = useState('');
  const [selectedMood, setSelectedMood] = useState('');
  const [showMoodMenu, setShowMoodMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [openMenuPostId, setOpenMenuPostId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

 const moods = [
  'Feeling happy 😊',
  'Feeling loved ❤️',
  'Feeling excited 🤩',
  'Feeling sad 😢',
  'Feeling grateful 🙌'
];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setSelectedFiles((prev) => [...prev, ...files]);
    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setPreviewUrls((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postText.trim() && selectedFiles.length === 0) return;

    let imageUrls: string[] = [];
    if (selectedFiles.length > 0) {
      setUploadingImages(true);
      try {
        const uploadPromises = selectedFiles.map((file) =>
          postService.uploadPostImage(file)
        );
        const results = await Promise.all(uploadPromises);
        imageUrls = results.map((r) => r.url);
      } catch (err) {
        console.error('Error uploading images', err);
        setUploadingImages(false);
        return;
      }
      setUploadingImages(false);
    }

    await createPost(postText, imageUrls, selectedMood || undefined);
    setPostText('');
    setSelectedFiles([]);
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setPreviewUrls([]);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuPostId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const filteredPosts = posts.filter((post) =>
    post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.author.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      <header className="h-16 border-b border-outline-variant/60 bg-surface-container-lowest flex items-center justify-between px-6 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="font-display font-bold text-lg text-on-surface">Team Feed</h2>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary-container/40 text-on-secondary-container border border-secondary-container/40">
            Social updates
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search size={16} className="absolute left-3 top-2.5 text-on-surface-variant/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search posts..."
              className="w-full pl-9 pr-3 py-1.5 bg-surface-container-low border border-outline-variant rounded-full text-xs focus:outline-hidden focus:border-primary text-on-surface placeholder:text-on-surface-variant/40"
            />
          </div>
          <button className="p-2 rounded-xl bg-surface-container-low border border-outline-variant/40 hover:bg-surface-container-high transition-colors text-on-surface-variant hover:text-on-surface cursor-pointer">
            <SlidersHorizontal size={14} />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {currentUser && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface-container-lowest border border-outline-variant/80 rounded-2xl p-5 shadow-sm"
          >
            <div className="flex items-start gap-4">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-xl object-cover"
              />
              <div className="flex-1 space-y-3">
                <form onSubmit={handleCreatePost}>
                  <textarea
                    value={postText}
                    onChange={(e) => setPostText(e.target.value)}
                    placeholder={`What's on your mind, ${currentUser.name.split(' ')[0]}? Share an update...`}
                    rows={2}
                    className="w-full bg-transparent border-0 focus:ring-0 text-sm resize-none text-on-surface placeholder:text-on-surface-variant/50 outline-hidden"
                  />

                  {selectedMood && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-low text-[11px] font-medium text-on-surface border border-outline-variant/50 mt-1">
                      <span>{selectedMood}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedMood('')}
                        className="hover:text-error text-on-surface-variant cursor-pointer text-xs font-bold"
                      >
                        ×
                      </button>
                    </div>
                  )}

                  {previewUrls.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {previewUrls.map((url, idx) => (
                        <motion.div
                          key={url}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="relative w-20 h-20 rounded-xl overflow-hidden border border-outline-variant/50 group"
                        >
                          <img
                            src={url}
                            alt={`Preview ${idx}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute top-1 right-1 p-0.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          >
                            <X size={12} />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-outline-variant/40 mt-3">
                    <div className="flex items-center gap-2 relative">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImages}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-on-surface-variant hover:text-primary hover:bg-primary-container/30 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <ImageIcon size={15} className="text-primary" />
                        <span>Media</span>
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />

                      <button
                        type="button"
                        onClick={() => setShowMoodMenu(!showMoodMenu)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-on-surface-variant hover:text-amber-500 hover:bg-amber-500-container/30 transition-colors cursor-pointer"
                      >
                        <Smile size={15} className="text-amber-500" />
                        <span>Mood</span>
                      </button>

                      {showMoodMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.96 }}
                          className="absolute top-full left-16 mt-1.5 bg-surface-container-lowest border border-outline-variant rounded-xl p-2 shadow-lg z-20 w-48"
                        >
                          <div className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider px-2 py-1 border-b border-outline-variant/40 mb-1">
                            Select Current Mood
                          </div>
                          {moods.map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => {
                                setSelectedMood(m);
                                setShowMoodMenu(false);
                              }}
                              className="w-full text-left px-2 py-1.5 text-xs text-on-surface hover:bg-surface-container-high rounded-md transition-colors cursor-pointer"
                            >
                              {m}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={(!postText.trim() && selectedFiles.length === 0) || uploadingImages}
                      className="px-4 py-2 bg-primary text-on-primary text-xs font-semibold rounded-xl flex items-center gap-1.5 hover:bg-primary-container hover:text-on-primary-container disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
                    >
                      {uploadingImages ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Send size={13} />
                      )}
                      <span>{uploadingImages ? 'Uploading...' : 'Publish'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        )}

        {postsLoading ? (
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
              {filteredPosts.length > 0 ? (
                filteredPosts.map((post) => (
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
                            <motion.p
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-[11px] text-amber-600 dark:text-amber-400 font-medium"
                            >
                              is feeling {post.mood}
                            </motion.p>
                          )}
                          <p className="text-xs text-on-surface-variant opacity-85">{formatTime(post.createdAt)}</p>
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
                          onClick={() => setOpenMenuPostId(openMenuPostId === post._id ? null : post._id)}
                          className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer"
                        >
                          <MoreHorizontal size={15} />
                        </button>
                        {openMenuPostId === post._id && (
                          <div
                            ref={menuRef}
                            className="absolute top-full right-0 mt-1 bg-surface-container-lowest border border-outline-variant rounded-xl p-1.5 shadow-lg z-20 w-44"
                          >
                            {currentUser && (post.author._id === currentUser.id || currentUser.role === 'admin') ? (
                              <button
                                onClick={async () => {
                                  await hidePost(post._id);
                                  setOpenMenuPostId(null);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-error font-medium hover:bg-error-container/30 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 size={14} />
                                <span>Xóa bài viết</span>
                              </button>
                            ) : (
                              <button
                                onClick={async () => {
                                  await hidePost(post._id);
                                  setOpenMenuPostId(null);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-on-surface font-medium hover:bg-surface-container-high rounded-lg transition-colors cursor-pointer"
                              >
                                <EyeOff size={14} />
                                <span>Ẩn bài viết</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

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

                        <button className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer">
                          <MessageCircle size={16} />
                          <span>{post.commentsCount || 0}</span>
                        </button>

                        <button className="flex items-center gap-1.5 hover:text-secondary transition-colors cursor-pointer">
                          <Share2 size={16} />
                          <span>{post.shares || 0}</span>
                        </button>
                      </div>

                      <span className="text-[10px] uppercase tracking-wide font-bold opacity-60">
                        Team Update
                      </span>
                    </div>
                  </motion.article>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 bg-surface-container-lowest border border-outline-variant rounded-2xl"
                >
                  <p className="text-sm text-on-surface-variant">No social posts match your query.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
};
