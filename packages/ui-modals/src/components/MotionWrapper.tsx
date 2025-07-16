/**
 * @repo/ui-modals - Motion Wrapper Component
 * 
 * Wrapper for framer-motion components to handle type issues
 */

import { motion, AnimatePresence as FramerAnimatePresence } from 'framer-motion';

// Type-safe motion components
export const MotionDiv = motion.div as any;
export const AnimatePresence = FramerAnimatePresence as any;