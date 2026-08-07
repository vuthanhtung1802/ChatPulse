export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  timestamp: string;
  status?: 'sent' | 'delivered' | 'read';
  attachmentUrl?: string;
  attachmentType?: 'image' | 'video';
  isRecalled?: boolean;
}

