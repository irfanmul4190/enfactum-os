import { motion } from 'framer-motion';
import React from 'react';

interface StaggeredProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.07,
    },
  },
};

export const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

export const StaggerContainer: React.FC<StaggeredProps> = ({ children, className, staggerDelay = 0.07 }) => (
  <motion.div
    className={className}
    variants={{
      hidden: {},
      visible: { transition: { staggerChildren: staggerDelay } },
    }}
    initial="hidden"
    animate="visible"
  >
    {children}
  </motion.div>
);

export const StaggerItem: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <motion.div className={className} variants={itemVariants}>
    {children}
  </motion.div>
);

export const pageTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

export const PageTransition: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <motion.div
    className={className}
    initial={pageTransition.initial}
    animate={pageTransition.animate}
    exit={pageTransition.exit}
  >
    {children}
  </motion.div>
);
