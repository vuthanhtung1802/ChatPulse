import { useEffect } from 'react';
import { User, Message, Conversation, Comment, Post } from '../types/types';
import { NotificationItem } from '../types/Notification';
import { transformMessage } from '../utils/transformers';

export interface ChatSocketSetters {
  setMessages: React.Dispatch<React.SetStateAction<Record<string, Message[]>>>;
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  setIsTyping: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setNotifications: React.Dispatch<React.SetStateAction<NotificationItem[]>>;
  setComments: React.Dispatch<React.SetStateAction<Record<string, Comment[]>>>;
  setCommentsTotal: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
}

export function useChatSocket(
  socket: WebSocket | null,
  currentUser: User | null,
  send: (event: string, data?: any) => void,
  setters: ChatSocketSetters,
  conversations: Conversation[],
  activeConversationId: string
) {
  const { setMessages, setConversations, setIsTyping, setNotifications, setComments, setCommentsTotal, setPosts } = setters;

  useEffect(() => {
    if (!socket || !currentUser) return;

    const handler = (e: MessageEvent) => {
      let msg: any;
      try {
        msg = JSON.parse(e.data);
      } catch {
        return;
      }

      const { event, data } = msg;

      switch (event) {
        case 'newMessage': {
          const transformed = transformMessage(data);
          const conversationId = data.conversation;
          setMessages((prev) => {
            const currentList = prev[conversationId] || [];
            if (currentList.some((m) => m.id === transformed.id)) return prev;
            return {
              ...prev,
              [conversationId]: [...currentList, transformed]
            };
          });
          setConversations((prev) => {
            return prev.map((conv) => {
              if (conv.id === conversationId) {
                const isSelf = transformed.senderId === currentUser.id;
                return {
                  ...conv,
                  lastMessageText: transformed.text || (transformed.attachmentUrl ? 'Gửi một file đính kèm' : ''),
                  lastMessageTime: transformed.timestamp,
                  lastMessageUnread: !isSelf && activeConversationId !== conversationId
                };
              }
              return conv;
            });
          });
          if (transformed.senderId !== currentUser.id && activeConversationId !== conversationId) {
            const newNotif: NotificationItem = {
              id: `notif-${Date.now()}`,
              title: `Tin nhắn mới từ ${transformed.senderName}`,
              description: transformed.text || 'Gửi một file đính kèm',
              time: transformed.timestamp,
              type: 'message',
              unread: true
            };
            setNotifications((prev) => [newNotif, ...prev]);
          }
          break;
        }

        case 'userTyping': {
          if (data.userId !== currentUser.id) {
            setIsTyping((prev) => ({ ...prev, [data.conversationId]: data.isTyping }));
          }
          break;
        }

        case 'conversationSeen': {
          if (data.userId !== currentUser.id) {
            setMessages((prev) => {
              const list = prev[data.conversationId] || [];
              const updated = list.map((m) => {
                if (m.senderId === currentUser.id && m.status !== 'read') {
                  return { ...m, status: 'read' as const };
                }
                return m;
              });
              return { ...prev, [data.conversationId]: updated };
            });
          }
          break;
        }

        case 'messageRecalled': {
          setMessages((prev) => {
            const list = prev[data.conversationId] || [];
            const updated = list.map((m) => {
              if (m.id === data.messageId) {
                return {
                  ...m,
                  text: 'Tin nhắn đã bị thu hồi',
                  attachmentUrl: undefined,
                  attachmentType: undefined,
                  status: undefined
                };
              }
              return m;
            });
            return { ...prev, [data.conversationId]: updated };
          });
          setConversations((prev) => {
            return prev.map((conv) => {
              if (conv.id === data.conversationId) {
                return { ...conv, lastMessageText: 'Tin nhắn đã bị thu hồi' };
              }
              return conv;
            });
          });
          break;
        }

        case 'userStatusChanged': {
          setConversations((prev) => {
            return prev.map((conv) => {
              if (conv.participantId === data.userId) {
                return { ...conv, participantStatus: data.status };
              }
              return conv;
            });
          });
          break;
        }

        case 'newComment': {
          setComments((prev) => {
            const list = prev[data.post] || [];
            if (list.some((c) => c._id === data._id)) return prev;
            return { ...prev, [data.post]: [data, ...list] };
          });
          setCommentsTotal((prev) => ({
            ...prev,
            [data.post]: (prev[data.post] || 0) + 1,
          }));
          setPosts((prev) =>
            prev.map((p) =>
              p._id === data.post ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p
            )
          );
          break;
        }

        case 'deleteComment': {
          setComments((prev) => {
            const list = prev[data.postId] || [];
            return { ...prev, [data.postId]: list.filter((c) => c._id !== data.commentId) };
          });
          setCommentsTotal((prev) => ({
            ...prev,
            [data.postId]: Math.max(0, (prev[data.postId] || 0) - 1),
          }));
          break;
        }
      }
    };

    socket.addEventListener('message', handler);

    conversations.forEach((conv) => {
      send('joinConversation', { conversationId: conv.id });
    });

    return () => {
      socket.removeEventListener('message', handler);
    };
  }, [socket, currentUser, conversations.length, activeConversationId]);
}
