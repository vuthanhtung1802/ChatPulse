import { apiClient } from "../../../lib/api/client";
import {
  FriendItem,
  FriendRequest,
  RelationshipInfo,
} from "../../../types/Friend";

export const friendService = {
  async getFriends() {
    const response = await apiClient.get<{ friends: FriendItem[] }>("/friends");
    return response.data;
  },

  async getIncomingRequests() {
    const response = await apiClient.get<{ requests: FriendRequest[] }>(
      "/friends/requests/incoming",
    );
    return response.data;
  },

  async getSentRequests() {
    const response = await apiClient.get<{ requests: FriendRequest[] }>(
      "/friends/requests/sent",
    );
    return response.data;
  },

  async getStatuses(userIds: string[]) {
    const response = await apiClient.get<{ statuses: RelationshipInfo[] }>(
      `/friends/statuses?ids=${encodeURIComponent(userIds.join(","))}`,
    );
    return response.data;
  },
};
