import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AppProvider, useApp } from './contexts/AppContext';
import { SideNavBar } from './components/SideNavBar';
import { NewChatModal } from './components/NewChatModal';
import { Home } from './pages/Home';
import { SavedPosts } from './pages/SavedPosts';
import { Messages } from './pages/Messages';
import { Notifications } from './pages/Notifications';
import { Profile } from './pages/Profile';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { motion, AnimatePresence } from 'motion/react';

// Protected layout wrapper containing sidebar, header outlets, and chat modals
const DashboardLayout: React.FC = () => {
  const { currentUser } = useApp();
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);

  // Guard routing - redirect to Login screen if not authenticated
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="w-full h-full flex overflow-hidden bg-background">
      {/* Sidebar navigation */}
      <SideNavBar onNewChatClick={() => setIsNewChatOpen(true)} />

      {/* Main viewport area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={window.location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="w-full h-full flex flex-col"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Launch new conversation modal */}
      <NewChatModal isOpen={isNewChatOpen} onClose={() => setIsNewChatOpen(false)} />
    </div>
  );
};

// Public layout wrapper - prevents logged-in users from seeing Auth cards
const AuthLayout: React.FC = () => {
  const { currentUser } = useApp();

  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Protected Dashboard Routes */}
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Home />} />
            <Route path="saved" element={<SavedPosts />} />
            <Route path="messages" element={<Messages />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          {/* Guest / Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
