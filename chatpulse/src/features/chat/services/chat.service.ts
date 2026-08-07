import { apiClient } from "../../../lib/api/client";

// Chat Service
export const chatService = {
  async getConversations() {
    const response = await apiClient.get('/conversations');
    return response.data.conversations ?? response.data;
  },

  async createConversation(participantIds: string[], isGroup = false, groupName = '') {
    const response = await apiClient.post('/conversations', {
      participantIds,
      isGroup,
      groupName,
    });
    return response.data.conversation ?? response.data;
  },

  async getConversationDetail(conversationId: string) {
    const response = await apiClient.get(`/conversations/${conversationId}`);
    return response.data.conversation ?? response.data;
  },

  async getMessages(conversationId: string, page = 1, limit = 50) {
    const response = await apiClient.get(
      `/conversations/${conversationId}/messages?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  async recallMessage(messageId: string) {
    const response = await apiClient.post(
      `/conversations/messages/${messageId}/recall`
    );
    return response.data;
  },

  async deleteMessage(messageId: string) {
    const response = await apiClient.delete(`/conversations/messages/${messageId}`);
    return response.data;
  },
};