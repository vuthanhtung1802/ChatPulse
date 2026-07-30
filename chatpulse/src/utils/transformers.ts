import { User, Conversation, Message } from '../types/types';
import { getInitialsAvatar } from './avatarUtils';

export const transformUser = (u: any): User => {
  const name = u.name || '';
  return {
    id: u._id || u.id,
    name,
    email: u.email || '',
    avatar: u.avatar || getInitialsAvatar(name),
    role: u.role || 'user',
    plan: u.role === 'admin' ? 'Enterprise Plan' : 'Free Plan',
    status: u.status || 'offline',
    bio: u.bio || '',
    location: u.location || '',
    joinDate: u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '',
    website: u.website || '',
    interests: u.interests || [],
    photoGallery: u.photoGallery || []
  };
};

export const transformConversation = (c: any, currentUserId: string): Conversation => {
  if (c.isGroup) {
    const lastMsgText = c.lastMessage?.isRecalled 
      ? 'Tin nhắn đã bị thu hồi' 
      : (c.lastMessage?.content || (c.lastMessage?.attachmentUrl ? 'Gửi một file đính kèm' : 'Chưa có tin nhắn'));
    const lastMsgTime = c.lastMessage 
      ? new Date(c.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      : '';
    return {
      id: c._id,
      participantName: c.groupName || 'Nhóm chat',
      participantAvatar: '',
      participantStatus: 'online',
      lastMessageText: lastMsgText,
      lastMessageTime: lastMsgTime,
      lastMessageUnread: false,
      isGroup: true,
      groupInitials: (c.groupName || 'GP').substring(0, 2).toUpperCase()
    };
  } else {
    const otherParticipant = c.participants?.find((p: any) => (p._id || p) !== currentUserId) || c.participants?.[0] || {};
    const lastMsgText = c.lastMessage?.isRecalled 
      ? 'Tin nhắn đã bị thu hồi' 
      : (c.lastMessage?.content || (c.lastMessage?.attachmentUrl ? 'Gửi một file đính kèm' : 'Chưa có tin nhắn'));
    const lastMsgTime = c.lastMessage 
      ? new Date(c.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      : '';
    return {
      id: c._id,
      participantId: otherParticipant._id || otherParticipant,
      participantName: otherParticipant.name || 'Unknown User',
      participantAvatar: otherParticipant.avatar || getInitialsAvatar(otherParticipant.name),
      participantStatus: otherParticipant.status || 'offline',
      lastMessageText: lastMsgText,
      lastMessageTime: lastMsgTime,
      lastMessageUnread: false
    };
  }
};

export const transformMessage = (msg: any): Message => {
  const senderId = msg.sender?._id || msg.sender;
  return {
    id: msg._id,
    text: msg.isRecalled ? 'Tin nhắn đã bị thu hồi' : (msg.content || ''),
    senderId: senderId,
    senderName: msg.sender?.name || '',
    senderAvatar: msg.sender?.avatar || getInitialsAvatar(msg.sender?.name),
    timestamp: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: msg.isRecalled ? undefined : (msg.status || 'sent'),
    attachmentUrl: msg.isRecalled ? undefined : msg.attachmentUrl,
    attachmentType: msg.isRecalled ? undefined : msg.attachmentType
  };
};
