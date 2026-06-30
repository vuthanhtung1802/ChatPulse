import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ChatService } from "./chat.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateConversationDto } from "./dto/create-conversation.dto";

@Controller("conversations")
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async createConversation(
    @Request() req,
    @Body() createConversationDto: CreateConversationDto,
  ) {
    // Ensure current user is included in the conversation participants
    const participantIds = [
      ...new Set([
        ...createConversationDto.participantIds,
        req.user._id.toString(),
      ]),
    ];

    const isGroup = createConversationDto.isGroup ?? false;
    const groupName = createConversationDto.groupName ?? "";

    const conversation = await this.chatService.createConversation(
      participantIds,
      isGroup,
      groupName,
    );

    return { conversation };
  }

  @Get()
  async getConversations(@Request() req) {
    const conversations = await this.chatService.getConversationsForUser(
      req.user._id.toString(),
    );
    return { conversations };
  }

  @Get(":id/messages")
  async getMessages(@Param("id") conversationId: string) {
    return this.chatService.getMessagesForConversation(conversationId);
  }

  @Get(":id")
  async getConversationDetail(@Param("id") id: string, @Request() req) {
    const conversation = await this.chatService.getConversationById(
      id,
      req.user._id.toString(),
    );
    return { conversation };
  }

  @Delete(":id")
  async deleteConversation(@Param("id") id: string, @Request() req) {
    await this.chatService.deleteConversation(id, req.user._id.toString());
    return { success: true };
  }
}
