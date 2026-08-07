import React from 'react';
import { ThemeProvider } from '../features/theme/ThemeContext';
import { AuthProvider } from '../features/auth/AuthContext';
import { ChatProvider } from '../features/chat/ChatContext';
import { PostsProvider } from '../features/posts/PostsContext';
import { CommentsProvider } from '../features/comments/CommentsContext';
import { NotificationsProvider } from '../features/notifications/NotificationsContext';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <ThemeProvider>
    <AuthProvider>
      <ChatProvider>
        <PostsProvider>
          <CommentsProvider>
            <NotificationsProvider>{children}</NotificationsProvider>
          </CommentsProvider>
        </PostsProvider>
      </ChatProvider>
    </AuthProvider>
  </ThemeProvider>
);