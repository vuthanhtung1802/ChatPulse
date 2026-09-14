export interface SendMessagePayload {
  conversationId: string;
  content?: string;
  attachmentUrl?: string;
  attachmentType?: "image" | "video";
  clientMessageId: string;
  replyTo?: string;
}

export type SocketEvent =
  | "messageReceived"
  | "messageSeen"
  | "messageRecalled"
  | "messageReactionUpdated"
  | "conversationCreated"
  | "typing"
  | "userStatusChanged"
  | "friendRequestReceived"
  | "friendRequestAccepted"
  | "friendRequestDeclined"
  | "friendRemoved"
  | "connect"
  | "disconnect";

export type EventHandler = (...args: any[]) => void;

export type Acknowledgement<T> =
  { ok: true; data?: T } | { ok: false; error: string };
