const API_URL = import.meta.env.VITE_API_URL

import { apiClient } from "./api";

// Comment Service
export const commentService = {
  async getComments(postId: string, page = 1, limit = 20) {
    const response = await apiClient.get(`${API_URL}/posts/${postId}/comments?page=${page}&limit=${limit}`);
    return response.data;
  },

  async createComment(postId: string, content: string, parentCommentId?: string, emoji?: string) {
    const response = await apiClient.post(`${API_URL}/posts/${postId}/comments`, { content, parentCommentId, emoji });
    return response.data;
  },

  async toggleLikeComment(postId: string, commentId: string) {
    const response = await apiClient.post(`${API_URL}/posts/${postId}/comments/${commentId}/like`);
    return response.data;
  },

  async deleteComment(postId: string, commentId: string) {
    const response = await apiClient.delete(`${API_URL}/posts/${postId}/comments/${commentId}`);
    return response.data;
  },
};