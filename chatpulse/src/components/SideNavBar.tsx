import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { 
  Home, 
  MessageSquare, 
  Bell, 
  User as UserIcon, 
  Bookmark,
  Plus, 
  LogOut, 
  Sun, 
  Moon,
  Compass,
  Laptop
} from 'lucide-react';

interface SideNavBarProps {
  onNewChatClick?: () => void;
}

export const SideNavBar: React.FC<SideNavBarProps> = ({ onNewChatClick }) => {
  const { currentUser, logout, theme, toggleTheme, notifications, conversations } = useApp();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();

  const unreadNotificationsCount = notifications.filter(n => n.unread).length;
  const unreadMessagesCount = conversations.filter(c => c.lastMessageUnread).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', label: 'Feed', icon: Home, badge: 0 },
    { to: '/saved', label: 'Saved', icon: Bookmark, badge: 0 },
    { to: '/messages', label: 'Messages', icon: MessageSquare, badge: unreadMessagesCount },
    { to: '/notifications', label: 'Notifications', icon: Bell, badge: unreadNotificationsCount },
    { to: '/profile', label: 'Profile', icon: UserIcon, badge: 0 },
  ];

  return (
    <aside className="w-64 bg-surface-container-low border-r border-outline-variant flex flex-col h-full select-none z-10">
      {/* Brand Header */}
      <div className="p-5 flex items-center justify-between border-b border-outline-variant/50">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-bold text-lg shadow-sm shadow-primary/30 relative overflow-hidden">
            <span className="z-10 font-display">C</span>
            <div className="absolute inset-0 bg-white/10 mix-blend-overlay"></div>
          </div>
          <div>
            <h1 className="font-display font-bold text-base tracking-tight flex items-center gap-1.5 text-on-surface">
              ChatPulse
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
              </span>
            </h1>
            <p className="text-[10px] text-on-surface-variant font-medium tracking-wide uppercase opacity-70">
              COMMUNICATION HUB
            </p>
          </div>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="p-4">
        <button 
          onClick={onNewChatClick}
          className="w-full py-3 px-4 bg-primary text-on-primary font-medium rounded-xl flex items-center justify-center gap-2 hover:bg-primary-container hover:text-on-primary-container transition-all duration-200 shadow-sm shadow-primary/25 cursor-pointer group"
        >
          <Plus size={18} className="group-hover:rotate-90 transition-transform duration-200" />
          <span className="text-sm font-sans">New Chat</span>
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider opacity-60">
          Navigation
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `
              flex items-center justify-between px-3 py-3 rounded-xl transition-all duration-200 group cursor-pointer
              ${isActive 
                ? 'bg-primary-container text-on-primary-container font-semibold shadow-xs' 
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }
            `}
          >
            <div className="flex items-center gap-3">
              <item.icon 
                size={20} 
                className={`transition-transform duration-200 group-hover:scale-105`} 
              />
              <span className="text-sm font-sans">{item.label}</span>
            </div>
            {item.badge > 0 && (
              <span className="min-w-5 h-5 px-1.5 flex items-center justify-center rounded-full text-[10px] font-bold bg-error text-on-error animate-pulse">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom controls & profile section */}
      <div className="p-4 border-t border-outline-variant/50 space-y-4 bg-surface-container-low/80">
        
        {/* Theme Toggle Module */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-surface-container-high/60">
          <span className="text-xs font-medium text-on-surface-variant px-1">Appearance</span>
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg bg-surface-container-lowest text-on-surface border border-outline-variant/40 hover:bg-surface-container-highest transition-colors cursor-pointer"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <div className="flex items-center gap-1.5 text-amber-400">
                <Sun size={14} />
                <span className="text-[10px] font-medium text-on-surface">Light</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-indigo-600">
                <Moon size={14} />
                <span className="text-[10px] font-medium text-on-surface">Dark</span>
              </div>
            )}
          </button>
        </div>

        {/* Profile Card */}
        {currentUser && (
          <div className="relative">
            {showLogoutConfirm ? (
              <div className="absolute bottom-full left-0 right-0 mb-2 p-3 bg-surface-container-highest rounded-xl border border-outline-variant shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
                <p className="text-xs text-on-surface font-medium text-center mb-2.5">
                  Sign out of ChatPulse?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 py-1.5 px-2 bg-surface-container-lowest hover:bg-surface-container-high text-on-surface text-xs rounded-lg border border-outline-variant/50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex-1 py-1.5 px-2 bg-error text-on-error text-xs rounded-lg hover:bg-opacity-90 transition-colors cursor-pointer"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : null}

            <div className="flex items-center justify-between p-2 rounded-xl hover:bg-surface-container-high/60 transition-colors duration-200 group">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-xl object-cover ring-2 ring-primary/20"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-secondary border-2 border-surface-container-low rounded-full"></div>
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-on-surface truncate pr-1">
                    {currentUser.name}
                  </h4>
                  <span className="text-[10px] font-medium text-secondary bg-secondary-container/50 px-1.5 py-0.5 rounded-md border border-secondary-container/70">
                    {currentUser.plan}
                  </span>
                </div>
              </div>
              
              <button
                onClick={() => setShowLogoutConfirm(!showLogoutConfirm)}
                className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error-container/30 rounded-lg transition-colors cursor-pointer"
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
