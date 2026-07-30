import { useState, useEffect } from 'react';
import { Conversation, Message, User } from '../types/types';
import { chatService } from '../services/chat.service';
import { transformConversation, transformMessage } from '../utils/transformers';

export function useChatState(currentUser: User | null, send: (event: string, data?: any) => void, socket: WebSocket | null) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [activeConversationId, setActiveConversationId] = useState<string>('');
  const [isTyping, setIsTyping] = useState<Record<string, boolean>>({});

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

    if (socket) {
      send('joinConversation', { conversationId: activeConversationId });
      send('seenConversation', { conversationId: activeConversationId });

      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id === activeConversationId) {
            return { ...conv, lastMessageUnread: false };
          }
          return conv;
        })
      );
    }
  }, [activeConversationId, socket, currentUser]);

  const sendMessage = (text: string, attachmentUrl?: string, attachmentType?: 'image' | 'video') => {
    if (!currentUser || !activeConversationId) return;
    send('sendMessage', {
      conversationId: activeConversationId,
      content: text,
      attachmentUrl,
      attachmentType
    });
  };

  const recallMessage = async (messageId: string) => {
    if (!currentUser || !activeConversationId) return;
    send('recallMessage', {
      messageId,
      conversationId: activeConversationId
    });
  };

  const sendTypingStatus = (typing: boolean) => {
    if (!currentUser || !activeConversationId) return;
    send('typing', {
      conversationId: activeConversationId,
      isTyping: typing
    });
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
      send('joinConversation', { conversationId: newConv.id });
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
      send('joinConversation', { conversationId: newConv.id });
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
    isTyping, setIsTyping,
    sendMessage, recallMessage, sendTypingStatus,
    createConversation, createGroupConversation,
    clearChat
  };
}
