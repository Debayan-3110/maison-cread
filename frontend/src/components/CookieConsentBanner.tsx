import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Cookie, ChevronRight, Check, X, Sliders, ExternalLink } from 'lucide-react';
import {
  ComplianceManager,
  CookiePreferences,
  DEFAULT_PREFERENCES,
} from '../utils/complianceManager';
import { useShop } from '../context/ShopContext';

interface CookieConsentBannerProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({
  forceOpen = false,
  onClose,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES);
  const { openLegalPolicy } = useShop();

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      setShowCustomize(true);
      const existing = ComplianceManager.getConsentRecord();
      if (existing) {
        setPreferences(existing.preferences);
      }
    } else {
      const responded = ComplianceManager.hasUserResponded();
      if (!responded) {
        // Small delay on first visit for smooth initial appearance
        const timer = setTimeout(() => setIsOpen(true), 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [forceOpen]);

  const handleAcceptAll = () => {
    ComplianceManager.acceptAll();
    setIsOpen(false);
    if (onClose) onClose();
  };

  const handleEssentialOnly = () => {
    ComplianceManager.rejectNonEssential();
    setIsOpen(false);
    if (onClose) onClose();
  };

  const handleSaveCustom = () => {
    ComplianceManager.saveConsent(preferences);
    setIsOpen(false);
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-5 pointer-events-none flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-banner-title"
          className="pointer-events-auto w-full max-w-4xl rounded-2xl border border-[#007BA7]/40 bg-[#020202]/95 backdrop-blur-[16px] text-body shadow-2xl p-5 sm:p-6"
          style={{
            boxShadow: '0 0 30px rgba(0, 123, 167, 0.25), 0 20px 40px rgba(0,0,0,0.9)',
          }}
        >
          {/* Top Bar: Privacy & DPDP Sovereign Shield */}
          <div className="flex items-start justify-between gap-4 border-b border-[#007BA7]/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#007BA7]/15 border border-[#007BA7]/40 text-[#007BA7]">
                <ShieldCheck className="h-5 w-5 drop-shadow-[0_0_8px_#007BA7]" />
              </div>
              <div>
                <h3 id="cookie-banner-title" className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                  <span>Privacy &amp; Cookie Consent Governance</span>
                  <span className="rounded-full bg-[#007BA7]/20 px-2.5 py-0.5 text-[9.5px] font-mono text-[#007BA7] border border-[#007BA7]/30 uppercase">
                    DPDP Act 2023 • GDPR
                  </span>
                </h3>
                <p className="text-xs text-[#888888] mt-0.5">
                  Maison Cread operates under explicit consent-first principles. We do not load non-essential tracking cookies without prior authorization.
                </p>
              </div>
            </div>

            {forceOpen && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  if (onClose) onClose();
                }}
                className="text-[#888888] hover:text-white transition-colors p-1"
                aria-label="Close cookie modal"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Granular Preference Drawer (When Customizing) */}
          {showCustomize && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 space-y-3 border-b border-[#007BA7]/20 pb-4"
            >
              {/* 1. Strictly Necessary */}
              <div className="flex items-start justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3.5">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">1. Strictly Necessary</span>
                    <span className="text-[10px] font-mono text-[#007BA7] bg-[#007BA7]/10 px-2 py-0.5 rounded">Always Active</span>
                  </div>
                  <p className="text-[11.5px] text-[#888888]">
                    Essential session tokens, CSRF protection, BNS phone number hiding routing, and shopping bag checkout state. Cannot be switched off.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={true}
                  disabled
                  className="mt-1 h-4 w-4 rounded accent-[#007BA7] cursor-not-allowed opacity-80"
                />
              </div>

              {/* 2. Functional & Appearance */}
              <div className="flex items-start justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3.5">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">2. Functional &amp; Preferences</span>
                  </div>
                  <p className="text-[11.5px] text-[#888888]">
                    Stores your appearance theme (Midnight Obsidian vs. Gallery White) and currency conversions across atelier visits.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.functional}
                  onChange={(e) => setPreferences({ ...preferences, functional: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded accent-[#007BA7] cursor-pointer"
                />
              </div>

              {/* 3. Performance & Anonymous Telemetry */}
              <div className="flex items-start justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3.5">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">3. Performance Analytics</span>
                  </div>
                  <p className="text-[11.5px] text-[#888888]">
                    Non-identifiable telemetry measuring page load latency and Cloudinary CDN edge speed to ensure flawless responsiveness.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.analytical}
                  onChange={(e) => setPreferences({ ...preferences, analytical: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded accent-[#007BA7] cursor-pointer"
                />
              </div>
            </motion.div>
          )}

          {/* Action Footer */}
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 text-[#888888]">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  openLegalPolicy('cookies');
                }}
                className="underline hover:text-[#007BA7] transition-colors inline-flex items-center gap-1"
              >
                <span>Read Cookie Policy</span>
                <ExternalLink className="h-3 w-3" />
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  openLegalPolicy('privacy');
                }}
                className="underline hover:text-[#007BA7] transition-colors"
              >
                Privacy Notice
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              {!showCustomize ? (
                <>
                  <button
                    type="button"
                    onClick={() => setShowCustomize(true)}
                    className="flex-1 sm:flex-none rounded-full border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-xs font-semibold text-zinc-300 hover:text-white hover:border-[#007BA7]/60 transition-colors"
                  >
                    Customize
                  </button>
                  <button
                    type="button"
                    onClick={handleEssentialOnly}
                    className="flex-1 sm:flex-none rounded-full border border-zinc-700 bg-transparent px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 transition-colors"
                  >
                    Essential Only
                  </button>
                  <button
                    type="button"
                    onClick={handleAcceptAll}
                    className="flex-1 sm:flex-none rounded-full bg-[#007BA7] px-5 py-2 text-xs font-bold text-white shadow-[0_0_15px_rgba(0,123,167,0.5)] hover:bg-[#008ec0] transition-all"
                  >
                    Accept All
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setShowCustomize(false)}
                    className="rounded-full border border-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCustom}
                    className="rounded-full bg-[#007BA7] px-6 py-2 text-xs font-bold text-white shadow-[0_0_15px_rgba(0,123,167,0.5)] hover:bg-[#008ec0] transition-all"
                  >
                    Save Preferences
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CookieConsentBanner;

