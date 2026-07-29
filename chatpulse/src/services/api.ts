import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL

export const apiClient = axios.create({
  baseURL: API_URL,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('chatpulse_accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url === '/auth/refresh') {
        sessionStorage.removeItem('chatpulse_accessToken');
        sessionStorage.removeItem('chatpulse_refreshToken');
        window.dispatchEvent(new CustomEvent('auth-unauthorized'));
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = sessionStorage.getItem('chatpulse_refreshToken');
        const response = await axios.post(
          `${API_URL}/auth/refresh`,
          { refreshToken }
        );
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        sessionStorage.setItem('chatpulse_accessToken', accessToken);
        sessionStorage.setItem('chatpulse_refreshToken', newRefreshToken);

        apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        processQueue(null, accessToken);
        isRefreshing = false;

        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;

        sessionStorage.removeItem('chatpulse_accessToken');
        sessionStorage.removeItem('chatpulse_refreshToken');
        window.dispatchEvent(new CustomEvent('auth-unauthorized'));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth Service
export const authService = {
  async register(name: string, email: string, password: string) {
    const response = await apiClient.post(`${API_URL}/auth/register`, { name, email, password });
    if (response.data.accessToken) {
      sessionStorage.setItem('chatpulse_accessToken', response.data.accessToken);
      if (response.data.refreshToken) {
        sessionStorage.setItem('chatpulse_refreshToken', response.data.refreshToken);
      }
    }
    return response.data;
  },

  async login(email: string, password: string) {
    const response = await apiClient.post(`${API_URL}/auth/login`, { email, password });
    if (response.data.accessToken) {
      sessionStorage.setItem('chatpulse_accessToken', response.data.accessToken);
      sessionStorage.setItem('chatpulse_refreshToken', response.data.refreshToken);
    }
    return response.data;
  },

  async logout() {
    const refreshToken = sessionStorage.getItem('chatpulse_refreshToken');
    try {
      await apiClient.post(`${API_URL}/auth/logout`, { refreshToken });
    } finally {
      sessionStorage.removeItem('chatpulse_accessToken');
      sessionStorage.removeItem('chatpulse_refreshToken');
    }
  },

  async getCurrentUser() {
    const response = await apiClient.get(`${API_URL}/auth/me`);
    return response.data;
  },
};

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

// Chat Service
export const chatService = {
  async getConversations() {
    const response = await apiClient.get(`${API_URL}/chat/conversations`);
    return response.data;
  },

  async createConversation(participantIds: string[], isGroup = false, groupName = '') {
    const response = await apiClient.post(`${API_URL}/chat/conversations`, {
      participantIds,
      isGroup,
      groupName,
    });
    return response.data;
  },

  async getConversationDetail(conversationId: string) {
    const response = await apiClient.get(`${API_URL}/chat/conversations/${conversationId}`);
    return response.data;
  },

  async getMessages(conversationId: string, page = 1, limit = 50) {
    const response = await apiClient.get(
      `${API_URL}/chat/conversations/${conversationId}/messages?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  async deleteMessage(messageId: string) {
    const response = await apiClient.delete(`${API_URL}/chat/messages/${messageId}`);
    return response.data;
  },
};

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
