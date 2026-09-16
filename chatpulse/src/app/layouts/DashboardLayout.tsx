import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { SideNavBar } from "../../components/layout/SideNavBar";
import { SearchFriendModal } from "../../features/users/components/SearchFriendModal";
import { RealtimeNotificationToast } from "../../features/notifications/components/RealtimeNotificationToast";
import { useNotifications } from "../../features/notifications/NotificationsContext";
import { useChat } from "../../features/chat/ChatContext";

// Protected layout: sidebar + animated page outlet + global modals.
export const DashboardLayout: React.FC = () => {
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const navigate = useNavigate();
  const {
    notificationToast,
    dismissNotificationToast,
    markNotificationAsRead,
  } = useNotifications();
  const { setActiveConversationId } = useChat();

  const openRealtimeNotification = () => {
    if (!notificationToast) return;
    markNotificationAsRead(notificationToast.id);
    dismissNotificationToast();
    if (notificationToast.type === "message") {
      if (!notificationToast.conversationId) return;
      setActiveConversationId(notificationToast.conversationId);
      navigate("/messages");
      return;
    }
    navigate("/");
  };

  return (
    <div className="w-full h-full flex overflow-hidden bg-background">
      <SideNavBar onNewChatClick={() => setIsNewChatOpen(true)} />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={window.location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="w-full h-full flex flex-col"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <SearchFriendModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
      />

      <RealtimeNotificationToast
        notification={notificationToast}
        onOpen={openRealtimeNotification}
        onDismiss={dismissNotificationToast}
      />
    </div>
  );
};
