import { apiClient, tokenStorage } from "../../../lib/api/client";

// Auth Service
export const authService = {
  async register(name: string, email: string, password: string) {
    const response = await apiClient.post('/auth/register', { name, email, password });
    if (response.data.accessToken) {
      tokenStorage.setTokens(response.data.accessToken, response.data.refreshToken);
    }
    return response.data;
  },

  async login(email: string, password: string) {
    const response = await apiClient.post('/auth/login', { email, password });
    if (response.data.accessToken) {
      tokenStorage.setTokens(response.data.accessToken, response.data.refreshToken);
    }
    return response.data;
  },

  async logout() {
    const refreshToken = tokenStorage.getRefreshToken();
    try {
      await apiClient.post('/auth/logout', { refreshToken });
    } finally {
      tokenStorage.clearTokens();
    }
  },

  async getCurrentUser() {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
};