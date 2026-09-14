export interface ApiUser {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  avatar?: string;
  role?: string;
  status?: "online" | "offline";
  bio?: string;
  location?: string;
  website?: string;
  interests?: string[];
  photoGallery?: string[];
  createdAt?: string;
}

export type ApiUserReference = ApiUser | string;

export interface ApiMessageReference {
  _id: string;
  content?: string;
  sender?: ApiUserReference;
  isRecalled?: boolean;
}

export interface ApiReaction {
  user: ApiUserReference;
  emoji: string;
}

export interface ApiMessage {
  _id: string;
  conversationId?: string | { toString(): string };
  sender: ApiUserReference;
  content?: string;
  attachmentUrl?: string;
  attachmentType?: "image" | "video";
  status?: "sent" | "delivered" | "read";
  isRecalled?: boolean;
  createdAt: string;
  replyTo?: ApiMessageReference;
  reactions?: ApiReaction[];
}

export interface ApiConversation {
  _id: string;
  participants?: ApiUserReference[];
  isGroup?: boolean;
  groupName?: string;
  lastMessage?: ApiMessage;
}
