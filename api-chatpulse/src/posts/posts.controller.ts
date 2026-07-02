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
  NotFoundException,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { PostsService } from "./posts.service";
import { CommentsService } from "./comments.service";
import { CreatePostDto } from "./dto/create-post.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CloudinaryService } from "../cloudinary/cloudinary.service";

@Controller("posts")
@UseGuards(JwtAuthGuard)
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly commentsService: CommentsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  private async attachCommentsCount(posts: any[]): Promise<void> {
    const postIds = posts.map((p) => p._id.toString());
    const countsMap = await this.commentsService.countByPostIds(postIds);
    for (const post of posts) {
      post.commentsCount = countsMap.get(post._id.toString()) || 0;
    }
  }

  @Post()
  async create(@Request() req, @Body() createPostDto: CreatePostDto) {
    const post = await this.postsService.create(
      req.user._id.toString(),
      createPostDto,
    );
    return { post };
  }

  @Get()
  async findAll(
    @Request() req,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const userId = req.user._id.toString();

    const result = await this.postsService.findAll(pageNum, limitNum, userId);

    const postsWithMeta = result.posts.map((post) => {
      const postObj = post.toObject();
      return {
        ...postObj,
        likedByMe: post.likes.some((id) => id.toString() === userId),
        savedByMe: post.savedBy.some((id) => id.toString() === userId),
        commentsCount: 0,
        shares: 0,
      };
    });

    await this.attachCommentsCount(postsWithMeta);

    return {
      posts: postsWithMeta,
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  @Get("saved")
  async findSaved(
    @Request() req,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const userId = req.user._id.toString();

    const result = await this.postsService.findSavedPosts(userId, pageNum, limitNum);

    const postsWithMeta = result.posts.map((post) => {
      const postObj = post.toObject();
      return {
        ...postObj,
        likedByMe: post.likes.some((id) => id.toString() === userId),
        savedByMe: true,
        commentsCount: 0,
        shares: 0,
      };
    });

    await this.attachCommentsCount(postsWithMeta);

    return { posts: postsWithMeta, total: result.total };
  }

  @Get(":id")
  async findOne(@Param("id") id: string, @Request() req) {
    const post = await this.postsService.findById(id);
    const userId = req.user._id.toString();
    const commentsCount = await this.commentsService.countByPost(id);
    return {
      post: {
        ...post.toObject(),
        likedByMe: post.likes.some((l) => l.toString() === userId),
        savedByMe: post.savedBy.some((l) => l.toString() === userId),
        commentsCount,
        shares: 0,
      },
    };
  }

  @Get("user/:userId")
  async findByUser(
    @Param("userId") userId: string,
    @Request() req,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const currentUserId = req.user._id.toString();

    const result = await this.postsService.findByUser(userId, pageNum, limitNum, currentUserId);

    const postsWithMeta = result.posts.map((post) => {
      const postObj = post.toObject();
      return {
        ...postObj,
        likedByMe: post.likes.some((id) => id.toString() === currentUserId),
        savedByMe: post.savedBy.some((id) => id.toString() === currentUserId),
        commentsCount: 0,
        shares: 0,
      };
    });

    await this.attachCommentsCount(postsWithMeta);

    return { posts: postsWithMeta, total: result.total };
  }

  @Post(":id/like")
  async toggleLike(@Param("id") id: string, @Request() req) {
    const post = await this.postsService.toggleLike(
      id,
      req.user._id.toString(),
    );
    const userId = req.user._id.toString();
    const commentsCount = await this.commentsService.countByPost(id);
    return {
      post: {
        ...post.toObject(),
        likedByMe: post.likes.some((l) => l.toString() === userId),
        savedByMe: post.savedBy.some((l) => l.toString() === userId),
        commentsCount,
        shares: 0,
      },
    };
  }

  @Post(":id/save")
  async toggleSave(@Param("id") id: string, @Request() req) {
    const post = await this.postsService.toggleSave(
      id,
      req.user._id.toString(),
    );
    const userId = req.user._id.toString();
    const commentsCount = await this.commentsService.countByPost(id);
    return {
      post: {
        ...post.toObject(),
        likedByMe: post.likes.some((l) => l.toString() === userId),
        savedByMe: post.savedBy.some((l) => l.toString() === userId),
        commentsCount,
        shares: 0,
      },
    };
  }

  @Delete(":id")
  async delete(@Param("id") id: string, @Request() req) {
    const result = await this.postsService.delete(
      id,
      req.user._id.toString(),
      req.user.role,
    );
    return { success: true, deleted: result.deleted };
  }

  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  async uploadFile(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException("File is required");
    }
    const uploadResult = await this.cloudinaryService.uploadFile(file, "posts");
    if (!uploadResult || !uploadResult.secure_url) {
      throw new BadRequestException("Failed to upload file to Cloudinary");
    }
    return {
      url: uploadResult.secure_url,
    };
  }
}
