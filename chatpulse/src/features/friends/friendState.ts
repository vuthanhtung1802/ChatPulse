import {
  FriendItem,
  FriendRequest,
  FriendRequestSender,
  RelationshipInfo,
} from "../../types/Friend";

function getPopulatedUser(
  user: FriendRequest["requester"] | FriendRequest["addressee"],
): FriendRequestSender | null {
  return typeof user === "object" ? user : null;
}

export function getFriendFromRequest(
  request: FriendRequest,
  currentUserId: string,
): FriendItem | null {
  const requester = getPopulatedUser(request.requester);
  const addressee = getPopulatedUser(request.addressee);
  const friend = requester?._id === currentUserId ? addressee : requester;

  if (!friend) return null;
  return {
    _id: friend._id,
    name: friend.name ?? "",
    email: friend.email ?? "",
    avatar: friend.avatar ?? "",
    status: friend.status ?? "offline",
    requestId: request._id,
    friendsSince: request.updatedAt ?? request.createdAt,
  };
}

export function buildRelationshipMap(
  currentUserId: string,
  friends: FriendItem[],
  incoming: FriendRequest[],
  sent: FriendRequest[],
): Record<string, RelationshipInfo> {
  const relationships: Record<string, RelationshipInfo> = {};

  for (const friend of friends) {
    relationships[friend._id] = { userId: friend._id, status: "friends" };
  }
  for (const request of incoming) {
    const requester = getPopulatedUser(request.requester);
    if (requester && requester._id !== currentUserId) {
      relationships[requester._id] = {
        userId: requester._id,
        status: "received",
        requestId: request._id,
      };
    }
  }
  for (const request of sent) {
    const addressee = getPopulatedUser(request.addressee);
    if (addressee && addressee._id !== currentUserId) {
      relationships[addressee._id] = {
        userId: addressee._id,
        status: "sent",
        requestId: request._id,
      };
    }
  }

  return relationships;
}
