import {
  ApiConversation,
  ApiMessage,
  ApiUser,
  ApiUserReference,
} from "../types/Api";
import { Conversation, Message, User } from "../types/types";
import { getInitialsAvatar } from "./avatarUtils";

const RECALLED_MESSAGE = "Tin nhắn đã bị thu hồi";
const ATTACHMENT_MESSAGE = "Gửi một file đính kèm";
const EMPTY_CONVERSATION = "Chưa có tin nhắn";

function getUserId(user?: ApiUserReference): string {
  if (!user) return "";
  return typeof user === "string" ? user : (user._id ?? user.id ?? "");
}

function getPopulatedUser(user?: ApiUserReference): ApiUser {
  return typeof user === "object" ? user : {};
}

function formatMessageTime(createdAt?: string): string {
  if (!createdAt) return "";
  return new Date(createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getConversationPreview(message?: ApiMessage): string {
  if (!message) return EMPTY_CONVERSATION;
  if (message.isRecalled) return RECALLED_MESSAGE;
  return (
    message.content ||
    (message.attachmentUrl ? ATTACHMENT_MESSAGE : EMPTY_CONVERSATION)
  );
}

export function transformUser(user: ApiUser): User {
  const name = user.name || "";
  return {
    id: user._id || user.id || "",
    name,
    email: user.email || "",
    avatar: user.avatar || getInitialsAvatar(name),
    role: user.role || "user",
    plan: user.role === "admin" ? "Enterprise Plan" : "Free Plan",
    status: user.status || "offline",
    bio: user.bio || "",
    location: user.location || "",
    joinDate: user.createdAt
      ? new Date(user.createdAt).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        })
      : "",
    website: user.website || "",
    interests: user.interests || [],
    photoGallery: user.photoGallery || [],
  };
}

export function transformConversation(
  conversation: ApiConversation,
  currentUserId: string,
): Conversation {
  const lastMessageText = getConversationPreview(conversation.lastMessage);
  const lastMessageTime = formatMessageTime(
    conversation.lastMessage?.createdAt,
  );

  if (conversation.isGroup) {
    const groupName = conversation.groupName || "Nhóm chat";
    return {
      id: conversation._id,
      participantName: groupName,
      participantAvatar: "",
      participantStatus: "online",
      lastMessageText,
      lastMessageTime,
      lastMessageUnread: false,
      isGroup: true,
      groupInitials: groupName.substring(0, 2).toUpperCase(),
    };
  }

  const participantReference =
    conversation.participants?.find(
      (participant) => getUserId(participant) !== currentUserId,
    ) ?? conversation.participants?.[0];
  const participant = getPopulatedUser(participantReference);
  const participantName = participant.name || "Unknown User";

  return {
    id: conversation._id,
    participantId: getUserId(participantReference),
    participantName,
    participantAvatar: participant.avatar || getInitialsAvatar(participantName),
    participantStatus: participant.status || "offline",
    lastMessageText,
    lastMessageTime,
    lastMessageUnread: false,
  };
}

export function transformMessage(message: ApiMessage): Message {
  const sender = getPopulatedUser(message.sender);
  const recalled = Boolean(message.isRecalled);

  return {
    id: message._id,
    conversationId: message.conversationId?.toString(),
    replyTo: message.replyTo
      ? {
          id: message.replyTo._id,
          text: message.replyTo.isRecalled
            ? RECALLED_MESSAGE
            : message.replyTo.content || "",
          senderName: getPopulatedUser(message.replyTo.sender).name || "",
          isRecalled: message.replyTo.isRecalled,
        }
      : undefined,
    reactions: (message.reactions || []).map((reaction) => ({
      user: getUserId(reaction.user),
      emoji: reaction.emoji,
    })),
    text: recalled ? RECALLED_MESSAGE : message.content || "",
    senderId: getUserId(message.sender),
    senderName: sender.name || "",
    senderAvatar: sender.avatar || getInitialsAvatar(sender.name),
    timestamp: formatMessageTime(message.createdAt),
    status: recalled ? undefined : message.status || "sent",
    attachmentUrl: recalled ? undefined : message.attachmentUrl || undefined,
    attachmentType: recalled ? undefined : message.attachmentType,
    isRecalled: recalled,
  };
}
