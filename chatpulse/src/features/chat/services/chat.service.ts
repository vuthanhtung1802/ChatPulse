import { apiClient } from "../../../lib/api/client";
import { ApiConversation, ApiMessage } from "../../../types/Api";

// Chat Service
export const chatService = {
  async getConversations() {
    const response = await apiClient.get<
      ApiConversation[] | { conversations: ApiConversation[] }
    >("/conversations");
    return Array.isArray(response.data)
      ? response.data
      : response.data.conversations;
  },

  async createConversation(
    participantIds: string[],
    isGroup = false,
    groupName = "",
  ) {
    const response = await apiClient.post<
      ApiConversation | { conversation: ApiConversation }
    >("/conversations", {
      participantIds,
      isGroup,
      groupName,
    });
    return "conversation" in response.data
      ? response.data.conversation
      : response.data;
  },

  async getConversationDetail(conversationId: string) {
    const response = await apiClient.get<
      ApiConversation | { conversation: ApiConversation }
    >(`/conversations/${conversationId}`);
    return "conversation" in response.data
      ? response.data.conversation
      : response.data;
  },

  async getMessages(conversationId: string, page = 1, limit = 50) {
    const response = await apiClient.get<ApiMessage[]>(
      `/conversations/${conversationId}/messages?page=${page}&limit=${limit}`,
    );
    return response.data;
  },

  async recallMessage(messageId: string) {
    const response = await apiClient.post(
      `/conversations/messages/${messageId}/recall`,
    );
    return response.data;
  },

  async deleteMessage(messageId: string) {
    const response = await apiClient.delete(
      `/conversations/messages/${messageId}`,
    );
    return response.data;
  },

  async toggleReaction(messageId: string, emoji: string) {
    const response = await apiClient.post(
      `/conversations/messages/${messageId}/reactions`,
      { emoji },
    );
    return response.data.reactions;
  },
};
