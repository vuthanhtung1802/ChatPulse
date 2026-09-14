export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  timestamp: string;
  status?: "sending" | "sent" | "delivered" | "read" | "failed";
  conversationId?: string;
  replyTo?: {
    id: string;
    text: string;
    senderName: string;
    isRecalled?: boolean;
  };
  reactions?: Array<{ user: string; emoji: string }>;
  attachmentUrl?: string;
  attachmentType?: "image" | "video";
  isRecalled?: boolean;
}
