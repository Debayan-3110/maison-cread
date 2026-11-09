import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useShop } from '../context/ShopContext';

/**
 * Heritage Luxury & Cyber-Luxury Precision-Milled Theme Switch
 * Mathematically bounded travel (64px track - 2x3px padding - 26px thumb = 29px translation)
 * Perfectly contained in both Dark (Midnight Obsidian / Cerulean) and Light (Heritage Luxury Cream / Burnt Orange) modes.
 */
export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useShop();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={`Switch to ${isDark ? 'Heritage Luxury Cream (Light Mode)' : 'Cyber-Luxury Jet Black (Dark Mode)'}`}
      title={`Current: ${isDark ? 'Cyber-Luxury (Cerulean / Void)' : 'Heritage Luxury (Cream / Burnt Orange)'} — Click to toggle`}
      className={`group relative inline-flex h-[34px] w-[64px] shrink-0 cursor-pointer items-center overflow-hidden rounded-full p-[3px] transition-all duration-500 focus:outline-none focus-visible:ring-2 ${
        isDark ? 'focus-visible:ring-[#007BA7]' : 'focus-visible:ring-[#CC5500]'
      }`}
      style={{
        background: isDark
          ? 'linear-gradient(135deg, #020202 0%, #0A1218 100%)'
          : 'linear-gradient(135deg, #FFFDD0 0%, #F5F5DC 100%)',
        border: isDark
          ? '1px solid rgba(0, 123, 167, 0.5)'
          : '1px solid rgba(12, 12, 12, 0.22)',
        boxShadow: isDark
          ? '0 0 14px rgba(0, 123, 167, 0.25), inset 0 1px 3px rgba(0,0,0,0.9)'
          : '0 1px 4px rgba(12, 12, 12, 0.08), inset 0 1px 2px rgba(12, 12, 12, 0.05)',
      }}
    >
      {/* Precision Track Background Ambient Micro-Glow */}
      <span
        className={`pointer-events-none absolute inset-0 rounded-full transition-opacity duration-500 ${
          isDark
            ? 'opacity-100 bg-gradient-to-r from-transparent via-[#007BA7]/10 to-[#FF007F]/10'
            : 'opacity-100 bg-gradient-to-r from-[#CC5500]/10 via-transparent to-transparent'
        }`}
      />

      {/* Track Background Indicators (Stationary Sun on Left, Moon on Right) */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-[8px] text-[10px]">
        {/* Left Track Station: Sun (Visible when knob is on the right in Dark mode) */}
        <span
          className={`transition-opacity duration-300 flex items-center justify-center ${
            isDark ? 'opacity-35 text-zinc-500' : 'opacity-0'
          }`}
        >
          <Sun className="h-3 w-3" strokeWidth={2} />
        </span>

        {/* Right Track Station: Moon (Visible when knob is on the left in Light mode) */}
        <span
          className={`transition-opacity duration-300 flex items-center justify-center ${
            isDark ? 'opacity-0' : 'opacity-40 text-[#0C0C0C]'
          }`}
        >
          <Moon className="h-3 w-3" strokeWidth={2} />
        </span>
      </div>

      {/* Tactile CNC-Milled Sliding Thumb with Mathematically Exact Travel */}
      <motion.div
        transition={{
          type: 'spring',
          stiffness: 600,
          damping: 32,
          mass: 0.8,
        }}
        animate={{
          x: isDark ? 29 : 0,
        }}
        className="relative z-10 flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full"
        style={{
          background: isDark
            ? 'linear-gradient(145deg, #14222E, #070E14)'
            : 'linear-gradient(145deg, #CC5500, #B34700)',
          border: isDark
            ? '1px solid rgba(0, 123, 167, 0.9)'
            : '1px solid #A03D00',
          boxShadow: isDark
            ? '0 0 10px rgba(0, 123, 167, 0.5), 0 2px 5px rgba(0, 0, 0, 0.8), inset 0 1px 1px rgba(255,255,255,0.2)'
            : '0 0 10px rgba(204, 85, 0, 0.45), 0 2px 5px rgba(12, 12, 12, 0.18), inset 0 1px 1px rgba(255,255,255,0.3)',
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.div
              key="dark-moon"
              initial={{ rotate: -45, scale: 0.6, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 45, scale: 0.6, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="flex items-center justify-center text-[#007BA7]"
            >
              <Moon className="h-3 w-3 drop-shadow-[0_0_6px_#007BA7]" strokeWidth={2.2} fill="#007BA7" />
            </motion.div>
          ) : (
            <motion.div
              key="light-sun"
              initial={{ rotate: 45, scale: 0.6, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: -45, scale: 0.6, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="flex items-center justify-center text-[#0C0C0C]"
            >
              <Sun className="h-3 w-3 drop-shadow-[0_0_3px_rgba(12,12,12,0.4)]" strokeWidth={2.4} fill="#0C0C0C" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </button>
  );
};

export default ThemeToggle;
