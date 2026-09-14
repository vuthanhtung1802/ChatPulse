import React, { createContext, useContext } from 'react';
import { FriendItem, FriendRequest, RelationshipInfo } from '../../types/Friend';
import { useAuth } from '../auth/AuthContext';
import { useFriendsState } from './useFriends';

interface FriendsContextValue {
  friends: FriendItem[];
  incomingRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  relationships: Record<string, RelationshipInfo>;
  loadAll: () => Promise<void>;
  sendRequest: (targetUserId: string) => void;
  acceptRequest: (requestId: string) => void;
  declineRequest: (requestId: string) => void;
  removeFriend: (friendId: string) => void;
}

const FriendsContext = createContext<FriendsContextValue | undefined>(
  undefined,
);

export const FriendsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { currentUser } = useAuth();
  const value = useFriendsState(currentUser);

  return (
    <FriendsContext.Provider value={value}>{children}</FriendsContext.Provider>
  );
};

export const useFriends = () => {
  const context = useContext(FriendsContext);
  if (context === undefined) {
    throw new Error('useFriends must be used within a FriendsProvider');
  }
  return context;
};