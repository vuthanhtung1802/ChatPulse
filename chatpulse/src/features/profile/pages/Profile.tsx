import React, { useRef, useState } from "react";
import {
  Award,
  BellRing,
  CalendarDays,
  Camera,
  Check,
  Edit3,
  Eye,
  Globe2,
  ImageIcon,
  LoaderCircle,
  LockKeyhole,
  Mail,
  MapPin,
  MessageCircleMore,
  Save,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { userService } from "../../users/services/user.service";

interface PreferenceRowProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}

const PreferenceRow: React.FC<PreferenceRowProps> = ({
  icon,
  title,
  description,
  enabled,
  onToggle,
}) => (
  <div className="flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-surface-container-low">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-container text-primary">
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <h5 className="text-sm font-semibold text-on-surface">{title}</h5>
      <p className="mt-0.5 text-[11px] leading-4 text-on-surface-variant">
        {description}
      </p>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={title}
      onClick={onToggle}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 ${
        enabled ? "bg-primary" : "bg-surface-container-highest"
      }`}
    >
      <span
        className={`absolute top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-200 ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      >
        {enabled && (
          <Check size={11} className="text-primary" strokeWidth={3} />
        )}
      </span>
    </button>
  </div>
);

export const Profile: React.FC = () => {
  const { currentUser, updateProfile } = useAuth();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [formError, setFormError] = useState("");
  const [editName, setEditName] = useState(currentUser?.name ?? "");
  const [editBio, setEditBio] = useState(currentUser?.bio ?? "");
  const [editLocation, setEditLocation] = useState(currentUser?.location ?? "");
  const [editWebsite, setEditWebsite] = useState(currentUser?.website ?? "");
  const [privateProfile, setPrivateProfile] = useState(false);
  const [readReceipts, setReadReceipts] = useState(true);
  const [activeIndicator, setActiveIndicator] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);

  if (!currentUser) return null;

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError("");
    setIsSaving(true);
    try {
      await updateProfile({
        name: editName.trim(),
        bio: editBio.trim(),
        location: editLocation.trim(),
        website: editWebsite.trim(),
      });
      setIsEditModalOpen(false);
    } catch {
      setFormError("Could not save your changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenEdit = () => {
    setEditName(currentUser.name);
    setEditBio(currentUser.bio || "");
    setEditLocation(currentUser.location || "");
    setEditWebsite(currentUser.website || "");
    setFormError("");
    setIsEditModalOpen(true);
  };

  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      const response = await userService.uploadAvatar(currentUser.id, file);
      await updateProfile({ avatar: response.avatarUrl });
    } catch (error) {
      console.error("Failed to update avatar", error);
    } finally {
      setIsUploadingAvatar(false);
      event.target.value = "";
    }
  };

  const websiteHref = currentUser.website
    ? /^https?:\/\//i.test(currentUser.website)
      ? currentUser.website
      : `https://${currentUser.website}`
    : "";

  const details = [
    currentUser.email && {
      icon: Mail,
      label: "Email",
      value: currentUser.email,
    },
    currentUser.location && {
      icon: MapPin,
      label: "Location",
      value: currentUser.location,
    },
    currentUser.joinDate && {
      icon: CalendarDays,
      label: "Member since",
      value: currentUser.joinDate,
    },
  ].filter(Boolean) as Array<{
    icon: React.ComponentType<{ size?: number; className?: string }>;
    label: string;
    value: string;
  }>;

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-background">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-outline-variant/60 bg-surface-container-lowest px-5 sm:px-7">
        <div>
          <h1 className="font-display text-lg font-bold text-on-surface">
            Profile
          </h1>
          <p className="hidden text-[11px] text-on-surface-variant sm:block">
            Manage your identity and workspace preferences
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenEdit}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-on-primary shadow-sm shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <Edit3 size={14} /> Edit profile
        </button>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
          <section className="relative overflow-hidden rounded-3xl border border-outline-variant/60 bg-surface-container-lowest shadow-sm">
            <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_18%_20%,rgba(255,255,255,0.34),transparent_28%),linear-gradient(120deg,var(--color-primary),var(--color-secondary))]" />
            <div className="absolute -right-16 top-3 h-48 w-48 rounded-full border-[28px] border-white/10" />
            <div className="absolute right-28 top-16 h-20 w-20 rounded-full bg-white/10 blur-sm" />
            <div className="relative mt-40 px-5 pb-6 sm:px-8">
              <div className="flex flex-col items-start sm:flex-row sm:items-start">
                <div className="relative -mt-16 shrink-0">
                  <div className="h-28 w-28 overflow-hidden rounded-3xl border-4 border-surface-container-lowest bg-surface-container shadow-xl sm:h-32 sm:w-32">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                    {isUploadingAvatar && (
                      <div className="absolute inset-1 flex items-center justify-center rounded-[20px] bg-black/55 text-white">
                        <LoaderCircle size={24} className="animate-spin" />
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-2xl border-4 border-surface-container-lowest bg-primary text-on-primary shadow-md transition-transform hover:scale-105 disabled:opacity-60"
                    title="Change profile photo"
                  >
                    <Camera size={16} />
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
                <div className="mt-4 min-w-0 flex-1 sm:ml-6 sm:mt-5">
                  <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
                    <h2 className="max-w-full break-words font-display text-2xl font-extrabold leading-tight tracking-tight text-on-surface sm:text-3xl">
                      {currentUser.name}
                    </h2>
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/20 bg-primary-container px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-on-primary-container">
                      <Award size={12} /> {currentUser.plan}
                    </span>
                  </div>
                  <div className="mt-2.5 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 text-xs text-on-surface-variant">
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-secondary-container/60 px-2.5 py-1 font-semibold text-secondary">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-50" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-secondary" />
                      </span>
                      Active now
                    </span>
                    <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-surface-container-low px-2.5 py-1">
                      <Mail size={13} className="shrink-0" />
                      <span className="truncate">{currentUser.email}</span>
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleOpenEdit}
                  className="mt-5 hidden shrink-0 items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-xs font-semibold text-on-surface shadow-xs transition-colors hover:bg-surface-container-low sm:ml-5 sm:flex"
                >
                  <Edit3 size={14} /> Edit details
                </button>
              </div>
            </div>
          </section>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.9fr)]">
            <div className="space-y-6">
              <section className="rounded-3xl border border-outline-variant/60 bg-surface-container-lowest p-5 shadow-xs sm:p-6">
                <SectionTitle
                  icon={<UserRound size={19} />}
                  title="About me"
                  subtitle="A little more about who I am"
                />
                <p className="mt-5 text-sm leading-6 text-on-surface-variant">
                  {currentUser.bio ||
                    "Tell your teammates what you do, what you care about, and how you like to collaborate."}
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {details.map(({ icon: Icon, label, value }) => (
                    <div
                      key={label}
                      className="flex items-center gap-3 rounded-2xl border border-outline-variant/40 bg-surface-container-low/60 p-3.5"
                    >
                      <Icon size={16} className="shrink-0 text-primary" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant/70">
                          {label}
                        </p>
                        <p className="truncate text-xs font-semibold text-on-surface">
                          {value}
                        </p>
                      </div>
                    </div>
                  ))}
                  {currentUser.website && (
                    <a
                      href={websiteHref}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 rounded-2xl border border-outline-variant/40 bg-surface-container-low/60 p-3.5 transition-colors hover:border-primary/40 hover:bg-primary-container/30"
                    >
                      <Globe2 size={16} className="shrink-0 text-primary" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant/70">
                          Website
                        </p>
                        <p className="truncate text-xs font-semibold text-primary">
                          {currentUser.website}
                        </p>
                      </div>
                    </a>
                  )}
                </div>
              </section>

              <section className="rounded-3xl border border-outline-variant/60 bg-surface-container-lowest p-5 shadow-xs sm:p-6">
                <SectionTitle
                  icon={<Sparkles size={19} />}
                  title="Interests"
                  subtitle="Topics that shape your workspace"
                  accent="secondary"
                />
                <div className="mt-5 flex flex-wrap gap-2">
                  {currentUser.interests?.length ? (
                    currentUser.interests.map((interest) => (
                      <span
                        key={interest}
                        className="rounded-full border border-outline-variant/50 bg-surface-container-low px-3.5 py-2 text-xs font-semibold text-on-surface transition-colors hover:border-primary/40 hover:bg-primary-container/40"
                      >
                        {interest}
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-on-surface-variant">
                      No interests added yet.
                    </p>
                  )}
                </div>
              </section>

              <section className="rounded-3xl border border-outline-variant/60 bg-surface-container-lowest p-5 shadow-xs sm:p-6">
                <SectionTitle
                  icon={<ImageIcon size={19} />}
                  title="Gallery"
                  subtitle="Highlights shared on your profile"
                  accent="tertiary"
                />
                {currentUser.photoGallery?.length ? (
                  <div className="mt-5 grid auto-rows-[130px] grid-cols-2 gap-3 sm:grid-cols-3">
                    {currentUser.photoGallery.map((photo, index) => (
                      <a
                        key={photo}
                        href={photo}
                        target="_blank"
                        rel="noreferrer"
                        className={`group relative overflow-hidden rounded-2xl border border-outline-variant/40 ${index === 0 ? "col-span-2 row-span-2 sm:col-span-2" : ""}`}
                      >
                        <img
                          src={photo}
                          alt={`Gallery item ${index + 1}`}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="mt-5 flex flex-col items-center rounded-2xl border border-dashed border-outline-variant bg-surface-container-low/50 px-4 py-9 text-center">
                    <ImageIcon
                      size={24}
                      className="text-on-surface-variant/50"
                    />
                    <p className="mt-2 text-xs font-semibold text-on-surface">
                      Your gallery is empty
                    </p>
                    <p className="mt-1 text-[11px] text-on-surface-variant">
                      Uploaded profile photos will appear here.
                    </p>
                  </div>
                )}
              </section>
            </div>

            <aside className="space-y-6">
              <section className="rounded-3xl border border-outline-variant/60 bg-surface-container-lowest p-4 shadow-xs">
                <div className="px-2 pb-3 pt-1">
                  <h3 className="font-display text-base font-bold text-on-surface">
                    Preferences
                  </h3>
                  <p className="mt-0.5 text-[11px] text-on-surface-variant">
                    Fine-tune your ChatPulse experience
                  </p>
                </div>
                <div className="space-y-1">
                  <PreferenceRow
                    icon={<LockKeyhole size={18} />}
                    title="Private profile"
                    description="Only your contacts can view your posts"
                    enabled={privateProfile}
                    onToggle={() => setPrivateProfile((value) => !value)}
                  />
                  <PreferenceRow
                    icon={<MessageCircleMore size={18} />}
                    title="Read receipts"
                    description="Let people know when messages are read"
                    enabled={readReceipts}
                    onToggle={() => setReadReceipts((value) => !value)}
                  />
                  <PreferenceRow
                    icon={<Eye size={18} />}
                    title="Active indicator"
                    description="Show when you are active in ChatPulse"
                    enabled={activeIndicator}
                    onToggle={() => setActiveIndicator((value) => !value)}
                  />
                  <PreferenceRow
                    icon={<BellRing size={18} />}
                    title="Sound alerts"
                    description="Play a sound for new notifications"
                    enabled={soundAlerts}
                    onToggle={() => setSoundAlerts((value) => !value)}
                  />
                </div>
              </section>
              <section className="relative overflow-hidden rounded-3xl bg-[linear-gradient(145deg,var(--color-on-primary-container),var(--color-primary))] p-5 text-white shadow-lg shadow-primary/15">
                <div className="absolute -right-7 -top-7 h-28 w-28 rounded-full bg-white/10" />
                <div className="relative">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                    <ShieldCheck size={22} />
                  </div>
                  <h3 className="mt-4 font-display text-base font-bold">
                    Your account is protected
                  </h3>
                  <p className="mt-2 text-xs leading-5 text-white/75">
                    Your conversations and profile data are protected by secure
                    authentication.
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-[11px] font-semibold text-white/90">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15">
                      <Check size={12} />
                    </span>
                    Security checks passed
                  </div>
                </div>
              </section>
            </aside>
          </div>
        </div>
      </main>

      {isEditModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-profile-title"
        >
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-outline-variant bg-surface-container-lowest shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant/60 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-container text-primary">
                  <Edit3 size={16} />
                </div>
                <div>
                  <h3
                    id="edit-profile-title"
                    className="font-display text-base font-bold text-on-surface"
                  >
                    Edit profile
                  </h3>
                  <p className="text-[11px] text-on-surface-variant">
                    Keep your details fresh and recognizable
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="rounded-xl p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
                aria-label="Close edit profile"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveProfile}>
              <div className="max-h-[65vh] space-y-4 overflow-y-auto p-5 sm:p-6">
                {formError && (
                  <div className="rounded-xl bg-error-container px-3.5 py-3 text-xs font-medium text-on-error-container">
                    {formError}
                  </div>
                )}
                <FormField label="Display name">
                  <input
                    type="text"
                    value={editName}
                    onChange={(event) => setEditName(event.target.value)}
                    className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3.5 py-3 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
                    placeholder="Your name"
                    required
                  />
                </FormField>
                <FormField label="Bio" hint={`${editBio.length}/240`}>
                  <textarea
                    value={editBio}
                    onChange={(event) => setEditBio(event.target.value)}
                    maxLength={240}
                    rows={4}
                    className="w-full resize-none rounded-xl border border-outline-variant bg-surface-container-low px-3.5 py-3 text-sm leading-5 text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
                    placeholder="Share a little about yourself"
                  />
                </FormField>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField label="Location">
                    <IconInput
                      icon={<MapPin size={15} />}
                      value={editLocation}
                      onChange={setEditLocation}
                      placeholder="City, country"
                    />
                  </FormField>
                  <FormField label="Website">
                    <IconInput
                      icon={<Globe2 size={15} />}
                      value={editWebsite}
                      onChange={setEditWebsite}
                      placeholder="yourwebsite.com"
                    />
                  </FormField>
                </div>
              </div>
              <div className="flex gap-3 border-t border-outline-variant/60 bg-surface-container-low/60 px-5 py-4 sm:justify-end sm:px-6">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isSaving}
                  className="flex-1 rounded-xl border border-outline-variant bg-surface-container-lowest px-5 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-high disabled:opacity-60 sm:flex-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !editName.trim()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
                >
                  {isSaving ? (
                    <LoaderCircle size={15} className="animate-spin" />
                  ) : (
                    <Save size={15} />
                  )}
                  {isSaving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const SectionTitle: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  accent?: "primary" | "secondary" | "tertiary";
}> = ({ icon, title, subtitle, accent = "primary" }) => {
  const accentClass =
    accent === "secondary"
      ? "bg-secondary-container text-secondary"
      : accent === "tertiary"
        ? "bg-tertiary-container text-tertiary"
        : "bg-primary-container text-primary";
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-2xl ${accentClass}`}
      >
        {icon}
      </div>
      <div>
        <h3 className="font-display text-base font-bold text-on-surface">
          {title}
        </h3>
        <p className="text-[11px] text-on-surface-variant">{subtitle}</p>
      </div>
    </div>
  );
};

const FormField: React.FC<{
  label: string;
  hint?: string;
  children: React.ReactNode;
}> = ({ label, hint, children }) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between">
      <label className="text-xs font-semibold text-on-surface">{label}</label>
      {hint && (
        <span className="text-[10px] text-on-surface-variant">{hint}</span>
      )}
    </div>
    {children}
  </div>
);

const IconInput: React.FC<{
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}> = ({ icon, value, onChange, placeholder }) => (
  <div className="relative">
    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant">
      {icon}
    </span>
    <input
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-3 pl-10 pr-3.5 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10"
      placeholder={placeholder}
    />
  </div>
);
