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
  UseInterceptors,
  UploadedFile,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { PostsService } from "./posts.service";
import { CreatePostDto } from "./dto/create-post.dto";
import { CurrentUser, JwtAuthGuard } from "../../shared/shared.module";
import { AuthUser } from "../../shared/interfaces/auth-user.interface";
import { PaginationDto } from "../../shared/dto/pagination.dto";

@Controller("posts")
@UseGuards(JwtAuthGuard)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  async create(
    @CurrentUser() user: AuthUser,
    @Body() createPostDto: CreatePostDto,
  ) {
    const post = await this.postsService.create(
      user._id.toString(),
      createPostDto,
    );
    return { post };
  }

  @Get()
  async findAll(@CurrentUser() user: AuthUser, @Query() query: PaginationDto) {
    const pageNum = query.page ?? 1;
    const limitNum = query.limit ?? 10;
    const userId = user._id.toString();

    const result = await this.postsService.findAll(pageNum, limitNum, userId);

    const postsWithMeta = result.posts.map((post) =>
      this.postsService.toPostView(post, userId),
    );

    await this.postsService.attachCommentsCount(postsWithMeta);

    return {
      posts: postsWithMeta,
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  @Get("saved")
  async findSaved(
    @CurrentUser() user: AuthUser,
    @Query() query: PaginationDto,
  ) {
    const pageNum = query.page ?? 1;
    const limitNum = query.limit ?? 10;
    const userId = user._id.toString();

    const result = await this.postsService.findSavedPosts(
      userId,
      pageNum,
      limitNum,
    );

    const postsWithMeta = result.posts.map((post) =>
      this.postsService.toPostView(post, userId, true),
    );

    await this.postsService.attachCommentsCount(postsWithMeta);

    return { posts: postsWithMeta, total: result.total };
  }

  @Get(":id")
  async findOne(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    const post = await this.postsService.findById(id);
    const postView = this.postsService.toPostView(post, user._id.toString());
    await this.postsService.attachCommentsCount([postView]);
    return { post: postView };
  }

  @Get("user/:userId")
  async findByUser(
    @Param("userId") userId: string,
    @CurrentUser() user: AuthUser,
    @Query() query: PaginationDto,
  ) {
    const pageNum = query.page ?? 1;
    const limitNum = query.limit ?? 10;
    const currentUserId = user._id.toString();

    const result = await this.postsService.findByUser(
      userId,
      pageNum,
      limitNum,
      currentUserId,
    );

    const postsWithMeta = result.posts.map((post) =>
      this.postsService.toPostView(post, currentUserId),
    );

    await this.postsService.attachCommentsCount(postsWithMeta);

    return { posts: postsWithMeta, total: result.total };
  }

  @Post(":id/like")
  async toggleLike(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    const post = await this.postsService.toggleLike(id, user._id.toString());
    const userId = user._id.toString();
    const postView = this.postsService.toPostView(post, userId);
    await this.postsService.attachCommentsCount([postView]);
    return { post: postView };
  }

  @Post(":id/save")
  async toggleSave(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    const post = await this.postsService.toggleSave(id, user._id.toString());
    const userId = user._id.toString();
    const postView = this.postsService.toPostView(post, userId);
    await this.postsService.attachCommentsCount([postView]);
    return { post: postView };
  }

  @Delete(":id")
  async delete(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    const result = await this.postsService.delete(
      id,
      user._id.toString(),
      user.role,
    );
    return { success: true, deleted: result.deleted };
  }

  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  async uploadFile(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException("File is required");
    }
    const url = await this.postsService.uploadFile(file);
    return { url };
  }
}
