import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type FriendRequestDocument = HydratedDocument<FriendRequest>;

export type FriendRequestStatus = "pending" | "accepted" | "rejected";

@Schema({
  timestamps: true,
})
export class FriendRequest {
  @Prop({
    type: Types.ObjectId,
    ref: "User",
    required: true,
  })
  requester: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: "User",
    required: true,
  })
  addressee: Types.ObjectId;

  @Prop({
    default: "pending",
  })
  status: FriendRequestStatus;
}

export const FriendRequestSchema = SchemaFactory.createForClass(FriendRequest);

FriendRequestSchema.index({ requester: 1, addressee: 1 }, { unique: true });
