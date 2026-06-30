export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  plan: string;
  status: 'online' | 'offline' | 'typing';
  bio?: string;
  location?: string;
  joinDate?: string;
  website?: string;
  interests?: string[];
  photoGallery?: string[];
}

export interface Conversation {
  id: string;
  participantName: string;
  participantAvatar: string;
  participantStatus: 'online' | 'offline' | 'typing';
  lastMessageText: string;
  lastMessageTime: string;
  lastMessageUnread: boolean;
  isGroup?: boolean;
  groupInitials?: string;
}

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
}

export interface Post {
  id: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  timestamp: string;
  likes: number;
  commentsCount: number;
  shares: number;
  likedByMe?: boolean;
  images?: string[];
}
