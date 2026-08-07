import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check } from 'lucide-react';

interface ToastProps {
  message: string | null;
}

// Bottom-center toast used for transient feedback (e.g. copied link).
export const Toast: React.FC<ToastProps> = ({ message }) => (
  <AnimatePresence>
    {message && (
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2.5 bg-surface-container-highest border border-outline-variant rounded-xl shadow-lg flex items-center gap-2 z-50"
      >
        <Check size={16} className="text-secondary" />
        <span className="text-xs font-medium text-on-surface">{message}</span>
      </motion.div>
    )}
  </AnimatePresence>
);