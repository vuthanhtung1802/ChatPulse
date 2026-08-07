import { useState, useEffect, useRef } from 'react';
import { Conversation, Message, User } from '../../types/types';
import { chatService } from './services/chat.service';
import { socketService, SendMessagePayload } from './services/socket.service';
import { transformConversation, transformMessage } from '../../utils/transformers';
import {
  createOptimisticMessage,
  generateTempId,
  matchPendingMessage,
  mergeMessage,
  previewText,
  PendingMessage,
} from './utils/chatMessages';

export function useChatState(currentUser: User | null) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [activeConversationId, setActiveConversationId] = useState<string>('');
  const [isTyping, setIsTyping] = useState<Record<string, boolean>>({});

  const currentUserIdRef = useRef<string | null>(null);
  currentUserIdRef.current = currentUser?.id ?? null;

  const activeConversationIdRef = useRef<string>('');
  activeConversationIdRef.current = activeConversationId;

  // Tracks optimistic messages awaiting the server echo.
  const pendingMessagesRef = useRef<Map<string, PendingMessage>>(new Map());

  const typingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingActiveRef = useRef(false);
  const typingTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const loadMessages = async (conversationId: string) => {
    try {
      const res = await chatService.getMessages(conversationId);
      const transformed = res.map(transformMessage);
      setMessages((prev) => ({
        ...prev,
        [conversationId]: transformed,
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
      console.error('Error fetching messages', err);
    }
  };

  useEffect(() => {
    if (!activeConversationId || !currentUser) return;

    loadMessages(activeConversationId);
    socketService.joinConversation(activeConversationId);

    return () => {
      socketService.leaveConversation(activeConversationId);
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
            ? { ...m, status: 'read' as const }
            : m,
        ),
      };
    });
  };

  // ---------- Socket event handlers ----------

  const handleMessageReceived = (msgDoc: any) => {
    const conversationId = msgDoc?.conversationId?.toString?.() ?? msgDoc?.conversationId;
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
            ? { ...m, status: 'read' as const }
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
              text: 'Tin nhắn đã bị thu hồi',
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
          ? { ...conv, lastMessageText: 'Tin nhắn đã bị thu hồi' }
          : conv,
      ),
    );
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
    status: 'online' | 'offline';
  }) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.participantId === userId
          ? { ...conv, participantStatus: status }
          : conv,
      ),
    );
  };

  useEffect(() => {
    if (!currentUser) return;

    socketService.on('messageReceived', handleMessageReceived);
    socketService.on('messageSeen', handleMessageSeen);
    socketService.on('messageRecalled', handleMessageRecalled);
    socketService.on('typing', handleTyping);
    socketService.on('userStatusChanged', handleUserStatusChanged);

    return () => {
      socketService.off('messageReceived', handleMessageReceived);
      socketService.off('messageSeen', handleMessageSeen);
      socketService.off('messageRecalled', handleMessageRecalled);
      socketService.off('typing', handleTyping);
      socketService.off('userStatusChanged', handleUserStatusChanged);
    };
  }, [currentUser]);

  // ---------- Actions ----------

  const sendMessage = (
    text: string,
    attachmentUrl?: string,
    attachmentType?: 'image' | 'video',
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
    };
    socketService.sendMessage(payload);
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
      console.error('Error recalling message', err);
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
      console.error('Error creating conversation', err);
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
      console.error('Error creating group conversation', err);
      throw err;
    }
  };

  const clearChat = () => {
    setConversations([]);
    setMessages({});
    setActiveConversationId('');
    setIsTyping({});
  };

  return {
    conversations,
    setConversations,
    messages,
    setMessages,
    activeConversationId,
    setActiveConversationId,
    isTyping,
    sendMessage,
    recallMessage,
    sendTypingStatus,
    createConversation,
    createGroupConversation,
    clearChat,
  };
}