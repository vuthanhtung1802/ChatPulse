import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  Search,
  UserPlus,
  UserCheck,
  Clock,
  MessageSquare,
  UserMinus,
  Users,
  LoaderCircle,
  AlertTriangle,
} from "lucide-react";
import { useChat } from "../../chat/ChatContext";
import { useAuth } from "../../auth/AuthContext";
import { useFriends } from "../../friends/FriendsContext";
import { useUserSearch } from "../useUserSearch";

interface SearchFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FALLBACK_AVATAR =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150";

export const SearchFriendModal: React.FC<SearchFriendModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { createConversation, createGroupConversation } = useChat();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const {
    relationships,
    friends,
    incomingRequests,
    sendRequest,
    acceptRequest,
    declineRequest,
    removeFriend,
  } = useFriends();
  const [activeTab, setActiveTab] = useState<"search" | "friends" | "group">(
    "search",
  );
  const [groupName, setGroupName] = useState("");
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [friendToRemove, setFriendToRemove] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isRemovingFriend, setIsRemovingFriend] = useState(false);
  const [removeFriendError, setRemoveFriendError] = useState("");
  const { searchTerm, setSearchTerm, users, isLoading, getRelationship } =
    useUserSearch({
      enabled: isOpen,
      currentUserId: currentUser?.id,
      relationships,
    });

  React.useEffect(() => {
    if (!isOpen) {
      setActiveTab("search");
      setGroupName("");
      setSelectedFriends([]);
      setFriendToRemove(null);
      setRemoveFriendError("");
      return;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectUser = async (id: string) => {
    try {
      await createConversation(id);
      onClose();
      navigate("/messages");
    } catch (err) {
      console.error("Failed to start conversation", err);
    }
  };

  const handleAddFriend = (id: string) => {
    sendRequest(id);
  };

  const handleUnfriend = (id: string, name: string) => {
    setRemoveFriendError("");
    setFriendToRemove({ id, name });
  };

  const handleConfirmUnfriend = async () => {
    if (!friendToRemove) return;
    setIsRemovingFriend(true);
    setRemoveFriendError("");
    try {
      await removeFriend(friendToRemove.id);
      setFriendToRemove(null);
    } catch {
      setRemoveFriendError("Could not remove this friend. Please try again.");
    } finally {
      setIsRemovingFriend(false);
    }
  };

  const settleRequest = (
    requestId: string | undefined,
    action: "accept" | "decline",
  ) => {
    if (!requestId) return;
    if (action === "accept") {
      acceptRequest(requestId);
    } else {
      declineRequest(requestId);
    }
  };

  const renderTabBar = () => (
    <div className="flex gap-1.5 px-4 py-3 border-b border-outline-variant/60">
      {(
        [
          { key: "search", label: "Search", icon: Search },
          { key: "friends", label: "Friends", icon: Users },
          { key: "group", label: "New group", icon: Users },
        ] as const
      ).map((tab) => (
        <button
          key={tab.key}
          onClick={() => setActiveTab(tab.key)}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === tab.key
              ? "bg-primary text-on-primary"
              : "text-on-surface-variant hover:bg-surface-container-high"
          }`}
        >
          <tab.icon size={14} />
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedFriends.length < 2) return;
    await createGroupConversation(groupName.trim(), selectedFriends);
    onClose();
    navigate("/messages");
  };

  const renderGroupTab = () => (
    <div className="space-y-4">
      <input
        value={groupName}
        onChange={(event) => setGroupName(event.target.value)}
        placeholder="Tên nhóm"
        maxLength={60}
        className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-hidden"
      />
      <p className="text-xs text-on-surface-variant">
        Chọn ít nhất 2 người bạn
      </p>
      <div className="space-y-1">
        {friends.map((friend) => {
          const checked = selectedFriends.includes(friend._id);
          return (
            <label
              key={friend._id}
              className="flex cursor-pointer items-center gap-3 rounded-xl p-2.5 hover:bg-surface-container-high/60"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() =>
                  setSelectedFriends((current) =>
                    checked
                      ? current.filter((id) => id !== friend._id)
                      : [...current, friend._id],
                  )
                }
              />
              <img
                src={friend.avatar || FALLBACK_AVATAR}
                alt={friend.name}
                className="h-9 w-9 rounded-lg object-cover"
              />
              <span className="text-sm font-semibold text-on-surface">
                {friend.name}
              </span>
            </label>
          );
        })}
      </div>
      <button
        type="button"
        onClick={handleCreateGroup}
        disabled={!groupName.trim() || selectedFriends.length < 2}
        className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-on-primary disabled:opacity-50"
      >
        Tạo nhóm ({selectedFriends.length} thành viên)
      </button>
    </div>
  );

  const renderFriendsTab = () => (
    <div className="space-y-5">
      {/* Incoming requests */}
      <div>
        <div className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider opacity-70 mb-2">
          Lời mời kết bạn
          {incomingRequests.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-error-container text-on-error-container text-[9px] font-bold">
              {incomingRequests.length}
            </span>
          )}
        </div>
        {incomingRequests.length > 0 ? (
          <div className="space-y-1">
            {incomingRequests.map((req) => {
              const sender =
                typeof req.requester === "object" ? req.requester : null;
              return (
                <div
                  key={req._id}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-surface-container-high/60 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={sender?.avatar || FALLBACK_AVATAR}
                      alt={sender?.name ?? ""}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-xl object-cover"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-on-surface truncate">
                        {sender?.name ?? "Người dùng"}
                      </div>
                      <div className="text-xs text-on-surface-variant opacity-80 truncate">
                        {sender?.email ?? ""}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <button
                      onClick={() => settleRequest(req._id, "accept")}
                      className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold flex items-center gap-1.5 hover:bg-primary-container hover:text-on-primary-container transition-colors cursor-pointer"
                    >
                      <UserCheck size={13} />
                      <span>Accept</span>
                    </button>
                    <button
                      onClick={() => settleRequest(req._id, "decline")}
                      className="px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface-variant text-xs font-semibold hover:text-error transition-colors cursor-pointer"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4 text-sm text-on-surface-variant/60 bg-surface-container-lowest border border-dashed border-outline-variant rounded-xl">
            Không có lời mời kết bạn nào
          </div>
        )}
      </div>

      {/* My friends (accepted only) */}
      <div>
        <div className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider opacity-70 mb-2">
          Bạn bè của tôi
          <span className="ml-1.5 text-on-surface-variant/60 font-medium normal-case">
            ({friends.length})
          </span>
        </div>
        {friends.length > 0 ? (
          <div className="space-y-1">
            {friends.map((friend) => (
              <div
                key={friend._id}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-surface-container-high/60 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={friend.avatar || FALLBACK_AVATAR}
                      alt={friend.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-xl object-cover"
                    />
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-surface-container-low ${
                        friend.status === "online"
                          ? "bg-secondary"
                          : "bg-outline-variant"
                      }`}
                    ></div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-on-surface truncate">
                      {friend.name}
                    </div>
                    <div className="text-xs text-on-surface-variant opacity-80">
                      {friend.status === "online" ? "Active Now" : "Offline"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <button
                    onClick={() => handleUnfriend(friend._id, friend.name)}
                    title="Unfriend"
                    className="p-2 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/30 transition-colors cursor-pointer"
                  >
                    <UserMinus size={15} />
                  </button>
                  <button
                    onClick={() => handleSelectUser(friend._id)}
                    className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold flex items-center gap-1.5 hover:bg-primary-container hover:text-on-primary-container transition-colors cursor-pointer"
                  >
                    <MessageSquare size={13} />
                    <span>Message</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-sm text-on-surface-variant/60 bg-surface-container-lowest border border-dashed border-outline-variant rounded-xl">
            Chưa có bạn bè nào
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-surface-container-low border border-outline-variant rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-outline-variant/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <UserPlus size={16} />
            </div>
            <h3 className="font-display font-bold text-base text-on-surface">
              {activeTab === "friends"
                ? "Friends"
                : activeTab === "group"
                  ? "Create group"
                  : "Search Friend"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-surface-container-high rounded-lg text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        {renderTabBar()}

        {/* Content */}
        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
          {activeTab === "group" ? (
            renderGroupTab()
          ) : activeTab === "friends" ? (
            renderFriendsTab()
          ) : (
            <>
              {/* Search */}
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-3.5 text-on-surface-variant/50"
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search users by name..."
                  className="w-full pl-9 pr-3 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-sm focus:outline-hidden focus:border-primary text-on-surface placeholder:text-on-surface-variant/50"
                />
              </div>

              {/* Users list */}
              <div className="space-y-1">
                {isLoading ? (
                  <div className="text-center py-6 text-sm text-on-surface-variant/60">
                    Searching users...
                  </div>
                ) : users.length > 0 ? (
                  users.map((user) => {
                    const userId = user._id || user.id;
                    if (!userId) return null;
                    const avatarUrl = user.avatar || FALLBACK_AVATAR;
                    const relationship = getRelationship(userId);
                    const status = relationship?.status ?? "none";

                    return (
                      <div
                        key={userId}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-surface-container-high/60 transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={avatarUrl}
                            alt={user.name}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-xl object-cover"
                          />
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors truncate">
                              {user.name}
                            </div>
                            <div className="text-xs text-on-surface-variant opacity-80 truncate">
                              {user.email}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          {status === "friends" && (
                            <>
                              <button
                                onClick={() =>
                                  handleUnfriend(
                                    userId,
                                    user.name || "this user",
                                  )
                                }
                                title="Unfriend"
                                className="p-2 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/30 transition-colors cursor-pointer"
                              >
                                <UserMinus size={15} />
                              </button>
                              <button
                                onClick={() => handleSelectUser(userId)}
                                className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold flex items-center gap-1.5 hover:bg-primary-container hover:text-on-primary-container transition-colors cursor-pointer"
                              >
                                <MessageSquare size={13} />
                                <span>Message</span>
                              </button>
                            </>
                          )}

                          {status === "sent" && (
                            <span className="px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface-variant text-xs font-semibold flex items-center gap-1.5 opacity-80">
                              <Clock size={13} />
                              <span>Requested</span>
                            </span>
                          )}

                          {status === "received" && (
                            <>
                              <button
                                onClick={() =>
                                  settleRequest(
                                    relationship?.requestId,
                                    "accept",
                                  )
                                }
                                className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold flex items-center gap-1 hover:bg-primary-container hover:text-on-primary-container transition-colors cursor-pointer"
                              >
                                <UserCheck size={13} />
                                <span>Accept</span>
                              </button>
                              <button
                                onClick={() =>
                                  settleRequest(
                                    relationship?.requestId,
                                    "decline",
                                  )
                                }
                                className="px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface-variant text-xs font-semibold hover:text-error transition-colors cursor-pointer"
                              >
                                Decline
                              </button>
                            </>
                          )}

                          {status === "none" && (
                            <button
                              onClick={() => handleAddFriend(userId)}
                              className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold flex items-center gap-1.5 hover:bg-primary-container hover:text-on-primary-container transition-colors cursor-pointer"
                            >
                              <UserPlus size={13} />
                              <span>Add Friend</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : searchTerm ? (
                  <div className="text-center py-6 text-sm text-on-surface-variant/60">
                    No users found
                  </div>
                ) : (
                  <div className="text-center py-6 text-sm text-on-surface-variant/60">
                    Type a name to search
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {friendToRemove && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
          <div
            className="w-full max-w-sm overflow-hidden rounded-3xl border border-outline-variant bg-surface-container-lowest shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-friend-title"
          >
            <div className="flex items-start justify-between px-5 pb-3 pt-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-error-container text-error">
                <AlertTriangle size={21} />
              </div>
              <button
                type="button"
                onClick={() => setFriendToRemove(null)}
                disabled={isRemovingFriend}
                className="rounded-xl p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface disabled:opacity-50"
                aria-label="Close confirmation"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-5 pb-5">
              <h3
                id="remove-friend-title"
                className="font-display text-lg font-bold text-on-surface"
              >
                Remove {friendToRemove.name}?
              </h3>
              <p className="mt-2 text-sm leading-5 text-on-surface-variant">
                You will no longer appear in each other&apos;s friend list. Your
                existing conversation will remain available.
              </p>
              {removeFriendError && (
                <p className="mt-3 rounded-xl bg-error-container px-3 py-2 text-xs font-medium text-on-error-container">
                  {removeFriendError}
                </p>
              )}
            </div>

            <div className="flex gap-3 border-t border-outline-variant/60 bg-surface-container-low/60 px-5 py-4">
              <button
                type="button"
                onClick={() => setFriendToRemove(null)}
                disabled={isRemovingFriend}
                className="flex-1 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-high disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmUnfriend}
                disabled={isRemovingFriend}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-error px-4 py-2.5 text-sm font-semibold text-on-error transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {isRemovingFriend ? (
                  <LoaderCircle size={15} className="animate-spin" />
                ) : (
                  <UserMinus size={15} />
                )}
                {isRemovingFriend ? "Removing..." : "Remove friend"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
