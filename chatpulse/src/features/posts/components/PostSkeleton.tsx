import React from 'react';
import { motion } from 'motion/react';

export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

export const postCardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 300, damping: 24 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -12,
    transition: { duration: 0.2 },
  },
};

export const PostSkeleton: React.FC = () => (
  <motion.div
    className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden"
    animate={{ opacity: [0.5, 1, 0.5] }}
    transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
  >
    <div className="p-5 flex items-center gap-3 border-b border-outline-variant/40">
      <div className="w-10 h-10 rounded-xl bg-surface-container-high" />
      <div className="space-y-2 flex-1">
        <div className="h-3 w-32 rounded-full bg-surface-container-high" />
        <div className="h-2 w-20 rounded-full bg-surface-container-high" />
      </div>
    </div>
    <div className="p-5 space-y-3">
      <div className="h-3 w-full rounded-full bg-surface-container-high" />
      <div className="h-3 w-3/4 rounded-full bg-surface-container-high" />
      <div className="h-40 w-full rounded-2xl bg-surface-container-high" />
    </div>
  </motion.div>
);