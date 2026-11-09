import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useShop } from '../context/ShopContext';
import { ShieldAlert, Wine, Cigarette, AlertCircle, CheckCircle2, X, Lock } from 'lucide-react';

export default function AgeGateModal() {
  const { isAgeGateOpen, setIsAgeGateOpen, verifyAgeAndEnterLiquor, setSelectedCategory } = useShop();

  const [birthYear, setBirthYear] = useState<number>(2000);
  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isAgeGateOpen) return null;

  const currentYear = new Date().getFullYear();
  const calculatedAge = currentYear - birthYear;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (calculatedAge < 18) {
      setValidationError('Access restricted: You must be at least 18 years of age under Indian law to enter this section.');
      return;
    }
    if (!agreedToTerms) {
      setValidationError('Please confirm the statutory declaration to proceed.');
      return;
    }
    setValidationError(null);
    verifyAgeAndEnterLiquor();
  };

  const handleExit = () => {
    setIsAgeGateOpen(false);
    setSelectedCategory('all');
  };

  // Generate birth years from currentYear - 80 down to currentYear - 14
  const years = Array.from({ length: 65 }, (_, i) => currentYear - 14 - i);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleExit}
        className="fixed inset-0 bg-scrim/80 backdrop-blur-md"
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-hairline bg-panel p-6 shadow-2xl md:p-8 text-left"
      >
        {/* Decorative Top Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-600 via-rose-600 to-amber-700" />

        {/* Close / Exit Button */}
        <button
          onClick={handleExit}
          aria-label="Exit age gate"
          className="btn-ghost absolute right-4 top-4 h-9 w-9 rounded-full p-0 text-quiet hover:text-body"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header Badges */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-500 border border-amber-500/30">
            <Wine className="h-5 w-5" />
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-500 border border-rose-500/30">
            <Cigarette className="h-5 w-5" />
          </div>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-amber-500">
            <Lock className="h-3 w-3" /> Statutory 18+ Gate
          </span>
        </div>

        <h3 className="title-editorial text-[24px] md:text-[28px] text-body leading-tight">
          Age Verification Required
        </h3>
        <p className="mt-1 text-[12.5px] font-mono text-quiet">
          Maison Cread Sovereign Cellar &amp; Hand-Rolled Tobacco
        </p>

        {/* Statutory Warning Box */}
        <div className="mt-5 rounded-2xl border border-hairline bg-recess p-4 space-y-2">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-xs uppercase tracking-wider">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>Statutory Compliance Notice</span>
          </div>
          <p className="text-[12px] leading-relaxed text-quiet">
            Under Section 77 of the Juvenile Justice Act, COTPA, and Indian State Excise Regulations, access to alcoholic beverages, single malts, and hand-rolled tobacco products is strictly reserved for adult patrons aged <strong>18 years or older</strong> (or legal drinking age in your state).
          </p>
        </div>

        {/* Verification Form */}
        <form onSubmit={handleVerify} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-quiet mb-2">
              Please Select Your Birth Year
            </label>
            <div className="flex items-center gap-3">
              <select
                value={birthYear}
                onChange={(e) => {
                  setBirthYear(Number(e.target.value));
                  setValidationError(null);
                }}
                className="w-full rounded-xl border border-hairline bg-canvas px-4 py-3 text-sm font-semibold text-body outline-none transition-colors focus:border-accent"
              >
                {years.map((y) => (
                  <option key={y} value={y} className="bg-panel text-body">
                    {y} ({currentYear - y} years old)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Legal Consent Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer pt-1 select-none">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => {
                setAgreedToTerms(e.target.checked);
                setValidationError(null);
              }}
              className="mt-1 h-4 w-4 rounded border-hairline accent-amber-600 focus:ring-1 focus:ring-amber-600"
            />
            <span className="text-[12px] leading-snug text-quiet">
              I solemnly affirm that I am 18 years of age or older, eligible to purchase age-gated goods, and accept the statutory terms under Indian business regulations.
            </span>
          </label>

          {/* Validation Error Banner */}
          {validationError && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-500">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-center gap-3 pt-3">
            <button
              type="button"
              onClick={handleExit}
              className="btn-line w-full sm:w-auto px-5 py-3 text-xs font-semibold uppercase tracking-wider text-quiet hover:text-body"
            >
              Exit to Boutique
            </button>
            <button
              type="submit"
              className="btn-solid w-full sm:flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Verify &amp; Enter Section</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
