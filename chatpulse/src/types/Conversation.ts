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