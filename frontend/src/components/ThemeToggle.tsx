import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useShop } from '../context/ShopContext.tsx';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useShop();
  const isDark = theme === 'dark';

  return (
    <motion.button
      onClick={toggleTheme}
      className="relative flex items-center justify-center w-12 h-12 rounded-full border border-hairline bg-panel shadow-quiet hover:border-accent transition-colors"
      whileTap={{ scale: 0.92 }}
      whileHover={{ scale: 1.05 }}
      aria-label="Toggle Theme"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={theme}
          initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="text-body"
        >
          {isDark ? (
            <Moon size={20} fill="currentColor" />
          ) : (
            <Sun size={20} fill="currentColor" />
          )}
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
};
