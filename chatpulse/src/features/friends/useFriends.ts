import { useState, useEffect, useCallback, useRef } from 'react';
import { User } from '../../types/types';
import { FriendItem, FriendRequest, RelationshipInfo } from '../../types/Friend';
import { friendService } from './services/friend.service';
import { socketService } from '../chat/services/socket.service';

function getOther(request: FriendRequest, myId: string): FriendItem | null {
  const requester =
    typeof request.requester === 'object' ? request.requester : null;
  const addressee =
    typeof request.addressee === 'object' ? request.addressee : null;
  const other =
    requester && requester._id === myId ? addressee : requester;
  if (!other) return null;
  return {
    _id: other._id,
    name: other.name ?? '',
    email: other.email ?? '',
    avatar: other.avatar ?? '',
    status: other.status ?? 'offline',
    requestId: request._id,
    friendsSince: request.updatedAt ?? request.createdAt,
  };
}

export function useFriendsState(currentUser: User | null) {
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [relationships, setRelationships] = useState<
    Record<string, RelationshipInfo>
  >({});

  const currentUserIdRef = useRef<string | null>(null);
  currentUserIdRef.current = currentUser?.id ?? null;

  const loadAll = useCallback(async () => {
    if (!currentUserIdRef.current) return;
    const myId = currentUserIdRef.current;
    try {
      const [friendsRes, incomingRes, sentRes] = await Promise.all([
        friendService.getFriends(),
        friendService.getIncomingRequests(),
        friendService.getSentRequests(),
      ]);
      setFriends(
        Array.isArray(friendsRes.friends) ? friendsRes.friends : [],
      );

      const incoming: FriendRequest[] = Array.isArray(incomingRes.requests)
        ? incomingRes.requests
        : [];
      const sent: FriendRequest[] = Array.isArray(sentRes.requests)
        ? sentRes.requests
        : [];
      setIncomingRequests(incoming);
      setSentRequests(sent);

      const rel: Record<string, RelationshipInfo> = {};
      for (const friend of friendsRes.friends as FriendItem[]) {
        rel[friend._id] = { userId: friend._id, status: 'friends' };
      }
      for (const req of incoming) {
        const senderId =
          typeof req.requester === 'object' ? req.requester._id : '';
        if (senderId) {
          rel[senderId] = { userId: senderId, status: 'received', requestId: req._id };
        }
      }
      for (const req of sent) {
        const targetId =
          typeof req.addressee === 'object' ? req.addressee._id : '';
        if (targetId) {
          rel[targetId] = { userId: targetId, status: 'sent' };
        }
      }
      setRelationships(rel);
    } catch (err) {
      console.error('Failed to load friends data', err);
    }
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setFriends([]);
      setIncomingRequests([]);
      setSentRequests([]);
      setRelationships({});
      return;
    }
    loadAll();
  }, [currentUser, loadAll]);

  useEffect(() => {
    if (!currentUser) return;

    const handleReceived = ({ request }: { request: FriendRequest }) => {
      setIncomingRequests((prev) => {
        if (prev.some((r) => r._id === request._id)) return prev;
        return [request, ...prev];
      });
      const senderId =
        typeof request.requester === 'object' ? request.requester._id : '';
      if (senderId) {
        setRelationships((prev) => ({
          ...prev,
          [senderId]: { userId: senderId, status: 'received', requestId: request._id },
        }));
      }
    };

    const handleAccepted = ({ request }: { request: FriendRequest }) => {
      const myId = currentUserIdRef.current;
      if (!myId) return;
      const friend = getOther(request, myId);
      if (!friend) return;

      setFriends((prev) =>
        prev.some((f) => f._id === friend._id) ? prev : [friend, ...prev],
      );
      setIncomingRequests((prev) =>
        prev.filter((r) => r._id !== request._id),
      );
      setSentRequests((prev) => prev.filter((r) => r._id !== request._id));
      setRelationships((prev) => ({
        ...prev,
        [friend._id]: { userId: friend._id, status: 'friends' },
      }));
    };

    const handleDeclined = ({ requestId }: { requestId: string }) => {
      setSentRequests((prev) => prev.filter((r) => r._id !== requestId));
      setRelationships((prev) => {
        const next = { ...prev };
        for (const [key, value] of Object.entries(next)) {
          if (value.status === 'sent' && value.requestId === requestId) {
            delete next[key];
          }
        }
        return next;
      });
    };

    const handleRemoved = ({ by }: { by: string }) => {
      setFriends((prev) => prev.filter((f) => f._id !== by));
      setRelationships((prev) => {
        const next = { ...prev };
        delete next[by];
        return next;
      });
    };

    socketService.on('friendRequestReceived', handleReceived);
    socketService.on('friendRequestAccepted', handleAccepted);
    socketService.on('friendRequestDeclined', handleDeclined);
    socketService.on('friendRemoved', handleRemoved);

    return () => {
      socketService.off('friendRequestReceived', handleReceived);
      socketService.off('friendRequestAccepted', handleAccepted);
      socketService.off('friendRequestDeclined', handleDeclined);
      socketService.off('friendRemoved', handleRemoved);
    };
  }, [currentUser]);

  // ---------- Actions ----------

  const sendRequest = (targetUserId: string) => {
    const myId = currentUserIdRef.current;
    if (!myId) return;

    const existingIncoming =
      incomingRequestsRef.current.find(
        (r) =>
          typeof r.requester === 'object' && r.requester._id === targetUserId,
      ) ?? null;

    socketService.sendFriendRequest(targetUserId);

    if (existingIncoming) {
      // Backend auto-accepts mutual requests: treat as friends right away.
      const friend = getOther(existingIncoming, myId);
      if (friend) {
        setFriends((prev) =>
          prev.some((f) => f._id === friend._id) ? prev : [friend, ...prev],
        );
        setIncomingRequests((prev) =>
          prev.filter((r) => r._id !== existingIncoming._id),
        );
        setRelationships((prev) => ({
          ...prev,
          [targetUserId]: { userId: targetUserId, status: 'friends' },
        }));
      }
    } else {
      setRelationships((prev) => ({
        ...prev,
        [targetUserId]: { userId: targetUserId, status: 'sent' },
      }));
    }
  };

  const acceptRequest = (requestId: string) => {
    const request = incomingRequestsRef.current.find(
      (r) => r._id === requestId,
    );
    const myId = currentUserIdRef.current;
    socketService.acceptFriendRequest(requestId);

    if (request && myId) {
      const friend = getOther(request, myId);
      if (friend) {
        setFriends((prev) =>
          prev.some((f) => f._id === friend._id) ? prev : [friend, ...prev],
        );
        setRelationships((prev) => ({
          ...prev,
          [friend._id]: { userId: friend._id, status: 'friends' },
        }));
      }
    }
    setIncomingRequests((prev) => prev.filter((r) => r._id !== requestId));
  };

  const declineRequest = (requestId: string) => {
    const request = incomingRequestsRef.current.find(
      (r) => r._id === requestId,
    );
    socketService.declineFriendRequest(requestId);

    if (request) {
      const senderId =
        typeof request.requester === 'object' ? request.requester._id : '';
      if (senderId) {
        setRelationships((prev) => {
          const next = { ...prev };
          delete next[senderId];
          return next;
        });
      }
    }
    setIncomingRequests((prev) => prev.filter((r) => r._id !== requestId));
  };

  const removeFriend = (friendId: string) => {
    socketService.emitRemoveFriend(friendId);
    setFriends((prev) => prev.filter((f) => f._id !== friendId));
    setRelationships((prev) => {
      const next = { ...prev };
      delete next[friendId];
      return next;
    });
  };

  const incomingRequestsRef = useRef<FriendRequest[]>([]);
  incomingRequestsRef.current = incomingRequests;

  return {
    friends,
    incomingRequests,
    sentRequests,
    relationships,
    loadAll,
    sendRequest,
    acceptRequest,
    declineRequest,
    removeFriend,
  };
}