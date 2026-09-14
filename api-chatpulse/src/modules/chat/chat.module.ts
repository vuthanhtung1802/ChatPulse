import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ChatService } from "./chat.service";
import { ChatController } from "./chat.controller";
import { ChatGateway } from "./chat.gateway";
import {
  Conversation,
  ConversationSchema,
} from "./schemas/conversation.schema";
import { Message, MessageSchema } from "./schemas/message.schema";
import { AuthModule } from "../auth/auth.module";
import { UsersModule } from "../users/users.module";
import { FriendsModule } from "../friends/friends.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
    ]),
    AuthModule,
    UsersModule,
    FriendsModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
  exports: [ChatService],
})
export class ChatModule {}
