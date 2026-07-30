import { useState, useEffect } from 'react';
import { Conversation, Message, User } from '../types/types';
import { chatService } from '../services/chat.service';
import { transformConversation, transformMessage } from '../utils/transformers';

export function useChatState(currentUser: User | null) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [activeConversationId, setActiveConversationId] = useState<string>('');

  useEffect(() => {
    if (!activeConversationId || !currentUser) return;

    const loadMessages = async () => {
      try {
        const res = await chatService.getMessages(activeConversationId);
        const transformed = res.map(transformMessage);
        setMessages((prev) => ({
          ...prev,
          [activeConversationId]: transformed
        }));
      } catch (err) {
        console.error('Error fetching messages', err);
      }
    };

    loadMessages();

    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === activeConversationId) {
          return { ...conv, lastMessageUnread: false };
        }
        return conv;
      })
    );
  }, [activeConversationId, currentUser]);

  const sendMessage = (_text: string, _attachmentUrl?: string, _attachmentType?: 'image' | 'video') => {
    console.warn('WebSocket removed — cannot send message');
  };

  const recallMessage = async (_messageId: string) => {
    console.warn('WebSocket removed — cannot recall message');
  };

  const sendTypingStatus = (_typing: boolean) => {
    console.warn('WebSocket removed — typing indicator disabled');
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

  const createGroupConversation = async (groupName: string, participantIds: string[]): Promise<string> => {
    try {
      const res = await chatService.createConversation(participantIds, true, groupName);
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
  };

  return {
    conversations, setConversations,
    messages, setMessages,
    activeConversationId, setActiveConversationId,
    sendMessage, recallMessage, sendTypingStatus,
    createConversation, createGroupConversation,
    clearChat
  };
}
