import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';

// Keeps already-authenticated users away from the auth screens.
export const GuestOnly: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { currentUser } = useAuth();
  if (currentUser) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};