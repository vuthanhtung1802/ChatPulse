import { useState, useEffect, useCallback, useRef } from "react";
import { User } from "../../types/types";
import {
  FriendItem,
  FriendRequest,
  RelationshipInfo,
} from "../../types/Friend";
import { friendService } from "./services/friend.service";
import { socketService } from "../chat/services/socket.service";
import { buildRelationshipMap, getFriendFromRequest } from "./friendState";

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
      setFriends(Array.isArray(friendsRes.friends) ? friendsRes.friends : []);

      const incoming: FriendRequest[] = Array.isArray(incomingRes.requests)
        ? incomingRes.requests
        : [];
      const sent: FriendRequest[] = Array.isArray(sentRes.requests)
        ? sentRes.requests
        : [];
      setIncomingRequests(incoming);
      setSentRequests(sent);

      setRelationships(
        buildRelationshipMap(myId, friendsRes.friends, incoming, sent),
      );
    } catch (err) {
      console.error("Failed to load friends data", err);
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
        typeof request.requester === "object" ? request.requester._id : "";
      if (senderId) {
        setRelationships((prev) => ({
          ...prev,
          [senderId]: {
            userId: senderId,
            status: "received",
            requestId: request._id,
          },
        }));
      }
    };

    const handleAccepted = ({ request }: { request: FriendRequest }) => {
      const myId = currentUserIdRef.current;
      if (!myId) return;
      const friend = getFriendFromRequest(request, myId);
      if (!friend) return;

      setFriends((prev) =>
        prev.some((f) => f._id === friend._id) ? prev : [friend, ...prev],
      );
      setIncomingRequests((prev) => prev.filter((r) => r._id !== request._id));
      setSentRequests((prev) => prev.filter((r) => r._id !== request._id));
      setRelationships((prev) => ({
        ...prev,
        [friend._id]: { userId: friend._id, status: "friends" },
      }));
    };

    const handleDeclined = ({
      requestId,
      declinedBy,
    }: {
      requestId: string;
      declinedBy: string;
    }) => {
      setSentRequests((prev) => prev.filter((r) => r._id !== requestId));
      setRelationships((prev) => {
        const next = { ...prev };
        for (const [key, value] of Object.entries(next)) {
          if (
            value.status === "sent" &&
            (value.requestId === requestId || key === declinedBy)
          ) {
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

    socketService.on("friendRequestReceived", handleReceived);
    socketService.on("friendRequestAccepted", handleAccepted);
    socketService.on("friendRequestDeclined", handleDeclined);
    socketService.on("friendRemoved", handleRemoved);

    return () => {
      socketService.off("friendRequestReceived", handleReceived);
      socketService.off("friendRequestAccepted", handleAccepted);
      socketService.off("friendRequestDeclined", handleDeclined);
      socketService.off("friendRemoved", handleRemoved);
    };
  }, [currentUser]);

  // ---------- Actions ----------

  const sendRequest = async (targetUserId: string) => {
    const myId = currentUserIdRef.current;
    if (!myId) return;

    try {
      const request = await socketService.sendFriendRequest(targetUserId);
      if (request.status === "accepted") {
        const friend = getFriendFromRequest(request, myId);
        if (friend) {
          setFriends((prev) =>
            prev.some((item) => item._id === friend._id)
              ? prev
              : [friend, ...prev],
          );
          setIncomingRequests((prev) =>
            prev.filter((item) => item._id !== request._id),
          );
          setRelationships((prev) => ({
            ...prev,
            [targetUserId]: { userId: targetUserId, status: "friends" },
          }));
        }
      } else {
        setSentRequests((prev) =>
          prev.some((item) => item._id === request._id)
            ? prev
            : [request, ...prev],
        );
        setRelationships((prev) => ({
          ...prev,
          [targetUserId]: {
            userId: targetUserId,
            status: "sent",
            requestId: request._id,
          },
        }));
      }
    } catch (err) {
      console.error("Failed to send friend request", err);
      await loadAll();
    }
  };

  const acceptRequest = async (requestId: string) => {
    const request = incomingRequestsRef.current.find(
      (r) => r._id === requestId,
    );
    const myId = currentUserIdRef.current;
    try {
      await socketService.acceptFriendRequest(requestId);
      if (request && myId) {
        const friend = getFriendFromRequest(request, myId);
        if (friend) {
          setFriends((prev) =>
            prev.some((f) => f._id === friend._id) ? prev : [friend, ...prev],
          );
          setRelationships((prev) => ({
            ...prev,
            [friend._id]: { userId: friend._id, status: "friends" },
          }));
        }
      }
      setIncomingRequests((prev) => prev.filter((r) => r._id !== requestId));
    } catch (err) {
      console.error("Failed to accept friend request", err);
      await loadAll();
    }
  };

  const declineRequest = async (requestId: string) => {
    const request = incomingRequestsRef.current.find(
      (r) => r._id === requestId,
    );
    try {
      await socketService.declineFriendRequest(requestId);
      if (request) {
        const senderId =
          typeof request.requester === "object" ? request.requester._id : "";
        if (senderId) {
          setRelationships((prev) => {
            const next = { ...prev };
            delete next[senderId];
            return next;
          });
        }
      }
      setIncomingRequests((prev) => prev.filter((r) => r._id !== requestId));
    } catch (err) {
      console.error("Failed to decline friend request", err);
      await loadAll();
    }
  };

  const removeFriend = async (friendId: string) => {
    try {
      await socketService.emitRemoveFriend(friendId);
      setFriends((prev) => prev.filter((f) => f._id !== friendId));
      setRelationships((prev) => {
        const next = { ...prev };
        delete next[friendId];
        return next;
      });
    } catch (err) {
      console.error("Failed to remove friend", err);
      await loadAll();
      throw err;
    }
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
