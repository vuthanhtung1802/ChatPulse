import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Crucial for sending/receiving HTTP-only cookies (refresh token)
});

// Request Interceptor: Attach access token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('chatpulse_accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle auto-refresh token
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

    // Check if error is 401 Unauthorized and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url === '/auth/refresh') {
        // Refresh token itself expired or invalid, trigger logout
        localStorage.removeItem('chatpulse_accessToken');
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
        // Request token refresh
        const response = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const { accessToken } = response.data;
        localStorage.setItem('chatpulse_accessToken', accessToken);

        // Update default header
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        processQueue(null, accessToken);
        isRefreshing = false;

        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        
        // Log out user
        localStorage.removeItem('chatpulse_accessToken');
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
    const response = await apiClient.post(`/auth/register`, { name, email, password });
    if (response.data.accessToken) {
      localStorage.setItem('chatpulse_accessToken', response.data.accessToken);
    }
    return response.data;
  },

  async login(email: string, password: string) {
    const response = await apiClient.post(`${API_URL}/auth/login`, { email, password });
    if (response.data.accessToken) {
      localStorage.setItem('chatpulse_accessToken', response.data.accessToken);
    }
    return response.data;
  },

  async logout() {
    try {
      await apiClient.post(`${API_URL}/auth/logout`);
    } finally {
      localStorage.removeItem('chatpulse_accessToken');
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
    return response.data; // List of conversations
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

  async createComment(postId: string, content: string) {
    const response = await apiClient.post(`${API_URL}/posts/${postId}/comments`, { content });
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
};