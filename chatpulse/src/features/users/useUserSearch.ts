import { useEffect, useState } from "react";
import { ApiUser } from "../../types/Api";
import { RelationshipInfo } from "../../types/Friend";
import { friendService } from "../friends/services/friend.service";
import { userService } from "./services/user.service";

interface UseUserSearchOptions {
  enabled: boolean;
  currentUserId?: string;
  relationships: Record<string, RelationshipInfo>;
}

export function useUserSearch({
  enabled,
  currentUserId,
  relationships,
}: UseUserSearchOptions) {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [remoteRelationships, setRemoteRelationships] = useState<
    Record<string, RelationshipInfo>
  >({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setSearchTerm("");
      setUsers([]);
      setRemoteRelationships({});
      return;
    }

    const query = searchTerm.trim();
    if (!query) {
      setUsers([]);
      setRemoteRelationships({});
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await userService.searchUsers(query);
        if (cancelled) return;
        const results = data.filter((user) => user._id !== currentUserId);
        setUsers(results);

        const unknownIds = results
          .map((user) => user._id || user.id || "")
          .filter((id) => id && !relationships[id]);
        if (unknownIds.length === 0) {
          setRemoteRelationships({});
          return;
        }

        const response = await friendService.getStatuses(unknownIds);
        if (cancelled) return;
        setRemoteRelationships(
          Object.fromEntries(
            response.statuses.map((status) => [status.userId, status]),
          ),
        );
      } catch (error) {
        if (!cancelled) console.error("Failed to search users", error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [currentUserId, enabled, relationships, searchTerm]);

  const getRelationship = (userId: string) =>
    relationships[userId] ?? remoteRelationships[userId];

  return { searchTerm, setSearchTerm, users, isLoading, getRelationship };
}
