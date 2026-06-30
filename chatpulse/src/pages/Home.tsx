import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
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
  MoreHorizontal
} from 'lucide-react';

export const Home: React.FC = () => {
  const { posts, toggleLikePost, createPost, currentUser } = useApp();
  const [postText, setPostText] = useState('');
  const [selectedMood, setSelectedMood] = useState('Feeling focused 🧠');
  const [showMoodMenu, setShowMoodMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const moods = [
    'Feeling focused 🧠',
    'Creative mode 🎨',
    'Coffee-fueled ☕',
    'Celebrating 🚀',
    'Productive day 💻',
    'Chilled out 🌅'
  ];

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postText.trim()) return;
    createPost(postText);
    setPostText('');
  };

  const filteredPosts = posts.filter(post => 
    post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.authorName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      
      {/* Top Header Panel */}
      <header className="h-16 border-b border-outline-variant/60 bg-surface-container-lowest flex items-center justify-between px-6 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="font-display font-bold text-lg text-on-surface">Team Feed</h2>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary-container/40 text-on-secondary-container border border-secondary-container/40">
            Social updates
          </span>
        </div>
        
        {/* Search Feed */}
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

      {/* Main scrollable body */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        
        {/* Post Creation Form */}
        {currentUser && (
          <div className="bg-surface-container-lowest border border-outline-variant/80 rounded-2xl p-5 shadow-sm">
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
                  
                  {/* Selected Mood Chip */}
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
                  
                  <div className="flex items-center justify-between pt-4 border-t border-outline-variant/40 mt-3">
                    {/* Action buttons */}
                    <div className="flex items-center gap-2 relative">
                      <button 
                        type="button"
                        onClick={() => alert("Photo/Video sharing will mock upload files in this interface.")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-on-surface-variant hover:text-primary hover:bg-primary-container/30 transition-colors cursor-pointer"
                      >
                        <ImageIcon size={15} className="text-primary" />
                        <span>Media</span>
                      </button>

                      <button 
                        type="button"
                        onClick={() => setShowMoodMenu(!showMoodMenu)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-on-surface-variant hover:text-amber-500 hover:bg-amber-500-container/30 transition-colors cursor-pointer"
                      >
                        <Smile size={15} className="text-amber-500" />
                        <span>Mood</span>
                      </button>

                      {showMoodMenu && (
                        <div className="absolute top-full left-16 mt-1.5 bg-surface-container-lowest border border-outline-variant rounded-xl p-2 shadow-lg z-20 w-48 animate-in fade-in slide-in-from-top-1 duration-150">
                          <div className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider px-2 py-1 border-b border-outline-variant/40 mb-1">
                            Select Current Mood
                          </div>
                          {moods.map(m => (
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
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={!postText.trim()}
                      className="px-4 py-2 bg-primary text-on-primary text-xs font-semibold rounded-xl flex items-center gap-1.5 hover:bg-primary-container hover:text-on-primary-container disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
                    >
                      <Send size={13} />
                      <span>Publish</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Post Items */}
        <div className="space-y-6">
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
              <article key={post.id} className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xs overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                
                {/* Post Header */}
                <div className="p-5 flex items-center justify-between border-b border-outline-variant/40">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={post.authorAvatar}
                        alt={post.authorName}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-xl object-cover ring-2 ring-primary/10"
                      />
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-secondary border-2 border-surface-container-lowest rounded-full"></div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-display font-bold text-sm text-on-surface">{post.authorName}</h4>
                        <span className="text-[9px] font-bold text-primary bg-primary-container/40 px-1.5 py-0.2 rounded-sm uppercase tracking-wide">
                          Pro
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant opacity-85">{post.timestamp}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer">
                      <Bookmark size={15} />
                    </button>
                    <button className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer">
                      <MoreHorizontal size={15} />
                    </button>
                  </div>
                </div>

                {/* Post Body Text */}
                <div className="p-5 pt-4 space-y-4">
                  <p className="text-sm leading-relaxed text-on-surface/90 font-sans">
                    {post.content}
                  </p>

                  {/* High Fidelity Bento Image Grid (only for posts with images, like Sarah Chen's) */}
                  {post.images && post.images.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 h-[340px] md:h-[400px] overflow-hidden rounded-2xl border border-outline-variant/50">
                      
                      {/* Left primary larger landscape image */}
                      <div className="md:col-span-3 h-full relative group overflow-hidden cursor-pointer">
                        <img
                          src={post.images[0]}
                          alt="Branding Project Layout"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                          <span className="text-white text-xs font-medium">Layout Blueprint Portfolio</span>
                        </div>
                      </div>

                      {/* Right stacked smaller items */}
                      <div className="md:col-span-2 grid grid-rows-2 gap-3.5 h-full">
                        {post.images.slice(1).map((imgUrl, idx) => (
                          <div key={idx} className="h-full relative group overflow-hidden cursor-pointer">
                            <img
                              src={imgUrl}
                              alt={`Branding Sub-asset ${idx + 1}`}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                              <span className="text-white text-[10px] font-medium">Palette Study {idx + 1}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                    </div>
                  )}
                </div>

                {/* Post Footer Actions */}
                <div className="px-5 py-3.5 bg-surface-container-low/40 border-t border-outline-variant/40 flex items-center justify-between text-on-surface-variant">
                  <div className="flex items-center gap-4 text-xs font-semibold">
                    
                    {/* Interactive Like trigger */}
                    <button
                      onClick={() => toggleLikePost(post.id)}
                      className={`flex items-center gap-1.5 transition-colors cursor-pointer hover:text-error ${
                        post.likedByMe ? 'text-error font-extrabold' : ''
                      }`}
                    >
                      <Heart 
                        size={16} 
                        className={`transition-transform duration-200 ${
                          post.likedByMe ? 'fill-current scale-110 text-error' : ''
                        }`} 
                      />
                      <span>{post.likes}</span>
                    </button>

                    <button className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer">
                      <MessageCircle size={16} />
                      <span>{post.commentsCount}</span>
                    </button>

                    <button className="flex items-center gap-1.5 hover:text-secondary transition-colors cursor-pointer">
                      <Share2 size={16} />
                      <span>{post.shares}</span>
                    </button>

                  </div>

                  <span className="text-[10px] uppercase tracking-wide font-bold opacity-60">
                    Team Update
                  </span>
                </div>

              </article>
            ))
          ) : (
            <div className="text-center py-12 bg-surface-container-lowest border border-outline-variant rounded-2xl">
              <p className="text-sm text-on-surface-variant">No social posts match your query.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
