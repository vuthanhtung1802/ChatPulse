import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as bcrypt from "bcrypt";
import { User, UserDocument } from "./schemas/user.schema";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { CloudinaryService } from "../cloudinary/cloudinary.service";
import { AuthUser } from "../../shared/interfaces/auth-user.interface";

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

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

  async updateUserProfile(
    id: string,
    updateProfileDto: UpdateProfileDto,
    currentUser: AuthUser,
  ): Promise<UserDocument> {
    // Check permissions: admin can update any user, normal user can only update themselves
    if (currentUser.role !== "admin" && currentUser._id.toString() !== id) {
      throw new ForbiddenException("You can only update your own profile");
    }
    return this.updateProfile(id, updateProfileDto);
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

  async uploadAvatar(
    id: string,
    file: any,
    currentUser: AuthUser,
  ): Promise<string> {
    // Check permissions: admin can update any user's avatar, normal user can only update themselves
    if (currentUser.role !== "admin" && currentUser._id.toString() !== id) {
      throw new ForbiddenException("You can only update your own avatar");
    }

    // Upload to Cloudinary
    const uploadResult = await this.cloudinaryService.uploadFile(file);
    if (!uploadResult || !uploadResult.secure_url) {
      throw new BadRequestException("Failed to upload avatar to Cloudinary");
    }

    // Save avatar URL to user in DB
    await this.updateAvatar(id, uploadResult.secure_url);
    return uploadResult.secure_url;
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

  async updateUserStatus(
    id: string,
    status: string,
    currentUser: AuthUser,
  ): Promise<void> {
    // Check permissions: admin can update any user's status, normal user can only update themselves
    if (currentUser.role !== "admin" && currentUser._id.toString() !== id) {
      throw new ForbiddenException("You can only update your own status");
    }
    await this.updateStatus(id, status);
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

  async addGalleryPhotos(
    id: string,
    files: any[],
    currentUser: AuthUser,
  ): Promise<string[]> {
    const currentUserId = currentUser._id.toString();

    // Check permissions: admin can upload to any user's gallery, normal user can only upload to themselves
    if (currentUser.role !== "admin" && currentUserId !== id) {
      throw new ForbiddenException(
        "You can only upload images to your own gallery",
      );
    }

    // Upload files to Cloudinary
    const uploadResults = await this.cloudinaryService.uploadFiles(
      files,
      "gallery",
    );
    const photoUrls = uploadResults
      .filter((res) => res && res.secure_url)
      .map((res) => res.secure_url);

    if (photoUrls.length === 0) {
      throw new BadRequestException("Failed to upload images to Cloudinary");
    }

    // Save URLs to user gallery in DB
    return this.addToGallery(id, photoUrls);
  }

  async uploadFile(file: any): Promise<{ url: string; type: string }> {
    const uploadResult = await this.cloudinaryService.uploadFile(file);
    if (!uploadResult || !uploadResult.secure_url) {
      throw new BadRequestException("Failed to upload file to Cloudinary");
    }
    return {
      url: uploadResult.secure_url,
      type:
        file.mimetype && file.mimetype.startsWith("image/") ? "image" : "video",
    };
  }

  toPublicUser(user: UserDocument | null) {
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      bio: user.bio,
      location: user.location,
      website: user.website,
      interests: user.interests,
      status: user.status,
    };
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
