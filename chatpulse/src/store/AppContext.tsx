import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Conversation, Message, Post, Comment } from '../types';
import { authService, userService, chatService, postService, commentService } from '../services/api';
import { io, Socket } from 'socket.io-client';

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'message' | 'system' | 'like' | 'mention';
  unread: boolean;
}

interface AppContextType {
  currentUser: User | null;
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  posts: Post[];
  notifications: NotificationItem[];
  theme: 'light' | 'dark';
  activeConversationId: string;
  isTyping: Record<string, boolean>;
  login: (email: string, password?: string) => Promise<boolean>;
  signup: (name: string, email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  toggleTheme: () => void;
  setActiveConversationId: (id: string) => void;
  sendMessage: (text: string, attachmentUrl?: string, attachmentType?: 'image' | 'video') => void;
  recallMessage: (messageId: string) => Promise<void>;
  sendTypingStatus: (isTyping: boolean) => void;
  updateProfile: (updatedData: Partial<User>) => Promise<void>;
  createConversation: (participantId: string) => Promise<string>;
  createGroupConversation: (groupName: string, participantIds: string[]) => Promise<string>;
  postsLoading: boolean;
  savedPosts: Post[];
  savedPostsLoading: boolean;
  toggleLikePost: (postId: string) => Promise<void>;
  toggleSavePost: (postId: string) => Promise<void>;
  hidePost: (postId: string) => Promise<void>;
  createPost: (content: string, images?: string[], mood?: string) => Promise<void>;
  fetchSavedPosts: () => Promise<void>;
  comments: Record<string, Comment[]>;
  commentsTotal: Record<string, number>;
  fetchComments: (postId: string, page?: number) => Promise<void>;
  createComment: (postId: string, content: string) => Promise<void>;
  deleteComment: (postId: string, commentId: string) => Promise<void>;
  joinPostRoom: (postId: string) => void;
  leavePostRoom: (postId: string) => void;
  markNotificationsAsRead: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const transformUser = (u: any): User => {
  if (!u) return {} as User;
  return {
    id: u._id || u.id,
    name: u.name || '',
    email: u.email || '',
    avatar: u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150',
    plan: u.role === 'admin' ? 'Enterprise Plan' : 'Free Plan',
    status: u.status || 'offline',
    bio: u.bio || '',
    location: u.location || '',
    joinDate: u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'August 2022',
    website: u.website || '',
    interests: u.interests || [],
    photoGallery: u.photoGallery || []
  };
};

const transformConversation = (c: any, currentUserId: string): Conversation => {
  if (c.isGroup) {
    const lastMsgText = c.lastMessage?.isRecalled 
      ? 'Tin nhắn đã bị thu hồi' 
      : (c.lastMessage?.content || (c.lastMessage?.attachmentUrl ? 'Gửi một file đính kèm' : 'Chưa có tin nhắn'));
    const lastMsgTime = c.lastMessage 
      ? new Date(c.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      : '';
    return {
      id: c._id,
      participantName: c.groupName || 'Nhóm chat',
      participantAvatar: '',
      participantStatus: 'online',
      lastMessageText: lastMsgText,
      lastMessageTime: lastMsgTime,
      lastMessageUnread: false,
      isGroup: true,
      groupInitials: (c.groupName || 'GP').substring(0, 2).toUpperCase()
    };
  } else {
    const otherParticipant = c.participants?.find((p: any) => (p._id || p) !== currentUserId) || c.participants?.[0] || {};
    const lastMsgText = c.lastMessage?.isRecalled 
      ? 'Tin nhắn đã bị thu hồi' 
      : (c.lastMessage?.content || (c.lastMessage?.attachmentUrl ? 'Gửi một file đính kèm' : 'Chưa có tin nhắn'));
    const lastMsgTime = c.lastMessage 
      ? new Date(c.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      : '';
    return {
      id: c._id,
      participantId: otherParticipant._id || otherParticipant,
      participantName: otherParticipant.name || 'Người dùng ChatPulse',
      participantAvatar: otherParticipant.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150',
      participantStatus: otherParticipant.status || 'offline',
      lastMessageText: lastMsgText,
      lastMessageTime: lastMsgTime,
      lastMessageUnread: false
    };
  }
};

const transformMessage = (msg: any): Message => {
  const senderId = msg.sender?._id || msg.sender;
  return {
    id: msg._id,
    text: msg.isRecalled ? 'Tin nhắn đã bị thu hồi' : (msg.content || ''),
    senderId: senderId,
    senderName: msg.sender?.name || '',
    senderAvatar: msg.sender?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150',
    timestamp: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: msg.isRecalled ? undefined : (msg.status || 'sent'),
    attachmentUrl: msg.isRecalled ? undefined : msg.attachmentUrl,
    attachmentType: msg.isRecalled ? undefined : msg.attachmentType
  };
};



export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [savedPostsLoading, setSavedPostsLoading] = useState(false);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [commentsTotal, setCommentsTotal] = useState<Record<string, number>>({});
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [activeConversationId, setActiveConversationId] = useState<string>('');
  const [isTyping, setIsTyping] = useState<Record<string, boolean>>({});
  const [socket, setSocket] = useState<Socket | null>(null);

  // Toggle Theme
  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Sync state and connect socket on mount
  useEffect(() => {
    const initialize = async () => {
      const token = sessionStorage.getItem('chatpulse_accessToken');
      if (token) {
        try {
          const userRes = await authService.getCurrentUser();
          const user = transformUser(userRes);
          setCurrentUser(user);

          const convsRes = await chatService.getConversations();
          const convs = convsRes.map((c: any) => transformConversation(c, user.id));
          setConversations(convs);

          if (convs.length > 0) {
            setActiveConversationId(convs[0].id);
          }
        } catch (err) {
          console.error('Initialization failed', err);
        }
      }
    };
    initialize();
  }, []);

  // Fetch posts when currentUser changes
  useEffect(() => {
    if (!currentUser) return;
    const fetchPosts = async () => {
      setPostsLoading(true);
      try {
        const data = await postService.getPosts();
        setPosts(data.posts || []);
      } catch (err) {
        console.error('Error fetching posts', err);
      } finally {
        setPostsLoading(false);
      }
    };
    fetchPosts();
  }, [currentUser]);

  // Connect Socket.IO client when currentUser is set
  useEffect(() => {
    const token = sessionStorage.getItem('chatpulse_accessToken');
    if (currentUser && token) {
      const newSocket = io('http://localhost:3000', {
        auth: { token }
      });

      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('Socket connected successfully');
      });

      return () => {
        newSocket.disconnect();
        setSocket(null);
      };
    }
  }, [currentUser]);

  // Set up socket listeners
  useEffect(() => {
    if (!socket || !currentUser) return;

    socket.on('newMessage', (msg: any) => {
      const transformed = transformMessage(msg);
      const conversationId = msg.conversation;

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

      // Show notification if message is from someone else
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
    });

    socket.on('userTyping', (data: { conversationId: string; userId: string; isTyping: boolean }) => {
      if (data.userId !== currentUser.id) {
        setIsTyping((prev) => ({
          ...prev,
          [data.conversationId]: data.isTyping
        }));
      }
    });

    socket.on('conversationSeen', (data: { conversationId: string; userId: string }) => {
      if (data.userId !== currentUser.id) {
        setMessages((prev) => {
          const list = prev[data.conversationId] || [];
          const updated = list.map((m) => {
            if (m.senderId === currentUser.id && m.status !== 'read') {
              return { ...m, status: 'read' as const };
            }
            return m;
          });
          return {
            ...prev,
            [data.conversationId]: updated
          };
        });
      }
    });

    socket.on('messageRecalled', (data: { messageId: string; conversationId: string }) => {
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
        return {
          ...prev,
          [data.conversationId]: updated
        };
      });

      setConversations((prev) => {
        return prev.map((conv) => {
          if (conv.id === data.conversationId) {
            return {
              ...conv,
              lastMessageText: 'Tin nhắn đã bị thu hồi'
            };
          }
          return conv;
        });
      });
    });

    socket.on('userStatusChanged', (data: { userId: string; status: 'online' | 'offline' }) => {
      setConversations((prev) => {
        return prev.map((conv) => {
          if (conv.participantId === data.userId) {
            return {
              ...conv,
              participantStatus: data.status
            };
          }
          return conv;
        });
      });
    });

    socket.on('newComment', (comment: any) => {
      setComments((prev) => {
        const list = prev[comment.post] || [];
        if (list.some((c) => c._id === comment._id)) return prev;
        return { ...prev, [comment.post]: [comment, ...list] };
      });
      setCommentsTotal((prev) => ({
        ...prev,
        [comment.post]: (prev[comment.post] || 0) + 1,
      }));
      setPosts((prev) =>
        prev.map((p) =>
          p._id === comment.post ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p
        )
      );
    });

    socket.on('deleteComment', (data: { postId: string; commentId: string }) => {
      setComments((prev) => {
        const list = prev[data.postId] || [];
        return { ...prev, [data.postId]: list.filter((c) => c._id !== data.commentId) };
      });
      setCommentsTotal((prev) => ({
        ...prev,
        [data.postId]: Math.max(0, (prev[data.postId] || 0) - 1),
      }));
    });

    // Automatically join all current conversation socket rooms
    conversations.forEach((conv) => {
      socket.emit('joinConversation', { conversationId: conv.id });
    });

    return () => {
      socket.off('newMessage');
      socket.off('userTyping');
      socket.off('conversationSeen');
      socket.off('messageRecalled');
      socket.off('userStatusChanged');
      socket.off('newComment');
      socket.off('deleteComment');
    };
  }, [socket, currentUser, conversations.length, activeConversationId]);

  // Load messages and emit seen event when activeConversationId changes
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
      socket.emit('joinConversation', { conversationId: activeConversationId });
      socket.emit('seenConversation', { conversationId: activeConversationId });

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

  // Login action
  const login = async (email: string, password?: string) => {
    try {
      const p = password || 'password123';
      const data = await authService.login(email, p);
      sessionStorage.setItem('chatpulse_accessToken', data.accessToken);
      sessionStorage.setItem('chatpulse_refreshToken', data.refreshToken);

      const userRes = await authService.getCurrentUser();
      const user = transformUser(userRes);
      setCurrentUser(user);

      const convsRes = await chatService.getConversations();
      const convs = convsRes.map((c: any) => transformConversation(c, user.id));
      setConversations(convs);

      if (convs.length > 0) {
        setActiveConversationId(convs[0].id);
      }
      return true;
    } catch (err) {
      console.error('Login failed', err);
      return false;
    }
  };

  // Signup action
  const signup = async (name: string, email: string, password?: string) => {
    try {
      const p = password || 'password123';
      await authService.register(name, email, p);
      return await login(email, p);
    } catch (err) {
      console.error('Signup failed', err);
      return false;
    }
  };

  // Logout action
  const logout = () => {
    authService.logout();
    setCurrentUser(null);
    setConversations([]);
    setMessages({});
    setActiveConversationId('');
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  };

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('auth-unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth-unauthorized', handleUnauthorized);
    };
  }, [socket]);

  // Send Message action
  const sendMessage = (text: string, attachmentUrl?: string, attachmentType?: 'image' | 'video') => {
    if (!currentUser || !activeConversationId || !socket) return;

    socket.emit('sendMessage', {
      conversationId: activeConversationId,
      content: text,
      attachmentUrl,
      attachmentType
    });
  };

  // Recall Message action
  const recallMessage = async (messageId: string) => {
    if (!currentUser || !activeConversationId || !socket) return;

    socket.emit('recallMessage', {
      messageId,
      conversationId: activeConversationId
    });
  };

  // Send Typing Status action
  const sendTypingStatus = (typing: boolean) => {
    if (!currentUser || !activeConversationId || !socket) return;
    socket.emit('typing', {
      conversationId: activeConversationId,
      isTyping: typing
    });
  };

  // Update Profile action
  const updateProfile = async (updatedData: Partial<User>) => {
    try {
      // In NestJS, we can update profile data
      const response = await userService.updateProfile(updatedData);
      setCurrentUser(transformUser(response));
    } catch (err) {
      console.error('Error updating profile', err);
      throw err;
    }
  };

  // Create Conversation action
  const createConversation = async (participantId: string): Promise<string> => {
    try {
      const res = await chatService.createConversation([participantId], false);
      const newConv = transformConversation(res, currentUser!.id);
      setConversations((prev) => {
        if (prev.some((c) => c.id === newConv.id)) return prev;
        return [newConv, ...prev];
      });
      setActiveConversationId(newConv.id);
      if (socket) {
        socket.emit('joinConversation', { conversationId: newConv.id });
      }
      return newConv.id;
    } catch (err) {
      console.error('Error creating conversation', err);
      throw err;
    }
  };

  // Create Group Conversation action
  const createGroupConversation = async (groupName: string, participantIds: string[]): Promise<string> => {
    try {
      const res = await chatService.createConversation(participantIds, true, groupName);
      const newConv = transformConversation(res, currentUser!.id);
      setConversations((prev) => {
        if (prev.some((c) => c.id === newConv.id)) return prev;
        return [newConv, ...prev];
      });
      setActiveConversationId(newConv.id);
      if (socket) {
        socket.emit('joinConversation', { conversationId: newConv.id });
      }
      return newConv.id;
    } catch (err) {
      console.error('Error creating group conversation', err);
      throw err;
    }
  };

  const toggleLikePost = async (postId: string) => {
    try {
      const data = await postService.toggleLikePost(postId);
      if (data.post) {
        setPosts((prev) =>
          prev.map((p) =>
            p._id === postId ? { ...p, ...data.post } : p
          )
        );
        setSavedPosts((prev) =>
          prev.map((p) =>
            p._id === postId ? { ...p, ...data.post } : p
          )
        );
      }
    } catch (err) {
      console.error('Error toggling like', err);
    }
  };

  const toggleSavePost = async (postId: string) => {
    try {
      const data = await postService.toggleSavePost(postId);
      if (data.post) {
        setPosts((prev) =>
          prev.map((p) =>
            p._id === postId ? { ...p, ...data.post } : p
          )
        );
        setSavedPosts((prev) => {
          const updated = prev.map((p) =>
            p._id === postId ? { ...p, ...data.post } : p
          );
          if (data.post.savedByMe) {
            const exists = prev.some((p) => p._id === postId);
            if (!exists) {
              const source = posts.find((p) => p._id === postId);
              if (source) return [...updated, { ...source, ...data.post }];
            }
          }
          return updated.filter((p) => p.savedByMe !== false);
        });
      }
    } catch (err) {
      console.error('Error toggling save', err);
    }
  };

  const hidePost = async (postId: string) => {
    try {
      await postService.deletePost(postId);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
      setSavedPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch (err) {
      console.error('Error hiding post', err);
    }
  };

  const fetchComments = async (postId: string, page = 1) => {
    try {
      const data = await commentService.getComments(postId, page);
      if (page === 1) {
        setComments((prev) => ({ ...prev, [postId]: data.comments || [] }));
      } else {
        setComments((prev) => ({
          ...prev,
          [postId]: [...(prev[postId] || []), ...(data.comments || [])],
        }));
      }
      setCommentsTotal((prev) => ({ ...prev, [postId]: data.total || 0 }));
    } catch (err) {
      console.error('Error fetching comments', err);
    }
  };

  const createComment = async (postId: string, content: string) => {
    if (!currentUser || !socket) return;
    try {
      await commentService.createComment(postId, content);
      setCommentsTotal((prev) => ({
        ...prev,
        [postId]: (prev[postId] || 0) + 1,
      }));
    } catch (err) {
      console.error('Error creating comment', err);
    }
  };

  const deleteComment = async (postId: string, commentId: string) => {
    try {
      await commentService.deleteComment(postId, commentId);
      setComments((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).filter((c) => c._id !== commentId),
      }));
      setCommentsTotal((prev) => ({
        ...prev,
        [postId]: Math.max(0, (prev[postId] || 0) - 1),
      }));
    } catch (err) {
      console.error('Error deleting comment', err);
    }
  };

  const joinPostRoom = (postId: string) => {
    if (socket) {
      socket.emit('joinPost', { postId });
    }
  };

  const leavePostRoom = (postId: string) => {
    if (socket) {
      socket.emit('leavePost', { postId });
    }
  };

  const fetchSavedPosts = async () => {
    setSavedPostsLoading(true);
    try {
      const data = await postService.getSavedPosts();
      setSavedPosts(data.posts || []);
    } catch (err) {
      console.error('Error fetching saved posts', err);
    } finally {
      setSavedPostsLoading(false);
    }
  };

  const createPost = async (content: string, images?: string[], mood?: string) => {
    if (!currentUser) return;
    try {
      const data = await postService.createPost(content, images, mood);
      if (data.post) {
        setPosts((prev) => [data.post, ...prev]);
      }
    } catch (err) {
      console.error('Error creating post', err);
    }
  };

  const markNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        conversations,
        messages,
        posts,
        postsLoading,
        savedPosts,
        savedPostsLoading,
        notifications,
        theme,
        activeConversationId,
        isTyping,
        login,
        signup,
        logout,
        toggleTheme,
        setActiveConversationId,
        sendMessage,
        recallMessage,
        sendTypingStatus,
        updateProfile,
        createConversation,
        createGroupConversation,
        toggleLikePost,
        toggleSavePost,
        hidePost,
        createPost,
        fetchSavedPosts,
        comments,
        commentsTotal,
        fetchComments,
        createComment,
        deleteComment,
        joinPostRoom,
        leavePostRoom,
        markNotificationsAsRead
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};