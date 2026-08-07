import React, { createContext, useContext, useEffect } from 'react';
import { Conversation, Message } from '../../types/types';
import { useChatState } from './useChat';
import { chatService } from './services/chat.service';
import { socketService } from './services/socket.service';
import { tokenStorage } from '../../lib/api/client';
import { transformConversation } from '../../utils/transformers';
import { useAuth } from '../auth/AuthContext';

interface ChatContextValue {
  conversations: Conversation[];
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  messages: Record<string, Message[]>;
  setMessages: React.Dispatch<React.SetStateAction<Record<string, Message[]>>>;
  activeConversationId: string;
  setActiveConversationId: React.Dispatch<React.SetStateAction<string>>;
  isTyping: Record<string, boolean>;
  sendMessage: (
    text: string,
    attachmentUrl?: string,
    attachmentType?: 'image' | 'video',
  ) => void;
  recallMessage: (messageId: string) => Promise<void>;
  sendTypingStatus: (isTyping: boolean) => void;
  createConversation: (participantId: string) => Promise<string>;
  createGroupConversation: (
    groupName: string,
    participantIds: string[],
  ) => Promise<string>;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { currentUser } = useAuth();

  const {
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
  } = useChatState(currentUser);

  // Open/close the realtime socket connection based on auth state.
  const userId = currentUser?.id;
  useEffect(() => {
    const token = tokenStorage.getAccessToken();
    if (userId && token) {
      socketService.connect(token);
    } else {
      socketService.disconnect();
    }
    return () => {
      socketService.disconnect();
    };
  }, [userId]);

  // Load conversations once a session is restored / user logs in.
  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;
    (async () => {
      try {
        const convsRes = await chatService.getConversations();
        if (cancelled) return;
        const convs = (
          Array.isArray(convsRes) ? convsRes : convsRes.conversations || []
        ).map((c: any) => transformConversation(c, currentUser.id));
        setConversations((prev) => (prev.length > 0 ? prev : convs));
        setActiveConversationId((prev) =>
          prev || (convs.length > 0 ? convs[0].id : ''),
        );
      } catch (err) {
        console.error('Failed to load conversations', err);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Reset chat state on logout.
  useEffect(() => {
    if (!currentUser) {
      clearChat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  return (
    <ChatContext.Provider
      value={{
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
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};