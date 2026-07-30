import React, { createContext, useContext, useEffect } from 'react';
import { User, Conversation, Message, Post, Comment } from '../types/types';
import { NotificationItem } from '../types/Notification';
import { authService } from '../services/auth.service';
import { userService } from '../services/user.service';
import { chatService } from '../services/chat.service';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuthState } from '../hooks/useAuth';
import { useChatState } from '../hooks/useChat';
import { usePostsState } from '../hooks/usePosts';
import { useCommentsState } from '../hooks/useComments';
import { useThemeState } from '../hooks/useTheme';
import { useNotificationsState } from '../hooks/useNotifications';
import { useChatSocket } from '../hooks/useChatSocket';
import { useAuthActions } from './AuthContext';
import { transformUser, transformConversation } from '../utils/transformers';
export { getInitialsAvatar, AVATAR_COLORS } from '../utils/avatarUtils';

interface AppContextType {
  currentUser: User | null;
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  posts: Post[];
  notifications: NotificationItem[];
  theme: 'light' | 'dark';
  activeConversationId: string;
  isTyping: Record<string, boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
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

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, setCurrentUser } = useAuthState();
  const accessToken = sessionStorage.getItem('chatpulse_accessToken');
  const { socket, send } = useWebSocket(currentUser ? accessToken : null);
  const { theme, toggleTheme } = useThemeState();
  const { notifications, setNotifications, markNotificationsAsRead } = useNotificationsState();
  const chatCtx = useChatState(currentUser, send, socket);
  const postsCtx = usePostsState(currentUser);
  const commentsCtx = useCommentsState(currentUser);

  useEffect(() => {
    const initialize = async () => {
      const token = sessionStorage.getItem('chatpulse_accessToken');
      if (token && !currentUser) {
        try {
          const userRes = await authService.getCurrentUser();
          const user = transformUser(userRes);
          setCurrentUser(user);

          const convsRes = await chatService.getConversations();
          const convs = convsRes.map((c: any) => transformConversation(c, user.id));
          chatCtx.setConversations(convs);

          if (convs.length > 0) {
            chatCtx.setActiveConversationId(convs[0].id);
          }
        } catch (err) {
          console.error('Initialization failed', err);
        }
      }
    };
    initialize();
  }, []);

  useChatSocket(
    socket, currentUser, send,
    {
      setMessages: chatCtx.setMessages,
      setConversations: chatCtx.setConversations,
      setIsTyping: chatCtx.setIsTyping,
      setNotifications,
      setComments: commentsCtx.setComments,
      setCommentsTotal: commentsCtx.setCommentsTotal,
      setPosts: postsCtx.setPosts,
    },
    chatCtx.conversations,
    chatCtx.activeConversationId
  );
  const { login, signup, logout } = useAuthActions(setCurrentUser, chatCtx, socket);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('auth-unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth-unauthorized', handleUnauthorized);
    };
  }, [socket]);

  const updateProfile = async (updatedData: Partial<User>) => {
    try {
      const response = await userService.updateProfile(updatedData);
      setCurrentUser(transformUser(response.user));
    } catch (err) {
      console.error('Error updating profile', err);
      throw err;
    }
  };

  const joinPostRoom = (postId: string) => {
    send('joinPost', { postId });
  };

  const leavePostRoom = (postId: string) => {
    send('leavePost', { postId });
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        conversations: chatCtx.conversations,
        messages: chatCtx.messages,
        posts: postsCtx.posts,
        postsLoading: postsCtx.postsLoading,
        savedPosts: postsCtx.savedPosts,
        savedPostsLoading: postsCtx.savedPostsLoading,
        notifications,
        theme,
        activeConversationId: chatCtx.activeConversationId,
        isTyping: chatCtx.isTyping,
        login,
        signup,
        logout,
        toggleTheme,
        setActiveConversationId: chatCtx.setActiveConversationId,
        sendMessage: chatCtx.sendMessage,
        recallMessage: chatCtx.recallMessage,
        sendTypingStatus: chatCtx.sendTypingStatus,
        updateProfile,
        createConversation: chatCtx.createConversation,
        createGroupConversation: chatCtx.createGroupConversation,
        toggleLikePost: postsCtx.toggleLikePost,
        toggleSavePost: postsCtx.toggleSavePost,
        hidePost: postsCtx.hidePost,
        createPost: postsCtx.createPost,
        fetchSavedPosts: postsCtx.fetchSavedPosts,
        comments: commentsCtx.comments,
        commentsTotal: commentsCtx.commentsTotal,
        fetchComments: commentsCtx.fetchComments,
        createComment: commentsCtx.createComment,
        deleteComment: commentsCtx.deleteComment,
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
