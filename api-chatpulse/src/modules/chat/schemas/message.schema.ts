import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type MessageDocument = HydratedDocument<Message>;

@Schema({
  timestamps: true,
})
export class Message {
  @Prop({
    type: Types.ObjectId,
    ref: "Conversation",
    required: true,
  })
  conversationId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: "User",
    required: true,
  })
  sender: Types.ObjectId;

  @Prop({ default: "" })
  clientMessageId: string;

  @Prop({
    default: "",
  })
  content: string;

  @Prop({
    default: "",
  })
  attachmentUrl: string;

  @Prop({
    default: "",
  })
  attachmentType: string;

  @Prop({ type: Types.ObjectId, ref: "Message", default: null })
  replyTo?: Types.ObjectId;

  @Prop({ type: [{ user: { type: Types.ObjectId, ref: "User" }, emoji: String }], default: [] })
  reactions: Array<{ user: Types.ObjectId; emoji: string }>;

  @Prop({
    default: "sent",
  })
  status: string;

  @Prop({
    default: false,
  })
  isRecalled: boolean;

  @Prop({
    type: [{ type: Types.ObjectId, ref: "User" }],
    default: [],
  })
  deletedBy: Types.ObjectId[];
}

export const MessageSchema = SchemaFactory.createForClass(Message);
MessageSchema.index(
  { sender: 1, clientMessageId: 1 },
  { unique: true, partialFilterExpression: { clientMessageId: { $gt: "" } } },
);
