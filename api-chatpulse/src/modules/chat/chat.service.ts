import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  Conversation,
  ConversationDocument,
} from "./schemas/conversation.schema";
import { Message, MessageDocument } from "./schemas/message.schema";

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Conversation.name)
    private conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
  ) {}

  async createConversation(
    participantIds: string[],
    isGroup: boolean = false,
    groupName: string = "",
  ): Promise<ConversationDocument> {
    const objectIds = participantIds.map((id) => new Types.ObjectId(id));

    // Check if conversation already exists with EXACTLY these participants ONLY for 1-1 chats
    if (!isGroup) {
      const existing = await this.conversationModel.findOne({
        isGroup: false,
        participants: { $all: objectIds, $size: objectIds.length },
      });

      if (existing) {
        existing.hiddenBy = existing.hiddenBy.filter(
          (id) => !participantIds.includes(id.toString()),
        );
        await existing.save();
        return existing;
      }
    }

    const created = new this.conversationModel({
      participants: objectIds,
      isGroup,
      groupName: isGroup ? groupName : "",
    });
    return created.save();
  }

  async hasParticipant(
    conversationId: string,
    userId: string,
  ): Promise<boolean> {
    const convObjectId = new Types.ObjectId(conversationId);
    const userObjectId = new Types.ObjectId(userId);

    const conversation = await this.conversationModel
      .findOne({ _id: convObjectId, participants: userObjectId })
      .select("_id")
      .exec();

    return conversation !== null;
  }

  async getConversationsForUser(
    userId: string,
  ): Promise<ConversationDocument[]> {
    const userObjectId = new Types.ObjectId(userId);
    return this.conversationModel
      .find({ participants: userObjectId, hiddenBy: { $ne: userObjectId } })
      .populate("participants", "name email role avatar status")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender",
          select: "name email avatar",
        },
      })
      .sort({ updatedAt: -1 })
      .exec();
  }

  async getConversationById(
    conversationId: string,
    userId: string,
  ): Promise<ConversationDocument> {
    const convObjectId = new Types.ObjectId(conversationId);
    const userObjectId = new Types.ObjectId(userId);

    const conversation = await this.conversationModel
      .findOne({
        _id: convObjectId,
        participants: userObjectId,
        hiddenBy: { $ne: userObjectId },
      })
      .populate("participants", "name email role avatar status")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender",
          select: "name email avatar",
        },
      })
      .exec();

    if (!conversation) {
      throw new NotFoundException("Conversation not found or access denied");
    }

    return conversation;
  }

  async deleteConversation(
    conversationId: string,
    userId: string,
  ): Promise<boolean> {
    const convObjectId = new Types.ObjectId(conversationId);

    const conversation = await this.conversationModel.findById(convObjectId);
    if (!conversation) {
      throw new NotFoundException("Conversation not found");
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === userId,
    );
    if (!isParticipant) {
      throw new NotFoundException("Conversation not found or access denied");
    }

    if (conversation.isGroup) {
      // For group conversation: remove user from participants (leave)
      conversation.participants = conversation.participants.filter(
        (p) => p.toString() !== userId,
      );

      if (conversation.participants.length === 0) {
        // If no participants left, delete conversation and all its messages
        await this.conversationModel.findByIdAndDelete(convObjectId);
        await this.messageModel.deleteMany({ conversationId: convObjectId });
      } else {
        await conversation.save();
      }
    } else {
      if (!conversation.hiddenBy.some((id) => id.toString() === userId)) {
        conversation.hiddenBy.push(new Types.ObjectId(userId));
        await conversation.save();
      }
    }

    return true;
  }

  async createMessage(
    senderId: string,
    conversationId: string,
    content: string = "",
    attachmentUrl: string = "",
    attachmentType: string = "",
    clientMessageId: string = "",
    replyTo: string = "",
  ): Promise<MessageDocument> {
    const senderObjectId = new Types.ObjectId(senderId);
    const convObjectId = new Types.ObjectId(conversationId);
    if (!content.trim() && !attachmentUrl) {
      throw new BadRequestException("Message content or attachment is required");
    }

    // Verify conversation exists and sender is participant
    const conversation = await this.conversationModel.findById(convObjectId);
    if (!conversation) {
      throw new NotFoundException("Conversation not found");
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === senderId,
    );
    if (!isParticipant) {
      throw new NotFoundException(
        "Sender is not a participant in this conversation",
      );
    }
    if (conversation.hiddenBy.length > 0) {
      conversation.hiddenBy = [];
    }

    if (clientMessageId) {
      const existing = await this.messageModel.findOne({
        sender: senderObjectId,
        clientMessageId,
      });
      if (existing) {
        return existing.populate({ path: "sender", select: "name email avatar" });
      }
    }

    let replyObjectId: Types.ObjectId | null = null;
    if (replyTo) {
      const repliedMessage = await this.messageModel.findOne({
        _id: new Types.ObjectId(replyTo),
        conversationId: convObjectId,
      });
      if (!repliedMessage) throw new NotFoundException("Replied message not found");
      replyObjectId = repliedMessage._id as Types.ObjectId;
    }

    // Create and save message
    const message = new this.messageModel({
      conversationId: convObjectId,
      sender: senderObjectId,
      content,
      attachmentUrl,
      attachmentType,
      clientMessageId,
      replyTo: replyObjectId,
    });
    const savedMessage = await message.save();

    // Update lastMessage on conversation
    conversation.lastMessage = savedMessage._id as Types.ObjectId;
    await conversation.save();

    await savedMessage.populate({ path: "sender", select: "name email avatar" });
    return savedMessage.populate({
      path: "replyTo",
      select: "content sender isRecalled",
      populate: { path: "sender", select: "name" },
    });
  }

  async getMessagesForConversation(
    conversationId: string,
    userId: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<MessageDocument[]> {
    if (!(await this.hasParticipant(conversationId, userId))) {
      throw new ForbiddenException("You are not a participant of this conversation");
    }
    const convObjectId = new Types.ObjectId(conversationId);
    const userObjectId = new Types.ObjectId(userId);

    const messages = await this.messageModel
      .find({
        conversationId: convObjectId,
        deletedBy: { $ne: userObjectId },
      })
      .populate("sender", "name email avatar")
      .populate({
        path: "replyTo",
        select: "content sender isRecalled",
        populate: { path: "sender", select: "name" },
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    // Return in chronological order
    return messages.reverse();
  }

  async recallMessage(
    messageId: string,
    userId: string,
  ): Promise<MessageDocument> {
    const msgObjectId = new Types.ObjectId(messageId);
    const message = await this.messageModel.findById(msgObjectId);
    if (!message) {
      throw new NotFoundException("Message not found");
    }

    if (message.sender.toString() !== userId) {
      throw new NotFoundException("You can only recall your own messages");
    }

    message.isRecalled = true;
    message.content = "Message recalled";
    message.attachmentUrl = "";
    message.attachmentType = "";
    const savedMessage = await message.save();
    return savedMessage.populate({
      path: "sender",
      select: "name email avatar",
    });
  }

  async deleteMessage(messageId: string, userId: string): Promise<boolean> {
    const msgObjectId = new Types.ObjectId(messageId);
    const userObjectId = new Types.ObjectId(userId);
    const message = await this.messageModel.findById(msgObjectId);
    if (!message) {
      throw new NotFoundException("Message not found");
    }
    if (!(await this.hasParticipant(message.conversationId.toString(), userId))) {
      throw new ForbiddenException("You are not a participant of this conversation");
    }

    // Add to deletedBy list if not already present
    if (!message.deletedBy.some((id) => id.toString() === userId)) {
      message.deletedBy.push(userObjectId);
      await message.save();
    }

    return true;
  }

  async markMessagesRead(
    conversationId: string,
    userId: string,
  ): Promise<number> {
    if (!(await this.hasParticipant(conversationId, userId))) {
      throw new ForbiddenException("You are not a participant of this conversation");
    }
    const convObjectId = new Types.ObjectId(conversationId);
    const userObjectId = new Types.ObjectId(userId);
    const result = await this.messageModel
      .updateMany(
        {
          conversationId: convObjectId,
          sender: { $ne: userObjectId },
          status: { $ne: "read" },
        },
        { $set: { status: "read" } },
      )
      .exec();
    return result.modifiedCount ?? 0;
  }

  async toggleReaction(messageId: string, userId: string, emoji: string): Promise<MessageDocument> {
    const allowed = ["👍", "❤️", "😂", "😮", "😢", "🎉"];
    if (!allowed.includes(emoji)) throw new ForbiddenException("Unsupported reaction");
    const message = await this.messageModel.findById(messageId);
    if (!message) throw new NotFoundException("Message not found");
    if (!(await this.hasParticipant(message.conversationId.toString(), userId))) {
      throw new ForbiddenException("You are not a participant of this conversation");
    }
    const index = message.reactions.findIndex(
      (reaction) => reaction.user.toString() === userId && reaction.emoji === emoji,
    );
    if (index >= 0) message.reactions.splice(index, 1);
    else message.reactions.push({ user: new Types.ObjectId(userId), emoji });
    return message.save();
  }
}
