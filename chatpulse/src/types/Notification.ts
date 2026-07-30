export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'message' | 'system' | 'like' | 'mention';
  unread: boolean;
}
