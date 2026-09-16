import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  FriendRequest,
  FriendRequestDocument,
} from "./schemas/friend-request.schema";
import { UsersService } from "../users/users.service";
import { FriendProfile, FriendView } from "./friends.types";

export type RelationshipStatus = "none" | "sent" | "received" | "friends";

export interface RelationshipInfo {
  userId: string;
  status: RelationshipStatus;
  requestId?: string;
}

const USER_SELECT = "name email avatar status";

@Injectable()
export class FriendsService {
  constructor(
    @InjectModel(FriendRequest.name)
    private friendRequestModel: Model<FriendRequestDocument>,
    private readonly usersService: UsersService,
  ) {}

  async sendRequest(
    requesterId: string,
    addresseeId: string,
  ): Promise<FriendRequestDocument> {
    if (requesterId === addresseeId) {
      throw new BadRequestException("You cannot add yourself");
    }

    const addressee = await this.usersService.findById(addresseeId);
    if (!addressee) {
      throw new NotFoundException("User not found");
    }

    // If the target already sent us a pending request, auto-accept it.
    const incoming = await this.friendRequestModel.findOne({
      requester: new Types.ObjectId(addresseeId),
      addressee: new Types.ObjectId(requesterId),
      status: "pending",
    });
    if (incoming) {
      incoming.status = "accepted";
      return incoming.save();
    }

    const requesterObjectId = new Types.ObjectId(requesterId);
    const addresseeObjectId = new Types.ObjectId(addresseeId);

    let request = await this.friendRequestModel.findOne({
      requester: requesterObjectId,
      addressee: addresseeObjectId,
    });

    if (request && request.status === "accepted") {
      throw new BadRequestException("You are already friends");
    }

    if (request && request.status === "pending") {
      return request;
    }

    if (request && request.status === "rejected") {
      // A new request after a rejection is allowed.
      request.status = "pending";
      return request.save();
    }

    const created = new this.friendRequestModel({
      requester: requesterObjectId,
      addressee: addresseeObjectId,
      status: "pending",
    });
    return created.save();
  }

  private assertAddressee(
    request: FriendRequestDocument,
    userId: string,
  ): void {
    if (request.addressee.toString() !== userId) {
      throw new ForbiddenException(
        "You can only act on requests addressed to you",
      );
    }
  }

  async acceptRequest(
    requestId: string,
    userId: string,
  ): Promise<FriendRequestDocument> {
    const request = await this.friendRequestModel.findById(requestId);
    if (!request) {
      throw new NotFoundException("Friend request not found");
    }
    this.assertAddressee(request, userId);
    if (request.status !== "pending") {
      throw new BadRequestException("Friend request is no longer pending");
    }
    request.status = "accepted";
    return request.save();
  }

  async findRequestById(requestId: string): Promise<FriendRequestDocument> {
    const request = await this.friendRequestModel
      .findById(requestId)
      .populate("requester", USER_SELECT)
      .populate("addressee", USER_SELECT)
      .exec();
    if (!request) {
      throw new NotFoundException("Friend request not found");
    }
    return request;
  }

  async declineRequest(
    requestId: string,
    userId: string,
  ): Promise<FriendRequestDocument> {
    const request = await this.friendRequestModel.findById(requestId);
    if (!request) {
      throw new NotFoundException("Friend request not found");
    }
    this.assertAddressee(request, userId);
    if (request.status !== "pending") {
      throw new BadRequestException("Friend request is no longer pending");
    }
    request.status = "rejected";
    return request.save();
  }

  async removeFriend(userId: string, friendId: string): Promise<void> {
    if (userId === friendId) {
      throw new BadRequestException("You cannot remove yourself");
    }

    const userObjectId = new Types.ObjectId(userId);
    const friendObjectId = new Types.ObjectId(friendId);

    const friendship = await this.friendRequestModel
      .findOne({
        status: "accepted",
        $or: [
          { requester: userObjectId, addressee: friendObjectId },
          { requester: friendObjectId, addressee: userObjectId },
        ],
      })
      .exec();

    if (!friendship) {
      throw new BadRequestException("You are not friends with this user");
    }

    await this.friendRequestModel.deleteMany({
      $or: [
        { requester: userObjectId, addressee: friendObjectId },
        { requester: friendObjectId, addressee: userObjectId },
      ],
    });
  }

  async getFriends(userId: string): Promise<FriendView[]> {
    const userObjectId = new Types.ObjectId(userId);

    const requests = await this.friendRequestModel
      .find({
        status: "accepted",
        $or: [{ requester: userObjectId }, { addressee: userObjectId }],
      })
      .populate("requester", USER_SELECT)
      .populate("addressee", USER_SELECT)
      .sort({ updatedAt: -1 })
      .exec();

    return requests.map((request) => {
      const requester = request.requester as unknown as FriendProfile;
      const addressee = request.addressee as unknown as FriendProfile;
      const friend =
        requester._id.toString() === userId ? addressee : requester;
      return {
        _id: friend._id,
        name: friend.name,
        email: friend.email,
        avatar: friend.avatar,
        status: friend.status,
        requestId: request._id,
        friendsSince: (request as unknown as { updatedAt: Date }).updatedAt,
      };
    });
  }

  async getIncomingRequests(userId: string): Promise<FriendRequestDocument[]> {
    const userObjectId = new Types.ObjectId(userId);
    return this.friendRequestModel
      .find({ addressee: userObjectId, status: "pending" })
      .populate("requester", USER_SELECT)
      .sort({ createdAt: -1 })
      .exec();
  }

  async getSentRequests(userId: string): Promise<FriendRequestDocument[]> {
    const userObjectId = new Types.ObjectId(userId);
    return this.friendRequestModel
      .find({ requester: userObjectId, status: "pending" })
      .populate("addressee", USER_SELECT)
      .sort({ createdAt: -1 })
      .exec();
  }

  async getRelationshipStatuses(
    userId: string,
    targetIds: string[],
  ): Promise<RelationshipInfo[]> {
    const uniqueIds = [...new Set(targetIds)].filter(
      (id) => id && id !== userId,
    );
    if (uniqueIds.length === 0) {
      return [];
    }

    const userObjectId = new Types.ObjectId(userId);
    const targetObjects = uniqueIds.map((id) => new Types.ObjectId(id));

    const requests = await this.friendRequestModel
      .find({
        $or: [
          {
            requester: userObjectId,
            addressee: { $in: targetObjects },
          },
          {
            requester: { $in: targetObjects },
            addressee: userObjectId,
          },
        ],
      })
      .exec();

    const infoMap = new Map<string, RelationshipInfo>();
    for (const id of uniqueIds) {
      infoMap.set(id, { userId: id, status: "none" });
    }

    for (const request of requests) {
      const isOutgoing = request.requester.toString() === userId;
      const otherId = isOutgoing
        ? request.addressee.toString()
        : request.requester.toString();
      const info = infoMap.get(otherId);
      if (!info) continue;

      if (request.status === "accepted") {
        info.status = "friends";
        continue;
      }

      if (info.status === "none") {
        info.status = isOutgoing ? "sent" : "received";
        if (!isOutgoing) {
          info.requestId = request._id.toString();
        }
      }
    }

    return [...infoMap.values()];
  }
}
