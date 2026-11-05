import React from 'react';
import { motion } from 'framer-motion';
import { useShop } from '../context/ShopContext.tsx';
import { Product } from '../types/models';
import { Heart, Star, Plus, Check, ArrowUpRight } from 'lucide-react';
import { formatINR } from '../utils/commerce';

interface ProductCardProps {
    product: Product;
    layout?: 'grid' | 'list';
}

export default function ProductCard({ product, layout = 'grid' }: ProductCardProps) {
  const { addToCart, toggleWishlist, isInWishlist, setQuickViewProduct } = useShop();

  const isWishlisted = isInWishlist(product.id);
  const originalPrice = product.price / (1 - product.discountPercentage / 100);
  const lowStock = product.stock > 0 && product.stock <= 8;

  const wishlistButton = (
    <button
      onClick={() => toggleWishlist(product)}
      aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
      title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
      className={`flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-300 ${
        isWishlisted
          ? 'border-accent bg-accent-soft text-accent'
          : 'border-hairline bg-panel/90 text-quiet hover:border-quiet hover:text-body'
      }`}
    >
      <Heart className={`h-[15px] w-[15px] ${isWishlisted ? 'fill-current' : ''}`} strokeWidth={1.5} />
    </button>
  );

  if (layout === 'list') {
    return (
      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        transition={{ type: 'spring', stiffness: 200, damping: 24 }}
        className="card-premium group flex flex-col gap-5 p-4 sm:flex-row sm:items-stretch sm:p-5"
      >
        <button
          onClick={() => setQuickViewProduct(product)}
          className="frame-still relative flex h-44 w-full shrink-0 items-center justify-center p-4 sm:h-auto sm:w-52"
          aria-label={`View ${product.title}`}
        >
          <img
            src={product.thumbnail}
            alt={product.title}
            loading="lazy"
            className="max-h-full max-w-full object-contain p-2 transition-transform duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
          />
          {product.discountPercentage > 0 && (
            <span className="absolute left-3 top-3 rounded-full bg-accent-soft px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-accent">
              -{Math.round(product.discountPercentage)}%
            </span>
          )}
        </button>

        <div className="flex min-w-0 flex-1 flex-col justify-between gap-4 text-left">
          <div>
            <div className="flex items-start justify-between gap-4">
              <p className="eyebrow capitalize">{product.category}</p>
              {wishlistButton}
            </div>
            <h3
              onClick={() => setQuickViewProduct(product)}
              className="mt-3 cursor-pointer text-[16px] leading-snug text-body transition-colors group-hover:text-accent"
            >
              {product.title}
            </h3>
            <p className="mt-2 line-clamp-2 max-w-xl text-[12.5px] leading-relaxed text-quiet">{product.description}</p>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-4 border-t border-hairline pt-4">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="numerals text-[19px] text-body">{formatINR(product.price)}</span>
                {product.discountPercentage > 0 && (
                  <span className="numerals text-[12px] text-faint line-through">{formatINR(originalPrice)}</span>
                )}
              </div>
              <div className="mt-1.5 flex items-center gap-3">
                <span className="flex items-center gap-1 text-[11.5px] text-quiet">
                  <Star className="h-3 w-3 fill-accent text-accent" />
                  {product.rating}
                </span>
                {lowStock && <span className="text-[11.5px] text-accent">Only {product.stock} left</span>}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => setQuickViewProduct(product)} className="btn-line px-4 py-2 text-[11px] uppercase tracking-[0.14em]">
                Details
              </button>
              <button onClick={() => addToCart(product)} className="btn-solid px-5 py-2 text-[11px] uppercase tracking-[0.14em]">
                Add to bag
              </button>
            </div>
          </div>
        </div>
      </motion.article>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 200, damping: 24 }}
      className="group relative flex h-full flex-col rounded-[16px] border border-transparent bg-panel p-2.5 transition-all duration-500 hover:border-hairline hover:shadow-quiet phone-lg:p-3"
    >
      <div className="absolute right-3.5 top-3.5 z-10 phone-lg:right-5 phone-lg:top-5">{wishlistButton}</div>

      <button
        onClick={() => setQuickViewProduct(product)}
        aria-label={`View ${product.title}`}
        className="frame-still relative flex h-44 w-full items-center justify-center p-3 phone-lg:h-52 phone-lg:p-4 xl:h-56 4xl:h-64"
      >
        <img
          src={product.thumbnail}
          alt={product.title}
          loading="lazy"
          className="max-h-full max-w-full object-contain p-2 transition-transform duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
        />
        {product.discountPercentage > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-accent-soft px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-accent">
            -{Math.round(product.discountPercentage)}%
          </span>
        )}
        <span className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-between bg-canvas/95 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-body transition-transform duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0">
          Quick view
          <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} />
        </span>
      </button>

      <div className="flex flex-1 flex-col justify-between pt-4 text-left">
        <div>
          <div className="flex items-center justify-between gap-2">
            <p className="eyebrow truncate capitalize">{product.category}</p>
            <span className="flex shrink-0 items-center gap-1 text-[11.5px] text-quiet">
              <Star className="h-3 w-3 fill-accent text-accent" />
              {product.rating}
            </span>
          </div>

          <h3
            onClick={() => setQuickViewProduct(product)}
            className="mt-2 cursor-pointer text-[14.5px] leading-snug text-body transition-colors group-hover:text-accent"
          >
            <span className="line-clamp-2">{product.title}</span>
          </h3>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3 border-t border-hairline pt-3">
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5">
              <span className="numerals text-[17px] text-body">{formatINR(product.price)}</span>
              {product.discountPercentage > 0 && (
                <span className="numerals text-[11px] text-faint line-through">{formatINR(originalPrice)}</span>
              )}
            </div>
            {lowStock && <p className="mt-1 text-[11px] text-accent">Only {product.stock} left</p>}
          </div>

          <button
            onClick={() => addToCart(product)}
            title="Add to bag"
            aria-label={`Add ${product.title} to bag`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-hairline bg-panel text-body transition-all duration-300 hover:border-transparent hover:bg-solid hover:text-on-solid active:scale-95"
          >
            <Plus className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </motion.article>
  );
}