import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type UserDocument = HydratedDocument<User>;

@Schema({
  timestamps: true,
})
export class User {
  @Prop({
    required: true,
  })
  name: string;

  @Prop({
    required: true,
    unique: true,
  })
  email: string;

  @Prop({
    required: true,
  })
  password: string;

  @Prop({
    default: "user",
  })
  role: string;

  @Prop({
    default: "",
  })
  avatar: string;

  @Prop({
    default: "",
  })
  bio: string;

  @Prop({
    default: "",
  })
  location: string;

  @Prop({
    default: "",
  })
  website: string;

  @Prop({
    type: [String],
    default: [],
  })
  interests: string[];

  @Prop({
    default: "offline",
  })
  status: string;

  @Prop({
    type: [String],
    default: [],
  })
  gallery: string[];

  @Prop({
    type: [String],
    default: [],
  })
  refreshTokens: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);
