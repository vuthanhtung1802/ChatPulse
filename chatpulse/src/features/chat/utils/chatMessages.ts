import { Message } from '../../../types/types';

export interface PendingMessage {
  conversationId: string;
  text: string;
  attachmentUrl?: string;
}

export interface OptimisticInput {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  attachmentUrl?: string;
  attachmentType?: 'image' | 'video';
}

export function createOptimisticMessage(input: OptimisticInput): Message {
  return {
    id: input.id,
    text: input.text,
    senderId: input.senderId,
    senderName: input.senderName,
    senderAvatar: input.senderAvatar,
    timestamp: new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
    status: 'sent',
    attachmentUrl: input.attachmentUrl,
    attachmentType: input.attachmentType,
  };
}

export function generateTempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function matchPendingMessage(
  pending: Map<string, PendingMessage>,
  conversationId: string,
  text: string,
  attachmentUrl?: string,
): string | null {
  for (const [id, p] of pending) {
    if (
      p.conversationId === conversationId &&
      p.text === text &&
      (p.attachmentUrl || '') === (attachmentUrl || '')
    ) {
      return id;
    }
  }
  return null;
}

export function mergeMessage(
  list: Message[],
  incoming: Message,
  tempId?: string | null,
): Message[] {
  if (list.some((m) => m.id === incoming.id)) return list;
  if (tempId && list.some((m) => m.id === tempId)) {
    return list.map((m) => (m.id === tempId ? incoming : m));
  }
  return [...list, incoming];
}

export function previewText(text: string, attachmentUrl?: string): string {
  return text || (attachmentUrl ? 'Gửi một file đính kèm' : '');
}
