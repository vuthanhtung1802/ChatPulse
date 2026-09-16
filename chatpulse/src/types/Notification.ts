export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "message" | "system" | "like" | "mention" | "friend";
  unread: boolean;
  requestId?: string;
  senderId?: string;
  conversationId?: string;
}
