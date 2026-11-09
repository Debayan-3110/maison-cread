import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Sparkles, RefreshCw, Zap, ExternalLink } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import CinematicLoadingOverlay from './CinematicLoadingOverlay';

// High-resolution flagship luxury timepiece for centered floating showcase
const FLAGSHIP_LUXURY_IMAGE =
  'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=90';

export default function Hero() {
  const { setSelectedCategory, setQuickViewProduct, theme } = useShop();
  const isDark = theme === 'dark';
  const [hasLoaded, setHasLoaded] = useState(false);
  const [showLoadingSequence, setShowLoadingSequence] = useState(true);

  const goToCatalog = () => {
    const el = document.getElementById('catalog-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleReplayIntro = () => {
    setShowLoadingSequence(false);
    setTimeout(() => {
      setHasLoaded(false);
      setShowLoadingSequence(true);
    }, 50);
  };

  return (
    <>
      {/* 2. Cinematic Loading Sequence: Burnt Orange slicing through Cream (Light) or Cerulean to Rose through Jet Black (Dark) */}
      {showLoadingSequence && (
        <CinematicLoadingOverlay
          minDurationMs={1700}
          onComplete={() => setHasLoaded(true)}
        />
      )}

      {/* Hero Section: Heritage Luxury Cream (#FFFDD0) in Light Mode | Cyber-Luxury Jet Black (#020202) in Dark Mode */}
      <section
        className={`relative min-h-[92vh] w-full overflow-hidden flex flex-col justify-between pt-6 pb-16 sm:py-16 lg:py-20 transition-colors duration-500 ${
          isDark ? 'bg-[#020202] text-[#FFFFFF]' : 'bg-[#FFFDD0] text-[#0C0C0C]'
        }`}
      >
        
        {/* Ambient Architectural Gradients */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          {/* Main Luminescent Light Streak across the canvas */}
          <div
            className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[480px] w-[95%] max-w-6xl rounded-full blur-3xl opacity-80 ${
              isDark
                ? 'bg-gradient-to-r from-transparent via-[#007BA7]/12 to-transparent'
                : 'bg-gradient-to-r from-transparent via-[#CC5500]/8 to-transparent'
            }`}
          />
          
          {/* Ambient Pedestal Aura */}
          <div
            className={`absolute top-1/2 right-1/4 h-[420px] w-[420px] rounded-full blur-3xl opacity-70 ${
              isDark
                ? 'bg-radial from-[#007BA7]/15 via-[#FF007F]/5 to-transparent'
                : 'bg-radial from-[#CC5500]/10 via-[#FFFDD0]/30 to-transparent'
            }`}
          />

          {/* Precision Architectural Grid Overlay */}
          <div
            className={`absolute inset-0 bg-[size:4.5rem_4.5rem] ${
              isDark
                ? 'bg-[linear-gradient(to_right,rgba(0,123,167,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,123,167,0.04)_1px,transparent_1px)]'
                : 'bg-[linear-gradient(to_right,rgba(12,12,12,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(12,12,12,0.035)_1px,transparent_1px)]'
            }`}
          />

          {/* Precision Corner Reticles */}
          <div
            className={`absolute top-6 left-8 h-3.5 w-3.5 border-t border-l hidden lg:block ${
              isDark ? 'border-[#007BA7]/40' : 'border-[#0C0C0C]/30'
            }`}
          />
          <div
            className={`absolute top-6 right-8 h-3.5 w-3.5 border-t border-r hidden lg:block ${
              isDark ? 'border-[#007BA7]/40' : 'border-[#0C0C0C]/30'
            }`}
          />
          <div
            className={`absolute bottom-6 left-8 h-3.5 w-3.5 border-b border-l hidden lg:block ${
              isDark ? 'border-[#007BA7]/40' : 'border-[#0C0C0C]/30'
            }`}
          />
          <div
            className={`absolute bottom-6 right-8 h-3.5 w-3.5 border-b border-r hidden lg:block ${
              isDark ? 'border-[#FF007F]/40' : 'border-[#CC5500]/40'
            }`}
          />
        </div>

        {/* THIN ACCENT SEPARATOR LINE: Laser-Line separating Header from Hero Content */}
        <div className="relative z-10 w-full mb-8">
          <div className={isDark ? 'laser-line-rose w-full' : 'laser-line-heritage w-full'} />
        </div>

        <div className="shell relative z-10 mx-auto flex flex-1 flex-col justify-between">
          {/* Top Eyebrow Bar */}
          <motion.div
            initial={{ opacity: 0, y: -14 }}
            animate={hasLoaded ? { opacity: 1, y: 0 } : { opacity: 0, y: -14 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className={`flex items-center justify-between border-b pb-4 ${
              isDark ? 'border-[#007BA7]/20' : 'border-[#0C0C0C]/15'
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Status Beacon: Neon Rose (Dark) | Burnt Orange (Light) */}
              <span className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isDark ? 'bg-[#FF007F]' : 'bg-[#CC5500]'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    isDark ? 'bg-[#FF007F] shadow-[0_0_10px_#FF007F]' : 'bg-[#CC5500] shadow-[0_0_8px_#CC5500]'
                  }`}
                />
              </span>
              <span
                className={`font-mono text-[10.5px] uppercase tracking-[0.3em] font-semibold ${
                  isDark ? 'text-[#007BA7]' : 'text-[#0C0C0C]'
                }`}
              >
                {isDark ? (
                  <>
                    SYSTEM PROVENANCE N° 401 <span className="text-[#888888] mx-1.5">•</span>{' '}
                    <span className="text-[#FF007F]">EXCLUSIVE LOT</span>
                  </>
                ) : (
                  <>
                    HERITAGE PROVENANCE N° 401 <span className="text-[#777777] mx-1.5">•</span>{' '}
                    <span className="text-[#CC5500] font-bold">LIMITED STOCK</span>
                  </>
                )}
              </span>
            </div>

            <div
              className={`hidden sm:flex items-center gap-4 text-xs font-mono ${
                isDark ? 'text-[#888888]' : 'text-[#555555]'
              }`}
            >
              <span className={`flex items-center gap-1.5 ${isDark ? 'text-zinc-400' : 'text-[#333333]'}`}>
                <ShieldCheck className={`h-3.5 w-3.5 ${isDark ? 'text-[#007BA7]' : 'text-[#CC5500]'}`} />
                <span>BNS PROTECTED ESCROW</span>
              </span>
              <span className={`h-3 w-px ${isDark ? 'bg-zinc-800' : 'bg-[#0C0C0C]/20'}`} />
              <button
                onClick={handleReplayIntro}
                className={`flex items-center gap-1.5 transition-colors ${
                  isDark ? 'text-[#888888] hover:text-[#007BA7]' : 'text-[#555555] hover:text-[#CC5500]'
                }`}
                title="Replay cinematic laser curtain"
              >
                <RefreshCw className="h-3 w-3" />
                <span>REPLAY INTRO</span>
              </button>
            </div>
          </motion.div>

          {/* MAIN HERO STAGE: Headline & Centered Floating Product */}
          <div className="my-auto py-8 sm:py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 items-center gap-10 lg:gap-14">
            
            {/* Left & Center: Typography & Value Proposition */}
            <div className="lg:col-span-7 flex flex-col justify-center text-left">
              
              {/* Main Headline */}
              <motion.div
                initial={{ opacity: 0, y: 28 }}
                animate={hasLoaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
                transition={{ duration: 0.95, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <h1
                  className={`title-editorial text-4xl phone:text-5xl phone-lg:text-6xl sm:text-7xl lg:text-[76px] xl:text-[84px] tracking-tight leading-[1.02] ${
                    isDark ? 'font-normal text-[#FFFFFF]' : 'font-bold text-[#0C0C0C]'
                  }`}
                >
                  <span className="block font-display">Precision.</span>
                  {/* Key Highlight: Neon Rose (Dark) | Burnt Orange (Light) */}
                  <span
                    className={`block font-display italic my-1 ${
                      isDark
                        ? 'text-[#FF007F] drop-shadow-[0_0_18px_rgba(255,0,127,0.55)]'
                        : 'text-[#CC5500] drop-shadow-[0_0_10px_rgba(204,85,0,0.3)] font-bold'
                    }`}
                  >
                    Authenticity.
                  </span>
                  <span className="block font-display">Certainty.</span>
                </h1>
              </motion.div>

              {/* Sub-headline: Charcoal Grey Typography in Light Mode */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={hasLoaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.9, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
                className="mt-6 sm:mt-8 max-w-xl"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`h-px w-6 ${isDark ? 'bg-[#007BA7]' : 'bg-[#CC5500]'}`} />
                  <p
                    className={`font-mono text-xs font-semibold tracking-[0.26em] uppercase ${
                      isDark ? 'text-[#007BA7]' : 'text-[#CC5500]'
                    }`}
                  >
                    THE LUXURY COMMERCE OS
                  </p>
                </div>
                <p
                  className={`text-[14px] phone-lg:text-[15.5px] sm:text-[16.5px] leading-relaxed font-sans ${
                    isDark ? 'text-[#888888]' : 'text-[#333333]'
                  }`}
                >
                  A high-conviction operating system for collectors and connoisseurs. Engineered with
                  forensic sub-millimeter authentication, custodial vault escrow, and multi-region insured delivery.
                </p>
              </motion.div>

              {/* CTA Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={hasLoaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.85, delay: 0.75, ease: [0.16, 1, 0.3, 1] }}
                className="mt-8 sm:mt-10 flex flex-wrap items-center gap-4"
              >
                {/* Primary CTA: Burnt Orange with Ink Black text (Light) | Glass-morphic Cyber Bloom (Dark) */}
                <motion.button
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={goToCatalog}
                  className={`relative group overflow-hidden rounded-full px-8 py-4 text-xs font-bold tracking-[0.24em] uppercase transition-all duration-300 cursor-pointer ${
                    isDark ? 'hover-cyber-cycle' : 'hover-heritage-lift'
                  }`}
                  style={{
                    background: isDark ? 'rgba(2, 2, 2, 0.75)' : '#CC5500',
                    backdropFilter: isDark ? 'blur(12px)' : 'none',
                    WebkitBackdropFilter: isDark ? 'blur(12px)' : 'none',
                    border: isDark ? '1px solid rgba(0, 123, 167, 0.7)' : '1px solid rgba(12, 12, 12, 0.25)',
                    boxShadow: isDark
                      ? '0 0 25px rgba(0, 123, 167, 0.45), inset 0 0 15px rgba(0, 123, 167, 0.15)'
                      : '0 4px 18px rgba(204, 85, 0, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.3)',
                  }}
                >
                  {/* Subtle Continuous Shimmer Highlight */}
                  <span className="pointer-events-none absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer-continuous" />

                  {/* Button Content: Ink Black in Light Mode | Pure White in Dark Mode */}
                  <span
                    className={`relative z-10 flex items-center gap-3 ${
                      isDark ? 'text-[#FFFFFF]' : 'text-[#0C0C0C]'
                    }`}
                  >
                    <span>Explore Collection</span>
                    <ArrowRight
                      className={`h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5 ${
                        isDark ? 'text-[#007BA7] group-hover:text-[#FF007F]' : 'text-[#0C0C0C]'
                      }`}
                    />
                  </span>
                </motion.button>

                {/* Secondary Action: Ghost Style (transparent background, Ink Black border, Ink Black text) */}
                <button
                  onClick={() => {
                    setSelectedCategory('clothes');
                    goToCatalog();
                  }}
                  className={`rounded-full px-6 py-4 text-xs font-semibold tracking-[0.2em] uppercase transition-all duration-300 shadow-sm ${
                    isDark
                      ? 'border border-zinc-800/80 bg-[#0A0A0A]/60 text-[#888888] hover:text-[#FFFFFF] hover:border-[#007BA7]/60 backdrop-blur-[12px]'
                      : 'border border-[#0C0C0C]/80 bg-transparent text-[#0C0C0C] hover:bg-[#0C0C0C]/5 hover:border-[#0C0C0C]'
                  }`}
                >
                  The Curated Edit
                </button>
              </motion.div>
            </div>

            {/* Right: Floating Centerpiece with Precision Borders */}
            <div className="lg:col-span-5 relative flex flex-col items-center justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.88 }}
                animate={hasLoaded ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.88 }}
                transition={{ duration: 1.1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="relative flex flex-col items-center justify-center w-full max-w-md"
              >
                {/* Slow Vertical Oscillation Floating Animation */}
                <motion.div
                  animate={{
                    y: [-14, 14, -14],
                    rotate: [0, 1.2, 0, -1.2, 0],
                  }}
                  transition={{
                    duration: 6.8,
                    ease: 'easeInOut',
                    repeat: Infinity,
                  }}
                  className="relative z-10 w-full aspect-[4/5] max-w-[340px] sm:max-w-[380px] overflow-hidden rounded-2xl p-[1px]"
                  style={{
                    background: isDark
                      ? 'linear-gradient(135deg, rgba(0, 123, 167, 0.6) 0%, rgba(255, 0, 127, 0.25) 50%, rgba(0, 123, 167, 0.1) 100%)'
                      : 'linear-gradient(135deg, rgba(12, 12, 12, 0.8) 0%, rgba(204, 85, 0, 0.45) 50%, rgba(12, 12, 12, 0.8) 100%)',
                    boxShadow: isDark
                      ? '0 0 35px rgba(0, 123, 167, 0.25), 0 30px 60px -15px rgba(0, 0, 0, 0.95)'
                      : '0 20px 50px -12px rgba(12, 12, 12, 0.15), 0 0 25px rgba(204, 85, 0, 0.12)',
                  }}
                >
                  {/* Precision Vessel Bezel Frame */}
                  <div
                    className={`relative h-full w-full overflow-hidden rounded-[15px] ${
                      isDark ? 'bg-[#0A0A0A]/95 backdrop-blur-[12px]' : 'bg-[#FFFFFF]'
                    }`}
                  >
                    <img
                      src={FLAGSHIP_LUXURY_IMAGE}
                      alt="ShopCread Luxury Masterpiece"
                      className="h-full w-full object-cover object-center transition-transform duration-700 hover:scale-105"
                      loading="eager"
                    />

                    {/* Top Badge: "Limited Stock" (Light) | "Vault Escrow Lot N° 401" (Dark) */}
                    <div
                      className={`absolute top-3.5 left-3.5 rounded-full px-3 py-1 flex items-center gap-1.5 text-[9.5px] font-mono tracking-wider backdrop-blur-[12px] ${
                        isDark
                          ? 'bg-[#020202]/85 border border-[#FF007F]/40 text-[#FFFFFF] shadow-[0_0_12px_rgba(255,0,127,0.4)]'
                          : 'bg-[#FFFDD0]/95 border border-[#CC5500]/60 text-[#0C0C0C] shadow-sm'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full animate-ping ${
                          isDark ? 'bg-[#FF007F]' : 'bg-[#CC5500]'
                        }`}
                      />
                      <span>{isDark ? 'VAULT ESCROW LOT N° 401' : 'VAULT ESCROW • LIMITED STOCK'}</span>
                    </div>

                    {/* Bottom Metadata Glass Bar */}
                    <div
                      className={`absolute bottom-3.5 inset-x-3.5 rounded-xl p-3.5 border flex items-center justify-between shadow-lg backdrop-blur-[12px] ${
                        isDark
                          ? 'bg-[#020202]/80 border-[#007BA7]/30 text-white'
                          : 'bg-[#FFFDD0]/92 border-[#0C0C0C]/25 text-[#0C0C0C]'
                      }`}
                    >
                      <div>
                        <p
                          className={`text-[10px] font-mono uppercase tracking-widest ${
                            isDark ? 'text-[#007BA7]' : 'text-[#CC5500] font-bold'
                          }`}
                        >
                          Chronometer Royal
                        </p>
                        <p
                          className={`text-xs font-bold truncate ${
                            isDark ? 'text-[#FFFFFF]' : 'text-[#0C0C0C]'
                          }`}
                        >
                          {isDark ? 'Cyber-Obsidian Edition' : 'Heritage Cream Edition'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-xs font-mono font-bold block ${
                            isDark ? 'text-[#FFFFFF]' : 'text-[#0C0C0C]'
                          }`}
                        >
                          ₹4,85,000
                        </span>
                        <span
                          className={`text-[9.5px] font-mono font-bold tracking-wide ${
                            isDark ? 'text-[#FF007F]' : 'text-[#CC5500]'
                          }`}
                        >
                          AUTHENTICATED
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Pedestal Aura (Synchronously Pulsing with Floating Oscillation) */}
                <motion.div
                  animate={{
                    scale: [0.85, 1.1, 0.85],
                    opacity: [0.4, 0.75, 0.4],
                  }}
                  transition={{
                    duration: 6.8,
                    ease: 'easeInOut',
                    repeat: Infinity,
                  }}
                  className={`mt-5 h-6 w-52 rounded-full blur-lg ${
                    isDark
                      ? 'bg-gradient-to-r from-[#007BA7]/30 via-[#FF007F]/20 to-[#007BA7]/30'
                      : 'bg-gradient-to-r from-[#CC5500]/25 via-[#FFFDD0]/40 to-[#CC5500]/25'
                  }`}
                />
              </motion.div>
            </div>
          </div>

          {/* Bottom Trust Infrastructure Specifications */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={hasLoaded ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            transition={{ duration: 0.8, delay: 0.95, ease: [0.16, 1, 0.3, 1] }}
            className={`border-t pt-6 grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs ${
              isDark ? 'border-[#007BA7]/20 text-[#888888]' : 'border-[#0C0C0C]/15 text-[#333333]'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className={`font-mono font-bold text-sm ${isDark ? 'text-[#007BA7]' : 'text-[#CC5500]'}`}>
                01
              </span>
              <div>
                <p
                  className={`uppercase tracking-wider text-[11px] ${
                    isDark ? 'font-semibold text-[#FFFFFF]' : 'font-bold text-[#0C0C0C]'
                  }`}
                >
                  Sub-Millimeter Provenance
                </p>
                <p className="text-[12px] leading-relaxed mt-0.5">
                  Dual-layer forensic verification &amp; non-destructive spectroscopy.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className={`font-mono font-bold text-sm ${isDark ? 'text-[#FF007F]' : 'text-[#CC5500]'}`}>
                02
              </span>
              <div>
                <p
                  className={`uppercase tracking-wider text-[11px] ${
                    isDark ? 'font-semibold text-[#FFFFFF]' : 'font-bold text-[#0C0C0C]'
                  }`}
                >
                  BNS Phone Number Shield
                </p>
                <p className="text-[12px] leading-relaxed mt-0.5">
                  Zero-knowledge customer privacy protocol with masked carrier routing.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className={`font-mono font-bold text-sm ${isDark ? 'text-[#007BA7]' : 'text-[#CC5500]'}`}>
                03
              </span>
              <div>
                <p
                  className={`uppercase tracking-wider text-[11px] ${
                    isDark ? 'font-semibold text-[#FFFFFF]' : 'font-bold text-[#0C0C0C]'
                  }`}
                >
                  Armored Custodial Escrow
                </p>
                <p className="text-[12px] leading-relaxed mt-0.5">
                  Full transit insurance backed by Lloyd's syndicates worldwide.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
