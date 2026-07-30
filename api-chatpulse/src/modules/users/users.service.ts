import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as bcrypt from "bcrypt";
import { User, UserDocument } from "./schemas/user.schema";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserData: Partial<User>): Promise<UserDocument> {
    const createdUser = new this.userModel(createUserData);
    return createdUser.save();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async setRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        { $set: { refreshTokens: [refreshToken] } },
        { new: true },
      )
      .exec();
  }

  async updateRefreshToken(
    userId: string,
    newRefreshTokenHash: string,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        { $set: { refreshTokens: [newRefreshTokenHash] } },
        { new: true },
      )
      .exec();
  }

  async removeAllRefreshTokens(userId: string): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(userId, { refreshTokens: [] }, { new: true })
      .exec();
  }

  async findAll(excludeUserId?: string): Promise<UserDocument[]> {
    const query = excludeUserId ? { _id: { $ne: excludeUserId } } : {};
    return this.userModel.find(query).select("-password").exec();
  }

  async searchUsers(
    keyword: string,
    excludeUserId?: string,
  ): Promise<UserDocument[]> {
    const regex = new RegExp(keyword, "i");
    const query: any = {
      $or: [{ name: { $regex: regex } }, { email: { $regex: regex } }],
    };

    if (excludeUserId) {
      query._id = { $ne: excludeUserId };
    }

    return this.userModel.find(query).select("-password").exec();
  }

  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(userId, updateProfileDto, { new: true })
      .select("-password")
      .exec();

    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user;
  }

  async updateAvatar(userId: string, avatarUrl: string): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(userId, { avatar: avatarUrl }, { new: true })
      .select("-password")
      .exec();

    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user;
  }

  async updateStatus(userId: string, status: string): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(userId, { status }, { new: true })
      .select("-password")
      .exec();

    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user;
  }

  async getGallery(userId: string): Promise<string[]> {
    const user = await this.userModel.findById(userId).select("gallery").exec();
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user.gallery || [];
  }

  async addToGallery(userId: string, photoUrls: string[]): Promise<string[]> {
    const user = await this.userModel
      .findByIdAndUpdate(
        userId,
        {
          $push: {
            gallery: {
              $each: photoUrls,
            },
          },
        },
        { new: true },
      )
      .select("gallery")
      .exec();

    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user.gallery || [];
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.oldPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new BadRequestException("Incorrect old password");
    }

    const hashedNewPassword = await bcrypt.hash(
      changePasswordDto.newPassword,
      10,
    );
    user.password = hashedNewPassword;
    await user.save();
  }
}
