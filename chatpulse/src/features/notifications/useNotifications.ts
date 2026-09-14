import { useState, useEffect } from 'react';
import { NotificationItem } from '../../types/Notification';
import { useFriends } from '../friends/FriendsContext';
import { useAuth } from '../auth/AuthContext';
import { socketService } from '../chat/services/socket.service';
import { FriendRequest } from '../../types/Friend';

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function useNotificationsState() {
  const { incomingRequests } = useFriends();
  const { currentUser } = useAuth();
  const [localNotifications, setLocalNotifications] = useState<
    NotificationItem[]
  >([]);
  const [dismissedIds, setDismissedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!currentUser) return;

    const handleAccepted = ({ request }: { request: FriendRequest }) => {
      const myId = currentUser.id;
      if (typeof request.requester === 'object' && request.requester._id !== myId) {
        return;
      }
      const acceptor =
        typeof request.addressee === 'object' ? request.addressee : null;

      setLocalNotifications((prev) => {
        const id = `accepted-${request._id}`;
        if (prev.some((n) => n.id === id)) return prev;
        return [
          {
            id,
            title: 'Lời mời được chấp nhận',
            description: `${acceptor?.name ?? 'Ai đó'} đã chấp nhận lời mời kết bạn của bạn.`,
            time: new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
            type: 'friend' as const,
            unread: true,
            senderId:
              typeof request.addressee === 'object'
                ? request.addressee._id
                : undefined,
          },
          ...prev,
        ];
      });
    };

    socketService.on('friendRequestAccepted', handleAccepted);
    return () => {
      socketService.off('friendRequestAccepted', handleAccepted);
    };
  }, [currentUser]);

  const friendNotifications: NotificationItem[] = incomingRequests
    .filter((req) => !dismissedIds[req._id])
    .map((req) => {
      const sender =
        typeof req.requester === 'object' ? req.requester : null;
      return {
        id: req._id,
        title: 'Lời mời kết bạn',
        description: `${sender?.name ?? 'Ai đó'} đã gửi lời mời kết bạn cho bạn.`,
        time: formatTime(req.createdAt),
        type: 'friend' as const,
        unread: true,
        requestId: req._id,
        senderId: sender?._id,
      };
    });

  const notifications = [...friendNotifications, ...localNotifications];

  const markNotificationsAsRead = () => {
    setLocalNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const removeNotification = (id: string) => {
    setDismissedIds((prev) => ({ ...prev, [id]: true }));
  };

  return {
    notifications,
    setNotifications: setLocalNotifications,
    markNotificationsAsRead,
    removeNotification,
  };
}