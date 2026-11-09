import React from 'react';
import { useShop } from '../context/ShopContext';
import { X, Heart, Plus } from 'lucide-react';
import { Product } from '../types/models';
import { formatINR } from '../utils/commerce';
import { getSafeImageUrl, handleImageError } from '../utils/imageFallback';

export default function WishlistDrawer() {
  const {
    isWishlistOpen,
    setIsWishlistOpen,
    wishlist,
    toggleWishlist,
    addToCart,
    setQuickViewProduct,
  } = useShop();

  if (!isWishlistOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="backdrop-in fixed inset-0 bg-scrim backdrop-blur-[2px]" onClick={() => setIsWishlistOpen(false)} />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-4 phone-lg:pl-10">
        <aside className="drawer-in flex w-screen max-w-full flex-col justify-between border-l border-hairline bg-canvas text-left shadow-scrim sm:max-w-md">
          <header className="flex items-start justify-between gap-3 border-b border-hairline p-4 pt-[max(1rem,env(safe-area-inset-top))] phone-lg:gap-4 phone-lg:p-6">
            <div className="min-w-0">
              <p className="eyebrow">Saved for later</p>
              <h2 className="title-editorial mt-2 text-[22px] phone-lg:text-[26px]">The wishlist</h2>
              <p className="mt-1 text-[12px] text-quiet">
                {wishlist.length} {wishlist.length === 1 ? 'piece' : 'pieces'}
              </p>
            </div>
            <button
              onClick={() => setIsWishlistOpen(false)}
              aria-label="Close wishlist"
              className="btn-ghost h-9 w-9 rounded-full p-0"
            >
              <X className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </button>
          </header>

          <div className="thin-scroll flex-1 overflow-y-auto p-4 phone-lg:p-6">
            {wishlist.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-hairline">
                  <Heart className="h-6 w-6 text-accent" strokeWidth={1.5} />
                </div>
                <h3 className="title-editorial mt-6 text-[22px]">Nothing saved yet</h3>
                <p className="mt-3 max-w-[16rem] text-[13px] leading-relaxed text-quiet">
                  Keep an eye on the pieces you are considering — they will wait here for you.
                </p>
                <button onClick={() => setIsWishlistOpen(false)} className="btn-line mt-7 uppercase tracking-[0.14em]">
                  Continue browsing
                </button>
              </div>
            ) : (
              <ul className="space-y-5">
                {wishlist.map((product: Product) => (
                  <li key={product.id} className="flex gap-4 border-b border-hairline pb-5 last:border-0">
                    <button
                      onClick={() => { setQuickViewProduct(product); setIsWishlistOpen(false); }}
                      className="frame-still flex h-20 w-20 shrink-0 items-center justify-center p-2"
                      aria-label={`View ${product.title}`}
                    >
                      <img
                        src={getSafeImageUrl(product.thumbnail, product.category)}
                        alt={product.title}
                        onError={(e) => handleImageError(e, product.category)}
                        className="max-h-full max-w-full object-contain"
                      />
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="eyebrow capitalize">{product.category}</p>
                          <h4 className="mt-1.5 truncate text-[13.5px] text-body">{product.title}</h4>
                        </div>
                        <button
                          onClick={() => toggleWishlist(product)}
                          aria-label={`Remove ${product.title} from wishlist`}
                          className="btn-ghost h-7 w-7 shrink-0 rounded-full p-0"
                        >
                          <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </button>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <span className="numerals text-[13.5px] text-body">{formatINR(product.price)}</span>
                        <button
                          onClick={() => addToCart(product)}
                          className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-body underline underline-offset-4 transition-opacity hover:opacity-70"
                        >
                          <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
                          Add to bag
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}