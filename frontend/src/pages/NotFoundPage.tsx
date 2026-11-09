import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Compass, ArrowLeft, Search, ShieldCheck, Sparkles, PhoneCall, Home } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import ThemeToggle from '../components/ThemeToggle';

interface NotFoundPageProps {
  onNavigateHome?: () => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onNavigateHome }) => {
  const { setSearchQuery } = useShop();
  const [localSearch, setLocalSearch] = useState('');

  const handleReturnHome = () => {
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localSearch.trim()) {
      setSearchQuery(localSearch.trim());
      handleReturnHome();
    }
  };

  const curatedJumps = [
    { label: 'Haute Horlogerie', query: 'watch' },
    { label: 'Organic Harvest', query: 'organic' },
    { label: 'Maison Leathercraft', query: 'shoes' },
    { label: 'Fine Electronics', query: 'electronics' },
    { label: 'Certified Archive', query: 'all' },
  ];

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden bg-canvas text-body font-sans select-none transition-colors duration-500">
      {/* Background Architectural Ambient Noise & Radial Bloom */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-40 dark:opacity-25">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-[#007BA7]/20 via-transparent to-[#FF007F]/15 blur-[120px] dark:from-[#007BA7]/30 dark:to-[#FF007F]/20" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      {/* Top Header / Coordinate Bar */}
      <header className="relative z-10 w-full border-b border-hairline bg-panel/60 backdrop-blur-md">
        <div className="shell flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleReturnHome}
              className="flex items-center gap-2 group text-left cursor-pointer focus:outline-none"
            >
              <span className="font-serif text-lg tracking-[0.2em] uppercase font-bold text-body group-hover:text-accent transition-colors">
                ShopCread
              </span>
              <span className="text-[10px] tracking-widest uppercase font-mono px-2 py-0.5 rounded border border-hairline bg-recess text-quiet">
                Maison OS
              </span>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="flex items-center gap-2 font-mono text-[11px] text-quiet">
              <span className="inline-block h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="hidden sm:inline">COORDINATE_MISMATCH // STATUS_404</span>
              <span className="sm:hidden">404</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Exhibition Stage */}
      <main className="relative z-10 shell flex-grow flex flex-col items-center justify-center py-12 text-center">
        {/* Animated Cyber-Astrolabe Gyroscope */}
        <div className="relative mb-8 flex items-center justify-center">
          {/* Outer Ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            className="w-44 h-44 sm:w-52 sm:h-52 rounded-full border border-dashed border-accent/40 flex items-center justify-center p-3"
          >
            {/* Middle Ring */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
              className="w-full h-full rounded-full border border-hairline bg-panel/30 backdrop-blur-sm flex items-center justify-center relative shadow-[0_0_30px_rgba(0,123,167,0.15)]"
            >
              <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#007BA7] shadow-[0_0_8px_#007BA7]" />
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#FF007F] shadow-[0_0_8px_#FF007F]" />
            </motion.div>
          </motion.div>

          {/* Central Monolithic 404 Beacon */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <span className="font-serif text-5xl sm:text-6xl font-black tracking-tight text-body">
                404
              </span>
              <Compass className="h-4 w-4 absolute -top-1 -right-4 text-accent animate-spin [animation-duration:8s]" />
            </motion.div>
          </div>
        </div>

        {/* Typographic Narrative */}
        <div className="max-w-xl mx-auto space-y-3">
          <p className="eyebrow text-accent tracking-[0.25em] text-xs font-semibold">
            TERRITORY UNRESOLVED
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-body leading-tight">
            Coordinate Beyond the Collection
          </h1>
          <p className="text-sm sm:text-base text-quiet font-light leading-relaxed max-w-lg mx-auto">
            The requested atelier wing, archival piece, or console coordinates cannot be resolved within the ShopCread ledger. It may have transitioned to private exhibitions or been permanently retired.
          </p>
        </div>

        {/* Direct Maison Catalog Search Input */}
        <form onSubmit={handleSearchSubmit} className="w-full max-w-md mt-8">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-quiet group-focus-within:text-accent transition-colors" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search authentic luxury catalog or enter SKU..."
              aria-label="Search catalog"
              className="w-full h-12 pl-11 pr-24 rounded-full border border-hairline bg-panel/90 backdrop-blur text-sm text-body placeholder:text-quiet/60 outline-none shadow-sm focus:border-accent focus:ring-1 focus:ring-accent transition-all"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 px-4 rounded-full bg-solid text-on-solid text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              Search
            </button>
          </div>
        </form>

        {/* Curated Archive Quick Jumps */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 max-w-lg">
          <span className="text-[11px] font-mono uppercase tracking-wider text-quiet mr-1">
            Re-orient:
          </span>
          {curatedJumps.map((jump) => (
            <button
              key={jump.label}
              onClick={() => {
                setSearchQuery(jump.query === 'all' ? '' : jump.query);
                handleReturnHome();
              }}
              className="px-3 py-1 rounded-full border border-hairline bg-panel text-[11.5px] text-body hover:border-accent hover:text-accent transition-colors"
            >
              {jump.label}
            </button>
          ))}
        </div>

        {/* Action Controls */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={handleReturnHome}
            className="group relative inline-flex items-center gap-2 px-6 py-3 rounded-full bg-solid text-on-solid text-xs uppercase tracking-widest font-bold shadow-md hover:shadow-lg transition-all"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span>Return to Boutique</span>
          </button>

          <a
            href="mailto:concierge@shopcread.com?subject=Private%20Client%20Support%20-%20404%20Inquiry"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-hairline bg-panel hover:bg-recess text-xs uppercase tracking-widest font-semibold text-body transition-colors"
          >
            <PhoneCall className="h-3.5 w-3.5 text-accent" />
            <span>Private Client Concierge</span>
          </a>
        </div>
      </main>

      {/* Footer Sovereign Telemetry */}
      <footer className="relative z-10 w-full border-t border-hairline bg-panel/40 py-4 text-center">
        <div className="shell flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-mono text-quiet">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>Zero-Knowledge Masking & DPDP Sovereign Shield Active</span>
          </div>
          <div>
            <span>SHOPCREAD MAISON LEDGER // SEC-PROTO-2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default NotFoundPage;
