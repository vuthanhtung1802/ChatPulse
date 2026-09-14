import React, { createContext, useContext } from "react";
import { Conversation, Message } from "../../types/types";
import { useChatState } from "./useChat";
import { useAuth } from "../auth/AuthContext";
import { useChatSession } from "./useChatSession";

interface ChatContextValue {
  conversations: Conversation[];
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  messages: Record<string, Message[]>;
  setMessages: React.Dispatch<React.SetStateAction<Record<string, Message[]>>>;
  activeConversationId: string;
  setActiveConversationId: React.Dispatch<React.SetStateAction<string>>;
  isTyping: Record<string, boolean>;
  hasMoreMessages: Record<string, boolean>;
  loadingOlderMessages: boolean;
  sendMessage: (
    text: string,
    attachmentUrl?: string,
    attachmentType?: "image" | "video",
    replyTo?: Message,
  ) => void;
  retryMessage: (messageId: string) => void;
  toggleReaction: (messageId: string, emoji: string) => void;
  recallMessage: (messageId: string) => Promise<void>;
  sendTypingStatus: (isTyping: boolean) => void;
  createConversation: (participantId: string) => Promise<string>;
  createGroupConversation: (
    groupName: string,
    participantIds: string[],
  ) => Promise<string>;
  loadOlderMessages: () => Promise<void>;
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
  } = useChatState(currentUser);

  useChatSession({
    currentUser,
    setConversations,
    setActiveConversationId,
    clearChat,
  });

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
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
