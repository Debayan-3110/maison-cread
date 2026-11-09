import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useShop } from '../context/ShopContext';

interface CinematicLoadingOverlayProps {
  onComplete?: () => void;
  minDurationMs?: number;
}

export const CinematicLoadingOverlay: React.FC<CinematicLoadingOverlayProps> = ({
  onComplete,
  minDurationMs = 1800,
}) => {
  const { theme } = useShop();
  const isDark = theme === 'dark';
  const [progress, setProgress] = useState(0);
  const [isDoneLoading, setIsDoneLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const rawProgress = Math.min(100, Math.floor((elapsed / minDurationMs) * 100));

      setProgress(rawProgress);

      if (elapsed >= minDurationMs) {
        clearInterval(interval);
        setTimeout(() => {
          setIsDoneLoading(true);
        }, 200);

        setTimeout(() => {
          setIsVisible(false);
          if (onComplete) onComplete();
        }, 1100);
      }
    }, 25);

    return () => clearInterval(interval);
  }, [minDurationMs, onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 pointer-events-none select-none overflow-hidden transition-colors duration-500 ${
        isDark ? 'bg-[#020202]' : 'bg-[#FFFDD0]'
      }`}
    >
      <AnimatePresence>
        {!isDoneLoading && (
          /* Centered Minimalist Crest & Slicing Loading Line */
          <motion.div
            key="loading-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-auto"
          >
            {/* Minimalist SVG Architectural Emblem */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex flex-col items-center"
            >
              <div className="relative mb-6 flex h-20 w-20 items-center justify-center">
                {/* Ambient Beacon Backlight */}
                <div
                  className={`absolute inset-0 rounded-full blur-xl ${
                    isDark
                      ? 'bg-radial from-[#007BA7]/20 via-[#FF007F]/10 to-transparent'
                      : 'bg-radial from-[#CC5500]/15 via-[#FFFDD0]/30 to-transparent'
                  }`}
                />

                <svg
                  viewBox="0 0 100 100"
                  className="h-full w-full relative z-10"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="46"
                    stroke={isDark ? '#007BA7' : '#0C0C0C'}
                    strokeWidth="1.2"
                    strokeDasharray="4 6"
                    className={`${isDark ? 'opacity-50' : 'opacity-35'} animate-[spin_40s_linear_infinite]`}
                  />
                  <polygon
                    points="50,16 80,50 50,84 20,50"
                    stroke={isDark ? '#FF007F' : '#CC5500'}
                    strokeWidth="1.6"
                    fill="none"
                    className={`${isDark ? 'opacity-80 drop-shadow-[0_0_8px_rgba(255,0,127,0.6)]' : 'opacity-90 drop-shadow-[0_0_8px_rgba(204,85,0,0.35)]'}`}
                  />
                  {/* Architectural S-C Monogram Motif */}
                  <path
                    d="M38 38 C 38 32, 62 32, 62 44 C 62 56, 38 48, 38 60 C 38 68, 62 68, 62 62"
                    stroke={isDark ? '#007BA7' : '#0C0C0C'}
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={isDark ? 'drop-shadow-[0_0_6px_rgba(0,123,167,0.8)]' : ''}
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="2.5"
                    fill={isDark ? '#FF007F' : '#CC5500'}
                    className={isDark ? 'drop-shadow-[0_0_6px_#FF007F]' : 'drop-shadow-[0_0_4px_#CC5500]'}
                  />
                </svg>
              </div>

              {/* Brand Typography */}
              <h2
                className={`font-display text-xl font-normal tracking-[0.4em] ${
                  isDark ? 'text-[#FFFFFF]' : 'text-[#0C0C0C]'
                }`}
              >
                SHOPCREAD
              </h2>
              <div
                className={`mt-2 flex items-center gap-2 text-[10px] font-medium tracking-[0.45em] uppercase ${
                  isDark ? 'text-[#888888]' : 'text-[#333333]'
                }`}
              >
                <span>{isDark ? 'CYBER-LUXURY' : 'HERITAGE LUXURY'}</span>
                <span className={`h-1 w-1 rounded-full ${isDark ? 'bg-[#FF007F]' : 'bg-[#CC5500]'}`} />
                <span className={isDark ? 'text-[#007BA7]' : 'text-[#CC5500] font-semibold'}>
                  COMMERCE OS
                </span>
              </div>
            </motion.div>

            {/* Slicing Loading Line: Burnt Orange through Cream (Light) or Cerulean to Rose through Jet Black (Dark) */}
            <div className="mt-12 flex flex-col items-center">
              <div
                className={`relative h-[2px] w-72 overflow-hidden rounded-full ${
                  isDark
                    ? 'bg-zinc-900 shadow-[0_0_15px_rgba(0,0,0,0.8)]'
                    : 'bg-[#EAE4CD] border border-[#0C0C0C]/10 shadow-[0_1px_4px_rgba(12,12,12,0.06)]'
                }`}
              >
                <motion.div
                  className={`absolute inset-y-0 ${
                    isDark
                      ? 'bg-gradient-to-r from-[#007BA7] via-[#007BA7] to-[#FF007F]'
                      : 'bg-[#CC5500]'
                  }`}
                  style={{
                    left: 0,
                    right: 0,
                    transformOrigin: 'center',
                    scaleX: progress / 100,
                    boxShadow: isDark
                      ? '0 0 12px rgba(0, 123, 167, 0.8), 0 0 20px rgba(255, 0, 127, 0.65)'
                      : '0 0 12px rgba(204, 85, 0, 0.75), 0 0 3px rgba(204, 85, 0, 0.9)',
                  }}
                  transition={{ ease: 'easeOut', duration: 0.05 }}
                />
              </div>

              {/* Minimalist Micro Progress Readout */}
              <div
                className={`mt-4 flex items-center gap-3 font-mono text-[10.5px] tracking-[0.25em] ${
                  isDark ? 'text-[#888888]' : 'text-[#555555]'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full animate-pulse ${
                    isDark ? 'bg-[#FF007F] shadow-[0_0_8px_#FF007F]' : 'bg-[#CC5500] shadow-[0_0_6px_#CC5500]'
                  }`}
                />
                <span>ATELIER INITIALIZING</span>
                <span className={isDark ? 'text-[#007BA7] font-semibold' : 'text-[#CC5500] font-bold'}>
                  {String(progress).padStart(2, '0')}%
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Theatrical Staggered Curtain Split Reveal Effect */}
      {/* Top Curtain Panel */}
      <motion.div
        initial={{ y: '0%' }}
        animate={isDoneLoading ? { y: '-100%' } : { y: '0%' }}
        transition={{
          duration: 0.95,
          delay: 0.05,
          ease: [0.77, 0, 0.175, 1],
        }}
        className={`pointer-events-auto absolute top-0 left-0 right-0 h-1/2 ${
          isDark
            ? 'bg-[#020202] border-b border-[#007BA7]/40'
            : 'bg-[#FFFDD0] border-b border-[#CC5500]/60'
        }`}
        style={{
          boxShadow: isDark
            ? '0 20px 60px rgba(0,0,0,0.95), 0 2px 15px rgba(0,123,167,0.3)'
            : '0 20px 50px rgba(12,12,12,0.12), 0 2px 10px rgba(204,85,0,0.25)',
        }}
      />

      {/* Bottom Curtain Panel */}
      <motion.div
        initial={{ y: '0%' }}
        animate={isDoneLoading ? { y: '100%' } : { y: '0%' }}
        transition={{
          duration: 0.95,
          delay: 0.05,
          ease: [0.77, 0, 0.175, 1],
        }}
        className={`pointer-events-auto absolute bottom-0 left-0 right-0 h-1/2 ${
          isDark
            ? 'bg-[#020202] border-t border-[#FF007F]/40'
            : 'bg-[#FFFDD0] border-t border-[#CC5500]/60'
        }`}
        style={{
          boxShadow: isDark
            ? '0 -20px 60px rgba(0,0,0,0.95), 0 -2px 15px rgba(255,0,127,0.3)'
            : '0 -20px 50px rgba(12,12,12,0.12), 0 -2px 10px rgba(204,85,0,0.25)',
        }}
      />
    </div>
  );
};

export default CinematicLoadingOverlay;
