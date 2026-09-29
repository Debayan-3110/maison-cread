import React, { useState, useRef, useEffect } from 'react';
import { useShop } from '../context/ShopContext.tsx';
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
} from 'lucide-react';

const statusTone: Record<string, string> = {
  online: 'bg-[#5F8C63]',
  checking: 'bg-[#C9A86A] animate-pulse',
  offline: 'bg-[#9B3B22]',
};

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
    <header className="sticky top-0 z-40 w-full border-b border-hairline bg-canvas/90 backdrop-blur-xl">
      <div className="bg-solid text-on-solid">
        <div className="mx-auto flex h-8 max-w-7xl items-center justify-between px-4 text-[10px] font-medium uppercase tracking-[0.2em] sm:px-6 lg:px-8">
          <span className="hidden items-center gap-2 sm:flex">
            <Sparkles className="h-3 w-3 opacity-70" strokeWidth={1.5} />
            Insured delivery over 1,999
          </span>
          <span className="flex items-center gap-2">
            <span className={`h-1.5 w-1.5 rounded-full ${statusTone[backendStatus] || statusTone.offline}`} />
            {statusLabel}
          </span>
          <span className="hidden md:block">Private client care 24/7</span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-[74px] items-center justify-between gap-6">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="shrink-0 text-left"
            aria-label="Maison Cread home"
          >
            <span className="font-display text-[21px] leading-none tracking-tight text-body sm:text-[23px]">
              Maison Cread
            </span>
            <span className="mt-1 hidden text-[9px] font-medium uppercase tracking-[0.32em] text-faint sm:block">
              Objects of desire
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
                  className="relative py-1 text-[12.5px] font-medium capitalize tracking-wide"
                >
                  <span className={isActive ? 'text-body' : 'text-quiet hover:text-body'}>{cat.replace('-', ' ')}</span>
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
                className="h-10 w-44 rounded-full border border-hairline bg-panel pl-9 pr-8 text-[12.5px] text-body outline-none transition-all duration-300 placeholder:text-faint focus:w-64 focus:border-body/40 xl:w-56"
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
                <div className="card-premium menu-in absolute left-0 top-full z-50 mt-3 w-[340px] overflow-hidden p-2">
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
              onClick={toggleTheme}
              aria-label="Toggle appearance"
              className="btn-ghost h-10 w-10 rounded-full p-0"
            >
              {theme === 'dark' ? (
                <Moon className="h-[18px] w-[18px]" strokeWidth={1.5} />
              ) : (
                <Sun className="h-[18px] w-[18px]" strokeWidth={1.5} />
              )}
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
                  className="flex items-center gap-2 rounded-full border border-hairline bg-panel py-1 pl-1 pr-3 hover:border-quiet"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-solid text-[11px] font-semibold text-on-solid">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-quiet transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`}
                    strokeWidth={1.5}
                  />
                </button>

                {showUserMenu && (
                  <div className="card-premium menu-in absolute right-0 z-50 mt-3 w-60 overflow-hidden py-1.5">
                    <div className="border-b border-hairline px-4 py-3">
                      <p className="truncate text-[13px] font-medium text-body">{user?.name}</p>
                      <p className="mt-0.5 truncate text-[11px] text-quiet">{user?.email}</p>
                    </div>
                    <div className="p-1.5">
                      <button
                        onClick={() => { setIsOrderHistoryOpen(true); setShowUserMenu(false); }}
                        className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-[12.5px] text-quiet hover:bg-recess hover:text-body"
                      >
                        <PackageCheck className="h-4 w-4" strokeWidth={1.5} /> My orders
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
              <button
                onClick={() => openAuthModal()}
                className="btn-solid ml-1 hidden px-5 py-2.5 text-[11.5px] uppercase tracking-[0.14em] sm:inline-flex"
              >
                Sign in
              </button>
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
          <div className="scrollbar-none -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
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