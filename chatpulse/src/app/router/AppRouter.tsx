import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { RequireAuth } from './RequireAuth';
import { GuestOnly } from './GuestOnly';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { Home } from '../../features/posts/pages/Home';
import { SavedPosts } from '../../features/posts/pages/SavedPosts';
import { Messages } from '../../features/chat/pages/Messages';
import { Notifications } from '../../features/notifications/pages/Notifications';
import { Profile } from '../../features/profile/pages/Profile';
import { Login } from '../../features/auth/pages/Login';
import { Register } from '../../features/auth/pages/Register';

export const AppRouter: React.FC = () => (
  <Routes>
    <Route
      path="/"
      element={
        <RequireAuth>
          <DashboardLayout />
        </RequireAuth>
      }
    >
      <Route index element={<Home />} />
      <Route path="saved" element={<SavedPosts />} />
      <Route path="messages" element={<Messages />} />
      <Route path="notifications" element={<Notifications />} />
      <Route path="profile" element={<Profile />} />
    </Route>

    <Route
      element={
        <GuestOnly>
          <AuthLayout />
        </GuestOnly>
      }
    >
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);