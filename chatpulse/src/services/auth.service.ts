const API_URL = import.meta.env.VITE_API_URL
import { apiClient } from "./api";

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