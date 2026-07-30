import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { 
  MapPin, 
  Calendar, 
  Globe, 
  Sliders, 
  Camera, 
  Plus, 
  Edit3, 
  X, 
  Save, 
  ToggleLeft, 
  ToggleRight,
  ShieldAlert,
  Award
} from 'lucide-react';
import { userService } from '../services/user.service';

export const Profile: React.FC = () => {
  const { currentUser, updateProfile } = useApp();
  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editBio, setEditBio] = useState(currentUser?.bio || '');
  const [editLocation, setEditLocation] = useState(currentUser?.location || '');
  const [editWebsite, setEditWebsite] = useState(currentUser?.website || '');
  
  // Custom states for settings sliders
  const [privateProfile, setPrivateProfile] = useState(false);
  const [readReceipts, setReadReceipts] = useState(true);
  const [activeIndicator, setActiveIndicator] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);

  if (!currentUser) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: editName,
      bio: editBio,
      location: editLocation,
      website: editWebsite
    });
    setIsEditModalOpen(false);
  };

  const handleOpenEdit = () => {
    setEditName(currentUser.name);
    setEditBio(currentUser.bio || '');
    setEditLocation(currentUser.location || '');
    setEditWebsite(currentUser.website || '');
    setIsEditModalOpen(true);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await userService.uploadAvatar(currentUser.id, file);
      await updateProfile({ avatar: res.avatarUrl });
    } catch (err) {
      console.error('Failed to update avatar', err);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      
      {/* Header */}
      <header className="h-16 border-b border-outline-variant/60 bg-surface-container-lowest flex items-center justify-between px-6 shrink-0 z-10">
        <h2 className="font-display font-bold text-lg text-on-surface">Member Profile</h2>
        <button
          onClick={handleOpenEdit}
          className="px-4 py-2 bg-primary text-on-primary text-xs font-semibold rounded-xl flex items-center gap-2 hover:bg-primary-container hover:text-on-primary-container transition-all cursor-pointer"
        >
          <Edit3 size={14} />
          <span>Edit Profile</span>
        </button>
      </header>

      {/* Scrollable Container */}
      <div className="flex-1 overflow-y-auto">
        
        {/* Banner with Profile image overlapping */}
        <div className="relative h-48 md:h-56 bg-gradient-to-br from-primary/40 via-secondary/30 to-primary/10 shrink-0">
          
          {/* Absolute Overlapping profile avatar */}
          <div className="absolute -bottom-12 left-6 flex items-end gap-4">
            <div className="relative">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="w-24 h-24 md:w-28 md:h-28 rounded-2xl object-cover border-4 border-surface-container-lowest shadow-lg bg-surface-container-lowest"
              />
              <button 
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-1 right-1 p-1.5 rounded-lg bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-xs cursor-pointer"
                title="Change Avatar"
              >
                <Camera size={13} />
              </button>
              <input
                type="file"
                ref={avatarInputRef}
                onChange={handleAvatarChange}
                accept="image/*"
                className="hidden"
              />
            </div>
            
            <div className="mb-2 space-y-1 select-none">
              <div className="flex items-center gap-2">
                <h3 className="text-on-surface font-display font-bold text-lg md:text-xl">{currentUser.name}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary text-on-secondary border border-secondary/20 shadow-xs flex items-center gap-1">
                  <Award size={10} />
                  <span>{currentUser.plan}</span>
                </span>
              </div>
              <p className="text-on-surface-variant text-xs font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-secondary"></span>
                <span>Active Workspace</span>
              </p>
            </div>
          </div>
        </div>

        {/* Content Bento Grid */}
        <div className="max-w-6xl mx-auto px-6 pt-16 pb-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN: About Me & Interests */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Bento Block 1: About Me */}
            <div className="bg-surface-container-lowest border border-outline-variant/80 rounded-2xl p-5 shadow-xs space-y-4">
              <h4 className="font-display font-bold text-sm text-on-surface uppercase tracking-wider opacity-85 border-b border-outline-variant/40 pb-2">
                About Me
              </h4>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                {currentUser.bio || 'No bio yet.'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 text-xs text-on-surface-variant font-medium">
                {currentUser.location && (
                  <div className="flex items-center gap-2">
                    <MapPin size={15} className="text-primary" />
                    <span>{currentUser.location}</span>
                  </div>
                )}
                {currentUser.joinDate && (
                  <div className="flex items-center gap-2">
                    <Calendar size={15} className="text-primary" />
                    <span>Joined {currentUser.joinDate}</span>
                  </div>
                )}
                {currentUser.website && (
                  <div className="flex items-center gap-2 truncate">
                    <Globe size={15} className="text-primary" />
                    <a href={`https://${currentUser.website}`} target="_blank" rel="noreferrer" className="hover:underline text-primary">
                      {currentUser.website}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Bento Block 2: Interests tag chips */}
            <div className="bg-surface-container-lowest border border-outline-variant/80 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-outline-variant/40 pb-2">
                <h4 className="font-display font-bold text-sm text-on-surface uppercase tracking-wider opacity-85">
                  Interests & Domains
                </h4>
                <button 
                  onClick={() => alert("Domains and tags are managed via settings.")}
                  className="p-1 rounded-lg text-primary hover:bg-primary-container/20 transition-colors cursor-pointer"
                >
                  <Plus size={15} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {currentUser.interests?.map((tag) => (
                  <span 
                    key={tag}
                    className="px-3 py-1.5 rounded-xl bg-surface-container-low text-xs font-semibold text-on-surface border border-outline-variant/40 hover:border-primary/50 transition-colors cursor-pointer select-none"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Bento Block 3: Photo Gallery */}
            {currentUser.photoGallery && currentUser.photoGallery.length > 0 && (
              <div className="bg-surface-container-lowest border border-outline-variant/80 rounded-2xl p-5 shadow-xs space-y-4">
                <h4 className="font-display font-bold text-sm text-on-surface uppercase tracking-wider opacity-85 border-b border-outline-variant/40 pb-2">
                  Portfolio Gallery
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 h-48 sm:h-36">
                  {currentUser.photoGallery.map((photo, index) => (
                    <div key={index} className="rounded-xl overflow-hidden relative group cursor-pointer border border-outline-variant/30 h-full">
                      <img
                        src={photo}
                        alt={`Gallery Item ${index + 1}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold">Zoom Asset</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* RIGHT COLUMN: Account settings preferences */}
          <div className="space-y-6">
            
            <div className="bg-surface-container-lowest border border-outline-variant/80 rounded-2xl p-5 shadow-xs space-y-4">
              <h4 className="font-display font-bold text-sm text-on-surface uppercase tracking-wider opacity-85 border-b border-outline-variant/40 pb-2">
                System Preferences
              </h4>

              {/* Slider Toggle Controls */}
              <div className="space-y-4">
                
                {/* Privacy switch */}
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-on-surface">Private Profile</h5>
                    <p className="text-[10px] text-on-surface-variant opacity-80">Only coworker contacts can read posts</p>
                  </div>
                  <button 
                    onClick={() => setPrivateProfile(!privateProfile)}
                    className="text-primary hover:scale-105 transition-transform cursor-pointer"
                  >
                    {privateProfile ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-on-surface-variant/50" />}
                  </button>
                </div>

                {/* Receipts switch */}
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-on-surface">Read Receipts</h5>
                    <p className="text-[10px] text-on-surface-variant opacity-80">Show double check-marks when messages read</p>
                  </div>
                  <button 
                    onClick={() => setReadReceipts(!readReceipts)}
                    className="text-primary hover:scale-105 transition-transform cursor-pointer"
                  >
                    {readReceipts ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-on-surface-variant/50" />}
                  </button>
                </div>

                {/* Status indicator switch */}
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-on-surface">Active Indicator</h5>
                    <p className="text-[10px] text-on-surface-variant opacity-80">Display green dot badge when online</p>
                  </div>
                  <button 
                    onClick={() => setActiveIndicator(!activeIndicator)}
                    className="text-primary hover:scale-105 transition-transform cursor-pointer"
                  >
                    {activeIndicator ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-on-surface-variant/50" />}
                  </button>
                </div>

                {/* Sound alerts indicator switch */}
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-on-surface">Sound Alerts</h5>
                    <p className="text-[10px] text-on-surface-variant opacity-80">Trigger soft notifications ping noises</p>
                  </div>
                  <button 
                    onClick={() => setSoundAlerts(!soundAlerts)}
                    className="text-primary hover:scale-105 transition-transform cursor-pointer"
                  >
                    {soundAlerts ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-on-surface-variant/50" />}
                  </button>
                </div>

              </div>
            </div>

            {/* Shield advisory notice */}
            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/60 flex items-start gap-3 select-none">
              <ShieldAlert size={18} className="text-primary mt-0.5 shrink-0" />
              <div>
                <h5 className="text-xs font-bold text-on-surface">Compliance & Security</h5>
                <p className="text-[10px] text-on-surface-variant leading-normal mt-1 pr-1">
                  ChatPulse accounts are fully encrypted. To customize security certificates, visit organizational settings in your enterprise console.
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* EDIT PROFILE MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="p-4 border-b border-outline-variant/60 flex items-center justify-between bg-surface-container-low/50">
              <div className="flex items-center gap-2">
                <Edit3 size={16} className="text-primary" />
                <h3 className="font-display font-bold text-base text-on-surface">Edit Profile Details</h3>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 hover:bg-surface-container-high rounded-lg text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form content */}
            <form onSubmit={handleSaveProfile}>
              <div className="p-5 space-y-4">
                
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-on-surface-variant">Profile Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:outline-hidden focus:border-primary text-on-surface"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-on-surface-variant">Bio Description</label>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    rows={3}
                    className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:outline-hidden focus:border-primary text-on-surface resize-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-on-surface-variant">Location</label>
                    <input
                      type="text"
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:outline-hidden focus:border-primary text-on-surface"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-on-surface-variant">Website Link</label>
                    <input
                      type="text"
                      value={editWebsite}
                      onChange={(e) => setEditWebsite(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:outline-hidden focus:border-primary text-on-surface"
                    />
                  </div>
                </div>

              </div>

              {/* Footer buttons */}
              <div className="p-4 border-t border-outline-variant/60 bg-surface-container-low/60 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-outline-variant text-sm font-medium text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-primary text-on-primary text-sm font-medium hover:bg-primary-container hover:text-on-primary-container transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Save size={15} />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
