const API_URL = import.meta.env.VITE_API_URL
import { apiClient } from "./api";

// Friend Request Service
export const friendRequestService = {
  async sendRequest(receiverId: string) {
    const response = await apiClient.post(`${API_URL}/friend-requests/send`, { receiverId });
    return response.data;
  },

  async acceptRequest(requestId: string) {
    const response = await apiClient.put(`${API_URL}/friend-requests/${requestId}/accept`);
    return response.data;
  },

  async rejectRequest(requestId: string) {
    const response = await apiClient.put(`${API_URL}/friend-requests/${requestId}/reject`);
    return response.data;
  },

  async cancelRequest(requestId: string) {
    const response = await apiClient.delete(`${API_URL}/friend-requests/${requestId}/cancel`);
    return response.data;
  },

  async getSentRequests() {
    const response = await apiClient.get(`${API_URL}/friend-requests/sent`);
    return response.data;
  },

  async getReceivedRequests() {
    const response = await apiClient.get(`${API_URL}/friend-requests/received`);
    return response.data;
  },

  async getFriends() {
    const response = await apiClient.get(`${API_URL}/friend-requests/friends`);
    return response.data;
  },

  async getPendingCount() {
    const response = await apiClient.get(`${API_URL}/friend-requests/pending-count`);
    return response.data;
  },

  async getRelationship(userId: string) {
    const response = await apiClient.get(`${API_URL}/friend-requests/relationship/${userId}`);
    return response.data;
  },

  async removeFriend(friendId: string) {
    const response = await apiClient.delete(`${API_URL}/friend-requests/friends/${friendId}`);
    return response.data;
  },
};
