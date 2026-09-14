import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ChatService } from "./chat.service";
import { CurrentUser, JwtAuthGuard } from "../../shared/shared.module";
import { AuthUser } from "../../shared/interfaces/auth-user.interface";
import { CreateConversationDto } from "./dto/create-conversation.dto";
import { PaginationDto } from "../../shared/dto/pagination.dto";
import { ChatGateway } from "./chat.gateway";

@Controller("conversations")
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Post()
  async createConversation(
    @CurrentUser() user: AuthUser,
    @Body() createConversationDto: CreateConversationDto,
  ) {
    // Ensure current user is included in the conversation participants
    const participantIds = [
      ...new Set([
        ...createConversationDto.participantIds,
        user._id.toString(),
      ]),
    ];

    const isGroup = createConversationDto.isGroup ?? false;
    const groupName = createConversationDto.groupName ?? "";

    const created = await this.chatService.createConversation(
      participantIds,
      isGroup,
      groupName,
    );
    const conversation = await this.chatService.getConversationById(
      created._id.toString(),
      user._id.toString(),
    );
    this.chatGateway.notifyConversationCreated(conversation);

    return { conversation };
  }

  @Get()
  async getConversations(@CurrentUser() user: AuthUser) {
    const conversations = await this.chatService.getConversationsForUser(
      user._id.toString(),
    );
    return { conversations };
  }

  @Get(":id/messages")
  async getMessages(
    @Param("id") conversationId: string,
    @CurrentUser() user: AuthUser,
    @Query() query: PaginationDto,
  ) {
    const userId = user._id.toString();
    const pageNum = query.page ?? 1;
    const limitNum = query.limit ?? 50;
    return this.chatService.getMessagesForConversation(
      conversationId,
      userId,
      pageNum,
      limitNum,
    );
  }

  @Get(":id")
  async getConversationDetail(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
  ) {
    const conversation = await this.chatService.getConversationById(
      id,
      user._id.toString(),
    );
    return { conversation };
  }

  @Delete("messages/:messageId")
  async deleteMessage(
    @Param("messageId") messageId: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.chatService.deleteMessage(messageId, user._id.toString());
    return { success: true };
  }

  @Delete(":id")
  async deleteConversation(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.chatService.deleteConversation(id, user._id.toString());
    this.chatGateway.removeUserFromConversationRoom(user._id.toString(), id);
    return { success: true };
  }

  @Post("messages/:messageId/recall")
  async recallMessage(
    @Param("messageId") messageId: string,
    @CurrentUser() user: AuthUser,
  ) {
    const message = await this.chatService.recallMessage(
      messageId,
      user._id.toString(),
    );
    return { success: true, message };
  }

  @Post("messages/:messageId/reactions")
  async toggleReaction(
    @Param("messageId") messageId: string,
    @CurrentUser() user: AuthUser,
    @Body("emoji") emoji: string,
  ) {
    const message = await this.chatService.toggleReaction(
      messageId,
      user._id.toString(),
      emoji,
    );
    return { reactions: message.reactions };
  }
}
