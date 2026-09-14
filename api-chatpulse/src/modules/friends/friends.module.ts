import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { FriendsService } from "./friends.service";
import { FriendsController } from "./friends.controller";
import {
  FriendRequest,
  FriendRequestSchema,
} from "./schemas/friend-request.schema";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FriendRequest.name, schema: FriendRequestSchema },
    ]),
    UsersModule,
  ],
  controllers: [FriendsController],
  providers: [FriendsService],
  exports: [FriendsService],
})
export class FriendsModule {}
