import { apiClient } from "./api";
const API_URL = import.meta.env.VITE_API_URL
// Notification Service
export const notificationService = {
  async getAll(page = 1, limit = 20) {
    const response = await apiClient.get(`${API_URL}/notifications?page=${page}&limit=${limit}`);
    return response.data;
  },

  async getUnreadCount() {
    const response = await apiClient.get(`${API_URL}/notifications/unread-count`);
    return response.data;
  },

  async markAsRead(notificationId: string) {
    const response = await apiClient.put(`${API_URL}/notifications/${notificationId}/read`);
    return response.data;
  },

  async markAllAsRead() {
    const response = await apiClient.put(`${API_URL}/notifications/read-all`);
    return response.data;
  },

  async delete(notificationId: string) {
    const response = await apiClient.delete(`${API_URL}/notifications/${notificationId}`);
    return response.data;
  },
};
