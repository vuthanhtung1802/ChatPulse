export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "message" | "post" | "system" | "like" | "mention" | "friend";
  unread: boolean;
  requestId?: string;
  senderId?: string;
  conversationId?: string;
  postId?: string;
}
