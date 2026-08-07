import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { CommentsService } from "./comments.service";
import { CurrentUser, JwtAuthGuard } from "../../shared/shared.module";
import { AuthUser } from "../../shared/interfaces/auth-user.interface";
import { PaginationDto } from "../../shared/dto/pagination.dto";

@Controller("posts")
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post(":id/comments")
  async create(
    @Param("id") postId: string,
    @Body("content") content: string,
    @CurrentUser() user: AuthUser,
  ) {
    if (!content || !content.trim()) {
      throw new BadRequestException("Content is required");
    }
    const comment = await this.commentsService.create(
      postId,
      user._id.toString(),
      content,
    );
    return { comment };
  }

  @Get(":id/comments")
  async findByPost(@Param("id") postId: string, @Query() query: PaginationDto) {
    const pageNum = query.page ?? 1;
    const limitNum = query.limit ?? 20;
    const result = await this.commentsService.findByPost(
      postId,
      pageNum,
      limitNum,
    );
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
    @Param("commentId") commentId: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.commentsService.delete(
      commentId,
      user._id.toString(),
      user.role,
    );
    return { success: true };
  }
}
