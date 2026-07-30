import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Comment, CommentDocument } from "./schemas/comment.schema";

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
  ) {}

  async create(
    postId: string,
    userId: string,
    content: string,
  ): Promise<CommentDocument> {
    const comment = new this.commentModel({
      post: postId,
      author: userId,
      content,
    });
    const saved = await comment.save();
    return saved.populate("author", "name avatar");
  }

  async findByPost(
    postId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ comments: CommentDocument[]; total: number }> {
    const skip = (page - 1) * limit;
    const filter = { post: postId };
    const [comments, total] = await Promise.all([
      this.commentModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("author", "name avatar")
        .exec(),
      this.commentModel.countDocuments(filter).exec(),
    ]);
    return { comments, total };
  }

  async countByPost(postId: string): Promise<number> {
    return this.commentModel.countDocuments({ post: postId }).exec();
  }

  async countByPostIds(postIds: string[]): Promise<Map<string, number>> {
    const counts = await this.commentModel.aggregate([
      { $match: { post: { $in: postIds.map((id) => id.toString()) } } },
      { $group: { _id: "$post", count: { $sum: 1 } } },
    ]).exec();
    const map = new Map<string, number>();
    for (const item of counts) {
      map.set(item._id.toString(), item.count);
    }
    return map;
  }

  async delete(
    commentId: string,
    userId: string,
    userRole: string,
  ): Promise<void> {
    const comment = await this.commentModel.findById(commentId).exec();
    if (!comment) {
      throw new NotFoundException("Comment not found");
    }

    const isAuthor = comment.author.toString() === userId;
    const isAdmin = userRole === "admin";

    if (!isAuthor && !isAdmin) {
      throw new ForbiddenException("You can only delete your own comments");
    }

    await this.commentModel.findByIdAndDelete(commentId).exec();
  }
}
