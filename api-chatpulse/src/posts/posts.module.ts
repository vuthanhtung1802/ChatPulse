import { Module, forwardRef } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { PostsService } from "./posts.service";
import { PostsController } from "./posts.controller";
import { CommentsService } from "./comments.service";
import { CommentsController } from "./comments.controller";
import { PostsGateway } from "./posts.gateway";
import { Post, PostSchema } from "./schemas/post.schema";
import { Comment, CommentSchema } from "./schemas/comment.schema";
import { CloudinaryModule } from "../cloudinary/cloudinary.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema },
      { name: Comment.name, schema: CommentSchema },
    ]),
    CloudinaryModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [PostsController, CommentsController],
  providers: [PostsService, CommentsService, PostsGateway],
  exports: [PostsService, CommentsService, PostsGateway],
})
export class PostsModule {}
