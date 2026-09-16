import React from "react";
import { MessageSquare, Newspaper, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { NotificationItem } from "../../../types/Notification";

interface RealtimeNotificationToastProps {
  notification: NotificationItem | null;
  onOpen: (notification: NotificationItem) => void;
  onDismiss: () => void;
}

export const RealtimeNotificationToast: React.FC<
  RealtimeNotificationToastProps
> = ({ notification, onOpen, onDismiss }) => (
  <AnimatePresence>
    {notification && (
      <motion.div
        key={notification.id}
        initial={{ opacity: 0, x: 32, scale: 0.96 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 24, scale: 0.96 }}
        transition={{ duration: 0.2 }}
        className="fixed right-5 top-5 z-[70] w-[min(24rem,calc(100vw-2.5rem))] overflow-hidden rounded-2xl border border-outline-variant/70 bg-surface-container-lowest shadow-2xl"
      >
        <div className="h-1 bg-gradient-to-r from-primary to-secondary" />
        <div className="flex items-start gap-3 p-4">
          <button
            type="button"
            onClick={() => onOpen(notification)}
            className="flex min-w-0 flex-1 items-start gap-3 text-left"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-container text-primary">
              {notification.type === "post" ? (
                <Newspaper size={18} />
              ) : (
                <MessageSquare size={18} />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-on-surface">
                {notification.title}
              </span>
              <span className="mt-1 block truncate text-xs text-on-surface-variant">
                {notification.description}
              </span>
              <span className="mt-2 block text-[10px] font-semibold text-primary">
                {notification.type === "post"
                  ? "View post"
                  : "Open conversation"}
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss notification"
            className="rounded-lg p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
          >
            <X size={15} />
          </button>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);
