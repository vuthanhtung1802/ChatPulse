import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../NotificationsContext";
import { useFriends } from "../../friends/FriendsContext";
import {
  Bell,
  MessageSquare,
  Heart,
  AtSign,
  Check,
  Trash2,
  AlertCircle,
  UserPlus,
  UserCheck,
  UserX,
  X,
} from "lucide-react";
import { NotificationItem } from "../../../types/Notification";
import { useChat } from "../../chat/ChatContext";

export const Notifications: React.FC = () => {
  const [notificationToDelete, setNotificationToDelete] =
    useState<NotificationItem | null>(null);
  const {
    notifications,
    markNotificationsAsRead,
    markNotificationAsRead,
    removeNotification,
  } = useNotifications();
  const { acceptRequest, declineRequest } = useFriends();
  const { setActiveConversationId } = useChat();
  const navigate = useNavigate();

  const handleMarkAllRead = () => {
    markNotificationsAsRead();
  };

  const unreadCount = notifications.filter((n) => n.unread).length;

  const getIcon = (type: string) => {
    switch (type) {
      case "message":
        return <MessageSquare size={16} className="text-primary" />;
      case "like":
        return <Heart size={16} className="text-error" fill="currentColor" />;
      case "mention":
        return <AtSign size={16} className="text-secondary" />;
      case "friend":
        return <UserPlus size={16} className="text-primary" />;
      default:
        return <AlertCircle size={16} className="text-amber-500" />;
    }
  };

  const handleAccept = (notif: NotificationItem) => {
    if (!notif.requestId) return;
    acceptRequest(notif.requestId);
    removeNotification(notif.id);
  };

  const handleDecline = (notif: NotificationItem) => {
    if (!notif.requestId) return;
    declineRequest(notif.requestId);
    removeNotification(notif.id);
  };

  const handleOpenMessage = (notification: NotificationItem) => {
    if (!notification.conversationId) return;
    setActiveConversationId(notification.conversationId);
    markNotificationAsRead(notification.id);
    navigate("/messages");
  };

  const handleConfirmDelete = () => {
    if (!notificationToDelete) return;
    removeNotification(notificationToDelete.id);
    setNotificationToDelete(null);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-outline-variant/60 bg-surface-container-lowest flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <h2 className="font-display font-bold text-lg text-on-surface">
            Notifications
          </h2>
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
                    notif.unread ? "bg-primary-container/10" : ""
                  }`}
                >
                  {/* Left Icon Badge */}
                  <div className="w-9 h-9 rounded-xl bg-surface-container-high flex items-center justify-center shrink-0 border border-outline-variant/30">
                    {getIcon(notif.type)}
                  </div>

                  {/* Middle Context */}
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <h4
                        className={`text-sm text-on-surface ${
                          notif.unread ? "font-bold" : "font-semibold"
                        }`}
                      >
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-on-surface-variant opacity-80 shrink-0 ml-2">
                        {notif.time}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {notif.description}
                    </p>

                    {notif.type === "message" && notif.conversationId && (
                      <button
                        type="button"
                        onClick={() => handleOpenMessage(notif)}
                        className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary-container px-3 py-1.5 text-[11px] font-semibold text-on-primary-container transition-colors hover:bg-primary hover:text-on-primary"
                      >
                        <MessageSquare size={12} />
                        Open conversation
                      </button>
                    )}

                    {/* Friend request actions */}
                    {notif.type === "friend" && notif.requestId && (
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          onClick={() => handleAccept(notif)}
                          className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold flex items-center gap-1.5 hover:bg-primary-container hover:text-on-primary-container transition-colors cursor-pointer"
                        >
                          <UserCheck size={13} />
                          <span>Accept</span>
                        </button>
                        <button
                          onClick={() => handleDecline(notif)}
                          className="px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface-variant text-xs font-semibold flex items-center gap-1.5 hover:text-error hover:bg-error-container/30 transition-colors cursor-pointer"
                        >
                          <UserX size={13} />
                          <span>Decline</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-2 self-center">
                    {notif.unread && (
                      <span
                        className="h-2 w-2 rounded-full bg-primary"
                        aria-label="Unread"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => setNotificationToDelete(notif)}
                      className="rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-error-container hover:text-error"
                      aria-label={`Delete notification: ${notif.title}`}
                      title="Delete notification"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center mx-auto text-on-surface-variant">
                <Bell size={20} />
              </div>
              <h3 className="font-display font-semibold text-sm text-on-surface">
                No notifications yet
              </h3>
              <p className="text-xs text-on-surface-variant opacity-80">
                We will notify you when coworkers update layouts or start syncs.
              </p>
            </div>
          )}
        </div>
      </div>

      {notificationToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-notification-title"
        >
          <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-outline-variant bg-surface-container-lowest shadow-2xl">
            <div className="flex items-start justify-between px-5 pb-3 pt-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-error-container text-error">
                <Trash2 size={20} />
              </div>
              <button
                type="button"
                onClick={() => setNotificationToDelete(null)}
                className="rounded-xl p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
                aria-label="Close confirmation"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-5 pb-5">
              <h3
                id="delete-notification-title"
                className="font-display text-lg font-bold text-on-surface"
              >
                Delete this notification?
              </h3>
              <p className="mt-2 text-sm leading-5 text-on-surface-variant">
                “{notificationToDelete.title}” will be removed from your
                notification list.
              </p>
            </div>

            <div className="flex gap-3 border-t border-outline-variant/60 bg-surface-container-low/60 px-5 py-4">
              <button
                type="button"
                onClick={() => setNotificationToDelete(null)}
                className="flex-1 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-high"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-error px-4 py-2.5 text-sm font-semibold text-on-error transition-opacity hover:opacity-90"
              >
                <Trash2 size={15} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
