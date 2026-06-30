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
import { CreateMessageDto } from "./dto/create-message.dto";

@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly chatService: ChatService,
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

      console.log(
        `Socket Client Connected: ${client.id}, User: ${client.data.email}`,
      );
    } catch (error: any) {
      console.log("Socket connection auth failed:", error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Socket Client Disconnected: ${client.id}`);
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
    const { conversationId, content } = createMessageDto;

    const message = await this.chatService.createMessage(
      senderId,
      conversationId,
      content,
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
}
