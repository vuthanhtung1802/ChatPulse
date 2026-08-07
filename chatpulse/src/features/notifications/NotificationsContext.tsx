import React, { createContext, useContext } from 'react';
import { NotificationItem } from '../../types/Notification';
import { useNotificationsState } from './useNotifications';

interface NotificationsContextValue {
  notifications: NotificationItem[];
  markNotificationsAsRead: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(
  undefined,
);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const value = useNotificationsState();

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};