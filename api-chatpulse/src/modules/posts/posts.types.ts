import { PostDocument } from "./schemas/post.schema";

export type PostView = ReturnType<PostDocument["toObject"]> & {
  likedByMe: boolean;
  savedByMe: boolean;
  commentsCount: number;
  shares: number;
};
