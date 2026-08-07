import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { PostsService } from "./posts.service";
import { PostsController } from "./posts.controller";
import { CommentsService } from "./comments.service";
import { CommentsController } from "./comments.controller";
import { Post, PostSchema } from "./schemas/post.schema";
import { Comment, CommentSchema } from "./schemas/comment.schema";
import { CloudinaryModule } from "../cloudinary/cloudinary.module";
import { SharedModule } from "../../shared/shared.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema },
      { name: Comment.name, schema: CommentSchema },
    ]),
    CloudinaryModule,
    SharedModule,
  ],
  controllers: [PostsController, CommentsController],
  providers: [PostsService, CommentsService],
  exports: [PostsService, CommentsService],
})
export class PostsModule {}
