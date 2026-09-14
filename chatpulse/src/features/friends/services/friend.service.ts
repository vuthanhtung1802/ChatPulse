import { apiClient } from '../../../lib/api/client';

export const friendService = {
  async getFriends() {
    const response = await apiClient.get('/friends');
    return response.data;
  },

  async getIncomingRequests() {
    const response = await apiClient.get('/friends/requests/incoming');
    return response.data;
  },

  async getSentRequests() {
    const response = await apiClient.get('/friends/requests/sent');
    return response.data;
  },

  async getStatuses(userIds: string[]) {
    const response = await apiClient.get(
      `/friends/statuses?ids=${encodeURIComponent(userIds.join(','))}`,
    );
    return response.data;
  },
};