import { useState } from 'react';
import { NotificationItem } from '../types/Notification';

export function useNotificationsState() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const markNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  return { notifications, setNotifications, markNotificationsAsRead };
}
