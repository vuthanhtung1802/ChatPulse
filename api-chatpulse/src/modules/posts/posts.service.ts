import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Post, PostDocument } from "./schemas/post.schema";
import { CreatePostDto } from "./dto/create-post.dto";
import { CommentsService } from "./comments.service";
import { CloudinaryService } from "../cloudinary/cloudinary.service";

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    private readonly commentsService: CommentsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(
    userId: string,
    createPostDto: CreatePostDto,
  ): Promise<PostDocument> {
    const post = new this.postModel({
      author: userId,
      content: createPostDto.content || "",
      images: createPostDto.images || [],
      mood: createPostDto.mood || "",
    });
    const saved = await post.save();
    return saved.populate("author", "name avatar");
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    currentUserId?: string,
  ): Promise<{
    posts: PostDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;
    const filter: any = {};
    if (currentUserId) {
      filter.hiddenBy = { $ne: currentUserId };
    }
    const [posts, total] = await Promise.all([
      this.postModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("author", "name avatar email")
        .exec(),
      this.postModel.countDocuments(filter).exec(),
    ]);
    return { posts, total, page, limit };
  }

  async findById(id: string): Promise<PostDocument> {
    const post = await this.postModel
      .findById(id)
      .populate("author", "name avatar email")
      .exec();
    if (!post) {
      throw new NotFoundException("Post not found");
    }
    return post;
  }

  async findByUser(
    userId: string,
    page: number = 1,
    limit: number = 10,
    currentUserId?: string,
  ): Promise<{ posts: PostDocument[]; total: number }> {
    const skip = (page - 1) * limit;
    const filter: any = { author: userId };
    if (currentUserId) {
      filter.hiddenBy = { $ne: currentUserId };
    }
    const [posts, total] = await Promise.all([
      this.postModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("author", "name avatar email")
        .exec(),
      this.postModel.countDocuments(filter).exec(),
    ]);
    return { posts, total };
  }

  async toggleLike(postId: string, userId: string): Promise<PostDocument> {
    const post = await this.postModel.findById(postId).exec();
    if (!post) {
      throw new NotFoundException("Post not found");
    }

    const userIdStr = userId.toString();
    const isLiked = post.likes.some((id) => id.toString() === userIdStr);

    if (isLiked) {
      await this.postModel
        .findByIdAndUpdate(postId, { $pull: { likes: userId } })
        .exec();
    } else {
      await this.postModel
        .findByIdAndUpdate(postId, { $push: { likes: userId } })
        .exec();
    }

    return this.postModel
      .findById(postId)
      .populate("author", "name avatar email")
      .exec();
  }

  async toggleSave(postId: string, userId: string): Promise<PostDocument> {
    const post = await this.postModel.findById(postId).exec();
    if (!post) {
      throw new NotFoundException("Post not found");
    }

    const userIdStr = userId.toString();
    const isSaved = post.savedBy.some((id) => id.toString() === userIdStr);

    if (isSaved) {
      await this.postModel
        .findByIdAndUpdate(postId, { $pull: { savedBy: userId } })
        .exec();
    } else {
      await this.postModel
        .findByIdAndUpdate(postId, { $push: { savedBy: userId } })
        .exec();
    }

    return this.postModel
      .findById(postId)
      .populate("author", "name avatar email")
      .exec();
  }

  async findSavedPosts(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ posts: PostDocument[]; total: number }> {
    const skip = (page - 1) * limit;
    const filter = { savedBy: userId };
    const [posts, total] = await Promise.all([
      this.postModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("author", "name avatar email")
        .exec(),
      this.postModel.countDocuments(filter).exec(),
    ]);
    return { posts, total };
  }

  async delete(
    postId: string,
    userId: string,
    userRole: string,
  ): Promise<{ deleted: boolean }> {
    const post = await this.postModel.findById(postId).exec();
    if (!post) {
      throw new NotFoundException("Post not found");
    }

    const isAuthor = post.author.toString() === userId;
    const isAdmin = userRole === "admin";

    if (isAuthor || isAdmin) {
      await this.postModel.findByIdAndDelete(postId).exec();
      return { deleted: true };
    }

    await this.postModel
      .findByIdAndUpdate(postId, { $addToSet: { hiddenBy: userId } })
      .exec();
    return { deleted: false };
  }

  toPostView(
    post: PostDocument,
    userId: string,
    savedByMe: boolean = false,
  ): any {
    const postObj = post.toObject();
    return {
      ...postObj,
      likedByMe: post.likes.some((id) => id.toString() === userId),
      savedByMe:
        savedByMe || post.savedBy.some((id) => id.toString() === userId),
      commentsCount: 0,
      shares: 0,
    };
  }

  async attachCommentsCount(posts: any[]): Promise<void> {
    const postIds = posts.map((p) => p._id.toString());
    const countsMap = await this.commentsService.countByPostIds(postIds);
    for (const post of posts) {
      post.commentsCount = countsMap.get(post._id.toString()) || 0;
    }
  }

  async uploadFile(file: any): Promise<string> {
    const uploadResult = await this.cloudinaryService.uploadFile(file, "posts");
    if (!uploadResult || !uploadResult.secure_url) {
      throw new BadRequestException("Failed to upload file to Cloudinary");
    }
    return uploadResult.secure_url;
  }
}
