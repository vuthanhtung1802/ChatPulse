import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from "@nestjs/common";
import { CommentsService } from "./comments.service";
import { PostsGateway } from "./posts.gateway";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("posts")
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly postsGateway: PostsGateway,
  ) {}

  @Post(":id/comments")
  async create(
    @Param("id") postId: string,
    @Body("content") content: string,
    @Request() req,
  ) {
    if (!content || !content.trim()) {
      throw new BadRequestException("Content is required");
    }
    const comment = await this.commentsService.create(
      postId,
      req.user._id.toString(),
      content,
    );
    this.postsGateway.emitNewComment(comment.toObject());
    return { comment };
  }

  @Get(":id/comments")
  async findByPost(
    @Param("id") postId: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const result = await this.commentsService.findByPost(postId, pageNum, limitNum);
    return {
      comments: result.comments.map((c) => ({
        ...c.toObject(),
        author: c.author,
      })),
      total: result.total,
    };
  }

  @Delete(":postId/comments/:commentId")
  async delete(
    @Param("postId") postId: string,
    @Param("commentId") commentId: string,
    @Request() req,
  ) {
    await this.commentsService.delete(
      commentId,
      req.user._id.toString(),
      req.user.role,
    );
    this.postsGateway.emitDeleteComment({ postId, commentId });
    return { success: true };
  }
}
