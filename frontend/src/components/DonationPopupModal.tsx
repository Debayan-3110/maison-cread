import React, { useState, useEffect } from 'react';
import { Heart, Sparkles, ShieldCheck, ArrowRight, X, Gift, Users, Award, ExternalLink } from 'lucide-react';

interface DonationPopupModalProps {
  forceOpen?: boolean;
  onCloseModal?: () => void;
}

export default function DonationPopupModal({ forceOpen, onCloseModal }: DonationPopupModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasDismissed, setHasDismissed] = useState(false);

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      return;
    }

    // Check if dismissed in current session
    const dismissed = sessionStorage.getItem('maison_donation_popup_dismissed');
    if (dismissed === 'true') {
      setHasDismissed(true);
      return;
    }

    // Trigger popup smoothly after visitor arrives on the site
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 1200);

    return () => clearTimeout(timer);
  }, [forceOpen]);

  const handleDismiss = () => {
    setIsOpen(false);
    sessionStorage.setItem('maison_donation_popup_dismissed', 'true');
    setHasDismissed(true);
    if (onCloseModal) onCloseModal();
  };

  const navigateToDonationSite = (preselectedAmount?: number) => {
    handleDismiss();
    const query = preselectedAmount ? `?amount=${preselectedAmount}` : '';
    window.history.pushState({}, '', `/donate${query}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Philanthropic Sanctuary Alliance"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
    >
      <div 
        className="relative w-full max-w-2xl bg-panel text-body border border-hairline dark:border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Accent Header Border */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600 animate-pulse" />

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 z-20 p-2 text-quiet hover:text-body hover:bg-recess rounded-full transition-colors"
          title="Dismiss and browse boutique"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Banner Grid */}
        <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-recess">
          <img
            src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80"
            alt="Children and Elders Sanctuary Initiative"
            className="w-full h-full object-cover object-center filter brightness-75 hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-panel/90 via-black/40 to-transparent" />

          {/* Floating Pill Badges */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold tracking-wider text-amber-300 uppercase bg-black/70 backdrop-blur-md border border-amber-500/40 rounded-full">
              <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
              Maison Cread Philanthropy
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-emerald-300 bg-emerald-950/80 backdrop-blur-md border border-emerald-500/40 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              100% Direct Impact
            </span>
          </div>

          <div className="absolute bottom-3 left-6 right-6">
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-wide drop-shadow-md">
              Giving Hope to Orphanages & Elder Sanctuaries
            </h2>
            <p className="text-xs sm:text-sm text-zinc-200 mt-1 line-clamp-1 drop-shadow-sm">
              Tokyo • Paris • London • New York • Bengaluru • New Delhi
            </p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 space-y-5">
          <p className="text-sm text-quiet leading-relaxed">
            Welcome to Maison Cread. Beyond our haute couture and rare fragrances, our mission is to ensure no orphaned child lacks nourishment or education, and no elder spends their golden years in solitude.
          </p>

          {/* Cloud Integration Highlights Bar */}
          <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-recess border border-hairline rounded-xl text-center">
            <div className="flex flex-col items-center justify-center p-1">
              <span className="text-[10px] text-faint uppercase tracking-wider font-semibold">Neon DB</span>
              <span className="text-xs text-amber-600 dark:text-amber-400 font-mono font-medium">Relational Records</span>
            </div>
            <div className="flex flex-col items-center justify-center p-1 border-x border-hairline">
              <span className="text-[10px] text-faint uppercase tracking-wider font-semibold">Cockroach Labs</span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-medium">Immutable Ledger</span>
            </div>
            <div className="flex flex-col items-center justify-center p-1">
              <span className="text-[10px] text-faint uppercase tracking-wider font-semibold">Cloudinary</span>
              <span className="text-xs text-sky-600 dark:text-sky-400 font-mono font-medium">Media CDN</span>
            </div>
          </div>

          {/* Benefactor Privilege Box */}
          <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/30">
                <Gift className="w-5 h-5 text-amber-500 dark:text-amber-400" />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-300">
                  Donor Appreciation Privilege
                </div>
                <div className="text-xs text-quiet">
                  Every donor receives a 20% off voucher code (<span className="text-amber-600 dark:text-amber-300 font-mono font-bold">HOPE-BLOOM-20</span>) storewide!
                </div>
              </div>
            </div>
          </div>

          {/* Quick Direct Amount Selectors in INR */}
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-wider text-faint font-medium">
              Choose Quick Pledge to Dedicated Portal (INR):
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[500, 1000, 2500, 5000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => navigateToDonationSite(amt)}
                  className="py-2 px-3 text-xs sm:text-sm font-semibold rounded-lg border border-hairline bg-panel text-body hover:border-amber-400 hover:text-amber-600 dark:hover:text-amber-300 hover:bg-recess transition-all text-center shadow-sm"
                >
                  ₹{amt.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Main Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => navigateToDonationSite()}
              className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold rounded-xl shadow-lg shadow-amber-500/20 transition-all transform hover:-translate-y-0.5"
            >
              <Heart className="w-4 h-4 fill-black" />
              <span>Enter Philanthropic Website</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
            <button
              onClick={handleDismiss}
              className="w-full sm:w-auto py-3 px-5 text-xs text-quiet hover:text-body border border-hairline rounded-xl transition-colors hover:bg-recess"
            >
              Continue to Boutique
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <div className="px-6 py-3 bg-recess border-t border-hairline text-center text-[11px] text-faint flex items-center justify-center gap-2">
          <span>Registered 501(c)(3) & NGO Alliance</span>
          <span>•</span>
          <span>Zero Admin Fees Deducted</span>
          <span>•</span>
          <span>Instant Tax Certificate via Sendmail</span>
        </div>
      </div>
    </div>
  );
}

