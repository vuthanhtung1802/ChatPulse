export type RelationshipStatus = 'none' | 'sent' | 'received' | 'friends';

export interface FriendRequestSender {
  _id: string;
  name: string;
  email?: string;
  avatar?: string;
  status?: string;
}

export interface FriendRequest {
  _id: string;
  requester: FriendRequestSender | string;
  addressee: FriendRequestSender | string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface FriendItem {
  _id: string;
  name: string;
  email: string;
  avatar: string;
  status: string;
  requestId: string;
  friendsSince: string;
}

export interface RelationshipInfo {
  userId: string;
  status: RelationshipStatus;
  requestId?: string;
}