import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  NotFoundException,
  ForbiddenException,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { UsersService } from "./users.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { UpdateStatusDto } from "./dto/update-status.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CloudinaryService } from "../cloudinary/cloudinary.service";

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get()
  async findAll(@Request() req) {
    // Exclude logged in user from list
    return this.usersService.findAll(req.user._id.toString());
  }

  @Get("search")
  async searchUsers(@Query("q") keyword: string, @Request() req) {
    const users = await this.usersService.searchUsers(
      keyword || "",
      req.user._id.toString(),
    );
    return { users };
  }

  @Get(":id/gallery")
  async getGallery(@Param("id") id: string) {
    const photos = await this.usersService.getGallery(id);
    return { photos };
  }

  @Post(":id/gallery")
  @UseInterceptors(FilesInterceptor("files"))
  async uploadGallery(
    @Param("id") id: string,
    @Request() req,
    @UploadedFiles() files: any[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException("At least one image file is required");
    }

    const currentUser = req.user;
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
    const gallery = await this.usersService.addToGallery(id, photoUrls);

    return {
      photos: gallery,
    };
  }

  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  async uploadFile(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException("File is required");
    }
    const uploadResult = await this.cloudinaryService.uploadFile(file);
    if (!uploadResult || !uploadResult.secure_url) {
      throw new BadRequestException("Failed to upload file to Cloudinary");
    }
    return {
      url: uploadResult.secure_url,
      type: file.mimetype && file.mimetype.startsWith("image/") ? "image" : "video",
    };
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return {
      user: {
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
      },
    };
  }

  @Put("profile")
  async updateProfile(
    @Request() req,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const userId = req.user._id.toString();
    const updatedUser = await this.usersService.updateProfile(
      userId,
      updateProfileDto,
    );
    return {
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        avatar: updatedUser.avatar,
        bio: updatedUser.bio,
        location: updatedUser.location,
        website: updatedUser.website,
        interests: updatedUser.interests,
        status: updatedUser.status,
      },
    };
  }

  @Put(":id")
  async updateUser(
    @Param("id") id: string,
    @Request() req,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const currentUser = req.user;
    const currentUserId = currentUser._id.toString();

    // Check permissions: admin can update any user, normal user can only update themselves
    if (currentUser.role !== "admin" && currentUserId !== id) {
      throw new ForbiddenException("You can only update your own profile");
    }

    const updatedUser = await this.usersService.updateProfile(
      id,
      updateProfileDto,
    );
    return {
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        avatar: updatedUser.avatar,
        bio: updatedUser.bio,
        location: updatedUser.location,
        website: updatedUser.website,
        interests: updatedUser.interests,
        status: updatedUser.status,
      },
    };
  }

  @Put(":id/avatar")
  @UseInterceptors(FileInterceptor("file"))
  async uploadAvatar(
    @Param("id") id: string,
    @Request() req,
    @UploadedFile() file: any,
  ) {
    if (!file) {
      throw new BadRequestException("Avatar file is required");
    }

    const currentUser = req.user;
    const currentUserId = currentUser._id.toString();

    // Check permissions: admin can update any user's avatar, normal user can only update themselves
    if (currentUser.role !== "admin" && currentUserId !== id) {
      throw new ForbiddenException("You can only update your own avatar");
    }

    // Upload to Cloudinary
    const uploadResult = await this.cloudinaryService.uploadFile(file);
    if (!uploadResult || !uploadResult.secure_url) {
      throw new BadRequestException("Failed to upload avatar to Cloudinary");
    }

    // Save avatar URL to user in DB
    await this.usersService.updateAvatar(id, uploadResult.secure_url);

    return {
      avatarUrl: uploadResult.secure_url,
    };
  }

  @Put(":id/status")
  async updateStatus(
    @Param("id") id: string,
    @Request() req,
    @Body() updateStatusDto: UpdateStatusDto,
  ) {
    const currentUser = req.user;
    const currentUserId = currentUser._id.toString();

    // Check permissions: admin can update any user's status, normal user can only update themselves
    if (currentUser.role !== "admin" && currentUserId !== id) {
      throw new ForbiddenException("You can only update your own status");
    }

    await this.usersService.updateStatus(id, updateStatusDto.status);

    return {
      success: true,
    };
  }

  @Put("password")
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Request() req,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    const userId = req.user._id.toString();
    await this.usersService.changePassword(userId, changePasswordDto);
    return {
      message: "Password changed successfully",
    };
  }
}
