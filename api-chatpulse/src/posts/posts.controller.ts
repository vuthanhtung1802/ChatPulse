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
import { CreatePostDto } from "./dto/create-post.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CloudinaryService } from "../cloudinary/cloudinary.service";

@Controller("posts")
@UseGuards(JwtAuthGuard)
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

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

    const result = await this.postsService.findAll(pageNum, limitNum);

    const postsWithLikedByMe = result.posts.map((post) => {
      const postObj = post.toObject();
      const userId = req.user._id.toString();
      return {
        ...postObj,
        likedByMe: post.likes.some((id) => id.toString() === userId),
        commentsCount: 0,
        shares: 0,
      };
    });

    return {
      posts: postsWithLikedByMe,
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  @Get(":id")
  async findOne(@Param("id") id: string, @Request() req) {
    const post = await this.postsService.findById(id);
    const userId = req.user._id.toString();
    return {
      post: {
        ...post.toObject(),
        likedByMe: post.likes.some((l) => l.toString() === userId),
        commentsCount: 0,
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

    const result = await this.postsService.findByUser(userId, pageNum, limitNum);

    const postsWithLikedByMe = result.posts.map((post) => {
      const postObj = post.toObject();
      const currentUserId = req.user._id.toString();
      return {
        ...postObj,
        likedByMe: post.likes.some((id) => id.toString() === currentUserId),
        commentsCount: 0,
        shares: 0,
      };
    });

    return { posts: postsWithLikedByMe, total: result.total };
  }

  @Post(":id/like")
  async toggleLike(@Param("id") id: string, @Request() req) {
    const post = await this.postsService.toggleLike(
      id,
      req.user._id.toString(),
    );
    const userId = req.user._id.toString();
    return {
      post: {
        ...post.toObject(),
        likedByMe: post.likes.some((l) => l.toString() === userId),
        commentsCount: 0,
        shares: 0,
      },
    };
  }

  @Delete(":id")
  async delete(@Param("id") id: string, @Request() req) {
    await this.postsService.delete(
      id,
      req.user._id.toString(),
      req.user.role,
    );
    return { success: true };
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
