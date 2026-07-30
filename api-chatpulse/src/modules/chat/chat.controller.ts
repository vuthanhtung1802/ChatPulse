import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
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
  async getMessages(
    @Param("id") conversationId: string,
    @Request() req,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    const userId = req.user._id.toString();
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.chatService.getMessagesForConversation(conversationId, userId, pageNum, limitNum);
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

  @Delete("messages/:messageId")
  async deleteMessage(@Param("messageId") messageId: string, @Request() req) {
    await this.chatService.deleteMessage(messageId, req.user._id.toString());
    return { success: true };
  }

  @Post("messages/:messageId/recall")
  async recallMessage(@Param("messageId") messageId: string, @Request() req) {
    const message = await this.chatService.recallMessage(messageId, req.user._id.toString());
    return { success: true, message };
  }
}
