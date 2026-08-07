import { apiClient } from "../../../lib/api/client";

// Post Service
export const postService = {
  async getPosts(page = 1, limit = 10) {
    const response = await apiClient.get(`/posts?page=${page}&limit=${limit}`);
    return response.data;
  },

  async createPost(content: string, images?: string[], mood?: string) {
    const response = await apiClient.post('/posts', { content, images, mood });
    return response.data;
  },

  async toggleLikePost(postId: string) {
    const response = await apiClient.post(`/posts/${postId}/like`);
    return response.data;
  },

  async toggleSavePost(postId: string) {
    const response = await apiClient.post(`/posts/${postId}/save`);
    return response.data;
  },

  async getSavedPosts(page = 1, limit = 10) {
    const response = await apiClient.get(`/posts/saved?page=${page}&limit=${limit}`);
    return response.data;
  },

  async deletePost(postId: string) {
    const response = await apiClient.delete(`/posts/${postId}`);
    return response.data;
  },

  async getPostsByUser(userId: string, page = 1, limit = 10) {
    const response = await apiClient.get(`/posts/user/${userId}?page=${page}&limit=${limit}`);
    return response.data;
  },

  async uploadPostImage(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/posts/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async sharePost(postId: string) {
    const response = await apiClient.post(`/posts/${postId}/share`);
    return response.data;
  },
};