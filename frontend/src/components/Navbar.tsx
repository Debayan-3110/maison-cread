import React, { useState, useRef, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import {
  ShoppingBag,
  Heart,
  Search,
  Sun,
  Moon,
  PackageCheck,
  Sparkles,
  ChevronDown,
  LogOut,
  ShieldCheck,
  Inbox,
  X,
  User,
  PackagePlus,
  Cloud,
  Compass,
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const statusTone: Record<string, string> = {
  online: 'bg-[#5F8C63]',
  checking: 'bg-[#C9A86A] animate-pulse',
  offline: 'bg-[#9B3B22]',
};

const CATEGORY_NAV_LABELS: Record<string, string> = {
  all: 'All',
  fashion: 'Fashion',
  beauty: 'Beauty',
  electronics: 'Electronics',
  'home-apparels': 'Home Apparels',
  appliances: 'Appliances',
  toys: 'Toys',
  books: 'Books',
  sports: 'Sports',
  food: 'Gourmet Food',
  worship: 'Sacred & Worship',
  'liquor-tobacco': 'Liquor & Tobacco 🔞',
};

const formatNavCategory = (cat: string) =>
  CATEGORY_NAV_LABELS[cat.toLowerCase()] || cat.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export default function Navbar() {
  const {
    theme,
    toggleTheme,
    backendStatus,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    categories,
    cartTotalCount,
    wishlist,
    setIsCartOpen,
    setIsWishlistOpen,
    setIsOrderHistoryOpen,
    allProducts,
    setQuickViewProduct,
    user,
    isAuthenticated,
    openAuthModal,
    handleLogout,
    setIsSecurityModalOpen,
    setIsDevMailboxOpen,
    devEmails,
    setIsSellerStudioOpen,
    setIsNeonHubOpen,
    openOrderTracker,
  } = useShop();

  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const suggestions = searchQuery.trim()
    ? allProducts
        .filter((p) => p.title.toLowerCase().includes(searchQuery.toLowerCase()))
        .slice(0, 5)
    : [];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const goToCatalog = () => {
    const el = document.getElementById('catalog-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const statusLabel =
    backendStatus === 'online' ? 'Atelier online' : backendStatus === 'checking' ? 'Connecting' : 'Offline mode';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-hairline bg-canvas/90 pt-safe backdrop-blur-xl">
      <div className="bg-[#0C0C0C] text-[#FFFDD0] border-b border-[#0C0C0C]/80">
        <div className="shell flex h-7 items-center justify-between gap-2 text-[9px] font-medium uppercase tracking-[0.16em] xs:text-[10px] xs:tracking-[0.2em] sm:h-8">
          <span className="hidden items-center gap-2 truncate xs:flex">
            <Sparkles className="h-3 w-3 shrink-0 opacity-70" strokeWidth={1.5} />
            <span className="truncate">Complimentary insured delivery over ₹1,999 • All 11 Departments Live</span>
          </span>
          <span className="flex items-center gap-2">
            <span className={`h-1.5 w-1.5 rounded-full ${statusTone[backendStatus] || statusTone.offline}`} />
            {statusLabel}
          </span>
          <span className="hidden md:block">Private client care 24/7</span>
        </div>
      </div>

      <div className="shell">
        <div className="flex h-[58px] items-center justify-between gap-2 phone-lg:h-[64px] sm:h-[74px] sm:gap-4 lg:gap-6">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="min-w-0 shrink-0 text-left"
            aria-label="Maison Cread home"
          >
            <span className="block truncate font-display text-[19px] leading-none tracking-tight text-body xs:text-[20px] sm:text-[23px]">
              ShopCread
            </span>
            <span className="mt-1 hidden text-[9px] font-medium uppercase tracking-[0.32em] text-faint phone-xl:block sm:block">
              Luxury Commerce OS
            </span>
          </button>

          <nav className="hidden items-center gap-8 lg:flex">
            {categories.slice(0, 6).map((cat: string) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    goToCatalog();
                  }}
                  className="relative py-1 text-[12.5px] font-medium tracking-wide"
                >
                  <span className={isActive ? 'text-body font-semibold' : 'text-quiet hover:text-body'}>{formatNavCategory(cat)}</span>
                  <span
                    className={`absolute -bottom-0.5 left-0 h-px w-full origin-left bg-accent transition-transform duration-300 ${
                      isActive ? 'scale-x-100' : 'scale-x-0'
                    }`}
                  />
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <div ref={searchRef} className="relative hidden md:block">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
                strokeWidth={1.5}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                placeholder="Search the maison"
                aria-label="Search products"
                className="h-10 w-40 rounded-full border border-hairline bg-panel pl-9 pr-8 text-[12.5px] text-body outline-none transition-all duration-300 placeholder:text-faint focus:w-56 focus:border-body/40 sm:w-44 lg:w-48 xl:w-56 3xl:w-72"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-faint hover:text-body"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                </button>
              )}

              {isSearchFocused && searchQuery.trim() !== '' && (
                <div className="card-premium menu-in absolute left-0 top-full z-50 mt-3 w-[calc(100vw-1.75rem)] overflow-hidden p-2 sm:w-[340px]">
                  {suggestions.length > 0 ? (
                    <div className="space-y-1">
                      <p className="eyebrow px-3 pb-1 pt-2">{suggestions.length} matches</p>
                      {suggestions.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setQuickViewProduct(p);
                            setIsSearchFocused(false);
                          }}
                          className="flex w-full items-center gap-3 rounded-[10px] p-2 text-left hover:bg-recess"
                        >
                          <span className="frame-still flex h-11 w-11 shrink-0 items-center justify-center p-1">
                            <img src={p.thumbnail} alt="" className="max-h-full max-w-full object-contain" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] text-body">{p.title}</span>
                            <span className="block text-[11px] capitalize text-quiet">{p.category}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="px-3 py-6 text-center text-[12.5px] text-quiet">Nothing matched your search.</p>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => setIsNeonHubOpen(true)}
              aria-label="Open Cloud Infrastructure Hub"
              title="Cloud Stack: Neon (Postgres, S3, Edge), CockroachDB Labs Storage & Cloudinary CDN"
              className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-[11.5px] font-semibold text-emerald-600 dark:text-emerald-400 transition-all hover:bg-emerald-500 hover:text-white hover:shadow-sm"
            >
              <Cloud className="h-3.5 w-3.5" />
              <span>Cloud Stack</span>
            </button>

            <button
              onClick={() => setIsSellerStudioOpen(true)}
              aria-label="Open Seller Studio"
              title="Seller Studio: List Product & Manage Fresh Inventory"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent-soft/80 px-3 py-1.5 text-[11.5px] font-semibold text-accent transition-all hover:bg-accent hover:text-[#16130E] hover:shadow-sm"
            >
              <PackagePlus className="h-3.5 w-3.5" />
              <span>+ List Product</span>
            </button>

            {/* Precision-Milled Luxury Theme Switch */}
            <ThemeToggle />

            {/* Sovereign Order & Shipment Tracking Portal */}
            <button
              onClick={() => {
                window.history.pushState({}, '', '/tracking');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              aria-label="Track shipment portal"
              title="Open Sovereign Shipment Tracking Website"
              className="btn-ghost relative h-10 w-10 rounded-full p-0 flex items-center justify-center text-body hover:text-cyan-400 transition-colors"
            >
              <Compass className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </button>

            {/* Philanthropic Sanctuary & Donation Portal */}
            <button
              onClick={() => {
                window.history.pushState({}, '', '/donate');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              aria-label="Philanthropic Sanctuary Portal"
              title="Give Hope to Orphanages & Elder Sanctuaries"
              className="btn-ghost relative h-10 w-10 rounded-full p-0 flex items-center justify-center text-rose-400 hover:text-rose-300 transition-colors"
            >
              <Heart className="h-[18px] w-[18px] fill-rose-500/20 text-rose-400" strokeWidth={1.8} />
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
            </button>

            <button
              onClick={() => setIsWishlistOpen(true)}
              aria-label="Open wishlist"
              className="btn-ghost relative h-10 w-10 rounded-full p-0"
            >
              <Heart className="h-[18px] w-[18px]" strokeWidth={1.5} />
              {wishlist.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[9px] font-semibold text-[#16130E]">
                  {wishlist.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsCartOpen(true)}
              aria-label="Open shopping bag"
              className="btn-ghost relative h-10 w-10 rounded-full p-0"
            >
              <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.5} />
              {cartTotalCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-solid px-1 text-[9px] font-semibold text-on-solid">
                  {cartTotalCount}
                </span>
              )}
            </button>

            {isAuthenticated ? (
              <div ref={userMenuRef} className="relative pl-1">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 rounded-full border border-hairline bg-panel py-1 pl-1 pr-1 hover:border-quiet phone-xl:pr-3 sm:pr-3"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-solid text-[11px] font-semibold text-on-solid">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                  <ChevronDown
                    className={`hidden h-3.5 w-3.5 text-quiet transition-transform duration-200 phone-xl:block ${showUserMenu ? 'rotate-180' : ''}`}
                    strokeWidth={1.5}
                  />
                </button>

                {showUserMenu && (
                  <div className="card-premium menu-in absolute right-0 z-50 mt-3 w-[min(15rem,calc(100vw-2rem))] overflow-hidden py-1.5">
                    <div className="border-b border-hairline px-4 py-3">
                      <p className="truncate text-[13px] font-medium text-body">{user?.name}</p>
                      <p className="mt-0.5 truncate text-[11px] text-quiet">{user?.email}</p>
                    </div>
                    <div className="p-1.5">
                      <button
                        onClick={() => { setIsSellerStudioOpen(true); setShowUserMenu(false); }}
                        className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-[12.5px] font-medium text-accent hover:bg-recess"
                      >
                        <PackagePlus className="h-4 w-4" strokeWidth={1.5} /> Seller Studio (+ List Product)
                      </button>
                      <button
                        onClick={() => { setIsOrderHistoryOpen(true); setShowUserMenu(false); }}
                        className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-[12.5px] text-quiet hover:bg-recess hover:text-body"
                      >
                        <PackageCheck className="h-4 w-4" strokeWidth={1.5} /> My orders
                      </button>
                      <button
                        onClick={() => {
                          window.history.pushState({}, '', '/tracking');
                          window.dispatchEvent(new PopStateEvent('popstate'));
                          setShowUserMenu(false);
                        }}
                        className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-[12.5px] text-cyan-400 font-semibold hover:bg-recess"
                      >
                        <Compass className="h-4 w-4 text-cyan-400" strokeWidth={1.5} /> Track Shipment Portal
                      </button>
                      <button
                        onClick={() => { setIsSecurityModalOpen(true); setShowUserMenu(false); }}
                        className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-[12.5px] text-quiet hover:bg-recess hover:text-body"
                      >
                        <ShieldCheck className="h-4 w-4" strokeWidth={1.5} /> Security
                      </button>
                      <button
                        onClick={() => { setIsDevMailboxOpen(true); setShowUserMenu(false); }}
                        className="flex w-full items-center justify-between gap-3 rounded-[10px] px-3 py-2.5 text-left text-[12.5px] text-quiet hover:bg-recess hover:text-body"
                      >
                        <span className="flex items-center gap-3">
                          <Inbox className="h-4 w-4" strokeWidth={1.5} /> Dev mailbox
                        </span>
                        {devEmails?.length > 0 && <span className="text-[10px] text-faint">{devEmails.length}</span>}
                      </button>
                      <div className="my-1.5 h-px w-full bg-hairline" />
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-[12.5px] text-[#9B3B22] hover:bg-recess"
                      >
                        <LogOut className="h-4 w-4" strokeWidth={1.5} /> Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={() => openAuthModal()}
                  aria-label="Sign in"
                  className="btn-ghost h-10 w-10 rounded-full p-0 phone-xl:hidden"
                >
                  <User className="h-[18px] w-[18px]" strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => openAuthModal()}
                  className="btn-solid ml-1 hidden px-5 py-2.5 text-[11.5px] uppercase tracking-[0.14em] phone-xl:inline-flex"
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>

        <div className="pb-3 lg:hidden">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" strokeWidth={1.5} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search the maison"
              aria-label="Search products"
              className="h-11 w-full rounded-full border border-hairline bg-panel pl-9 pr-4 text-[13px] text-body outline-none placeholder:text-faint focus:border-body/40"
            />
          </div>
          <div className="snap-rail rail-fade -mx-[.875rem] mt-3 px-[.875rem] sm:-mx-6 sm:px-6">
            {categories.map((cat: string) => (
              <button
                key={cat}
                onClick={() => { setSelectedCategory(cat); goToCatalog(); }}
                className={selectedCategory === cat ? 'chip-active shrink-0 capitalize' : 'chip shrink-0 capitalize'}
              >
                {cat.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}