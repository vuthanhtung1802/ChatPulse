import { Dispatch, SetStateAction, useEffect } from "react";
import { ApiConversation } from "../../types/Api";
import { Conversation, User } from "../../types/types";
import { tokenStorage } from "../../lib/api/client";
import { transformConversation } from "../../utils/transformers";
import { chatService } from "./services/chat.service";
import { socketService } from "./services/socket.service";

interface ChatSessionOptions {
  currentUser: User | null;
  setConversations: Dispatch<SetStateAction<Conversation[]>>;
  setActiveConversationId: Dispatch<SetStateAction<string>>;
  clearChat: () => void;
}

export function useChatSession({
  currentUser,
  setConversations,
  setActiveConversationId,
  clearChat,
}: ChatSessionOptions): void {
  const userId = currentUser?.id;

  useEffect(() => {
    const token = tokenStorage.getAccessToken();
    if (userId && token) {
      socketService.connect(token);
    } else {
      socketService.disconnect();
    }
    return () => socketService.disconnect();
  }, [userId]);

  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;

    async function loadConversations() {
      try {
        const response = await chatService.getConversations();
        if (cancelled) return;
        const conversations = (response as ApiConversation[]).map(
          (conversation) => transformConversation(conversation, currentUser.id),
        );
        setConversations((current) =>
          current.length > 0 ? current : conversations,
        );
        setActiveConversationId(
          (current) => current || conversations[0]?.id || "",
        );
      } catch (error) {
        console.error("Failed to load conversations", error);
      }
    }

    void loadConversations();
    return () => {
      cancelled = true;
    };
  }, [currentUser, setActiveConversationId, setConversations]);

  useEffect(() => {
    if (!currentUser) clearChat();
  }, [currentUser, clearChat]);
}
