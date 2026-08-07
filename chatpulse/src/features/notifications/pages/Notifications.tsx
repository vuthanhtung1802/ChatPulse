import React from 'react';
import { useNotifications } from '../NotificationsContext';
import { 
  Bell, 
  MessageSquare, 
  Heart, 
  AtSign, 
  Settings, 
  Check, 
  Trash2,
  AlertCircle
} from 'lucide-react';

export const Notifications: React.FC = () => {
  const { notifications, markNotificationsAsRead } = useNotifications();

  const handleMarkAllRead = () => {
    markNotificationsAsRead();
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare size={16} className="text-primary" />;
      case 'like':
        return <Heart size={16} className="text-error" fill="currentColor" />;
      case 'mention':
        return <AtSign size={16} className="text-secondary" />;
      default:
        return <AlertCircle size={16} className="text-amber-500" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      
      {/* Header */}
      <header className="h-16 border-b border-outline-variant/60 bg-surface-container-lowest flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <h2 className="font-display font-bold text-lg text-on-surface">Notifications</h2>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-error-container text-on-error-container border border-error-container/40">
              {unreadCount} Unread
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="px-3.5 py-1.5 rounded-xl border border-outline-variant text-xs font-semibold text-primary hover:bg-primary-container/20 hover:text-on-primary-container transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Check size={14} />
            <span>Mark all as read</span>
          </button>
        )}
      </header>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto px-6 py-6 max-w-3xl w-full mx-auto space-y-4">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xs overflow-hidden">
          {notifications.length > 0 ? (
            <div className="divide-y divide-outline-variant/40">
              {notifications.map((notif) => (
                <div 
                  key={notif.id}
                  className={`p-4 flex items-start gap-4 transition-colors hover:bg-surface-container-low/30 relative ${
                    notif.unread ? 'bg-primary-container/10' : ''
                  }`}
                >
                  {/* Left Icon Badge */}
                  <div className="w-9 h-9 rounded-xl bg-surface-container-high flex items-center justify-center shrink-0 border border-outline-variant/30">
                    {getIcon(notif.type)}
                  </div>

                  {/* Middle Context */}
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-sm text-on-surface ${
                        notif.unread ? 'font-bold' : 'font-semibold'
                      }`}>
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-on-surface-variant opacity-80 shrink-0 ml-2">
                        {notif.time}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {notif.description}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {notif.unread && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                  )}

                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center mx-auto text-on-surface-variant">
                <Bell size={20} />
              </div>
              <h3 className="font-display font-semibold text-sm text-on-surface">No notifications yet</h3>
              <p className="text-xs text-on-surface-variant opacity-80">We will notify you when coworkers update layouts or start syncs.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
