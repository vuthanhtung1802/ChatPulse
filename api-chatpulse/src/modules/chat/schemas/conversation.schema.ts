import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type ConversationDocument = HydratedDocument<Conversation>;

@Schema({
  timestamps: true,
})
export class Conversation {
  @Prop({
    type: [{ type: Types.ObjectId, ref: "User" }],
    required: true,
  })
  participants: Types.ObjectId[];

  @Prop({
    type: Types.ObjectId,
    ref: "Message",
  })
  lastMessage: Types.ObjectId;

  @Prop({
    type: Boolean,
    default: false,
  })
  isGroup: boolean;

  @Prop({
    type: String,
    default: "",
  })
  groupName: string;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
