import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { FriendsService } from "./friends.service";
import { CurrentUser, JwtAuthGuard } from "../../shared/shared.module";
import { AuthUser } from "../../shared/interfaces/auth-user.interface";

@Controller("friends")
@UseGuards(JwtAuthGuard)
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Get()
  async getFriends(@CurrentUser() user: AuthUser) {
    const friends = await this.friendsService.getFriends(user._id.toString());
    return { friends };
  }

  @Get("requests/incoming")
  async getIncomingRequests(@CurrentUser() user: AuthUser) {
    const requests = await this.friendsService.getIncomingRequests(
      user._id.toString(),
    );
    return { requests };
  }

  @Get("requests/sent")
  async getSentRequests(@CurrentUser() user: AuthUser) {
    const requests = await this.friendsService.getSentRequests(
      user._id.toString(),
    );
    return { requests };
  }

  @Get("statuses")
  async getRelationshipStatuses(
    @Query("ids") ids: string,
    @CurrentUser() user: AuthUser,
  ) {
    const statuses = await this.friendsService.getRelationshipStatuses(
      user._id.toString(),
      ids
        ? ids
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean)
        : [],
    );
    return { statuses };
  }
}
