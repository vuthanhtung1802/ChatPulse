import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { ChatService } from "./chat.service";
import { UsersService } from "../users/users.service";
import { CreateMessageDto } from "./dto/create-message.dto";

@WebSocketGateway({
  cors: {
    origin: true, // Allow all origins for development; adjust in production
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly chatService: ChatService,
    private readonly usersService: UsersService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Authenticate socket connection via query param or headers
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(" ")[1];
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>("JWT_SECRET"),
      });

      // Store user details in socket metadata
      client.data.userId = payload.sub;
      client.data.email = payload.email;

      // Update online status in database
      await this.usersService.updateStatus(payload.sub, "online");

      // Broadcast user online status change
      this.server.emit("userStatusChanged", {
        userId: payload.sub,
        status: "online",
      });

      console.log(
        `Socket Client Connected: ${client.id}, User: ${client.data.email}`,
      );
    } catch (error: any) {
      console.log("Socket connection auth failed:", error.message);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    console.log(`Socket Client Disconnected: ${client.id}`);
    const userId = client.data.userId;
    if (userId) {
      // Update offline status in database
      await this.usersService.updateStatus(userId, "offline");

      // Broadcast user offline status change
      this.server.emit("userStatusChanged", {
        userId,
        status: "offline",
      });
    }
  }

  @SubscribeMessage("joinConversation")
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody("conversationId") conversationId: string,
  ) {
    client.join(conversationId);
    console.log(`User ${client.data.email} joined room: ${conversationId}`);
    return { status: "joined", room: conversationId };
  }

  @SubscribeMessage("leaveConversation")
  async handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody("conversationId") conversationId: string,
  ) {
    client.leave(conversationId);
    console.log(`User ${client.data.email} left room: ${conversationId}`);
    return { status: "left", room: conversationId };
  }

  @SubscribeMessage("sendMessage")
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() createMessageDto: CreateMessageDto,
  ) {
    const senderId = client.data.userId;
    const { conversationId, content, attachmentUrl, attachmentType } = createMessageDto;

    const message = await this.chatService.createMessage(
      senderId,
      conversationId,
      content || "",
      attachmentUrl || "",
      attachmentType || "",
    );

    // Emit the new message to all clients in the conversation room
    this.server.to(conversationId).emit("newMessage", message);
    return message;
  }

  @SubscribeMessage("typing")
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; isTyping: boolean },
  ) {
    const { conversationId, isTyping } = data;

    // Broadcast to others in the room
    client.to(conversationId).emit("userTyping", {
      conversationId,
      userId: client.data.userId,
      email: client.data.email,
      isTyping,
    });
  }

  @SubscribeMessage("seenConversation")
  async handleSeenConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const { conversationId } = data;
    const userId = client.data.userId;
    if (!userId || !conversationId) return;

    await this.chatService.markConversationAsRead(conversationId, userId);

    // Broadcast to others in the room that this user has seen the conversation
    client.to(conversationId).emit("conversationSeen", {
      conversationId,
      userId,
    });
  }

  @SubscribeMessage("recallMessage")
  async handleRecallMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; conversationId: string },
  ) {
    const { messageId, conversationId } = data;
    const userId = client.data.userId;
    if (!userId || !messageId || !conversationId) return;

    const message = await this.chatService.recallMessage(messageId, userId);

    // Emit to everyone in the room that the message was recalled
    this.server.to(conversationId).emit("messageRecalled", {
      messageId,
      conversationId,
      message,
    });
  }
}
