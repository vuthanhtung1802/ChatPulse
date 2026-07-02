import { Module, forwardRef } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { PostsService } from "./posts.service";
import { PostsController } from "./posts.controller";
import { Post, PostSchema } from "./schemas/post.schema";
import { CloudinaryModule } from "../cloudinary/cloudinary.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }]),
    CloudinaryModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
