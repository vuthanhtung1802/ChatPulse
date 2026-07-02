export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
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
  participantId?: string;
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
  _id: string;
  author: {
    _id: string;
    name: string;
    avatar: string;
  };
  content: string;
  images: string[];
  likes: string[];
  hiddenBy?: string[];
  savedBy?: string[];
  createdAt: string;
  updatedAt: string;
  mood?: string;
  likedByMe?: boolean;
  savedByMe?: boolean;
  commentsCount?: number;
  shares?: number;
}
