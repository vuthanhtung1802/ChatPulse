const API_URL = import.meta.env.VITE_API_URL
import { apiClient } from "./api";

// Chat Service
export const chatService = {
  async getConversations() {
    const response = await apiClient.get(`${API_URL}/conversations`);
    return response.data;
  },

  async createConversation(participantIds: string[], isGroup = false, groupName = '') {
    const response = await apiClient.post(`${API_URL}/conversations`, {
      participantIds,
      isGroup,
      groupName,
    });
    return response.data;
  },

  async getConversationDetail(conversationId: string) {
    const response = await apiClient.get(`${API_URL}/conversations/${conversationId}`);
    return response.data;
  },

  async getMessages(conversationId: string, page = 1, limit = 50) {
    const response = await apiClient.get(
      `${API_URL}/conversations/${conversationId}/messages?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  async deleteMessage(messageId: string) {
    const response = await apiClient.delete(`${API_URL}/conversations/messages/${messageId}`);
    return response.data;
  },
};

