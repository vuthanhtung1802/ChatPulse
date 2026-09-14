import { Injectable } from "@nestjs/common";
import { Server } from "socket.io";
import {
  SocketAck,
  getErrorMessage,
  userRoom,
} from "../chat/chat-realtime.types";
import { FriendRequestDocument } from "./schemas/friend-request.schema";
import { FriendsService } from "./friends.service";

@Injectable()
export class FriendsRealtimeService {
  constructor(private readonly friendsService: FriendsService) {}

  async sendRequest(
    server: Server,
    userId: string,
    targetUserId: string,
    acknowledge?: SocketAck<FriendRequestDocument>,
  ): Promise<void> {
    try {
      const request = await this.friendsService.sendRequest(
        userId,
        targetUserId,
      );
      const populated = await this.friendsService.findRequestById(
        request._id.toString(),
      );
      const event =
        populated.status === "accepted"
          ? "friendRequestAccepted"
          : "friendRequestReceived";

      server.to(userRoom(targetUserId)).emit(event, { request: populated });
      acknowledge?.({ ok: true, data: populated });
    } catch (error) {
      acknowledge?.({ ok: false, error: getErrorMessage(error) });
    }
  }

  async acceptRequest(
    server: Server,
    userId: string,
    requestId: string,
    acknowledge?: SocketAck<FriendRequestDocument>,
  ): Promise<void> {
    try {
      const request = await this.friendsService.acceptRequest(
        requestId,
        userId,
      );
      const populated = await this.friendsService.findRequestById(
        request._id.toString(),
      );
      server
        .to(userRoom(request.requester.toString()))
        .emit("friendRequestAccepted", { request: populated });
      acknowledge?.({ ok: true, data: populated });
    } catch (error) {
      acknowledge?.({ ok: false, error: getErrorMessage(error) });
    }
  }

  async declineRequest(
    server: Server,
    userId: string,
    requestId: string,
    acknowledge?: SocketAck,
  ): Promise<void> {
    try {
      const request = await this.friendsService.declineRequest(
        requestId,
        userId,
      );
      server
        .to(userRoom(request.requester.toString()))
        .emit("friendRequestDeclined", {
          requestId: request._id.toString(),
          declinedBy: userId,
        });
      acknowledge?.({ ok: true });
    } catch (error) {
      acknowledge?.({ ok: false, error: getErrorMessage(error) });
    }
  }

  async removeFriend(
    server: Server,
    userId: string,
    friendId: string,
    acknowledge?: SocketAck,
  ): Promise<void> {
    try {
      await this.friendsService.removeFriend(userId, friendId);
      server.to(userRoom(friendId)).emit("friendRemoved", { by: userId });
      acknowledge?.({ ok: true });
    } catch (error) {
      acknowledge?.({ ok: false, error: getErrorMessage(error) });
    }
  }
}
