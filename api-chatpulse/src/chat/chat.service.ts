import { Injectable, NotFoundException } from "@nestjs/common";
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

  async getConversationsForUser(userId: string): Promise<any[]> {
    const userObjectId = new Types.ObjectId(userId);
    return this.conversationModel
      .find({ participants: userObjectId })
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
    const userObjectId = new Types.ObjectId(userId);

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
      // For 1-1 conversation: delete conversation and all its messages
      await this.conversationModel.findByIdAndDelete(convObjectId);
      await this.messageModel.deleteMany({ conversationId: convObjectId });
    }

    return true;
  }

  async createMessage(
    senderId: string,
    conversationId: string,
    content: string,
  ): Promise<MessageDocument> {
    const senderObjectId = new Types.ObjectId(senderId);
    const convObjectId = new Types.ObjectId(conversationId);

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

    // Create and save message
    const message = new this.messageModel({
      conversationId: convObjectId,
      sender: senderObjectId,
      content,
    });
    const savedMessage = await message.save();

    // Update lastMessage on conversation
    conversation.lastMessage = savedMessage._id as Types.ObjectId;
    await conversation.save();

    return savedMessage.populate([
      { path: "sender", select: "name email" },
      { path: "conversationId" },
    ]);
  }

  async getMessagesForConversation(
    conversationId: string,
  ): Promise<MessageDocument[]> {
    const convObjectId = new Types.ObjectId(conversationId);
    return this.messageModel
      .find({ conversationId: convObjectId })
      .populate("sender", "name email")
      .sort({ createdAt: 1 })
      .exec();
  }
}
