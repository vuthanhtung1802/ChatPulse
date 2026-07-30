import { apiClient } from "./api";
const API_URL = import.meta.env.VITE_API_URL
// User Service
export const userService = {
  async updateProfile(data: {
    name?: string;
    bio?: string;
    location?: string;
    website?: string;
    interests?: string[];
  }) {
    const response = await apiClient.put(`${API_URL}/users/profile`, data);
    return response.data;
  },

  async uploadAvatar(userId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.put(`${API_URL}/users/${userId}/avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async searchUsers(keyword: string) {
    const response = await apiClient.get(`${API_URL}/users/search?q=${encodeURIComponent(keyword)}`);
    return response.data;
  },

  async uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post(`${API_URL}/users/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};