import { useState, useEffect, useRef } from "react";
import { NotificationItem } from "../../types/Notification";
import { useFriends } from "../friends/FriendsContext";
import { useAuth } from "../auth/AuthContext";
import { socketService } from "../chat/services/socket.service";
import { FriendRequest } from "../../types/Friend";
import { ApiMessage, ApiUser } from "../../types/Api";

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function useNotificationsState() {
  const { incomingRequests } = useFriends();
  const { currentUser } = useAuth();
  const [localNotifications, setLocalNotifications] = useState<
    NotificationItem[]
  >([]);
  const [dismissedIds, setDismissedIds] = useState<Record<string, boolean>>({});
  const [messageToast, setMessageToast] = useState<NotificationItem | null>(
    null,
  );
  const messageIdsRef = useRef(new Set<string>());
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    const handleAccepted = ({ request }: { request: FriendRequest }) => {
      const myId = currentUser.id;
      if (
        typeof request.requester === "object" &&
        request.requester._id !== myId
      ) {
        return;
      }
      const acceptor =
        typeof request.addressee === "object" ? request.addressee : null;

      setLocalNotifications((prev) => {
        const id = `accepted-${request._id}`;
        if (prev.some((n) => n.id === id)) return prev;
        return [
          {
            id,
            title: "Lời mời được chấp nhận",
            description: `${acceptor?.name ?? "Ai đó"} đã chấp nhận lời mời kết bạn của bạn.`,
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            type: "friend" as const,
            unread: true,
            senderId:
              typeof request.addressee === "object"
                ? request.addressee._id
                : undefined,
          },
          ...prev,
        ];
      });
    };

    const handleMessageReceived = (message: ApiMessage) => {
      const sender =
        typeof message.sender === "object" ? (message.sender as ApiUser) : null;
      const senderId = sender?._id ?? sender?.id ?? String(message.sender);
      const conversationId = message.conversationId?.toString();

      if (
        senderId === currentUser.id ||
        !conversationId ||
        messageIdsRef.current.has(message._id)
      ) {
        return;
      }

      messageIdsRef.current.add(message._id);
      const senderName = sender?.name || "Someone";
      const messageText = message.content?.trim();
      const attachmentLabel =
        message.attachmentType === "image"
          ? "sent you a photo"
          : message.attachmentType === "video"
            ? "sent you a video"
            : "sent you a message";
      const notification: NotificationItem = {
        id: `message-${message._id}`,
        title: `New message from ${senderName}`,
        description: messageText
          ? messageText.length > 90
            ? `${messageText.slice(0, 90)}…`
            : messageText
          : `${senderName} ${attachmentLabel}.`,
        time: formatTime(message.createdAt),
        type: "message",
        unread: true,
        senderId,
        conversationId,
      };

      setLocalNotifications((previous) => [notification, ...previous]);
      setMessageToast(notification);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => setMessageToast(null), 5000);
    };

    socketService.on("friendRequestAccepted", handleAccepted);
    socketService.on("messageReceived", handleMessageReceived);
    return () => {
      socketService.off("friendRequestAccepted", handleAccepted);
      socketService.off("messageReceived", handleMessageReceived);
    };
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) return;
    setLocalNotifications([]);
    setMessageToast(null);
    messageIdsRef.current.clear();
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }, [currentUser]);

  useEffect(
    () => () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    },
    [],
  );

  const friendNotifications: NotificationItem[] = incomingRequests
    .filter((req) => !dismissedIds[req._id])
    .map((req) => {
      const sender = typeof req.requester === "object" ? req.requester : null;
      return {
        id: req._id,
        title: "Lời mời kết bạn",
        description: `${sender?.name ?? "Ai đó"} đã gửi lời mời kết bạn cho bạn.`,
        time: formatTime(req.createdAt),
        type: "friend" as const,
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
    setLocalNotifications((prev) => prev.filter((item) => item.id !== id));
  };

  const markNotificationAsRead = (id: string) => {
    setLocalNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, unread: false } : item)),
    );
  };

  return {
    notifications,
    setNotifications: setLocalNotifications,
    markNotificationsAsRead,
    removeNotification,
    markNotificationAsRead,
    messageToast,
    dismissMessageToast: () => setMessageToast(null),
  };
}
