import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePosts } from '../PostsContext';
import { useAuth } from '../../auth/AuthContext';
import { postService } from '../services/posts.service';
import { PostCard } from '../components/PostCard';
import { PostSkeleton, containerVariants } from '../components/PostSkeleton';
import {
  Image as ImageIcon,
  Smile,
  Send,
  Search,
  SlidersHorizontal,
  X,
  Loader2,
} from 'lucide-react';

const moods = [
  'Feeling happy 😊',
  'Feeling loved ❤️',
  'Feeling excited 🤩',
  'Feeling sad 😢',
  'Feeling grateful 🙌',
];

export const Home: React.FC = () => {
  const { posts, postsLoading, createPost } = usePosts();
  const { currentUser } = useAuth();
  const [postText, setPostText] = useState('');
  const [selectedMood, setSelectedMood] = useState('');
  const [showMoodMenu, setShowMoodMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          postService.uploadPostImage(file),
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

  const filteredPosts = posts.filter(
    (post) =>
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author.name.toLowerCase().includes(searchQuery.toLowerCase()),
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
              {filteredPosts.length > 0 ? (
                filteredPosts.map((post) => <PostCard key={post._id} post={post} />)
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