import { useState, useEffect, useRef } from "react";
import { Conversation, Message, User } from "../../types/types";
import { chatService } from "./services/chat.service";
import { socketService, SendMessagePayload } from "./services/socket.service";
import {
  transformConversation,
  transformMessage,
} from "../../utils/transformers";
import {
  createOptimisticMessage,
  generateTempId,
  matchPendingMessage,
  mergeMessage,
  previewText,
  PendingMessage,
} from "./utils/chatMessages";

export function useChatState(currentUser: User | null) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [activeConversationId, setActiveConversationId] = useState<string>("");
  const [isTyping, setIsTyping] = useState<Record<string, boolean>>({});
  const [hasMoreMessages, setHasMoreMessages] = useState<
    Record<string, boolean>
  >({});
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const messagePagesRef = useRef<Record<string, number>>({});
  const MESSAGE_PAGE_SIZE = 50;

  const currentUserIdRef = useRef<string | null>(null);
  currentUserIdRef.current = currentUser?.id ?? null;

  const activeConversationIdRef = useRef<string>("");
  activeConversationIdRef.current = activeConversationId;

  // Tracks optimistic messages awaiting the server echo.
  const pendingMessagesRef = useRef<Map<string, PendingMessage>>(new Map());

  const typingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingActiveRef = useRef(false);
  const typingTimeoutsRef = useRef<
    Record<string, ReturnType<typeof setTimeout>>
  >({});

  const loadMessages = async (conversationId: string) => {
    try {
      const res = await chatService.getMessages(
        conversationId,
        1,
        MESSAGE_PAGE_SIZE,
      );
      const transformed = res.map(transformMessage);
      setMessages((prev) => ({
        ...prev,
        [conversationId]: transformed,
      }));
      messagePagesRef.current[conversationId] = 1;
      setHasMoreMessages((prev) => ({
        ...prev,
        [conversationId]: res.length === MESSAGE_PAGE_SIZE,
      }));
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId
            ? { ...conv, lastMessageUnread: false }
            : conv,
        ),
      );
      socketService.emitSeen(conversationId);
    } catch (err) {
      console.error("Error fetching messages", err);
    }
  };

  const loadOlderMessages = async () => {
    const conversationId = activeConversationIdRef.current;
    if (
      !conversationId ||
      loadingOlderMessages ||
      hasMoreMessages[conversationId] === false
    )
      return;
    setLoadingOlderMessages(true);
    try {
      const nextPage = (messagePagesRef.current[conversationId] ?? 1) + 1;
      const res = await chatService.getMessages(
        conversationId,
        nextPage,
        MESSAGE_PAGE_SIZE,
      );
      const older = res.map(transformMessage);
      setMessages((prev) => {
        const current = prev[conversationId] || [];
        const currentIds = new Set(current.map((message) => message.id));
        return {
          ...prev,
          [conversationId]: [
            ...older.filter((message) => !currentIds.has(message.id)),
            ...current,
          ],
        };
      });
      messagePagesRef.current[conversationId] = nextPage;
      setHasMoreMessages((prev) => ({
        ...prev,
        [conversationId]: res.length === MESSAGE_PAGE_SIZE,
      }));
    } catch (err) {
      console.error("Error fetching older messages", err);
    } finally {
      setLoadingOlderMessages(false);
    }
  };

  useEffect(() => {
    if (!activeConversationId || !currentUser) return;

    loadMessages(activeConversationId);
    socketService.joinConversation(activeConversationId);

    return () => {
      sendTypingStatus(false);
    };
  }, [activeConversationId, currentUser]);

  const updateConversationPreview = (
    conversationId: string,
    text: string,
    timestamp: string,
    unread: boolean,
  ) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId
          ? {
              ...conv,
              lastMessageText: text,
              lastMessageTime: timestamp,
              lastMessageUnread: unread,
            }
          : conv,
      ),
    );
  };

  const markAllAsRead = (conversationId: string) => {
    setMessages((prev) => {
      const list = prev[conversationId];
      if (!list) return prev;
      return {
        ...prev,
        [conversationId]: list.map((m) =>
          m.senderId !== currentUserIdRef.current
            ? { ...m, status: "read" as const }
            : m,
        ),
      };
    });
  };

  // ---------- Socket event handlers ----------

  const handleMessageReceived = (msgDoc: any) => {
    const conversationId =
      msgDoc?.conversationId?.toString?.() ?? msgDoc?.conversationId;
    if (!conversationId) return;

    const message = transformMessage(msgDoc);
    const isMine = message.senderId === currentUserIdRef.current;
    const isActive = conversationId === activeConversationIdRef.current;

    // Resolve which optimistic copy (if any) this echo replaces. Kept outside
    // setMessages so the state updater stays pure (see mergeMessage) and safe
    // under StrictMode's double-invocation of updaters.
    const tempId = isMine
      ? matchPendingMessage(
          pendingMessagesRef.current,
          conversationId,
          message.text,
          message.attachmentUrl,
        )
      : null;
    if (tempId) {
      pendingMessagesRef.current.delete(tempId);
    }

    setMessages((prev) => ({
      ...prev,
      [conversationId]: mergeMessage(
        prev[conversationId] || [],
        message,
        tempId,
      ),
    }));

    if (!tempId) {
      updateConversationPreview(
        conversationId,
        previewText(message.text, msgDoc.attachmentUrl),
        message.timestamp,
        !isMine && !isActive,
      );
    }

    if (!isMine && isActive) {
      markAllAsRead(conversationId);
      socketService.emitSeen(conversationId);
    }
  };

  const handleMessageSeen = ({
    conversationId,
  }: {
    conversationId: string;
    seenBy?: string;
  }) => {
    // Mark my own sent messages in that conversation as read.
    setMessages((prev) => {
      const list = prev[conversationId];
      if (!list) return prev;
      return {
        ...prev,
        [conversationId]: list.map((m) =>
          m.senderId === currentUserIdRef.current
            ? { ...m, status: "read" as const }
            : m,
        ),
      };
    });
  };

  const handleMessageRecalled = ({
    conversationId,
    messageId,
  }: {
    conversationId: string;
    messageId: string;
  }) => {
    setMessages((prev) => ({
      ...prev,
      [conversationId]: (prev[conversationId] || []).map((m) =>
        m.id === messageId
          ? {
              ...m,
              text: "Tin nhắn đã bị thu hồi",
              isRecalled: true,
              attachmentUrl: undefined,
              attachmentType: undefined,
            }
          : m,
      ),
    }));
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId
          ? { ...conv, lastMessageText: "Tin nhắn đã bị thu hồi" }
          : conv,
      ),
    );
  };

  const handleReactionUpdated = ({
    conversationId,
    messageId,
    reactions,
  }: {
    conversationId: string;
    messageId: string;
    reactions: Array<{ user: string; emoji: string }>;
  }) => {
    setMessages((prev) => ({
      ...prev,
      [conversationId]: (prev[conversationId] || []).map((message) =>
        message.id === messageId ? { ...message, reactions } : message,
      ),
    }));
  };

  const handleTyping = ({
    conversationId,
    isTyping: typingNow,
  }: {
    conversationId: string;
    isTyping: boolean;
  }) => {
    setIsTyping((prev) =>
      typingNow
        ? { ...prev, [conversationId]: true }
        : { ...prev, [conversationId]: false },
    );

    if (typingNow) {
      clearTimeout(typingTimeoutsRef.current[conversationId]);
      typingTimeoutsRef.current[conversationId] = setTimeout(() => {
        setIsTyping((prev) => ({ ...prev, [conversationId]: false }));
      }, 2000);
    }
  };

  const handleUserStatusChanged = ({
    userId,
    status,
  }: {
    userId: string;
    status: "online" | "offline";
  }) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.participantId === userId
          ? { ...conv, participantStatus: status }
          : conv,
      ),
    );
  };

  const handleConversationCreated = ({
    conversation,
  }: {
    conversation: any;
  }) => {
    const userId = currentUserIdRef.current;
    if (!userId) return;
    const created = transformConversation(conversation, userId);
    setConversations((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === created.id);
      if (existingIndex < 0) return [created, ...prev];
      return prev.map((item) => (item.id === created.id ? created : item));
    });
  };

  useEffect(() => {
    if (!currentUser) return;

    socketService.on("messageReceived", handleMessageReceived);
    socketService.on("messageSeen", handleMessageSeen);
    socketService.on("messageRecalled", handleMessageRecalled);
    socketService.on("messageReactionUpdated", handleReactionUpdated);
    socketService.on("typing", handleTyping);
    socketService.on("userStatusChanged", handleUserStatusChanged);
    socketService.on("conversationCreated", handleConversationCreated);

    return () => {
      socketService.off("messageReceived", handleMessageReceived);
      socketService.off("messageSeen", handleMessageSeen);
      socketService.off("messageRecalled", handleMessageRecalled);
      socketService.off("messageReactionUpdated", handleReactionUpdated);
      socketService.off("typing", handleTyping);
      socketService.off("userStatusChanged", handleUserStatusChanged);
      socketService.off("conversationCreated", handleConversationCreated);
    };
  }, [currentUser]);

  // ---------- Actions ----------

  const sendMessage = (
    text: string,
    attachmentUrl?: string,
    attachmentType?: "image" | "video",
    replyTo?: Message,
  ) => {
    const conversationId = activeConversationIdRef.current;
    const senderId = currentUserIdRef.current;
    if (!conversationId || !senderId || !currentUser) return;

    const tempId = generateTempId();
    const optimistic = createOptimisticMessage({
      id: tempId,
      conversationId,
      senderId,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      text,
      attachmentUrl,
      attachmentType,
      replyTo: replyTo
        ? {
            id: replyTo.id,
            text: replyTo.text,
            senderName: replyTo.senderName,
            isRecalled: replyTo.isRecalled,
          }
        : undefined,
    });

    pendingMessagesRef.current.set(tempId, {
      conversationId,
      text,
      attachmentUrl,
    });

    setMessages((prev) => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), optimistic],
    }));

    updateConversationPreview(
      conversationId,
      previewText(text, attachmentUrl),
      optimistic.timestamp,
      false,
    );

    const payload: SendMessagePayload = {
      conversationId,
      content: text,
      attachmentUrl,
      attachmentType,
      clientMessageId: tempId,
      replyTo: replyTo?.id,
    };
    socketService.sendMessage(payload).catch(() => {
      setMessages((prev) => ({
        ...prev,
        [conversationId]: (prev[conversationId] || []).map((message) =>
          message.id === tempId
            ? { ...message, status: "failed" as const }
            : message,
        ),
      }));
    });
  };

  const toggleReaction = (messageId: string, emoji: string) => {
    if (messageId.startsWith("temp-")) return;
    socketService.toggleReaction(messageId, emoji);
  };

  const retryMessage = (messageId: string) => {
    const conversationId = activeConversationIdRef.current;
    const message = messages[conversationId]?.find(
      (item) => item.id === messageId,
    );
    if (!message || message.status !== "failed") return;
    setMessages((prev) => ({
      ...prev,
      [conversationId]: (prev[conversationId] || []).map((item) =>
        item.id === messageId ? { ...item, status: "sending" as const } : item,
      ),
    }));
    socketService
      .sendMessage({
        conversationId,
        content: message.text,
        attachmentUrl: message.attachmentUrl,
        attachmentType: message.attachmentType,
        clientMessageId: messageId,
        replyTo: message.replyTo?.id,
      })
      .catch(() => {
        setMessages((prev) => ({
          ...prev,
          [conversationId]: (prev[conversationId] || []).map((item) =>
            item.id === messageId
              ? { ...item, status: "failed" as const }
              : item,
          ),
        }));
      });
  };

  const sendTypingStatus = (isTypingNow: boolean) => {
    const conversationId = activeConversationIdRef.current;
    if (!conversationId) return;

    if (isTypingNow) {
      if (!typingActiveRef.current) {
        socketService.emitTyping(conversationId, true);
        typingActiveRef.current = true;
      }
      if (typingDebounceRef.current) {
        clearTimeout(typingDebounceRef.current);
      }
      typingDebounceRef.current = setTimeout(() => {
        socketService.emitTyping(conversationId, false);
        typingActiveRef.current = false;
      }, 1500);
    } else {
      if (typingDebounceRef.current) {
        clearTimeout(typingDebounceRef.current);
      }
      if (typingActiveRef.current) {
        socketService.emitTyping(conversationId, false);
        typingActiveRef.current = false;
      }
    }
  };

  const recallMessage = async (messageId: string) => {
    const conversationId = activeConversationIdRef.current;
    try {
      await chatService.recallMessage(messageId);
      socketService.emitRecall(messageId);
      if (conversationId) {
        handleMessageRecalled({ conversationId, messageId });
      }
    } catch (err) {
      console.error("Error recalling message", err);
    }
  };

  const createConversation = async (participantId: string): Promise<string> => {
    try {
      const res = await chatService.createConversation([participantId], false);
      const newConv = transformConversation(res, currentUser!.id);
      setConversations((prev) => {
        if (prev.some((c) => c.id === newConv.id)) return prev;
        return [newConv, ...prev];
      });
      setActiveConversationId(newConv.id);
      return newConv.id;
    } catch (err) {
      console.error("Error creating conversation", err);
      throw err;
    }
  };

  const createGroupConversation = async (
    groupName: string,
    participantIds: string[],
  ): Promise<string> => {
    try {
      const res = await chatService.createConversation(
        participantIds,
        true,
        groupName,
      );
      const newConv = transformConversation(res, currentUser!.id);
      setConversations((prev) => {
        if (prev.some((c) => c.id === newConv.id)) return prev;
        return [newConv, ...prev];
      });
      setActiveConversationId(newConv.id);
      return newConv.id;
    } catch (err) {
      console.error("Error creating group conversation", err);
      throw err;
    }
  };

  const clearChat = () => {
    setConversations([]);
    setMessages({});
    setActiveConversationId("");
    setIsTyping({});
    setHasMoreMessages({});
    messagePagesRef.current = {};
  };

  return {
    conversations,
    setConversations,
    messages,
    setMessages,
    activeConversationId,
    setActiveConversationId,
    isTyping,
    hasMoreMessages,
    loadingOlderMessages,
    sendMessage,
    retryMessage,
    toggleReaction,
    recallMessage,
    sendTypingStatus,
    createConversation,
    createGroupConversation,
    loadOlderMessages,
    clearChat,
  };
}
