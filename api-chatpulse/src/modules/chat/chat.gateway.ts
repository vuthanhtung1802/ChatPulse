import {
  ConnectedSocket,
  Ack,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from "@nestjs/websockets";
import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { Server, Socket } from "socket.io";
import { ChatService } from "./chat.service";
import { UsersService } from "../users/users.service";
import { FriendsRealtimeService } from "../friends/friends-realtime.service";
import { FriendRequestDocument } from "../friends/schemas/friend-request.schema";
import { ConversationDocument } from "./schemas/conversation.schema";
import {
  conversationRoom,
  SendMessagePayload,
  SocketAck,
  TypingPayload,
  userRoom,
} from "./chat-realtime.types";
import { parseCorsOrigins } from "../../config/environment";

@WebSocketGateway({
  cors: {
    origin: parseCorsOrigins(
      process.env.CORS_ORIGINS || "http://localhost:3000",
    ),
    credentials: true,
  },
})
@Injectable()
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnApplicationBootstrap
{
  private readonly logger = new Logger(ChatGateway.name);

  // Track how many socket connections a user currently holds (multi-tab).
  // Status flips to "offline" only when the last connection drops.
  private readonly connectionCounts = new Map<string, number>();

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly usersService: UsersService,
    private readonly friendsRealtime: FriendsRealtimeService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.usersService.resetAllStatuses();
  }

  notifyFriendsOfPost(friendIds: string[], post: unknown): void {
    for (const friendId of friendIds) {
      this.server.to(userRoom(friendId)).emit("friendPostCreated", { post });
    }
  }

  notifyConversationCreated(conversation: ConversationDocument): void {
    const room = conversationRoom(conversation._id.toString());
    for (const participant of conversation.participants) {
      const populatedId = (participant as unknown as { _id?: unknown })._id;
      const participantId = String(populatedId ?? participant);
      this.server.in(userRoom(participantId)).socketsJoin(room);
      this.server
        .to(userRoom(participantId))
        .emit("conversationCreated", { conversation });
    }
  }

  removeUserFromConversationRoom(userId: string, conversationId: string): void {
    this.server
      .in(userRoom(userId))
      .socketsLeave(conversationRoom(conversationId));
  }

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = client.handshake.auth?.token as string | undefined;
      if (!token) {
        throw new WsException("Missing authentication token");
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>("JWT_SECRET"),
      });
      const userId = payload.sub as string;

      client.data.userId = userId;
      client.join(userRoom(userId));

      // Join all of the user's conversations so realtime events reach
      // every connected tab, even when the chat screen is not open.
      const conversations =
        await this.chatService.getConversationsForUser(userId);
      for (const conversation of conversations) {
        client.join(conversationRoom(conversation._id.toString()));
      }

      const count = (this.connectionCounts.get(userId) ?? 0) + 1;
      this.connectionCounts.set(userId, count);

      if (count === 1) {
        await this.usersService.updateStatus(userId, "online");
        this.server.emit("userStatusChanged", { userId, status: "online" });
      }
    } catch (error) {
      this.logger.warn(
        `Socket connection rejected: ${(error as Error).message}`,
      );
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    const userId = client.data?.userId as string | undefined;
    if (!userId) return;

    const count = (this.connectionCounts.get(userId) ?? 1) - 1;
    if (count <= 0) {
      this.connectionCounts.delete(userId);
      await this.usersService.updateStatus(userId, "offline");
      this.server.emit("userStatusChanged", { userId, status: "offline" });
    } else {
      this.connectionCounts.set(userId, count);
    }
  }

  @SubscribeMessage("joinConversation")
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string },
  ): Promise<void> {
    const userId = client.data.userId as string;
    const isParticipant = await this.chatService.hasParticipant(
      payload.conversationId,
      userId,
    );
    if (!isParticipant) {
      throw new WsException("You are not a participant of this conversation");
    }
    client.join(conversationRoom(payload.conversationId));
  }

  @SubscribeMessage("leaveConversation")
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string },
  ): void {
    client.leave(conversationRoom(payload.conversationId));
  }

  @SubscribeMessage("sendMessage")
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SendMessagePayload,
    @Ack() acknowledge?: (response: { ok: true }) => void,
  ): Promise<void> {
    const userId = client.data.userId as string;

    const message = await this.chatService.createMessage(
      userId,
      payload.conversationId,
      payload.content ?? "",
      payload.attachmentUrl ?? "",
      payload.attachmentType ?? "",
      payload.clientMessageId ?? "",
      payload.replyTo ?? "",
    );

    this.server
      .to(conversationRoom(payload.conversationId))
      .emit("messageReceived", message);
    acknowledge?.({ ok: true });
  }

  @SubscribeMessage("typing")
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: TypingPayload,
  ): Promise<void> {
    const userId = client.data.userId as string;
    return this.broadcastTyping(client, userId, payload);
  }

  private async broadcastTyping(
    client: Socket,
    userId: string,
    payload: TypingPayload,
  ): Promise<void> {
    if (
      !(await this.chatService.hasParticipant(payload.conversationId, userId))
    ) {
      throw new WsException("You are not a participant of this conversation");
    }
    client.to(conversationRoom(payload.conversationId)).emit("typing", {
      conversationId: payload.conversationId,
      userId,
      isTyping: payload.isTyping,
    });
  }

  @SubscribeMessage("seenMessage")
  async handleSeenMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string },
  ): Promise<void> {
    const userId = client.data.userId as string;

    const modifiedCount = await this.chatService.markMessagesRead(
      payload.conversationId,
      userId,
    );

    if (modifiedCount > 0) {
      this.server
        .to(conversationRoom(payload.conversationId))
        .emit("messageSeen", {
          conversationId: payload.conversationId,
          seenBy: userId,
        });
    }
  }

  @SubscribeMessage("recallMessage")
  async handleRecallMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { messageId: string },
  ): Promise<void> {
    const userId = client.data.userId as string;

    const message = await this.chatService.recallMessage(
      payload.messageId,
      userId,
    );

    this.server
      .to(conversationRoom(message.conversationId.toString()))
      .emit("messageRecalled", {
        conversationId: message.conversationId.toString(),
        messageId: message._id.toString(),
      });
  }

  @SubscribeMessage("toggleReaction")
  async handleToggleReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { messageId: string; emoji: string },
  ): Promise<void> {
    const message = await this.chatService.toggleReaction(
      payload.messageId,
      client.data.userId as string,
      payload.emoji,
    );
    this.server
      .to(conversationRoom(message.conversationId.toString()))
      .emit("messageReactionUpdated", {
        conversationId: message.conversationId.toString(),
        messageId: message._id.toString(),
        reactions: message.reactions,
      });
  }

  @SubscribeMessage("sendFriendRequest")
  async handleSendFriendRequest(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { to: string },
    @Ack() acknowledge?: SocketAck<FriendRequestDocument>,
  ): Promise<void> {
    await this.friendsRealtime.sendRequest(
      this.server,
      client.data.userId as string,
      payload.to,
      acknowledge,
    );
  }

  @SubscribeMessage("acceptFriendRequest")
  async handleAcceptFriendRequest(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { requestId: string },
    @Ack() acknowledge?: SocketAck<FriendRequestDocument>,
  ): Promise<void> {
    await this.friendsRealtime.acceptRequest(
      this.server,
      client.data.userId as string,
      payload.requestId,
      acknowledge,
    );
  }

  @SubscribeMessage("declineFriendRequest")
  async handleDeclineFriendRequest(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { requestId: string },
    @Ack() acknowledge?: SocketAck,
  ): Promise<void> {
    await this.friendsRealtime.declineRequest(
      this.server,
      client.data.userId as string,
      payload.requestId,
      acknowledge,
    );
  }

  @SubscribeMessage("removeFriend")
  async handleRemoveFriend(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { friendId: string },
    @Ack() acknowledge?: SocketAck,
  ): Promise<void> {
    await this.friendsRealtime.removeFriend(
      this.server,
      client.data.userId as string,
      payload.friendId,
      acknowledge,
    );
  }
}
