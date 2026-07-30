import { apiClient } from "./api";
const API_URL = import.meta.env.VITE_API_URL
// Post Service
export const postService = {
  async getPosts(page = 1, limit = 10) {
    const response = await apiClient.get(`${API_URL}/posts?page=${page}&limit=${limit}`);
    return response.data;
  },

  async createPost(content: string, images?: string[], mood?: string) {
    const response = await apiClient.post(`${API_URL}/posts`, { content, images, mood });
    return response.data;
  },

  async toggleLikePost(postId: string) {
    const response = await apiClient.post(`${API_URL}/posts/${postId}/like`);
    return response.data;
  },

  async toggleSavePost(postId: string) {
    const response = await apiClient.post(`${API_URL}/posts/${postId}/save`);
    return response.data;
  },

  async getSavedPosts(page = 1, limit = 10) {
    const response = await apiClient.get(`${API_URL}/posts/saved?page=${page}&limit=${limit}`);
    return response.data;
  },

  async deletePost(postId: string) {
    const response = await apiClient.delete(`${API_URL}/posts/${postId}`);
    return response.data;
  },

  async getPostsByUser(userId: string, page = 1, limit = 10) {
    const response = await apiClient.get(`${API_URL}/posts/user/${userId}?page=${page}&limit=${limit}`);
    return response.data;
  },

  async uploadPostImage(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post(`${API_URL}/posts/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async sharePost(postId: string) {
    const response = await apiClient.post(`${API_URL}/posts/${postId}/share`);
    return response.data;
  },
};