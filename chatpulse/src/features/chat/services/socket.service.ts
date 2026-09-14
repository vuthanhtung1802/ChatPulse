import { io, Socket } from "socket.io-client";
import { WS_URL } from "../../../config/env";
import { FriendRequest } from "../../../types/Friend";

export interface MessageDoc {
  _id: string;
  conversationId: string;
  sender:
    { _id: string; name: string; email?: string; avatar?: string } | string;
  content: string;
  attachmentUrl?: string;
  attachmentType?: string;
  status?: string;
  isRecalled?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserStatusPayload {
  userId: string;
  status: "online" | "offline";
}

export interface TypingPayload {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

export interface MessageSeenPayload {
  conversationId: string;
  seenBy: string;
}

export interface MessageRecalledPayload {
  conversationId: string;
  messageId: string;
}

export interface SendMessagePayload {
  conversationId: string;
  content?: string;
  attachmentUrl?: string;
  attachmentType?: "image" | "video";
  clientMessageId: string;
  replyTo?: string;
}

export interface FriendRequestPayload {
  requestId: string;
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

type EventHandler = (...args: any[]) => void;

/**
 * Singleton wrapper around the Socket.IO client.
 * Listeners registered via on() are buffered, so components can register
 * handlers even before the socket connects (e.g. during login).
 */
class SocketService {
  private socket: Socket | null = null;
  private readonly listeners = new Map<string, Set<EventHandler>>();

  connect(token: string): void {
    if (this.socket?.connected) return;

    this.socket = io(WS_URL, {
      auth: { token },
      transports: ["websocket"],
    });

    for (const [event, handlers] of this.listeners) {
      for (const handler of handlers) {
        this.socket.on(event, handler);
      }
    }
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  on(event: SocketEvent, handler: EventHandler): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
    this.socket?.on(event, handler);
  }

  off(event: SocketEvent, handler: EventHandler): void {
    this.listeners.get(event)?.delete(handler);
    this.socket?.off(event, handler);
  }

  joinConversation(conversationId: string): void {
    this.socket?.emit("joinConversation", { conversationId });
  }

  leaveConversation(conversationId: string): void {
    this.socket?.emit("leaveConversation", { conversationId });
  }

  sendMessage(payload: SendMessagePayload): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error("Socket is disconnected"));
        return;
      }
      this.socket
        .timeout(8000)
        .emit("sendMessage", payload, (error: Error | null) => {
          if (error) reject(error);
          else resolve();
        });
    });
  }

  private emitWithAck<T>(event: string, payload: unknown): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error("Socket is disconnected"));
        return;
      }
      this.socket
        .timeout(8000)
        .emit(
          event,
          payload,
          (
            timeoutError: Error | null,
            response?: { ok: true; data?: T } | { ok: false; error: string },
          ) => {
            if (timeoutError) {
              reject(timeoutError);
            } else if (!response) {
              reject(new Error("Request failed"));
            } else if (response.ok === false) {
              reject(new Error(response.error));
            } else {
              resolve(response.data as T);
            }
          },
        );
    });
  }

  emitTyping(conversationId: string, isTyping: boolean): void {
    this.socket?.emit("typing", { conversationId, isTyping });
  }

  emitSeen(conversationId: string): void {
    this.socket?.emit("seenMessage", { conversationId });
  }

  emitRecall(messageId: string): void {
    this.socket?.emit("recallMessage", { messageId });
  }

  toggleReaction(messageId: string, emoji: string): void {
    this.socket?.emit("toggleReaction", { messageId, emoji });
  }

  sendFriendRequest(targetUserId: string): Promise<FriendRequest> {
    return this.emitWithAck<FriendRequest>("sendFriendRequest", {
      to: targetUserId,
    });
  }

  acceptFriendRequest(requestId: string): Promise<FriendRequest> {
    return this.emitWithAck<FriendRequest>("acceptFriendRequest", {
      requestId,
    });
  }

  declineFriendRequest(requestId: string): Promise<void> {
    return this.emitWithAck<void>("declineFriendRequest", { requestId });
  }

  emitRemoveFriend(friendId: string): Promise<void> {
    return this.emitWithAck<void>("removeFriend", { friendId });
  }
}

export const socketService = new SocketService();
