import { Types } from "mongoose";

export interface FriendProfile {
  _id: Types.ObjectId;
  name: string;
  email: string;
  avatar: string;
  status: string;
}

export interface FriendView extends FriendProfile {
  requestId: Types.ObjectId;
  friendsSince: Date;
}
