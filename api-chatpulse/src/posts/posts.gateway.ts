import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

@WebSocketGateway({
  cors: {
    origin: true,
  },
})
export class PostsGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage("joinPost")
  handleJoinPost(
    @MessageBody() data: { postId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`post_${data.postId}`);
  }

  @SubscribeMessage("leavePost")
  handleLeavePost(
    @MessageBody() data: { postId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`post_${data.postId}`);
  }

  emitNewComment(comment: any) {
    this.server.to(`post_${comment.post}`).emit("newComment", comment);
  }

  emitDeleteComment(data: { postId: string; commentId: string }) {
    this.server
      .to(`post_${data.postId}`)
      .emit("deleteComment", data);
  }
}
