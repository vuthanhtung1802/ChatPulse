import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type PostDocument = HydratedDocument<Post>;

@Schema({
  timestamps: true,
})
export class Post {
  @Prop({
    type: Types.ObjectId,
    ref: "User",
    required: true,
  })
  author: Types.ObjectId;

  @Prop({
    default: "",
  })
  content: string;

  @Prop({
    type: [String],
    default: [],
  })
  images: string[];

  @Prop({
    type: [{ type: Types.ObjectId, ref: "User" }],
    default: [],
  })
  likes: Types.ObjectId[];
}

export const PostSchema = SchemaFactory.createForClass(Post);
