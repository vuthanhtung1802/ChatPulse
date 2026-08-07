import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
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
import { CurrentUser, JwtAuthGuard } from "../../shared/shared.module";
import { AuthUser } from "../../shared/interfaces/auth-user.interface";

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(@CurrentUser() user: AuthUser) {
    // Exclude logged in user from list
    return this.usersService.findAll(user._id.toString());
  }

  @Get("search")
  async searchUsers(
    @Query("q") keyword: string,
    @CurrentUser() user: AuthUser,
  ) {
    const users = await this.usersService.searchUsers(
      keyword || "",
      user._id.toString(),
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
    @CurrentUser() user: AuthUser,
    @UploadedFiles() files: any[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException("At least one image file is required");
    }

    const gallery = await this.usersService.addGalleryPhotos(id, files, user);

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
    return this.usersService.uploadFile(file);
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    const user = await this.usersService.findById(id);
    return { user: this.usersService.toPublicUser(user) };
  }

  @Put("profile")
  async updateProfile(
    @CurrentUser() user: AuthUser,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const updatedUser = await this.usersService.updateProfile(
      user._id.toString(),
      updateProfileDto,
    );
    return {
      message: "Profile updated successfully",
      user: this.usersService.toPublicUser(updatedUser),
    };
  }

  @Put(":id")
  async updateUser(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const updatedUser = await this.usersService.updateUserProfile(
      id,
      updateProfileDto,
      user,
    );
    return {
      user: this.usersService.toPublicUser(updatedUser),
    };
  }

  @Put(":id/avatar")
  @UseInterceptors(FileInterceptor("file"))
  async uploadAvatar(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: any,
  ) {
    if (!file) {
      throw new BadRequestException("Avatar file is required");
    }

    const avatarUrl = await this.usersService.uploadAvatar(id, file, user);

    return {
      avatarUrl,
    };
  }

  @Put(":id/status")
  async updateStatus(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
    @Body() updateStatusDto: UpdateStatusDto,
  ) {
    await this.usersService.updateUserStatus(id, updateStatusDto.status, user);

    return {
      success: true,
    };
  }

  @Put("password")
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: AuthUser,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    await this.usersService.changePassword(
      user._id.toString(),
      changePasswordDto,
    );
    return {
      message: "Password changed successfully",
    };
  }
}
