export const userRoom = (userId: string): string => `user:${userId}`;

export const conversationRoom = (conversationId: string): string =>
  `conversation:${conversationId}`;

export interface SendMessagePayload {
  conversationId: string;
  content?: string;
  attachmentUrl?: string;
  attachmentType?: string;
  clientMessageId?: string;
  replyTo?: string;
}

export interface TypingPayload {
  conversationId: string;
  isTyping: boolean;
}

export type SocketAck<T = undefined> = (
  response: { ok: true; data?: T } | { ok: false; error: string },
) => void;

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Request failed";
}
